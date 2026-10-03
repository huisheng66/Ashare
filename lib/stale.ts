import type { Software } from "@/data/types";

/**
 * 核验日期的判定与回写。
 *
 * `linksCheckedAt` 记录「这条条目的外链最近一次人工确认可达的日期」。
 * 目录站是死链重灾区，官网改版、下载页迁移都很常见，因此需要能问出：
 * 哪些条目的链接已经很久没核过了。
 *
 * 纯函数放在这里，脚本与测试共用。
 */

/** 默认阈值：90 天。软件更新节奏慢，三个月没变通常不代表有问题。 */
export const DEFAULT_STALE_DAYS = 90;

const DATE_SHAPE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * 形状对但日期不存在（2026-13-45）也算非法。
 * Date.UTC 会把越界的月日进位成别的日期，光看正则过不了这一关。
 */
function isRealDate(value: string): boolean {
  const [y, m, d] = value.split("-").map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

export type StaleReason =
  /** 超过阈值没核验 */
  | "stale"
  /** 从未核验过（字段缺失） */
  | "never"
  /** 日期格式非法，后续统计会失真 */
  | "invalid"
  /** 核验过且新鲜 */
  | "fresh";

export type StaleInfo = {
  slug: string;
  name: string;
  /** 该条目所有外链的 host 数量，用于提示核验成本 */
  hosts: string[];
  checkedAt?: string;
  reason: StaleReason;
  /** 距今天数；从未核验或格式非法时为 undefined */
  ageDays?: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** 两个 YYYY-MM-DD 之间的天数差（按 UTC 零点算，避免时区让结果差一天）。 */
function daysBetween(from: string, to: Date): number {
  const [y, m, d] = from.split("-").map(Number);
  const start = Date.UTC(y, m - 1, d);
  return Math.floor((to.getTime() - start) / DAY_MS);
}

/**
 * 判断一个条目的核验新鲜度。
 *
 * **缺字段不等于新鲜** —— 这是本函数最容易写错的地方。若把 undefined 当
 * 「没过期」，那从未核验的条目会永远不出现在巡检报告里，而它们恰恰是最
 * 该核的。
 */
/** 渠道槽位。与 lib/links.ts 的 CHANNEL_IDS 一致，此处只读不写，故用 import type。 */
const LINK_KEYS = ["official", "homepage", "github", "disk"] as const;

export function checkFreshness(
  item: Pick<Software, "slug" | "name" | "links" | "linksCheckedAt">,
  staleDays = DEFAULT_STALE_DAYS,
  now = new Date(),
): StaleInfo {
  const hosts = [...new Set(
    LINK_KEYS
      .map((key) => item.links?.[key])
      .filter((url): url is string => typeof url === "string" && url.length > 0)
      .map((url) => {
        try {
          return new URL(url).host;
        } catch {
          return url;
        }
      }),
  )];

  const checkedAt = item.linksCheckedAt;
  const base = { slug: item.slug, name: item.name, hosts };

  if (checkedAt === undefined) return { ...base, reason: "never" };
  if (!DATE_SHAPE.test(checkedAt) || !isRealDate(checkedAt)) {
    return { ...base, checkedAt, reason: "invalid" };
  }
  const ageDays = daysBetween(checkedAt, now);
  if (ageDays < 0) {
    // 未来的日期通常是手填错误，但也可能是时区造成的轻微偏移。
    // 按「刚核验过」处理，并让调用方能从 reason 看出异常。
    return { ...base, checkedAt, reason: "fresh", ageDays };
  }
  return { ...base, checkedAt, reason: ageDays > staleDays ? "stale" : "fresh", ageDays };
}

/** 需要复验的条目（过期、从未核验、格式非法）。 */
export function staleItems(
  items: readonly Pick<Software, "slug" | "name" | "links" | "linksCheckedAt">[],
  staleDays = DEFAULT_STALE_DAYS,
  now = new Date(),
): StaleInfo[] {
  return items
    .map((item) => checkFreshness(item, staleDays, now))
    .filter((info) => info.reason !== "fresh");
}

const REASON_LABEL: Record<StaleReason, string> = {
  stale: "已过期",
  never: "从未核验",
  invalid: "日期格式非法",
  fresh: "新鲜",
};

export function reasonLabel(reason: StaleReason): string {
  return REASON_LABEL[reason];
}

/** 今天（北京时间）的 YYYY-MM-DD。与 formatDate 同一时区约定。 */
export function today(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/**
 * 汇总：最旧的若干条与各原因计数。
 * 用于巡检报告开头，让「有没有该核的」一眼可见。
 */
export function summarize(infos: readonly StaleInfo[]): {
  total: number;
  fresh: number;
  byReason: Record<StaleReason, number>;
  oldest?: StaleInfo;
} {
  const byReason: Record<StaleReason, number> = { stale: 0, never: 0, invalid: 0, fresh: 0 };
  for (const info of infos) byReason[info.reason] += 1;
  const aged = infos
    .filter((info) => typeof info.ageDays === "number")
    .sort((a, b) => (b.ageDays ?? 0) - (a.ageDays ?? 0));
  return { total: infos.length, fresh: byReason.fresh, byReason, oldest: aged[0] };
}
