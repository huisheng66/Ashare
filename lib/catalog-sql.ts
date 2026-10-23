import type { PoolConnection, RowDataPacket } from "mysql2/promise";

import type { CatalogCounts, CatalogItem, ItemKind, Platform, SceneId, Software } from "@/data/types";
import { assembleSoftware, loadChildren, loadItem, loadItemsBySlugs } from "./catalog-persist.ts";
import { getPool } from "./db.ts";
import { kindIds, platformIds, sceneIds, type CatalogFilters } from "./catalog-query.ts";
import { pinyin as toPinyin } from "pinyin-pro";

import { pickCorrection } from "./spell-correct.ts";
// 值导入必须用相对路径：`@/data/*` 在 tsc/Next 里能解析，但 `node --test` 直跑 .ts 时
// 不认这个别名。项目里其余的 `@/data/types` 都是 import type（编译后擦除），所以之前没暴露。
import { SYNONYM_GROUPS, synonymsOf } from "../data/synonyms.ts";

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

export type SearchResult = {
  items: CatalogItem[];
  total: number;
  /** true 表示严格匹配无结果、已放宽为 OR 语义（容错降级）。调用方据此提示读者。 */
  fuzzy: boolean;
  /**
   * 拼写纠正后的查询词（仅当原查询 0 结果、且纠正后才命中时才有值）。
   * 前台据此显示「已按 X 搜索」—— 悄悄换掉用户的输入是不诚实的。
   */
  corrected?: string;
};

/**
 * 名称词表，供拼写纠正比对。
 *
 * 只收名称/中文名/别名：简介里的词不是「用户想找的东西的名字」，
 * 拿它做编辑距离纠正会把 git 纠成 get 之类的噪音。
 *
 * 带 5 分钟缓存：纠正只在 0 结果时触发（罕见路径），但一次 415 行的全表扫
 * 也不该在用户连打错几个词时反复执行。
 */
let vocabularyCache: { at: number; words: string[] } | null = null;
const VOCABULARY_TTL_MS = 5 * 60_000;

async function nameVocabulary(): Promise<string[]> {
  if (vocabularyCache && Date.now() - vocabularyCache.at < VOCABULARY_TTL_MS) {
    return vocabularyCache.words;
  }
  const words = await withConnection(async (conn) => {
    const [rows] = await conn.query<RowDataPacket[]>(
      "SELECT name, name_zh, aliases FROM items WHERE status = 'published'",
    );
    const set = new Set<string>();
    for (const row of rows) {
      if (typeof row.name === "string" && row.name.trim()) set.add(row.name.trim());
      if (typeof row.name_zh === "string" && row.name_zh.trim()) set.add(row.name_zh.trim());
      // aliases 是 JSON 列：驱动可能返回已解析的数组，也可能返回字符串。
      let aliases: unknown = row.aliases;
      if (typeof aliases === "string") {
        try {
          aliases = JSON.parse(aliases);
        } catch {
          aliases = [];
        }
      }
      if (Array.isArray(aliases)) {
        for (const alias of aliases) {
          if (typeof alias === "string" && alias.trim()) set.add(alias.trim());
        }
      }
    }
    return [...set];
  });
  vocabularyCache = { at: Date.now(), words };
  return words;
}

/** 逐词尝试纠正；没有任何词被改动时返回 null（调用方据此跳过二次查询）。 */
async function correctQuery(query: string): Promise<string | null> {
  const terms = query.split(" ").filter(Boolean);
  if (!terms.length) return null;
  const vocabulary = await nameVocabulary();
  let changed = false;
  const fixed = terms.map((term) => {
    const hit = pickCorrection(term, vocabulary);
    if (hit && hit.toLowerCase() !== term.toLowerCase()) {
      changed = true;
      return hit;
    }
    return term;
  });
  return changed ? fixed.join(" ") : null;
}

/**
 * 原文召回条件（search_text）。strict=true 时每个词都必须命中（布尔模式的 + 前缀）；
 * strict=false 去掉 + 变成 OR 语义，用于零结果时的容错降级。
 *
 * `expand=true` 时把每个词换成同义词分组 `+(图片 图像 照片)`。这是 MySQL 布尔模式的
 * **组语法**：组内任一命中即可，组之间仍是 AND —— 正好对应「这个概念的任一种说法」。
 * 实测 `+图片` 13 条、`+(图片 图像 照片)` 34 条，新召回的全是图片工具。
 */
