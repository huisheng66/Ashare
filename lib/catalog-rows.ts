import type {
  Guide,
  GuideResource,
  GuideResourceKind,
  ItemKind,
  ItemLinks,
  Platform,
  PublishStatus,
  SceneId,
  Software,
  SourceKind,
} from "@/data/types";

/**
 * Software <-> 数据库行的纯映射。
 *
 * 放在 lib/ 而不是脚本里：ETL 导入、db:verify 还原、P4 的 lib/store.ts 三处必须共用同一份映射，
 * 否则「导入的逻辑」与「读回的逻辑」会各自漂移，而漂移只有靠往返比对才发现。
 *
 * 刻意不 import mysql2、不碰文件系统 —— 纯函数才能单测
 * （tests/catalog-rows.test.mjs 拿全部 55 条种子做往返比对）。
 *
 * 时间列一律用 ISO 字符串表示（与 catalog.json 里的形态一致），绑定参数时再由调用方转 Date。
 * 这样往返比对是纯字符串比较，不受时区影响。
 */

/** item_links.kind 的取值；ItemLinks 上的 diskNote / diskSha256 / diskFile 归到 disk 这一行。 */
export type LinkKind = "official" | "homepage" | "github" | "disk";
export const LINK_KINDS: LinkKind[] = ["official", "homepage", "github", "disk"];

export type ItemRow = {
  slug: string;
  name: string;
  name_zh: string | null;
  aliases: string;
  status: PublishStatus;
  kind: ItemKind;
  source: SourceKind;
  price: string | null;
  summary: string;
  body: string;
  tutorial: string;
  who_for: string;
  who_not: string;
  discount_note: string | null;
  license: string | null;
  version: string | null;
  links_checked_at: string | null;
  featured: 0 | 1;
  sort_index: number;
  icon_letter: string;
  icon_color: string | null;
  icon_simple: string | null;
  icon_image: string | null;
  guide_intro: string | null;
  guide_markdown: string | null;
  search_text: string;
  created_at: string;
  updated_at: string;
};

export type LinkRow = {
  kind: LinkKind;
  url: string;
  disk_note: string | null;
  disk_sha256: string | null;
  disk_file: string | null;
};

export type GuideResourceRow = {
  kind: GuideResourceKind;
  title: string;
  url: string;
  note: string | null;
};

/** 一个条目的全部行（主子表一起），顺序即前台呈现顺序。 */
export type ItemBundle = {
  item: ItemRow;
  tags: string[];
  scenes: string[];
  platforms: string[];
  alternatives: string[];
  links: LinkRow[];
  previews: string[];
  guideResources: GuideResourceRow[];
};

/**
 * Software 契约上的字段名。用于发现 JSON 里多出来的键
 * （实测只有一个：种子遗留的 officialLabel，见 db:verify 的「未入库字段」报告）。
 */
export const ITEM_KEYS: string[] = [
  "slug", "name", "nameZh", "aliases", "kind", "status", "tags", "summary", "body",
  "scenes", "platforms", "source", "price", "links", "tutorial", "guide", "whoFor",
  "whoNot", "discountNote", "alternatives", "featured", "previews", "iconImage",
  "createdAt", "updatedAt", "license", "version", "linksCheckedAt", "icon",
];

/** 拼出供 FULLTEXT(ngram) 使用的可搜文本。查询侧同样做 NFKC，两边口径必须一致。 */
export function searchTextOf(item: Software): string {
  return [
    item.name,
    item.nameZh ?? "",
    ...(item.aliases ?? []),
    ...(item.tags ?? []),
    item.summary,
  ].join(" ").normalize("NFKC");
}

/** JSON 里有、但 Software 契约未定义的顶层键。 */
export function nonContractKeys(item: Software): string[] {
  const record = item as unknown as Record<string, unknown>;
  return Object.keys(record).filter((key) => !ITEM_KEYS.includes(key));
}

/**
 * 取「期望形态」：把不会入库、也不影响语义的差异抹平，好让往返比对只暴露真问题。
 *  - 丢掉契约外的遗留键（officialLabel）
 *  - featured: false 与「没有 featured」等价（列是 TINYINT NOT NULL DEFAULT 0）
 * 只做这两件事，不批量丢 falsy —— 否则 body 为空串这类真差异会被静默吞掉。
 */
export function canonicalItem(item: Software): Software {
  const next = { ...(item as unknown as Record<string, unknown>) };
  for (const key of nonContractKeys(item)) delete next[key];
  if (!next.featured) delete next.featured;
  return next as unknown as Software;
}

function requireTime(value: string | undefined, field: string, slug: string): string {
  if (!value) {
    throw new Error("[catalog-rows] " + slug + " 缺少 " + field + "；导入前应先用 lib/store.ts 的 normalize 补齐");
  }
  return value;
}

