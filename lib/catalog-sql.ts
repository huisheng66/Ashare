import type { PoolConnection, RowDataPacket } from "mysql2/promise";

import type { CatalogCounts, CatalogItem, ItemKind, Platform, SceneId, Software } from "@/data/types";
import { assembleSoftware, loadChildren, loadItem, loadItemsBySlugs } from "./catalog-persist.ts";
import { getPool } from "./db.ts";
import { kindIds, platformIds, sceneIds, type CatalogFilters } from "./catalog-query.ts";

/**
 * 目录的 SQL 读路径。
 *
 * 与 JSON 回滚路径（内存里全量过滤）并存，由 lib/catalog.ts 按 STORE_DRIVER 转发。
 *
 * 两条硬规矩：
 *  1. **列表只做窄投影**：卡片要的列才查，绝不 SELECT * —— body / guide_markdown 是最大的两列，
 *     全量读它们正是「几何增长后第一个炸的地方」。
 *  2. **子行按 id 收窄**：详情页只取一条，就不能整表读 item_tags。
 */

/** 卡片需要的列（对应 CatalogItem）。刻意不含 body / guide / tutorial / links。 */
const CARD_COLUMNS = [
  "i.id", "i.slug", "i.name", "i.name_zh", "i.kind", "i.summary",
  "i.source", "i.price", "i.featured",
  "i.icon_letter", "i.icon_color", "i.icon_simple", "i.icon_image",
].join(", ");

function filterClause(filters: CatalogFilters): { where: string; params: unknown[] } {
  const where = ["i.status = 'published'"];
  const params: unknown[] = [];
  if (filters.scenes.size) {
    // 用 IN(子查询) 而不是逐行 EXISTS：MySQL 8 能把它优化成半连接，一次物化再连接；
    // 实测 20,000 条时 EXISTS 版本要 95ms（5,000 条时只要 4ms，超线性）。
    where.push("i.id IN (SELECT s.item_id FROM item_scenes s WHERE s.scene_id IN (?))");
    params.push([...filters.scenes]);
  }
  if (filters.platforms.size) {
    where.push("i.id IN (SELECT p.item_id FROM item_platforms p WHERE p.platform IN (?))");
    params.push([...filters.platforms]);
  }
  if (filters.kinds.size) {
    where.push("i.kind IN (?)");
    params.push([...filters.kinds]);
  }
  if (filters.discountOnly) where.push("i.source = 'discount'");
  return { where: where.join(" AND "), params };
}

/**
 * 排序。注意 sort=name 用的是 utf8mb4_0900_ai_ci，与 JSON 路径的 Intl.Collator("zh-CN", numeric)
 * 不完全等价：差异只在含数字的名称（"Python 3" vs "Python 10" 的自然序）。要完全一致得另加排序键列。
 */
const ORDER_BY: Record<CatalogFilters["sort"], string> = {
  featured: "i.featured DESC, i.sort_index ASC, i.id ASC",
  updated: "i.updated_at DESC, i.id ASC",
  name: "i.name ASC, i.id ASC",
};

async function withConnection<T>(work: (conn: PoolConnection) => Promise<T>): Promise<T> {
  const conn = await getPool().getConnection();
  try {
    return await work(conn);
  } finally {
    conn.release();
  }
}

