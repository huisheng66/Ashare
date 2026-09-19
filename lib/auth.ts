import "server-only";

import { cookies } from "next/headers";
import { createSessionToken, SESSION_MS, verifyPasswordHash, verifySignedSessionToken } from "./auth-crypto";
import { getSiteUrl } from "./site";

export { hashPassword } from "./auth-crypto";

const COOKIE = "ashare_admin";
const cookieOptions = {
  httpOnly: true,
  // 未配置 https 站点时（如内网 HTTP 部署）不能下发 secure cookie，否则登录后立刻失效
  secure: process.env.NODE_ENV === "production" && getSiteUrl()?.protocol === "https:",
  sameSite: "strict" as const,
  path: "/admin",
};

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET 未配置或短于 32 字符");
  return value;
}

export async function verifyPassword(password: string): Promise<boolean> {
  return verifyPasswordHash(password, process.env.ADMIN_PASSWORD_HASH ?? "");
}

export function makeSessionToken(): string {
  return createSessionToken(secret());
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  return verifySignedSessionToken(token, secret());
}

export async function hasValidSession(): Promise<boolean> {
  return verifySessionToken((await cookies()).get(COOKIE)?.value);
}

export async function startSession(): Promise<void> {
  (await cookies()).set(COOKIE, makeSessionToken(), { ...cookieOptions, maxAge: SESSION_MS / 1000 });
}

export async function endSession(): Promise<void> {
  // Cookie removal must use the same path as creation, not delete()'s default '/'.
  (await cookies()).set(COOKIE, "", { ...cookieOptions, maxAge: 0, expires: new Date(0) });
}
