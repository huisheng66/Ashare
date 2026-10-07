import { createHash, createHmac } from "node:crypto";

/**
 * 最小 S3 客户端：手写 SigV4 签名 + fetch，只做 PUT / GET / DELETE / HEAD 四个动作。
 *
 * 为什么不上 AWS SDK：本项目一直避免重型依赖（自研 markdown 子集解析器、自写迁移器）。
 * SDK 会带进几 MB 依赖，而我们只需要四个动作。
 *
 * **验证边界（重要，别当成「已验证可用」）**：
 *  - 已验证：SigV4 最容易出错的一步 —— 规范化请求与签名串（tests/s3.test.mjs 用字面量断言），
 *    以及请求形态（方法、路径、必签头、Authorization 语法）对假端点往返。
 *  - **未验证**：没有对着真实 bucket 签过。启用 MEDIA_DRIVER=s3 之前必须跑
 *    `npm run media:check`（PUT / HEAD / GET / DELETE 一个探针对象），它会如实报错。
 */

export type S3Config = {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  /** 对象键前缀，便于多个环境共用一个 bucket。 */
  prefix: string;
  /** MinIO 之类的自建服务只能用 path-style；AWS 两种都支持。 */
  forcePathStyle: boolean;
  sessionToken?: string;
};

export function sha256Hex(data: Buffer | string): string {
  return createHash("sha256").update(data).digest("hex");
}

/** RFC3986 编码：只有 A-Za-z0-9-._~ 免编码，其余按字节百分号编码。 */
export function uriEncode(value: string, encodeSlash = true): string {
  let out = "";
  for (const byte of Buffer.from(value, "utf8")) {
    const char = String.fromCharCode(byte);
    if (/[A-Za-z0-9\-._~]/.test(char)) out += char;
    else if (char === "/" && !encodeSlash) out += char;
    else out += "%" + byte.toString(16).toUpperCase().padStart(2, "0");
  }
  return out;
}

function amzDate(now: Date): { full: string; short: string } {
  const iso = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  return { full: iso, short: iso.slice(0, 8) };
}

export function hostOf(config: S3Config): string {
  const host = new URL(config.endpoint).host;
  return config.forcePathStyle ? host : config.bucket + "." + host;
}

/** 对象在 URL 上的路径（含 bucket，若为 path-style）。 */
export function objectPath(config: S3Config, key: string): string {
  const full = config.prefix ? config.prefix.replace(/\/+$/, "") + "/" + key : key;
  const encoded = full.split("/").map((segment) => uriEncode(segment, false)).join("/");
  return config.forcePathStyle ? "/" + uriEncode(config.bucket, false) + "/" + encoded : "/" + encoded;
}

/**
 * 规范化请求。单独抽出来就是为了单测 —— SigV4 的坑几乎都集中在这里：
 * 头的排序与空白折叠、URI 的编码规则、以及 CanonicalHeaders 自带换行导致的那个空行。
 */
export function buildCanonicalRequest(input: {
  method: string;
  path: string;
  query: string;
  headers: [string, string][];
  payloadHash: string;
}): { canonicalRequest: string; signedHeaders: string } {
  const normalized = input.headers
    .map(([name, value]) => [name.toLowerCase(), value.trim().replace(/\s+/g, " ")] as [string, string])
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  const signedHeaders = normalized.map(([name]) => name).join(";");
  // CanonicalHeaders 每行自带结尾换行，拼进整体后又接一个 '\n' —— 这正是规范要求的空行。
  const canonicalHeaders = normalized.map(([name, value]) => name + ":" + value + "\n").join("");
  return {
    canonicalRequest: [
      input.method,
      input.path,
      input.query,
      canonicalHeaders,
      signedHeaders,
      input.payloadHash,
    ].join("\n"),
    signedHeaders,
  };
}

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data, "utf8").digest();
}

/** 派生签名密钥并算出最终签名。 */
export function signString(secret: string, short: string, region: string, stringToSign: string): string {
  const kDate = hmac("AWS4" + secret, short);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, "s3");
  const kSigning = hmac(kService, "aws4_request");
  return createHmac("sha256", kSigning).update(stringToSign, "utf8").digest("hex");
}

export type SignableRequest = {
  method: "PUT" | "GET" | "DELETE" | "HEAD";
  key: string;
  payload?: Buffer;
  contentType?: string;
  now?: Date;
};

export function signRequest(
  config: S3Config,
  request: SignableRequest,
): { url: string; headers: Record<string, string>; stringToSign: string } {
  const now = request.now ?? new Date();
  const { full, short } = amzDate(now);
  const payload = request.payload ?? Buffer.alloc(0);
  const payloadHash = sha256Hex(payload);
  const path = objectPath(config, request.key);

  const signingHeaders: [string, string][] = [
    ["host", hostOf(config)],
    ["x-amz-content-sha256", payloadHash],
    ["x-amz-date", full],
  ];
  if (request.contentType) signingHeaders.push(["content-type", request.contentType]);
  if (config.sessionToken) signingHeaders.push(["x-amz-security-token", config.sessionToken]);

  const { canonicalRequest, signedHeaders } = buildCanonicalRequest({
    method: request.method,
    path,
    query: "",
    headers: signingHeaders,
    payloadHash,
  });
  const scope = short + "/" + config.region + "/s3/aws4_request";
  const stringToSign = ["AWS4-HMAC-SHA256", full, scope, sha256Hex(canonicalRequest)].join("\n");
  const signature = signString(config.secretAccessKey, short, config.region, stringToSign);

  const headers: Record<string, string> = {
    Authorization:
      "AWS4-HMAC-SHA256 Credential=" + config.accessKeyId + "/" + scope +
      ", SignedHeaders=" + signedHeaders + ", Signature=" + signature,
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": full,
  };
  if (request.contentType) headers["content-type"] = request.contentType;
  if (config.sessionToken) headers["x-amz-security-token"] = config.sessionToken;

  return { url: config.endpoint.replace(/\/+$/, "") + path, headers, stringToSign };
}

async function failure(action: string, response: Response): Promise<Error> {
  const detail = await response.text().catch(() => "");
  return new Error("[s3] " + action + " 失败：" + response.status + (detail ? " " + detail.slice(0, 200) : ""));
}

export async function putObject(config: S3Config, key: string, body: Buffer, contentType: string): Promise<void> {
  const { url, headers } = signRequest(config, { method: "PUT", key, payload: body, contentType });
  const response = await fetch(url, { method: "PUT", headers, body: new Uint8Array(body) });
  if (!response.ok) throw await failure("PUT " + key, response);
}

export async function headObject(config: S3Config, key: string): Promise<boolean> {
  const { url, headers } = signRequest(config, { method: "HEAD", key });
  const response = await fetch(url, { method: "HEAD", headers });
  if (response.status === 404) return false;
  if (!response.ok) throw await failure("HEAD " + key, response);
  return true;
}

export async function getObject(config: S3Config, key: string): Promise<Buffer | undefined> {
  const { url, headers } = signRequest(config, { method: "GET", key });
  const response = await fetch(url, { method: "GET", headers });
  if (response.status === 404) return undefined;
  if (!response.ok) throw await failure("GET " + key, response);
  return Buffer.from(await response.arrayBuffer());
}

export async function deleteObject(config: S3Config, key: string): Promise<void> {
  const { url, headers } = signRequest(config, { method: "DELETE", key });
  const response = await fetch(url, { method: "DELETE", headers });
  // 删除不存在的对象在 S3 上也是 204，404 一并当作成功。
  if (!response.ok && response.status !== 404) throw await failure("DELETE " + key, response);
}
