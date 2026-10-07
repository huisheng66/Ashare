"use server";

import { recordClick } from "@/lib/click-store";
import { getClientIp, rateLimit } from "@/lib/guard";
import { SLUG_PATTERN } from "@/lib/input-validation";
import { isChannelId } from "@/lib/links";

/**
 * 记录一次出站链接点击。
 *
 * 刻意不做 `requireAdmin`，也不信任调用方传来的任何展示数据：
 * 只接受「已发布条目的 slug + 已知渠道 id」两个可枚举的白名单值。
 * 统计写错不该让页面报错，因此全程不抛出。
 */
export async function recordOutboundClick(slug: string, channel: string): Promise<void> {
  try {
    if (!SLUG_PATTERN.test(slug)) return;
    if (!isChannelId(channel)) return;
    // 限速按 IP。同一 IP 60 次/分钟足够真实用户，不足以刷爆磁盘。
    if (!rateLimit(`click:${await getClientIp()}`, 60, 60_000)) return;
    await recordClick(slug, channel);
  } catch (error) {
    console.error("[clicks] recordOutboundClick failed", error);
  }
}