function textRecall(
  longTerms: string[],
  shortTerms: string[],
  query: string,
  strict: boolean,
  expand = false,
) {
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (longTerms.length) {
    const groups = longTerms.map((term) => {
      if (!expand) return term;
      const others = synonymsOf(term);
      // 没有同义词时不加括号：`+(图片)` 与 `+图片` 等价，但前者让 SQL 更难读。
      return others.length ? "(" + [term, ...others].join(" ") + ")" : term;
    });
    conditions.push("MATCH(i.search_text) AGAINST(? IN BOOLEAN MODE)");
    params.push(groups.map((term) => (strict ? "+" : "") + term).join(" "));
  }
  for (const term of shortTerms) {
    conditions.push("i.search_text LIKE ?");
    params.push("%" + escapeLike(term) + "%");
  }
  // 输入全是符号时上面两条都不成立，退化成整体包含匹配，而不是返回全部。
  if (!conditions.length) {
    conditions.push("i.search_text LIKE ?");
    params.push("%" + escapeLike(query) + "%");
  }
  return { where: "(" + conditions.join(" AND ") + ")", params };
}

const HAN = /[\u4e00-\u9fff]/;

/**
 * 拼音 → 同组其它词的拼音。
 *
 * 为什么需要：同义词扩展只作用在 search_text（中文/英文原文），而拼音列里是字母。
 * 用户打 tupian 时走的是拼音通道，拿不到「图像/照片」的扩展 ——
 * 实测扩展前 tupian 只有 4 条，而「图片」有 34 条，同一个意图两种结果，说不通。
 *
 * 只转换组内的中文词：cli / shell 这类英文词在拼音列里本来就以原文存在。
 * 拼音转换有成本，所以算一次缓存住（组数是个位数量级，总共几十个词）。
 */
let pinyinSynonymMap: Map<string, string[]> | null = null;

function pinyinSynonymMapOf(): Map<string, string[]> {
  if (pinyinSynonymMap) return pinyinSynonymMap;
  const map = new Map<string, string[]>();
  for (const group of SYNONYM_GROUPS) {
    const entries = group
      .filter((word) => HAN.test(word))
      .map((word) => ({ py: (toPinyin(word, { toneType: "none", type: "array" }) as string[]).join("") }));
    for (const entry of entries) {
      if (!entry.py) continue;
      map.set(entry.py, entries.filter((other) => other.py !== entry.py).map((other) => other.py));
    }
  }
  pinyinSynonymMap = map;
  return map;
}

/**
 * 拼音召回条件（search_pinyin，独立列）。只处理长词 —— 拼音列里是字母，单字符没有意义。
 *
 * 命中即返回，但**不参与排序打分**：排序里没有它的相关度项。这是刻意的 ——
 * 拼音是为了「让 tupian 也能找到图片」，不是为了把拼音命中排到真名命中前面。
 *
 * `expand=true` 时把拼音也按同义词组展开（tupian → tupian / tuxiang / zhaopian / xiangpian）。
 */
function pinyinRecall(longTerms: string[], strict: boolean, expand = false) {
  if (!longTerms.length) return { where: "(1 = 0)", params: [] as unknown[] };
  const terms = expand
    ? longTerms.flatMap((term) => [term, ...(pinyinSynonymMapOf().get(term) ?? [])])
    : longTerms;
  return {
    where: "(MATCH(i.search_pinyin) AGAINST(? IN BOOLEAN MODE))",
    params: [terms.map((term) => (strict ? "+" : "") + term).join(" ")],
  };
}

/**
 * 名称命中分档，作 ORDER BY 第一优先级：精确 → 前缀 → 包含 → 别名 → 其他。
 *
 * 比只判 name 更细：中文名（name_zh）与别名的命中现在也能拔高，
 * 与内存实现 lib/items.ts 的 200/120/100/90 档位保持同一取向。
 * name_zh 可为 NULL，`= ?` 与 `LIKE ?` 对 NULL 都返回 false，无需额外处理。
 */
