import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

import type { Software } from "@/data/types";
import {
  fromBundle,
  itemRowFromDb,
  toBundle,
  type GuideResourceRow,
  type ItemBundle,
  type ItemRow,
  type LinkRow,
} from "./catalog-rows.ts";

/**
 * 目录的读写实现，供三处共用：lib/store-sql.ts（应用）、scripts/db-import-json.mjs（ETL）、
 * scripts/db-verify.mjs（比对）。读写各只有一份，避免「写进去的形态」与「读出来的形态」分叉。
 *
 * 调用方负责事务与锁；本模块只发语句。
 */

export const ITEM_COLUMNS: string[] = [
  "slug", "name", "name_zh", "aliases", "status", "kind", "source", "price", "summary", "body",
  "tutorial", "who_for", "who_not", "discount_note", "license", "version", "links_checked_at",
  "featured", "sort_index", "icon_letter", "icon_color", "icon_simple", "icon_image",
  "guide_intro", "guide_markdown", "search_text", "created_at", "updated_at",
];

/** row_version 刻意不在 UPDATE 列表里：ETL / 批量保存不该覆盖编辑侧的并发计数。 */
export const ITEM_SQL =
  "INSERT INTO items (" + ITEM_COLUMNS.join(", ") + ") VALUES (" + ITEM_COLUMNS.map(() => "?").join(", ") +
  ") AS new ON DUPLICATE KEY UPDATE " +
  ITEM_COLUMNS.filter((column) => column !== "slug").map((column) => column + " = new." + column).join(", ");

const CHILD_TABLES = [
  "item_tags", "item_scenes", "item_platforms", "item_alternatives",
  "item_links", "item_previews", "item_guide_resources",
];

function bindItem(row: ItemRow): unknown[] {
  return [
    row.slug, row.name, row.name_zh, row.aliases, row.status, row.kind, row.source, row.price,
    row.summary, row.body, row.tutorial, row.who_for, row.who_not, row.discount_note,
    row.license, row.version, row.links_checked_at, row.featured, row.sort_index,
    row.icon_letter, row.icon_color, row.icon_simple, row.icon_image,
    row.guide_intro, row.guide_markdown, row.search_text,
    new Date(row.created_at), new Date(row.updated_at),
  ];
}

async function writeChildren(conn: PoolConnection, itemId: number, bundle: ItemBundle): Promise<void> {
  for (const table of CHILD_TABLES) await conn.query("DELETE FROM " + table + " WHERE item_id = ?", [itemId]);
  for (const [index, tag] of bundle.tags.entries()) {
    await conn.query("INSERT INTO item_tags (item_id, tag, sort_index) VALUES (?, ?, ?)", [itemId, tag, index]);
  }
  for (const [index, scene] of bundle.scenes.entries()) {
    await conn.query("INSERT INTO item_scenes (item_id, scene_id, sort_index) VALUES (?, ?, ?)", [itemId, scene, index]);
  }
  for (const [index, platform] of bundle.platforms.entries()) {
    await conn.query("INSERT INTO item_platforms (item_id, platform, sort_index) VALUES (?, ?, ?)", [itemId, platform, index]);
  }
  for (const [index, slug] of bundle.alternatives.entries()) {
    await conn.query("INSERT INTO item_alternatives (item_id, alternative_slug, sort_index) VALUES (?, ?, ?)", [itemId, slug, index]);
  }
  for (const link of bundle.links) {
    await conn.query(
      "INSERT INTO item_links (item_id, kind, url, disk_note, disk_sha256, disk_file) VALUES (?, ?, ?, ?, ?, ?)",
      [itemId, link.kind, link.url, link.disk_note, link.disk_sha256, link.disk_file],
    );
  }
  for (const [index, preview] of bundle.previews.entries()) {
    await conn.query("INSERT INTO item_previews (item_id, sort_index, path) VALUES (?, ?, ?)", [itemId, index, preview]);
  }
  for (const [index, resource] of bundle.guideResources.entries()) {
    await conn.query(
      "INSERT INTO item_guide_resources (item_id, sort_index, kind, title, url, note) VALUES (?, ?, ?, ?, ?, ?)",
      [itemId, index, resource.kind, resource.title, resource.url, resource.note],
    );
  }
}

export type PersistStats = { items: number; pruned: number };

