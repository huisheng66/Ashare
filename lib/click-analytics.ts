import type { ItemKind, SceneId, Software } from "@/data/types";
import type { ChannelId } from "./links";

/**
 * 渠道白名单就地定义，不从 `lib/links.ts` 运行时导入。
 *
 * 原因：测试用 `node --test` 靠类型擦除直接跑 `.ts`，相对导入必须带
 * `.ts` 扩展名才能被 Node 解析；而 tsconfig 没开 `allowImportingTsExtensions`，
 * 带扩展名会让 `tsc --noEmit` 报错。`import type` 运行时被擦除所以不受影响，
 * 但白名单是值，必须解析到文件。
 *
 * 代价是这里与 `lib/links.ts` 各有一份渠道列表。两者的同步由
 * `tests/click-analytics.test.mjs` 里「两个模块的渠道集合必须一致」守住。
 */
const CHANNEL_IDS: readonly ChannelId[] = ["official", "homepage", "github", "disk"];

function isChannelId(value: string): value is ChannelId {
  return CHANNEL_IDS.includes(value as ChannelId);
}

/**
 * 点击数据的展示层聚合。
 *
 * 统计的原始形状是 (slug, channel, time) 三元组，直接渲染会得到一堆
 * 重复条目的行。这里把它折成「每个条目一行 + 渠道拆分」，
 * 并与目录里的条目信息合并 —— 页面需要的是「Blender 点了 40 次，
 * 其中 38 次走官网」，而不是 4 行各 38 次的计数。
 */

export type ChannelBreakdown = {
  channel: ChannelId;
  label: string;
  count: number;
};

export type ItemClickRow = {
  slug: string;
  /** 条目名称；条目已删除时为 undefined */
  name?: string;
  kind?: ItemKind;
  scenes?: SceneId[];
  source?: Software["source"];
  total: number;
  breakdown: ChannelBreakdown[];
  /** 占全部点击的比例，0–1 */
  share: number;
};

const CHANNEL_LABEL: Record<ChannelId, string> = {
  official: "官网",
  homepage: "产品主页",
  github: "GitHub",
  disk: "镜像",
};

/** 渠道展示顺序，与详情页一致：官网 → 主页 → GitHub → 镜像。 */
const CHANNEL_ORDER: ChannelId[] = ["official", "homepage", "github", "disk"];

export type RawCount = { slug: string; channel: string; count: number };

/**
 * 把 (slug, channel) 计数折成按条目聚合的行。
 *
 * `items` 传入目录用于补名称与分类；统计里出现但目录里没有的 slug
 * （条目被删）仍会列出，只是不带名称 —— 删条目不该让历史点击凭空消失，
 * 顺便也能提醒「这个 slug 该清理了」。
 */
export function itemClickRows(
  counts: Iterable<RawCount>,
  items: readonly Pick<Software, "slug" | "name" | "kind" | "scenes" | "source">[],
): ItemClickRow[] {
  const bySlug = new Map(items.map((item) => [item.slug, item]));
  const grouped = new Map<string, Map<ChannelId, number>>();

  for (const { slug, channel, count } of counts) {
    if (!slug || !Number.isFinite(count) || count <= 0) continue;
    // 未知渠道直接丢：统计白名单之外的 id 只可能是脏数据或旧版本残留。
    if (!isChannelId(channel)) continue;
    const channels = grouped.get(slug) ?? new Map<ChannelId, number>();
    channels.set(channel, (channels.get(channel) ?? 0) + count);
    grouped.set(slug, channels);
  }

  const grandTotal = [...grouped.values()].reduce(
    (sum, channels) => sum + [...channels.values()].reduce((a, b) => a + b, 0),
    0,
  );

  const rows: ItemClickRow[] = [];
  for (const [slug, channels] of grouped) {
    const item = bySlug.get(slug);
    const breakdown = CHANNEL_ORDER
      .filter((id) => channels.has(id))
      .map((id) => ({ channel: id, label: CHANNEL_LABEL[id], count: channels.get(id)! }));
    const total = breakdown.reduce((sum, row) => sum + row.count, 0);
    rows.push({
      slug,
      name: item?.name,
      kind: item?.kind,
      scenes: item?.scenes,
      source: item?.source,
      total,
      breakdown,
      // grandTotal 为 0 时不会出现这一行（没有计数就没有分组），此处只是兜底除零。
      share: grandTotal > 0 ? total / grandTotal : 0,
    });
  }

  return rows.sort((a, b) => b.total - a.total || a.slug.localeCompare(b.slug));
}

/** 渠道维度的总计，用于「用户更常走哪个渠道」。 */
export function channelTotals(rows: readonly ItemClickRow[]): { channel: ChannelId; label: string; count: number }[] {
  const counts = new Map<ChannelId, number>();
  for (const row of rows) {
    for (const { channel, count } of row.breakdown) {
      counts.set(channel, (counts.get(channel) ?? 0) + count);
    }
  }
  return CHANNEL_ORDER.filter((id) => counts.has(id)).map((id) => ({
    channel: id,
    label: CHANNEL_LABEL[id],
    count: counts.get(id)!,
  }));
}

export type DayPoint = { day: string; count: number };

/**
 * 按天序列。补齐空缺日期，否则趋势图会把「没点击的那天」直接跳过，
 * 让连续 7 天看起来像只有 3 天。
 */
export function dailySeries(
  byDay: ReadonlyMap<string, number>,
  days: number,
  now = new Date(),
): DayPoint[] {
  const series: DayPoint[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const day = new Date(now);
    day.setDate(day.getDate() - offset);
    const key = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(day);
    series.push({ day: key, count: byDay.get(key) ?? 0 });
  }
  return series;
}

/** 「10 月 3 日」；年份与今年不同时才带上年份。 */
export function shortDay(day: string): string {
  const [, month, date] = day.split("-");
  if (!month || !date) return day;
  return `${Number(month)} 月 ${Number(date)} 日`;
}