const NAME_RANK =
  "CASE WHEN i.name = ? OR i.name_zh = ? THEN 0 " +
  "WHEN i.name LIKE ? OR i.name_zh LIKE ? THEN 1 " +
  "WHEN i.name LIKE ? OR i.name_zh LIKE ? THEN 2 " +
  "WHEN i.aliases LIKE ? THEN 3 ELSE 4 END ASC";

/**
 * 目录搜索。
 *
 * 口径说明（与 JSON 回滚路径的差异，已记入计划文档）：
 *  - 检索字段是 items.search_text（名称 + 中文名 + 别名 + 标签 + 简介），**不含长正文**。
 *    旧的内存实现还会扫 body / whoFor / whoNot，因此只在正文里出现的词搜不到了 —— 这是
 *    「把 5 万字的正文塞进全文索引」换来的取舍，不是疏漏。
 *  - 召回有两条通道：search_text（原文）与 search_pinyin（拼音，独立列）。
 *    两条都是「每个词都必须命中」（AND），彼此之间是 OR —— 原文命中或拼音命中都算。
 *    拼音通道只影响**能否召回**，不进排序，避免稀释原文的相关度。
 *  - 排序：先按名称命中程度分档（精确 → 前缀 → 包含 → 别名），再按全文相关度，最后回到目录顺序。
 *  - 容错：严格 AND 查不到时，降级为 OR 语义重查一次（去掉布尔 + 前缀），
 *    结果以 fuzzy=true 标记。这样「ollma」这类少打一个字的查询也能救回来。
 *  - 短于 2 字的词走 LIKE，无法用索引，是一次全表扫描；短查询本来就少，且 5 万条量级可接受。
 *    要根治得调小 ngram_token_size（索引膨胀）或上独立搜索引擎。
 */
/** 搜索可叠加的筛选。与目录浏览（CatalogFilters）分开：搜索不做排序切换，也不支持仅看折扣。 */
export type SearchFilters = { scenes?: SceneId[]; platforms?: Platform[] };

/** 把查询串切成「能交给 ngram 的长词」与「只能 LIKE 兜底的短词」。 */
function splitTerms(value: string) {
  const long: string[] = [];
  const short: string[] = [];
  for (const term of [...new Set(value.split(" "))].filter(Boolean)) {
    const sanitized = booleanTerm(term);
    // 用净化后的长度判断能否交给 ngram：净化后只剩 1 个字符，MATCH 同样查不到。
    if (sanitized.length >= NGRAM_TOKEN_SIZE) long.push(sanitized);
    else short.push(term);
  }
  return { longTerms: long, shortTerms: short };
}

/**
 * 搜索召回条件（不含排序、不含筛选）。
 *
 * 抽出来是为了让 searchFacets 与 searchCatalog 用**同一套**条件 —— 两处各写一份的话，
 * 加一条召回通道（比如这次的拼音同义词）就会漏改一处，表现为「结果里有 34 条，
 * 场景筛选却只统计出 13 条」，而且不报错。
 */
function searchRecallCondition(query: string, strict: boolean) {
  const { longTerms, shortTerms } = splitTerms(query);
  const text = textRecall(longTerms, shortTerms, query, strict, true);
  const pinyin = pinyinRecall(longTerms, strict, true);
  return {
    where: "i.status = 'published' AND (" + text.where + " OR " + pinyin.where + ")",
    params: [...text.params, ...pinyin.params] as unknown[],
    longTerms,
  };
}

/** 搜索之上的筛选条件（场景/平台）。刻意不含 status —— 那由 searchRecallCondition 负责。 */
function searchFilterClause(filters: SearchFilters): { where: string[]; params: unknown[] } {
  const where: string[] = [];
  const params: unknown[] = [];
  if (filters.scenes?.length) {
    where.push("i.id IN (SELECT s.item_id FROM item_scenes s WHERE s.scene_id IN (?))");
    params.push(filters.scenes);
  }
  if (filters.platforms?.length) {
    where.push("i.id IN (SELECT p.item_id FROM item_platforms p WHERE p.platform IN (?))");
    params.push(filters.platforms);
  }
  return { where, params };
}

/** 搜索结果的分布：每个场景/平台各命中多少条。 */
export type SearchFacets = {
  total: number;
  scenes: { id: SceneId; count: number }[];
  platforms: { id: Platform; count: number }[];
};

