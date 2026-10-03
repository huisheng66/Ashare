import type { ItemLinks as ItemLinksData } from "@/data/types";

/**
 * 外链渠道的规范视图。
 *
 * 存量数据用命名槽位（official / github / homepage / disk）表达渠道，
 * 这套字段在「镜像」「主 CTA」「统计维度」三处各自判断了一遍，
 * 新增一种渠道（例如文档站、发布页）要改四处。
 *
 * 这里只做读取侧的规范化：把槽位摊平成有序渠道列表，
 * **不改动 catalog.json 的存储结构**，因此无需迁移现有 35 条数据。
 */

/** 渠道用途。决定它在详情页的位置、是否可作主 CTA、统计如何归类。 */
export type ChannelRole =
  /** 厂商官网 / 项目主页：唯一可作主 CTA 的第一选择 */
  | "primary"
  /** 产品主页：官网缺位时的次选 */
  | "product"
  /** 开源仓库 */
  | "repo"
  /** 已核验镜像：永不作主 CTA，必须附说明 */
  | "mirror";

export type LinkChannel = {
  /** 稳定标识，用于统计聚合与 React key */
  id: string;
  role: ChannelRole;
  /** 展示名，如「官网」 */
  label: string;
  url: string;
  /** URL 的 host，解析失败时回退原文 */
  host: string;
  /** 镜像说明，只有 mirror 角色有值 */
  note?: string;
};

/** 渠道 id 白名单。统计上报只接受这里的值。 */
const CHANNEL_IDS = ["official", "homepage", "github", "disk"] as const;

export type ChannelId = (typeof CHANNEL_IDS)[number];

export function isChannelId(value: string): value is ChannelId {
  return CHANNEL_IDS.includes(value as ChannelId);
}

/** 角色决定图标与徽章语气，顺序即详情页的展示顺序。 */
const CHANNEL_SPECS: { id: ChannelId; role: ChannelRole; label: string }[] = [
  { id: "official", role: "primary", label: "官网" },
  { id: "homepage", role: "product", label: "产品主页" },
  { id: "github", role: "repo", label: "GitHub" },
  { id: "disk", role: "mirror", label: "已核验镜像" },
];

export function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

/**
 * 把槽位展开为有序渠道。空槽位不产出条目。
 * 官方顺序：官网 → 产品主页 → GitHub → 镜像，与视觉规范 7.13 一致。
 */
export function linkChannels(links: ItemLinksData): LinkChannel[] {
  const rows: LinkChannel[] = [];
  for (const spec of CHANNEL_SPECS) {
    const url = links[spec.id];
    if (typeof url !== "string") continue;
    const trimmed = url.trim();
    if (!trimmed) continue;
    rows.push({
      id: spec.id,
      role: spec.role,
      label: spec.label,
      url: trimmed,
      host: hostOf(trimmed),
      ...(spec.role === "mirror" ? { note: links.diskNote } : {}),
    });
  }
  return rows;
}

/**
 * 主 CTA 渠道：官网 → GitHub → 产品主页，镜像永不入选。
 * 返回 undefined 而不是空串，调用方不必再判空串。
 */
export function primaryChannel(links: ItemLinksData): LinkChannel | undefined {
  const channels = linkChannels(links);
  return channels.find((c) => c.role === "primary")
    ?? channels.find((c) => c.role === "repo")
    ?? channels.find((c) => c.role === "product");
}

/** 除主渠道外剩余的渠道数。 */
export function otherChannels(links: ItemLinksData): LinkChannel[] {
  const primary = primaryChannel(links);
  return linkChannels(links).filter((c) => c.id !== primary?.id);
}

/** 镜像必须附说明；没有说明的镜像按不可信处理，不予展示。 */
export function isVerifiedMirror(channel: LinkChannel): boolean {
  return channel.role !== "mirror" || Boolean(channel.note?.trim());
}
