import "server-only";

import { isIP } from "node:net";
import { headers } from "next/headers";

import { getBlocks, updateBlocks } from "./store";
import { SlidingWindowLimiter } from "./rate-limiter";

const limiter = new SlidingWindowLimiter();

/** TRUST_PROXY=1 requires a trusted, directly connected proxy that appends/sets XFF. */
export async function getClientIp(): Promise<string> {
  if (process.env.TRUST_PROXY !== "1") return "unknown";
  const h = await headers();
  // The leftmost entry may have been supplied by the client before the proxy appended its IP.
  const candidate = (h.get("x-forwarded-for")?.split(",").at(-1) ?? h.get("x-real-ip") ?? "").trim();
  if (!isIP(candidate)) return "unknown";
  return candidate.toLowerCase().replace(/^::ffff:(?=\d+\.)/, "");
}

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  return limiter.allow(key, limit, windowMs);
}

export async function isBlocked(ip: string): Promise<boolean> {
  if (ip === "unknown") return false;
  const until = (await getBlocks())[ip];
  return Number.isFinite(until) && until > Date.now();
}

export async function blockIp(ip: string, minutes: number): Promise<void> {
  if (!isIP(ip)) return;
  await updateBlocks((blocks) => {
    const now = Date.now();
    const current = Object.fromEntries(Object.entries(blocks).filter(([, until]) => until > now));
    current[ip] = now + minutes * 60 * 1000;
    return current;
  });
}

export async function guardLogin(ip: string): Promise<boolean> {
  if (await isBlocked(ip)) return false;
  return rateLimit(`login:${ip}`, 5, 10 * 60 * 1000);
}

export async function recordLoginFailure(ip: string): Promise<void> {
  const key = `fail:${ip}`;
  if (!rateLimit(key, 7, 15 * 60 * 1000)) {
    await blockIp(ip, 30);
    limiter.delete(key);
  }
}

export async function guardPublicWrite(ip: string, kind: string): Promise<boolean> {
  if (await isBlocked(ip)) return false;
  return rateLimit(`${kind}:${ip}`, 3, 10 * 60 * 1000);
}