/**
 * 统计搜索结果的场景/平台分布。
 *
 * **必须基于「筛选前」的全量**：如果先把结果按 scene=photo 筛过再统计，
 * 其它场景的计数都会变成 0，筛选条上除当前项外全部消失，用户就再也切不回去了 ——
 * 这是 facet 实现里最经典的错误。所以这里不带 filters 参数。
 *
 * 用两条 GROUP BY 而不是把全部条目拉进内存数：一个条目可能属于多个场景，
 * 内存里还得自己展开去重，SQL 一次就能算准。
 */
export async function searchFacets(raw: string): Promise<SearchFacets> {
  const query = normalizeQuery(raw);
  if (!query) return { total: 0, scenes: [], platforms: [] };
  const recall = searchRecallCondition(query, true);

  return withConnection(async (conn) => {
    const [countRows] = await conn.query<RowDataPacket[]>(
      "SELECT COUNT(*) AS c FROM items i WHERE " + recall.where,
      recall.params,
    );
    const total = Number(countRows[0].c);
    if (!total) return { total: 0, scenes: [], platforms: [] };

    const [sceneRows] = await conn.query<RowDataPacket[]>(
      "SELECT s.scene_id AS id, COUNT(*) AS c FROM items i JOIN item_scenes s ON s.item_id = i.id WHERE " +
        recall.where +
        " GROUP BY s.scene_id ORDER BY c DESC, s.scene_id ASC",
      recall.params,
    );
    const [platformRows] = await conn.query<RowDataPacket[]>(
      "SELECT p.platform AS id, COUNT(*) AS c FROM items i JOIN item_platforms p ON p.item_id = i.id WHERE " +
        recall.where +
        " GROUP BY p.platform ORDER BY c DESC, p.platform ASC",
      recall.params,
    );
    return {
      total,
      scenes: sceneRows.map((row) => ({ id: row.id as SceneId, count: Number(row.c) })),
      platforms: platformRows.map((row) => ({ id: row.id as Platform, count: Number(row.c) })),
    };
  });
}

