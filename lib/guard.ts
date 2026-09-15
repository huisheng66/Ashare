import "server-only";

import { headers } from "next/headers";

import { getBlocks, saveBlocks } from "./store";

/**
 * 单进程内存滑动窗口限速 + blocks.json IP 封禁。
 * 取 IP：配置了 TRUST_PROXY=1 时用 X-Forwarded-For 最左，否则连接 IP。
 */

const buckets = new Map<string, number[]>(); // key -> 命中时间戳

export async function getClientIp(): Promise<string> {
  const h = await headers();
  if (process.env.TRUST_PROXY === "1") {
    const xff = h.get("x-forwarded-for");
    if (xff) return xff.split(",")[0].trim();
  }
  return h.get("x-real-ip") ?? "unknown";
}

/** 允许通过返回 true；超限返回 false（调用方回 429） */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  return true;
}

export async function isBlocked(ip: string): Promise<boolean> {
  if (ip === "unknown") return false;
  const blocks = await getBlocks();
  const until = blocks[ip];
  if (!until) return false;
  if (until < Date.now()) {
    const next = { ...blocks };
    delete next[ip];
    await saveBlocks(next);
    return false;
  }
  return true;
}

export async function blockIp(ip: string, minutes: number): Promise<void> {
  if (ip === "unknown") return;
  const blocks = await getBlocks();
  blocks[ip] = Date.now() + minutes * 60 * 1000;
  await saveBlocks(blocks);
}

/** 登录失败处理：限速 + 累计失败封 IP。返回是否放行 */
export async function guardLogin(ip: string): Promise<boolean> {
  if (await isBlocked(ip)) return false;
  return rateLimit(`login:${ip}`, 5, 10 * 60 * 1000);
}

export async function recordLoginFailure(ip: string): Promise<void> {
  const key = `fail:${ip}`;
  const fails = (buckets.get(key) ?? []).filter(
    (t) => Date.now() - t < 15 * 60 * 1000,
  );
  fails.push(Date.now());
  buckets.set(key, fails);
  if (fails.length >= 8) {
    await blockIp(ip, 30);
    buckets.delete(key);
  }
}

/** 公开写接口（投稿/反馈）限速 */
export async function guardPublicWrite(ip: string, kind: string): Promise<boolean> {
  if (await isBlocked(ip)) return false;
  return rateLimit(`${kind}:${ip}`, 3, 10 * 60 * 1000);
}