/**
 * 把整份目录写入数据库。sort_index 取数组下标，因此调用方给的顺序就是前台顺序。
 * prune=true 时删除数据库里多出来的条目（镜像语义）。
 */
export async function persistCatalog(
  conn: PoolConnection,
  items: Software[],
  options: { prune?: boolean } = {},
): Promise<PersistStats> {
  const stats: PersistStats = { items: 0, pruned: 0 };
  for (const [index, item] of items.entries()) {
    const bundle = toBundle(item, index);
    await conn.query(ITEM_SQL, bindItem(bundle.item));
    const [rows] = await conn.query<RowDataPacket[]>("SELECT id FROM items WHERE slug = ?", [item.slug]);
    await writeChildren(conn, Number(rows[0].id), bundle);
    stats.items += 1;
  }
  if (options.prune) {
    const keep = new Set(items.map((item) => item.slug));
    const [existing] = await conn.query<RowDataPacket[]>("SELECT slug FROM items");
    for (const row of existing) {
      if (keep.has(String(row.slug))) continue;
      await conn.query("DELETE FROM items WHERE slug = ?", [row.slug]);
      stats.pruned += 1;
    }
  }
  return stats;
}

export type ChildBundle = {
  tags: Map<string, string[]>;
  scenes: Map<string, string[]>;
  platforms: Map<string, string[]>;
  alternatives: Map<string, string[]>;
  links: Map<string, LinkRow[]>;
  previews: Map<string, string[]>;
  guideResources: Map<string, GuideResourceRow[]>;
};

function emptyBundle(): ChildBundle {
  return {
    tags: new Map(), scenes: new Map(), platforms: new Map(), alternatives: new Map(),
    links: new Map(), previews: new Map(), guideResources: new Map(),
  };
}

function groupValues(rows: RowDataPacket[], column: string): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const row of rows) {
    const id = String(row.item_id);
    if (!map.has(id)) map.set(id, []);
    map.get(id)!.push(String(row[column]));
  }
  return map;
}

/**
 * 只取给定条目的子行。用 IN (?) 收窄范围非常重要 ——
 * 详情页只关心一条，若还整表读子表，几万条时它和「全量加载」一样慢。
 */
export async function loadChildren(conn: PoolConnection, ids: number[]): Promise<ChildBundle> {
  if (!ids.length) return emptyBundle();
  const [tagRows] = await conn.query<RowDataPacket[]>("SELECT item_id, tag FROM item_tags WHERE item_id IN (?) ORDER BY item_id, sort_index, tag", [ids]);
  const [sceneRows] = await conn.query<RowDataPacket[]>("SELECT item_id, scene_id FROM item_scenes WHERE item_id IN (?) ORDER BY item_id, sort_index, scene_id", [ids]);
  const [platformRows] = await conn.query<RowDataPacket[]>("SELECT item_id, platform FROM item_platforms WHERE item_id IN (?) ORDER BY item_id, sort_index, platform", [ids]);
  const [alternativeRows] = await conn.query<RowDataPacket[]>("SELECT item_id, alternative_slug FROM item_alternatives WHERE item_id IN (?) ORDER BY item_id, sort_index, alternative_slug", [ids]);
  const [linkRows] = await conn.query<RowDataPacket[]>("SELECT item_id, kind, url, disk_note, disk_sha256, disk_file FROM item_links WHERE item_id IN (?)", [ids]);
  const [previewRows] = await conn.query<RowDataPacket[]>("SELECT item_id, path FROM item_previews WHERE item_id IN (?) ORDER BY item_id, sort_index", [ids]);
  const [resourceRows] = await conn.query<RowDataPacket[]>("SELECT item_id, kind, title, url, note FROM item_guide_resources WHERE item_id IN (?) ORDER BY item_id, sort_index", [ids]);

  const links = new Map<string, LinkRow[]>();
  for (const row of linkRows) {
    const id = String(row.item_id);
    if (!links.has(id)) links.set(id, []);
    links.get(id)!.push({
      kind: row.kind as LinkRow["kind"],
      url: String(row.url),
      disk_note: row.disk_note == null ? null : String(row.disk_note),
      disk_sha256: row.disk_sha256 == null ? null : String(row.disk_sha256),
      disk_file: row.disk_file == null ? null : String(row.disk_file),
    });
  }
  const guideResources = new Map<string, GuideResourceRow[]>();
  for (const row of resourceRows) {
    const id = String(row.item_id);
    if (!guideResources.has(id)) guideResources.set(id, []);
    guideResources.get(id)!.push({
      kind: row.kind as GuideResourceRow["kind"],
      title: String(row.title),
      url: String(row.url),
      note: row.note == null ? null : String(row.note),
    });
  }

  return {
    tags: groupValues(tagRows, "tag"),
    scenes: groupValues(sceneRows, "scene_id"),
    platforms: groupValues(platformRows, "platform"),
    alternatives: groupValues(alternativeRows, "alternative_slug"),
    links,
    previews: groupValues(previewRows, "path"),
    guideResources,
  };
}