export async function searchCatalog(
  raw: string,
  limit: number,
  offset: number,
  filters: SearchFilters = {},
): Promise<SearchResult> {
  const query = normalizeQuery(raw);
  if (!query) return { items: [], total: 0, fuzzy: false };

  const termsOf = splitTerms;

  /** `q` 默认是清洗后的原查询；拼写纠正后会带着纠正词再跑一次。 */
  const run = (strict: boolean, q: string = query): Promise<SearchResult> => {
    const { longTerms, shortTerms } = termsOf(q);
    // 召回用扩展版（同义词也算命中），排序用原词版（原词优先）。
    const text = textRecall(longTerms, shortTerms, q, strict, true);
    const pinyin = pinyinRecall(longTerms, strict, true);
    const extra = searchFilterClause(filters);
    const condition =
      "i.status = 'published' AND (" +
      text.where +
      " OR " +
      pinyin.where +
      ")" +
      (extra.where.length ? " AND " + extra.where.join(" AND ") : "");
    const whereParams = [...text.params, ...pinyin.params, ...extra.params];
    // 中文走 synonymsOf，拼音走拼音映射表 —— 两者任一有扩展就需要「原词优先」那一档。
    const pinyinMap = pinyinSynonymMapOf();
    const hasSynonyms =
      longTerms.some((term) => synonymsOf(term).length > 0) ||
      longTerms.some((term) => (pinyinMap.get(term) ?? []).length > 0);

    return withConnection(async (conn) => {
      const [countRows] = await conn.query<RowDataPacket[]>(
        "SELECT COUNT(*) AS c FROM items i WHERE " + condition,
        whereParams,
      );
      const total = Number(countRows[0].c);
      // 带筛选时 total=0 多半是「筛太窄」，不是「没匹配到」—— 不该标记为放宽匹配。
      if (!total) return { items: [], total: 0, fuzzy: !strict && extra.where.length === 0 };

      const like = escapeLike(q);
      const orderParams: unknown[] = [
        q, q, like + "%", like + "%", "%" + like + "%", "%" + like + "%", "%" + like + "%",
      ];
      let order = NAME_RANK;
      // 标签命中：`tags` 是人工策展的类目（item_tags 子表），比「简介里顺带提了一句」可靠得多。
      //
      // 为什么需要这一档：全文相关度是**词频**驱动的，而词频在软件目录里是噪音而不是信号。
      // 实测搜「图片」时，yazi（终端文件管理器）仅因简介提到「图片预览」就挤进前六，
      // 真正的图片工具反而被压下去。标签精确覆盖了这个语义：「图片」是 photocraft 的类目，
      // 只是 yazi 的一句描述。
      //
      // 放在名称分档之后、全文相关度之前：名称命中最强，标签命中次之，词频再次之。
      const tagTerms = [...new Set(q.split(" "))].filter(Boolean);
      if (tagTerms.length) {
        const conds = tagTerms.map(() => "it.tag LIKE ?").join(" OR ");
        order +=
          ", CASE WHEN EXISTS (SELECT 1 FROM item_tags it WHERE it.item_id = i.id AND (" +
          conds +
          ")) THEN 0 ELSE 1 END ASC";
        for (const term of tagTerms) orderParams.push("%" + escapeLike(term) + "%");
      }
      if (hasSynonyms) {
        // 原词命中优先于「仅靠同义词命中」。
        // 不加这一档，搜「图片」时一个标签写「图像处理」但通篇没提「图片」的条目
        // 会和真正写着「图片」的条目混在一起，用户会觉得结果跑偏。
        // 用原词条件（不扩展）重新算一遍 —— 参数重复一次，换来的是排序语义清晰。
        const original = textRecall(longTerms, shortTerms, q, strict, false);
        const originalPinyin = pinyinRecall(longTerms, strict, false);
        order += ", CASE WHEN " + original.where + " OR " + originalPinyin.where + " THEN 0 ELSE 1 END ASC";
        orderParams.push(...original.params, ...originalPinyin.params);
      }
      if (longTerms.length) {
        // 原文相关度放在拼音相关度之前：原文命中的行得分必 > 0，纯拼音命中的恒为 0，
        // 于是「原文命中一律优先于纯拼音命中」这个意图靠排序本身就能表达，不必再套 CASE。
        order += ", MATCH(i.search_text) AGAINST(? IN BOOLEAN MODE) DESC";
        orderParams.push(longTerms.map((term) => "+" + term).join(" "));
        // 拼音相关度。不加这一档的话，拼音查询会退化成「只按目录顺序排」——
        // 实测搜 yinyue 时 mineradio（sort_index 92）压过 lx-music-desktop（395），
        // 尽管后者的拼音得分是前者的近三倍。这是个真实缺陷，不是调优。
        order += ", MATCH(i.search_pinyin) AGAINST(? IN BOOLEAN MODE) DESC";
        orderParams.push(longTerms.map((term) => (strict ? "+" : "") + term).join(" "));
      }
      order += ", i.sort_index ASC, i.id ASC";

      const [rows] = await conn.query<RowDataPacket[]>(
        "SELECT " + CARD_COLUMNS + " FROM items i WHERE " + condition + " ORDER BY " + order + " LIMIT ? OFFSET ?",
        [...whereParams, ...orderParams, limit, offset],
      );
      return { items: await toCards(conn, rows), total, fuzzy: !strict };
    });
  };

  const strict = await run(true);
  if (strict.total) return strict;

  // 带筛选时空手，问题在筛选而不在查询：降级或纠正只会给出一批同样被筛掉的条目，
  // 白白多打两次库。直接返回，由前台提示「试试取消筛选」（阶段 3 的零结果归因）。
  if (searchFilterClause(filters).where.length) return strict;

  // 严格 AND 空手 → 先按 OR 语义给部分结果（多词查询常能救回来）。
  const relaxed = await run(false);
  if (relaxed.total) return relaxed;

  // 连 OR 都空手，说明是**单词拼错**。这一步不能省给 SQL：
  // ngram parser 把单个词的 ngram 当短语，拼错一个字就要求所有 bigram 连续命中，
  // 布尔模式与非布尔模式都会返回 0（实测 obisidan / joplinn 均如此）。
  // 只能在应用层比对名称的编辑距离。
  const corrected = await correctQuery(query);
  if (corrected && corrected !== query) {
    for (const strictRetry of [true, false]) {
      const retried = await run(strictRetry, corrected);
      if (retried.total) return { ...retried, fuzzy: true, corrected };
    }
  }
  return relaxed;
}
