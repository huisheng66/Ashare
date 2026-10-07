import { createHmac, randomBytes, scrypt, scryptSync, timingSafeEqual } from "node:crypto";

export const SESSION_MS = 8 * 60 * 60 * 1000;

export async function verifyPasswordHash(password: string, stored: string): Promise<boolean> {
  // Reject malformed hex before Buffer decoding, which silently truncates invalid strings.
  if (!/^[a-f\d]{32}:[a-f\d]{128}$/i.test(stored) || !password || password.length > 1024) return false;
  const [saltHex, hashHex] = stored.split(":");
  const expected = Buffer.from(hashHex, "hex");
  const actual = await new Promise<Buffer>((resolve, reject) => {
    scrypt(password, Buffer.from(saltHex, "hex"), 64, (error, derived) => {
      if (error) reject(error);
      else resolve(derived);
    });
  });
  return timingSafeEqual(expected, actual);
}

/** 会话负载：谁、什么角色。签名覆盖两者，改任何一项都会失效。 */
export type SessionSubject = { username: string; role: string };

const ENCODED_PATTERN = /^[A-Za-z0-9_-]{1,256}$/;
const ROLE_PATTERN = /^[a-z]{1,16}$/;

/** 签名覆盖 base64url 后的用户名：签的就是实际传输的字节，不存在编码歧义。 */
function signSession(expiresAt: number, role: string, encoded: string, secret: string): string {
  return createHmac("sha256", secret).update(`${expiresAt}.${role}.${encoded}`).digest("hex");
}

/** 令牌形态：过期时间.角色.base64url(用户名).签名 */
export function createSessionToken(secret: string, subject: SessionSubject, now = Date.now()): string {
  const expiresAt = now + SESSION_MS;
  const encoded = Buffer.from(subject.username, "utf8").toString("base64url");
  return `${expiresAt}.${subject.role}.${encoded}.${signSession(expiresAt, subject.role, encoded, secret)}`;
}

/**
 * 校验并取回身份。任何一项不合法都返回 undefined —— 绝不抛异常，
 * 因为输入完全来自 cookie，构造畸形值是最省事的攻击方式。
 */
export function parseSessionToken(
  token: string | undefined,
  secret: string,
  now = Date.now(),
): SessionSubject | undefined {
  if (!token) return undefined;
  const parts = token.split(".");
  if (parts.length !== 4) return undefined;
  const [expRaw, role, encoded, signature] = parts;
  if (!/^\d{13}$/.test(expRaw) || !ROLE_PATTERN.test(role) || !ENCODED_PATTERN.test(encoded) || !/^[a-f\d]{64}$/.test(signature)) {
    return undefined;
  }
  const expiresAt = Number(expRaw);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= now || expiresAt > now + SESSION_MS) return undefined;

  const expected = Buffer.from(signSession(expiresAt, role, encoded, secret), "hex");
  const actual = Buffer.from(signature, "hex");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return undefined;

  const username = Buffer.from(encoded, "base64url").toString("utf8");
  return username ? { username, role } : undefined;
}

/** 只判真伪，不关心身份。 */
export function verifySignedSessionToken(token: string | undefined, secret: string, now = Date.now()): boolean {
  return parseSessionToken(token, secret, now) !== undefined;
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}
