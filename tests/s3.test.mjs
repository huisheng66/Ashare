import assert from "node:assert/strict";
import { createServer } from "node:http";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";

import { getMedia, isValidMediaKey, mediaDriver, putMedia, removeMedia } from "../lib/media-storage.ts";
import { buildCanonicalRequest, objectPath, putObject, getObject, headObject, deleteObject, sha256Hex, signRequest, uriEncode } from "../lib/s3.ts";

/**
 * 媒体存储与 SigV4 的闸门。
 *
 * 验证边界要写清楚：这里验证的是**规范化与签名串**（SigV4 最容易错的地方）与请求形态，
 * 没有对着真实 bucket 签过。启用 MEDIA_DRIVER=s3 前必须跑 npm run media:check。
 */

const HELLO_HASH = "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824";

test("sha256：先确认哈希实现本身对得上已知值", () => {
  assert.equal(sha256Hex("hello"), HELLO_HASH);
  assert.equal(sha256Hex(Buffer.alloc(0)), "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
});

test("uriEncode：按 RFC3986 编码，空格是 %20 而不是 +", () => {
  assert.equal(uriEncode("a b"), "a%20b");
  assert.equal(uriEncode("a/b", false), "a/b");
  assert.equal(uriEncode("a/b"), "a%2Fb");
  assert.equal(uriEncode("图.png"), "%E5%9B%BE.png");
  assert.equal(uriEncode("-_.~"), "-_.~");
  assert.equal(uriEncode("a+b&c=d"), "a%2Bb%26c%3Dd");
});

test("对象路径：path-style 带 bucket，virtual-host 不带", () => {
  const base = { endpoint: "https://s3.example.com", region: "us-east-1", bucket: "my-bucket", accessKeyId: "AK", secretAccessKey: "SK", prefix: "media" };
  assert.equal(objectPath({ ...base, forcePathStyle: true }, "demo/0123456789abcdef.png"), "/my-bucket/media/demo/0123456789abcdef.png");
  assert.equal(objectPath({ ...base, forcePathStyle: false }, "demo/0123456789abcdef.png"), "/media/demo/0123456789abcdef.png");
  assert.equal(objectPath({ ...base, forcePathStyle: true, prefix: "" }, "demo/0123456789abcdef.png"), "/my-bucket/demo/0123456789abcdef.png");
});

test("SigV4：规范化请求逐字符符合规范（头小写、字典序、CanonicalHeaders 后有空行）", () => {
  const { canonicalRequest, signedHeaders } = buildCanonicalRequest({
    method: "PUT",
    path: "/my-bucket/media/demo/0123456789abcdef.png",
    query: "",
    headers: [
      ["x-amz-date", "20260101T000000Z"],
      ["Host", "s3.example.com"],
      ["x-amz-content-sha256", HELLO_HASH],
    ],
    payloadHash: HELLO_HASH,
  });

  assert.equal(signedHeaders, "host;x-amz-content-sha256;x-amz-date", "头必须小写且按字典序");
  assert.equal(
    canonicalRequest,
    "PUT\n/my-bucket/media/demo/0123456789abcdef.png\n\n" +
      "host:s3.example.com\n" +
      "x-amz-content-sha256:" + HELLO_HASH + "\n" +
      "x-amz-date:20260101T000000Z\n" +
      "\n" +
      "host;x-amz-content-sha256;x-amz-date\n" +
      HELLO_HASH,
  );
});

test("SigV4：Authorization 语法完整，必签头齐全，且对同一输入确定", () => {
  const config = {
    endpoint: "https://s3.example.com", region: "us-east-1", bucket: "my-bucket",
    accessKeyId: "AKIAIOSFODNN7EXAMPLE", secretAccessKey: "secret", prefix: "media", forcePathStyle: true,
  };
  const now = new Date("2026-01-01T00:00:00.000Z");
  const first = signRequest(config, { method: "PUT", key: "demo/0123456789abcdef.png", payload: Buffer.from("hello"), contentType: "image/png", now });
  const second = signRequest(config, { method: "PUT", key: "demo/0123456789abcdef.png", payload: Buffer.from("hello"), contentType: "image/png", now });

  assert.equal(first.headers.Authorization, second.headers.Authorization, "同一输入必须得到同一签名");
  assert.match(
    first.headers.Authorization,
    /^AWS4-HMAC-SHA256 Credential=AKIAIOSFODNN7EXAMPLE\/20260101\/us-east-1\/s3\/aws4_request, SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, Signature=[a-f0-9]{64}$/,
  );
  assert.equal(first.headers["x-amz-content-sha256"], HELLO_HASH);
  assert.equal(first.headers["x-amz-date"], "20260101T000000Z");
  assert.equal(first.url, "https://s3.example.com/my-bucket/media/demo/0123456789abcdef.png");
  assert.ok(first.stringToSign.startsWith("AWS4-HMAC-SHA256\n20260101T000000Z\n20260101/us-east-1/s3/aws4_request\n"));

  // 换一个密钥必须换一个签名 —— 否则说明签名没真的用到密钥。
  const other = signRequest({ ...config, secretAccessKey: "other" }, { method: "PUT", key: "demo/0123456789abcdef.png", payload: Buffer.from("hello"), contentType: "image/png", now });
  assert.notEqual(first.headers.Authorization, other.headers.Authorization);
});

// —— 假端点往返：验证请求形态（方法、路径、头、体）而不需要真实 bucket ——

const seen = [];
let origin = "";
const server = createServer((request, response) => {
  const chunks = [];
  request.on("data", (chunk) => chunks.push(chunk));
  request.on("end", () => {
    seen.push({ method: request.method, url: request.url, headers: request.headers, body: Buffer.concat(chunks) });
    if (request.method === "GET") {
      response.writeHead(200, { "content-type": "image/png" });
      response.end(Buffer.from([1, 2, 3, 4]));
    } else if (request.method === "HEAD") {
      response.writeHead(200);
      response.end();
    } else {
      response.writeHead(204);
      response.end();
    }
  });
});

before(async () => {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  origin = "http://127.0.0.1:" + server.address().port;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

const CONFIG = () => ({
  endpoint: origin, region: "us-east-1", bucket: "ashare-test",
  accessKeyId: "AKTEST", secretAccessKey: "secret", prefix: "media", forcePathStyle: true,
});

test("对象存储：PUT / HEAD / GET / DELETE 的请求形态正确，字节原样往返", async () => {
  seen.length = 0;
  const config = CONFIG();
  const key = "demo/0123456789abcdef.png";
  const payload = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  await putObject(config, key, payload, "image/png");
  assert.equal(seen[0].method, "PUT");
  assert.equal(seen[0].url, "/ashare-test/media/demo/0123456789abcdef.png");
  assert.deepEqual([...seen[0].body], [...payload], "上传的字节必须原样送达");
  assert.equal(seen[0].headers["content-type"], "image/png");
  assert.match(seen[0].headers.authorization, /^AWS4-HMAC-SHA256 /);
  assert.equal(seen[0].headers["x-amz-content-sha256"], sha256Hex(payload));

  assert.equal(await headObject(config, key), true);
  assert.equal(seen[1].method, "HEAD");

  const back = await getObject(config, key);
  assert.deepEqual([...(back ?? Buffer.alloc(0))], [1, 2, 3, 4]);
  assert.equal(seen[2].method, "GET");

  await deleteObject(config, key);
  assert.equal(seen[3].method, "DELETE");
});

// —— 本地驱动：默认行为必须与从前一致 ——

test("本地驱动：默认生效，写读删围绕 data/media 进行", async () => {
  const original = process.cwd();
  const dir = await mkdtemp(path.join(tmpdir(), "ashare-media-test-"));
  try {
    process.chdir(dir);
    delete process.env.MEDIA_DRIVER;
    assert.equal(mediaDriver(), "local", "不设 MEDIA_DRIVER 时必须是 local");

    const key = "demo/0123456789abcdef.png";
    assert.equal(isValidMediaKey(key), true);
    assert.equal(isValidMediaKey("../etc/passwd"), false, "目录穿越必须被拒");
    assert.equal(isValidMediaKey("demo/short.png"), false, "文件名必须是 16 位 hex");

    await putMedia(key, Buffer.from([9, 9, 9]), "image/png");
    assert.deepEqual([...(await getMedia(key)) ?? Buffer.alloc(0)], [9, 9, 9]);
    assert.equal(await getMedia("demo/0000000000000000.png"), undefined, "不存在的键返回 undefined");

    await removeMedia(key);
    assert.equal(await getMedia(key), undefined);
  } finally {
    process.chdir(original);
    await rm(path.resolve(dir), { recursive: true, force: true });
  }
});