/** 把条目行与子行组装成 Software。 */
export function assembleSoftware(itemRows: RowDataPacket[], children: ChildBundle): Software[] {
  return itemRows.map((row) => {
    const id = String(row.id);
    const bundle: ItemBundle = {
      item: itemRowFromDb(row),
      tags: children.tags.get(id) ?? [],
      scenes: children.scenes.get(id) ?? [],
      platforms: children.platforms.get(id) ?? [],
      alternatives: children.alternatives.get(id) ?? [],
      links: children.links.get(id) ?? [],
      previews: children.previews.get(id) ?? [],
      guideResources: children.guideResources.get(id) ?? [],
    };
    return fromBundle(bundle);
  });
}

/** 读出整份目录，顺序由 sort_index 决定。仅用于 ETL 比对与 JSON 回滚路径的全量场景。 */
export async function loadCatalog(conn: PoolConnection): Promise<Software[]> {
  const [itemRows] = await conn.query<RowDataPacket[]>("SELECT * FROM items ORDER BY sort_index, id");
  const children = await loadChildren(conn, itemRows.map((row) => Number(row.id)));
  return assembleSoftware(itemRows, children);
}

/**
 * 详情页取一条。这替代了原先「全量加载再按 slug 查表」。
 * 默认只认已发布：公开读路径不该因为拿到 slug 就渲染草稿。
 */
export async function loadItem(
  conn: PoolConnection,
  slug: string,
  options: { publishedOnly?: boolean } = {},
): Promise<Software | undefined> {
  const publishedOnly = options.publishedOnly ?? true;
  const [itemRows] = await conn.query<RowDataPacket[]>(
    "SELECT * FROM items WHERE slug = ?" + (publishedOnly ? " AND status = 'published'" : ""),
    [slug],
  );
  if (!itemRows.length) return undefined;
  const children = await loadChildren(conn, [Number(itemRows[0].id)]);
  return assembleSoftware(itemRows, children)[0];
}

/** 按传入的 slug 顺序返回（「同类替代」要保编辑顺序）；查不到的 slug 直接跳过。 */
export async function loadItemsBySlugs(
  conn: PoolConnection,
  slugs: string[],
  options: { publishedOnly?: boolean } = {},
): Promise<Software[]> {
  if (!slugs.length) return [];
  const publishedOnly = options.publishedOnly ?? true;
  const [itemRows] = await conn.query<RowDataPacket[]>(
    "SELECT * FROM items WHERE slug IN (?)" + (publishedOnly ? " AND status = 'published'" : ""),
    [slugs],
  );
  const children = await loadChildren(conn, itemRows.map((row) => Number(row.id)));
  const bySlug = new Map(assembleSoftware(itemRows, children).map((item) => [item.slug, item]));
  return slugs.map((slug) => bySlug.get(slug)).filter((item): item is Software => Boolean(item));
}

/** 单条 INSERT（row_version 从 1 开始）。批量导入走 ITEM_SQL 的 UPSERT，不做版本检查。 */
const INSERT_ITEM_SQL =
  "INSERT INTO items (" + ITEM_COLUMNS.join(", ") + ", row_version) VALUES (" +
  ITEM_COLUMNS.map(() => "?").join(", ") + ", ?)";

/** 单条 UPDATE。row_version 由调用方给出下一个值，实现乐观锁。 */
const UPDATE_ITEM_SQL =
  "UPDATE items SET " + ITEM_COLUMNS.filter((column) => column !== "slug").map((column) => column + " = ?").join(", ") +
  ", row_version = ? WHERE slug = ?";

/** bindItem 的第 0 项就是 slug（ITEM_COLUMNS 以 slug 开头），UPDATE 语句里要去掉它。 */
function bindItemForUpdate(row: ItemRow): unknown[] {
  return bindItem(row).filter((_, index) => ITEM_COLUMNS[index] !== "slug");
}