export function toBundle(item: Software, sortIndex: number): ItemBundle {
  const links: LinkRow[] = [];
  for (const kind of LINK_KINDS) {
    const url = item.links?.[kind];
    if (!url) continue;
    links.push({
      kind,
      url,
      disk_note: kind === "disk" ? item.links.diskNote ?? null : null,
      disk_sha256: kind === "disk" ? item.links.diskSha256 ?? null : null,
      disk_file: kind === "disk" ? item.links.diskFile ?? null : null,
    });
  }
  return {
    item: {
      slug: item.slug,
      name: item.name,
      name_zh: item.nameZh ?? null,
      aliases: JSON.stringify(item.aliases ?? []),
      status: item.status,
      kind: item.kind,
      source: item.source,
      price: item.price ?? null,
      summary: item.summary,
      body: item.body,
      tutorial: JSON.stringify(item.tutorial ?? []),
      who_for: item.whoFor,
      who_not: item.whoNot,
      discount_note: item.discountNote ?? null,
      license: item.license ?? null,
      version: item.version ?? null,
      links_checked_at: item.linksCheckedAt ?? null,
      featured: item.featured ? 1 : 0,
      sort_index: sortIndex,
      icon_letter: item.icon.letter,
      icon_color: item.icon.color ?? null,
      icon_simple: item.icon.simpleIcon ?? null,
      icon_image: item.iconImage ?? null,
      guide_intro: item.guide?.intro ?? null,
      guide_markdown: item.guide?.markdown ?? null,
      search_text: searchTextOf(item),
      created_at: requireTime(item.createdAt, "createdAt", item.slug),
      updated_at: requireTime(item.updatedAt, "updatedAt", item.slug),
    },
    tags: [...(item.tags ?? [])],
    scenes: [...(item.scenes ?? [])],
    platforms: [...(item.platforms ?? [])],
    alternatives: [...(item.alternatives ?? [])],
    links,
    previews: [...(item.previews ?? [])],
    guideResources: (item.guide?.resources ?? []).map((resource) => ({
      kind: resource.kind,
      title: resource.title,
      url: resource.url,
      note: resource.note ?? null,
    })),
  };
}

function linksOf(rows: LinkRow[]): ItemLinks {
  const links: ItemLinks = {};
  for (const row of rows) {
    if (row.kind === "disk") {
      links.disk = row.url;
      if (row.disk_note) links.diskNote = row.disk_note;
      if (row.disk_sha256) links.diskSha256 = row.disk_sha256;
      if (row.disk_file) links.diskFile = row.disk_file;
    } else {
      links[row.kind] = row.url;
    }
  }
  return links;
}

function guideOf(row: ItemRow, rows: GuideResourceRow[]): Guide | undefined {
  const resources: GuideResource[] = rows.map((resource) => {
    const next: GuideResource = { kind: resource.kind, title: resource.title, url: resource.url };
    if (resource.note) next.note = resource.note;
    return next;
  });
  if (!row.guide_intro && !row.guide_markdown && !resources.length) return undefined;
  const guide: Guide = { resources };
  if (row.guide_intro) guide.intro = row.guide_intro;
  if (row.guide_markdown) guide.markdown = row.guide_markdown;
  return guide;
}

/** 行还原成 Software。可选字段只在有值时出现，与 normalize() 之后的 JSON 形态一致。 */
export function fromBundle(bundle: ItemBundle): Software {
  const row = bundle.item;
  const item: Software = {
    slug: row.slug,
    name: row.name,
    aliases: JSON.parse(row.aliases) as string[],
    kind: row.kind,
    status: row.status,
    tags: bundle.tags,
    summary: row.summary,
    body: row.body,
    scenes: bundle.scenes as SceneId[],
    platforms: bundle.platforms as Platform[],
    source: row.source,
    links: linksOf(bundle.links),
    tutorial: JSON.parse(row.tutorial) as string[],
    whoFor: row.who_for,
    whoNot: row.who_not,
    alternatives: bundle.alternatives,
    previews: bundle.previews,
    icon: { letter: row.icon_letter, color: row.icon_color ?? "#000000" },
  };
  if (row.name_zh) item.nameZh = row.name_zh;
  if (row.price) item.price = row.price;
  if (row.discount_note) item.discountNote = row.discount_note;
  if (row.license) item.license = row.license;
  if (row.version) item.version = row.version;
  if (row.links_checked_at) item.linksCheckedAt = row.links_checked_at;
  if (row.icon_image) item.iconImage = row.icon_image;
  if (row.icon_simple) item.icon.simpleIcon = row.icon_simple;
  if (row.featured === 1) item.featured = true;
  item.createdAt = row.created_at;
  item.updatedAt = row.updated_at;
  const guide = guideOf(row, bundle.guideResources);
  if (guide) item.guide = guide;
  return item;
}

/**
 * 数据库原始行 -> ItemRow。
 *
 * 两处必须在这里抹平：
 *  - mysql2 会把 JSON 列直接解析成对象/数组，而 ItemRow 用 JSON 字符串承载（往返比对才是纯字符串比较）
 *  - DATETIME(3) 回来是 Date，DATE 已由 dateStrings 保证是字符串
 */
export function itemRowFromDb(raw: Record<string, unknown>): ItemRow {
  const json = (value: unknown): string => (typeof value === "string" ? value : JSON.stringify(value ?? []));
  const iso = (value: unknown): string => (value instanceof Date ? value.toISOString() : String(value));
  const day = (value: unknown): string | null =>
    value == null ? null : (value instanceof Date ? value.toISOString() : String(value)).slice(0, 10);
  return {
    ...(raw as unknown as ItemRow),
    aliases: json(raw.aliases),
    tutorial: json(raw.tutorial),
    created_at: iso(raw.created_at),
    updated_at: iso(raw.updated_at),
    links_checked_at: day(raw.links_checked_at),
    featured: Number(raw.featured) === 1 ? 1 : 0,
  };
}
