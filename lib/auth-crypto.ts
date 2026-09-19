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

function sign(expiresAt: number, secret: string): string {
  return createHmac("sha256", secret).update(String(expiresAt)).digest("hex");
}

export function createSessionToken(secret: string, now = Date.now()): string {
  const expiresAt = now + SESSION_MS;
  return `${expiresAt}.${sign(expiresAt, secret)}`;
}

export function verifySignedSessionToken(token: string | undefined, secret: string, now = Date.now()): boolean {
  if (!token || !/^\d{13}\.[a-f\d]{64}$/.test(token)) return false;
  const [expRaw, signature] = token.split(".");
  const expiresAt = Number(expRaw);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= now || expiresAt > now + SESSION_MS) return false;
  return timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(sign(expiresAt, secret), "hex"));
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}
