import "server-only";

import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * 单口令登录：口令只存 scrypt 哈希（ADMIN_PASSWORD_HASH=salt:hash，hex），
 * session 只存 HMAC 签名的到期时间戳，不落库。
 */

const COOKIE = "ashare_admin";
const SESSION_MS = 8 * 60 * 60 * 1000; // 约 8 小时

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) {
    throw new Error("SESSION_SECRET 未配置或短于 32 字符");
  }
  return value;
}

export function verifyPassword(password: string): boolean {
  const stored = process.env.ADMIN_PASSWORD_HASH ?? "";
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return timingSafeEqual(expected, actual);
}

function sign(expiresAt: number): string {
  return createHmac("sha256", secret())
    .update(String(expiresAt))
    .digest("hex");
}

export function makeSessionToken(): string {
  const expiresAt = Date.now() + SESSION_MS;
  return `${expiresAt}.${sign(expiresAt)}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const [expRaw, sig] = token.split(".");
  const expiresAt = Number(expRaw);
  if (!Number.isFinite(expiresAt) || !sig) return false;
  const expected = sign(expiresAt);
  if (
    sig.length !== expected.length ||
    !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  ) {
    return false;
  }
  return expiresAt > Date.now();
}

export async function hasValidSession(): Promise<boolean> {
  const jar = await cookies();
  return verifySessionToken(jar.get(COOKIE)?.value);
}

export async function startSession(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, makeSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: SESSION_MS / 1000,
  });
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

/** 生成 ADMIN_PASSWORD_HASH 的值（部署时在本地跑一次，结果写进环境变量） */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}