async function toCards(conn: PoolConnection, rows: RowDataPacket[]): Promise<CatalogItem[]> {
  if (!rows.length) return [];
  const ids = rows.map((row) => Number(row.id));
  const [tagRows] = await conn.query<RowDataPacket[]>("SELECT item_id, tag FROM item_tags WHERE item_id IN (?) ORDER BY item_id, sort_index, tag", [ids]);
  const [sceneRows] = await conn.query<RowDataPacket[]>("SELECT item_id, scene_id FROM item_scenes WHERE item_id IN (?) ORDER BY item_id, sort_index, scene_id", [ids]);
  const [platformRows] = await conn.query<RowDataPacket[]>("SELECT item_id, platform FROM item_platforms WHERE item_id IN (?) ORDER BY item_id, sort_index, platform", [ids]);
  const [previewRows] = await conn.query<RowDataPacket[]>("SELECT item_id, path FROM item_previews WHERE item_id IN (?) ORDER BY item_id, sort_index", [ids]);

  const group = (childRows: RowDataPacket[], column: string): Map<string, string[]> => {
    const map = new Map<string, string[]>();
    for (const row of childRows) {
      const id = String(row.item_id);
      if (!map.has(id)) map.set(id, []);
      map.get(id)!.push(String(row[column]));
    }
    return map;
  };
  const tags = group(tagRows, "tag");
  const scenes = group(sceneRows, "scene_id");
  const platforms = group(platformRows, "platform");
  // 卡片只显示第一张预览（与 toCatalogItem 的 slice(0, 1) 一致）。
  const firstPreview = new Map<string, string>();
  for (const row of previewRows) {
    const id = String(row.item_id);
    if (!firstPreview.has(id)) firstPreview.set(id, String(row.path));
  }

  // 可选键一律显式写出（值可能是 undefined），与 lib/items.ts 的 toCatalogItem 逐字对齐：
  // deepStrictEqual 区分「键存在但为 undefined」与「键不存在」，只在有值时加键会让两条读路径的
  // 结果不可互换。JSON 序列化时 undefined 会被丢掉，所以对 RSC 载荷没有影响。
  return rows.map((row) => {
    const id = String(row.id);
    const preview = firstPreview.get(id);
    const simpleIcon = row.icon_simple == null ? undefined : String(row.icon_simple);
    return {
      slug: String(row.slug),
      name: String(row.name),
      nameZh: row.name_zh == null ? undefined : String(row.name_zh),
      kind: row.kind as ItemKind,
      tags: tags.get(id) ?? [],
      summary: String(row.summary),
      scenes: (scenes.get(id) ?? []) as SceneId[],
      platforms: (platforms.get(id) ?? []) as Platform[],
      source: row.source as CatalogItem["source"],
      price: row.price == null ? undefined : String(row.price),
      featured: Number(row.featured) === 1 ? true : undefined,
      previews: preview ? [preview] : [],
      iconImage: row.icon_image == null ? undefined : String(row.icon_image),
      icon: {
        letter: String(row.icon_letter),
        color: row.icon_color == null ? "#000000" : String(row.icon_color),
        simpleIcon,
      },
    } satisfies CatalogItem;
  });
}

export async function countCatalog(filters: CatalogFilters): Promise<number> {
  const { where, params } = filterClause(filters);
  const [rows] = await getPool().query<RowDataPacket[]>("SELECT COUNT(*) AS c FROM items i WHERE " + where, params);
  return Number(rows[0].c);
}

export async function queryCatalog(filters: CatalogFilters, limit: number, offset: number): Promise<CatalogItem[]> {
  const { where, params } = filterClause(filters);
  return withConnection(async (conn) => {
    const [rows] = await conn.query<RowDataPacket[]>(
      "SELECT " + CARD_COLUMNS + " FROM items i WHERE " + where +
        " ORDER BY " + ORDER_BY[filters.sort] + " LIMIT ? OFFSET ?",
      [...params, limit, offset],
    );
    return toCards(conn, rows);
  });
}

function fillCounts<T extends string>(ids: readonly T[], rows: RowDataPacket[]): Record<T, number> {
  const out = Object.fromEntries(ids.map((id) => [id, 0])) as Record<T, number>;
  for (const row of rows) {
    const key = String(row.id);
    if (Object.hasOwn(out, key)) out[key as T] = Number(row.c);
  }
  return out;
}

/** 计数全部下推到 SQL：根布局每页都要用，它是最热的读。 */
export async function catalogCountsSql(): Promise<CatalogCounts> {
  const pool = getPool();
  const [totals] = await pool.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS total, SUM(source = 'discount') AS discount FROM items WHERE status = 'published'",
  );
  const [kindRows] = await pool.query<RowDataPacket[]>(
    "SELECT kind AS id, COUNT(*) AS c FROM items WHERE status = 'published' GROUP BY kind",
  );
  const [sceneRows] = await pool.query<RowDataPacket[]>(
    "SELECT s.scene_id AS id, COUNT(*) AS c FROM item_scenes s JOIN items i ON i.id = s.item_id WHERE i.status = 'published' GROUP BY s.scene_id",
  );
  const [platformRows] = await pool.query<RowDataPacket[]>(
    "SELECT p.platform AS id, COUNT(*) AS c FROM item_platforms p JOIN items i ON i.id = p.item_id WHERE i.status = 'published' GROUP BY p.platform",
  );
  return {
    total: Number(totals[0].total),
    discount: Number(totals[0].discount ?? 0),
    kinds: fillCounts(kindIds, kindRows),
    scenes: fillCounts(sceneIds, sceneRows),
    platforms: fillCounts(platformIds, platformRows),
  };
}