export async function insertItem(conn: PoolConnection, bundle: ItemBundle): Promise<number> {
  const [result] = await conn.query<ResultSetHeader>(INSERT_ITEM_SQL, [...bindItem(bundle.item), 1]);
  await replaceItemChildren(conn, Number(result.insertId), bundle);
  return Number(result.insertId);
}

export async function updateItemRow(conn: PoolConnection, bundle: ItemBundle, nextVersion: number): Promise<void> {
  await conn.query(UPDATE_ITEM_SQL, [...bindItemForUpdate(bundle.item), nextVersion, bundle.item.slug]);
}

/** 子表整体替换（顺序敏感，所以是 DELETE + INSERT 而不是 upsert）。 */
export async function replaceItemChildren(conn: PoolConnection, itemId: number, bundle: ItemBundle): Promise<void> {
  await writeChildren(conn, itemId, bundle);
}

export async function readItemIdAndVersion(
  conn: PoolConnection,
  slug: string,
  options: { forUpdate?: boolean } = {},
): Promise<{ id: number; rowVersion: number } | undefined> {
  const [rows] = await conn.query<RowDataPacket[]>(
    "SELECT id, row_version FROM items WHERE slug = ?" + (options.forUpdate ? " FOR UPDATE" : ""),
    [slug],
  );
  return rows.length ? { id: Number(rows[0].id), rowVersion: Number(rows[0].row_version) } : undefined;
}

export async function currentSortIndex(conn: PoolConnection, slug: string): Promise<number | undefined> {
  const [rows] = await conn.query<RowDataPacket[]>("SELECT sort_index FROM items WHERE slug = ?", [slug]);
  return rows.length ? Number(rows[0].sort_index) : undefined;
}

/** 新条目排在最前（与从前 [draft, ...all] 的行为一致）。 */
export async function nextFrontSortIndex(conn: PoolConnection): Promise<number> {
  const [rows] = await conn.query<RowDataPacket[]>("SELECT COALESCE(MIN(sort_index), 1) - 1 AS next FROM items");
  return Number(rows[0].next);
}

export async function deleteItemBySlug(conn: PoolConnection, slug: string): Promise<boolean> {
  const [result] = await conn.query<ResultSetHeader>("DELETE FROM items WHERE slug = ?", [slug]);
  return Number(result.affectedRows) > 0;
}

/** 只改 slug。子表按 item_id 关联，改名不影响它们。 */
export async function renameItemSlug(conn: PoolConnection, from: string, to: string): Promise<void> {
  await conn.query("UPDATE items SET slug = ? WHERE slug = ?", [to, from]);
}

const UPDATE_ITEM_SQL_VERSIONED =
  "UPDATE items SET " + ITEM_COLUMNS.filter((column) => column !== "slug").map((column) => column + " = ?").join(", ") +
  ", row_version = ? WHERE slug = ? AND row_version = ?";

/**
 * 乐观锁的核心语句：把版本条件写进 WHERE。
 * 返回 false 表示期间被改过（affectedRows 0），调用方应报 conflict。
 *
 * 刻意不用 SELECT ... FOR UPDATE：对**不存在**的行取锁会拿间隙锁，
 * 两个并发新建会互相卡死（实测 deadlock）。这里只锁已存在的那一行，且锁在 UPDATE 期间。
 */
export async function updateItemRowVersioned(
  conn: PoolConnection,
  bundle: ItemBundle,
  nextVersion: number,
  expectedVersion: number,
): Promise<boolean> {
  const [result] = await conn.query<ResultSetHeader>(UPDATE_ITEM_SQL_VERSIONED, [
    ...bindItemForUpdate(bundle.item),
    nextVersion,
    bundle.item.slug,
    expectedVersion,
  ]);
  return Number(result.affectedRows) > 0;
}

/** 改名同样带版本条件，避免与并发写互相覆盖。 */
export async function renameItemSlugVersioned(
  conn: PoolConnection,
  from: string,
  to: string,
  expectedVersion: number,
): Promise<boolean> {
  const [result] = await conn.query<ResultSetHeader>(
    "UPDATE items SET slug = ? WHERE slug = ? AND row_version = ?",
    [to, from, expectedVersion],
  );
  return Number(result.affectedRows) > 0;
}