/** 首页「编辑精选」横滑行：只取需要的条数，不再为它全量加载。 */
export async function featuredCatalog(limit: number): Promise<{ items: CatalogItem[]; total: number }> {
  const [countRows] = await getPool().query<RowDataPacket[]>(
    "SELECT COUNT(*) AS c FROM items i WHERE i.status = 'published' AND i.featured = 1",
  );
  const items = await withConnection(async (conn) => {
    const [rows] = await conn.query<RowDataPacket[]>(
      "SELECT " + CARD_COLUMNS + " FROM items i WHERE i.status = 'published' AND i.featured = 1 ORDER BY i.sort_index, i.id LIMIT ?",
      [limit],
    );
    return toCards(conn, rows);
  });
  return { items, total: Number(countRows[0].c) };
}

export async function allPublishedSql(): Promise<Software[]> {
  return withConnection(async (conn) => {
    const [rows] = await conn.query<RowDataPacket[]>("SELECT * FROM items WHERE status = 'published' ORDER BY sort_index, id");
    return assembleSoftware(rows, await loadChildren(conn, rows.map((row) => Number(row.id))));
  });
}

export async function getSoftwareSql(slug: string): Promise<Software | undefined> {
  return withConnection((conn) => loadItem(conn, slug));
}

export async function alternativesOfSql(slugs: string[]): Promise<Software[]> {
  return withConnection((conn) => loadItemsBySlugs(conn, slugs));
}

export async function bySceneSql(sceneId: string): Promise<Software[]> {
  return withConnection(async (conn) => {
    const [rows] = await conn.query<RowDataPacket[]>(
      "SELECT i.* FROM items i JOIN item_scenes s ON s.item_id = i.id WHERE i.status = 'published' AND s.scene_id = ? ORDER BY i.sort_index, i.id",
      [sceneId],
    );
    return assembleSoftware(rows, await loadChildren(conn, rows.map((row) => Number(row.id))));
  });
}

/** 站点地图只需要 slug 与更新时间，别把整个条目读出来。 */
export async function sitemapPage(offset: number, limit: number): Promise<{ slug: string; updatedAt?: string }[]> {
  const [rows] = await getPool().query<RowDataPacket[]>(
    "SELECT slug, updated_at FROM items WHERE status = 'published' ORDER BY sort_index, id LIMIT ? OFFSET ?",
    [limit, offset],
  );
  return rows.map((row) => {
    const updated = new Date(row.updated_at as Date).toISOString();
    return Number.isFinite(Date.parse(updated)) ? { slug: String(row.slug), updatedAt: updated } : { slug: String(row.slug) };
  });
}

export async function publishedCount(): Promise<number> {
  const [rows] = await getPool().query<RowDataPacket[]>("SELECT COUNT(*) AS c FROM items WHERE status = 'published'");
  return Number(rows[0].c);
}

/**
 * 点击页补名称与分类用的窄查询：只取统计里出现过的 slug，不再为它拉整份目录。
 * 查不到的 slug（条目已删）不会出现在结果里，itemClickRows 会照旧列出但不带名称。
 */
export async function clickItemSummaries(
  slugs: string[],
): Promise<{ slug: string; name: string; kind: ItemKind; scenes: SceneId[]; source: Software["source"] }[]> {
  if (!slugs.length) return [];
  const [rows] = await getPool().query<RowDataPacket[]>(
    "SELECT slug, name, kind, source FROM items WHERE slug IN (?)",
    [slugs],
  );
  const [sceneRows] = await getPool().query<RowDataPacket[]>(
    "SELECT i.slug, s.scene_id FROM item_scenes s JOIN items i ON i.id = s.item_id WHERE i.slug IN (?) ORDER BY s.sort_index",
    [slugs],
  );
  const scenes = new Map<string, SceneId[]>();
  for (const row of sceneRows) {
    const slug = String(row.slug);
    if (!scenes.has(slug)) scenes.set(slug, []);
    scenes.get(slug)!.push(String(row.scene_id) as SceneId);
  }
  return rows.map((row) => ({
    slug: String(row.slug),
    name: String(row.name),
    kind: row.kind as ItemKind,
    scenes: scenes.get(String(row.slug)) ?? [],
    source: row.source as Software["source"],
  }));
}

/**
 * ngram 分词长度，与 MySQL 的 innodb ngram_token_size 一致。
 * 短于它的词 FULLTEXT 永远查不到（实测：MATCH AGAINST('图') 返回 0 行），必须走 LIKE 兜底。
 */
const NGRAM_TOKEN_SIZE = 2;

/** 与 lib/items.ts 的 normalizeSearchText 同口径：全角归一、折叠空白，大小写交给列排序规则。 */
function normalizeQuery(raw: string): string {
  return raw.normalize("NFKC").replace(/\s+/gu, " ").trim();
}

/**
 * 布尔模式的操作符必须剥掉：用户输入里的 "-" 会被当成排除，"(" 会直接造成语法错误。
 * 只在 MATCH 路径使用；LIKE 路径没有操作符，保留原词。
 */
function booleanTerm(term: string): string {
  return term.replace(/[+\-><()~*"@]/g, "").trim();
}

/** LIKE 的转义字符是反斜杠，用户输入里的 % 与 _ 必须转义，否则会变成通配符。 */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (character) => "\\" + character);
}

export type SearchResult = { items: CatalogItem[]; total: number };

/**
 * 目录搜索。
 *
 * 口径说明（与 JSON 回滚路径的差异，已记入计划文档）：
 *  - 检索字段是 items.search_text（名称 + 中文名 + 别名 + 标签 + 简介），**不含长正文**。
 *    旧的内存实现还会扫 body / whoFor / whoNot，因此只在正文里出现的词搜不到了 —— 这是
 *    「把 5 万字的正文塞进全文索引」换来的取舍，不是疏漏。
 *  - 每个词都必须命中（AND），与旧实现一致；布尔模式的 "+" 前缀就是这个意思。
 *  - 排序：先按名称命中程度分档（精确 → 前缀 → 包含），再按全文相关度，最后回到目录顺序。
 *  - 短于 2 字的词走 LIKE，无法用索引，是一次全表扫描；短查询本来就少，且 5 万条量级可接受。
 *    要根治得调小 ngram_token_size（索引膨胀）或上独立搜索引擎。
 */
export async function searchCatalog(raw: string, limit: number, offset: number): Promise<SearchResult> {
  const query = normalizeQuery(raw);
  if (!query) return { items: [], total: 0 };

  const longTerms: string[] = [];
  const shortTerms: string[] = [];
  for (const term of [...new Set(query.split(" "))].filter(Boolean)) {
    const sanitized = booleanTerm(term);
    // 用净化后的长度判断能否交给 ngram：净化后只剩 1 个字符，MATCH 同样查不到。
    if (sanitized.length >= NGRAM_TOKEN_SIZE) longTerms.push(sanitized);
    else shortTerms.push(term);
  }

  const conditions = ["i.status = 'published'"];
  const whereParams: unknown[] = [];
  if (longTerms.length) {
    conditions.push("MATCH(i.search_text) AGAINST(? IN BOOLEAN MODE)");
    whereParams.push(longTerms.map((term) => "+" + term).join(" "));
  }
  for (const term of shortTerms) {
    conditions.push("i.search_text LIKE ?");
    whereParams.push("%" + escapeLike(term) + "%");
  }
  // 输入全是符号时上面两条都不成立，退化成整体包含匹配，而不是返回全部。
  if (!longTerms.length && !shortTerms.length) {
    conditions.push("i.search_text LIKE ?");
    whereParams.push("%" + escapeLike(query) + "%");
  }
  const condition = conditions.join(" AND ");

  return withConnection(async (conn) => {
    const [countRows] = await conn.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS c FROM items i WHERE " + condition,
      whereParams,
    );
    const total = Number(countRows[0].c);
    if (!total) return { items: [], total: 0 };

    const orderParams: unknown[] = [query, escapeLike(query) + "%", "%" + escapeLike(query) + "%"];
    let order =
      "CASE WHEN i.name = ? THEN 0 WHEN i.name LIKE ? THEN 1 WHEN i.name LIKE ? THEN 2 ELSE 3 END ASC";
    if (longTerms.length) {
      order += ", MATCH(i.search_text) AGAINST(? IN BOOLEAN MODE) DESC";
      orderParams.push(longTerms.map((term) => "+" + term).join(" "));
    }
    order += ", i.sort_index ASC, i.id ASC";

    const [rows] = await conn.query<RowDataPacket[]>(
      "SELECT " + CARD_COLUMNS + " FROM items i WHERE " + condition + " ORDER BY " + order + " LIMIT ? OFFSET ?",
      [...whereParams, ...orderParams, limit, offset],
    );
    return { items: await toCards(conn, rows), total };
  });
}
