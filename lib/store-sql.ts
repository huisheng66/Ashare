import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

import type { FeedbackEntry, Software, Submission } from "@/data/types";
import { toPublicUser, type PublicUser, type UserRecord } from "./users.ts";
import type { AuditRecord } from "./audit.ts";
import {
  currentSortIndex,
  deleteItemBySlug,
  insertItem,
  loadCatalog,
  loadItem,
  nextFrontSortIndex,
  persistCatalog,
  readItemIdAndVersion,
  renameItemSlugVersioned,
  replaceItemChildren,
  updateItemRowVersioned,
} from "./catalog-persist.ts";
import { toBundle } from "./catalog-rows.ts";
import { getPool, withWriteTransaction } from "./db.ts";

/**
 * MySQL 运行库实现（STORE_DRIVER=mysql）。
 *
 * 与 JSON 实现的语义有一处刻意的差别：整表读改写用 MySQL 命名锁（GET_LOCK）跨进程串行，
 * 而不是进程内的文件队列 —— 多进程下后者失效，正是迁移的原因之一。
 * P6 会把「读全量、改一条、写全量」换成单条原子更新 + 乐观锁，届时这把大锁撤掉。
 */

export type Blocks = Record<string, number>;

const LOCK_TIMEOUT_SECONDS = 10;
const locks = {
  catalog: "ashare.catalog",
  feedback: "ashare.feedback",
  submissions: "ashare.submissions",
  blocks: "ashare.blocks",
};

/** 借一个连接做多条只读查询；与 lib/catalog-sql.ts 的同名函数各留一份，避免两个 store 互相依赖。 */
async function withConnection<T>(work: (conn: PoolConnection) => Promise<T>): Promise<T> {
  const conn = await getPool().getConnection();
  try {
    return await work(conn);
  } finally {
    conn.release();
  }
}

async function withLock<T>(name: string, work: (conn: PoolConnection) => Promise<T>): Promise<T> {
  const conn = await getPool().getConnection();
  try {
    const [rows] = await conn.query<RowDataPacket[]>("SELECT GET_LOCK(?, ?) AS ok", [name, LOCK_TIMEOUT_SECONDS]);
    if (Number(rows[0]?.ok) !== 1) throw new Error("[store] 获取写锁超时：" + name);
    try {
      await conn.beginTransaction();
      try {
        const result = await work(conn);
        await conn.commit();
        return result;
      } catch (error) {
        await conn.rollback().catch(() => {});
        throw error;
      }
    } finally {
      await conn.query("SELECT RELEASE_LOCK(?)", [name]).catch(() => {});
    }
  } finally {
    conn.release();
  }
}

let warnedEmptyCatalog = false;

export async function getCatalogAll(): Promise<Software[]> {
  const conn = await getPool().getConnection();
  try {
    const items = await loadCatalog(conn);
    if (!items.length && !warnedEmptyCatalog) {
      warnedEmptyCatalog = true;
      console.warn("[store] MySQL 目录为空。全新部署请先跑 npm run db:migrate 与 npm run db:import。");
    }
    return items;
  } finally {
    conn.release();
  }
}

export async function updateCatalog(
  change: (items: Software[]) => Software[] | Promise<Software[]>,
): Promise<void> {
  await withLock(locks.catalog, async (conn) => {
    const next = await change(await loadCatalog(conn));
    if (!Array.isArray(next)) throw new Error("[store] catalog 变更必须返回数组");
    await persistCatalog(conn, next, { prune: true });
  });
}

export async function saveCatalog(items: Software[]): Promise<void> {
  await updateCatalog(() => items);
}

type FeedbackRow = RowDataPacket & {
  id: string;
  at: Date;
  type: FeedbackEntry["type"];
  slug: string | null;
  contact: string | null;
  content: string;
  is_read: number;
};

const FEEDBACK_SELECT = "SELECT id, at, type, slug, contact, content, is_read FROM feedback ORDER BY at DESC, seq DESC";
const FEEDBACK_UPSERT =
  "INSERT INTO feedback (id, at, type, slug, contact, content, is_read) VALUES (?, ?, ?, ?, ?, ?, ?) " +
  "AS new ON DUPLICATE KEY UPDATE at = new.at, type = new.type, slug = new.slug, contact = new.contact, content = new.content, is_read = new.is_read";

function feedbackFromRow(row: FeedbackRow): FeedbackEntry {
  const entry: FeedbackEntry = {
    id: row.id,
    at: new Date(row.at).toISOString(),
    type: row.type,
    content: row.content,
  };
  if (row.slug) entry.slug = row.slug;
  if (row.contact) entry.contact = row.contact;
  if (Number(row.is_read) === 1) entry.read = true;
  return entry;
}

function feedbackParams(entry: FeedbackEntry): unknown[] {
  return [entry.id, new Date(entry.at), entry.type, entry.slug ?? null, entry.contact ?? null, entry.content, entry.read ? 1 : 0];
}

/**
 * 整表替换的差量实现：仍在的 id 保留（feedback.seq 这类自增排序键因此不会被重排），
 * 不在的删掉，其余 upsert。table / upsertSql 只来自本文件的字面量，不接收外部输入。
 */
async function replaceById(
  conn: PoolConnection,
  table: string,
  ids: string[],
  params: unknown[][],
  upsertSql: string,
): Promise<void> {
  const keep = new Set(ids);
  const [existing] = await conn.query<RowDataPacket[]>("SELECT id FROM " + table);
  for (const row of existing) {
    const id = String(row.id);
    if (!keep.has(id)) await conn.query("DELETE FROM " + table + " WHERE id = ?", [id]);
  }
  for (const values of params) await conn.query(upsertSql, values);
}

export async function getFeedback(): Promise<FeedbackEntry[]> {
  const [rows] = await getPool().query<FeedbackRow[]>(FEEDBACK_SELECT);
  return rows.map(feedbackFromRow);
}

export async function updateFeedback(change: (entries: FeedbackEntry[]) => FeedbackEntry[]): Promise<void> {
  await withLock(locks.feedback, async (conn) => {
    const [rows] = await conn.query<FeedbackRow[]>(FEEDBACK_SELECT);
    const next = change(rows.map(feedbackFromRow));
    if (!Array.isArray(next)) throw new Error("[store] feedback 变更必须返回数组");
    await replaceById(conn, "feedback", next.map((entry) => entry.id), next.map(feedbackParams), FEEDBACK_UPSERT);
  });
}

export async function addFeedback(entry: FeedbackEntry): Promise<void> {
  await getPool().query(FEEDBACK_UPSERT, feedbackParams(entry));
}

type SubmissionRow = RowDataPacket & {
  id: string;
  at: Date;
  kind: Submission["kind"];
  name: string;
  url: string;
  need: string;
};

const SUBMISSION_SELECT = "SELECT id, at, kind, name, url, need FROM submissions ORDER BY at DESC, seq DESC";
const SUBMISSION_UPSERT =
  "INSERT INTO submissions (id, at, kind, name, url, need) VALUES (?, ?, ?, ?, ?, ?) " +
  "AS new ON DUPLICATE KEY UPDATE at = new.at, kind = new.kind, name = new.name, url = new.url, need = new.need";

function submissionFromRow(row: SubmissionRow): Submission {
  return {
    id: row.id,
    at: new Date(row.at).toISOString(),
    kind: row.kind,
    name: row.name,
    url: row.url,
    need: row.need,
  };
}

function submissionParams(entry: Submission): unknown[] {
  return [entry.id, new Date(entry.at), entry.kind, entry.name, entry.url, entry.need];
}

export async function getSubmissions(): Promise<Submission[]> {
  const [rows] = await getPool().query<SubmissionRow[]>(SUBMISSION_SELECT);
  return rows.map(submissionFromRow);
}

export async function updateSubmissions(change: (entries: Submission[]) => Submission[]): Promise<void> {
  await withLock(locks.submissions, async (conn) => {
    const [rows] = await conn.query<SubmissionRow[]>(SUBMISSION_SELECT);
    const next = change(rows.map(submissionFromRow));
    if (!Array.isArray(next)) throw new Error("[store] submissions 变更必须返回数组");
    await replaceById(conn, "submissions", next.map((entry) => entry.id), next.map(submissionParams), SUBMISSION_UPSERT);
  });
}

export async function addSubmission(entry: Submission): Promise<void> {
  await getPool().query(SUBMISSION_UPSERT, submissionParams(entry));
}

function blocksFromRows(rows: RowDataPacket[]): Blocks {
  const blocks: Blocks = {};
  for (const row of rows) blocks[String(row.ip)] = new Date(row.blocked_until as Date).getTime();
  return blocks;
}

export async function getBlocks(): Promise<Blocks> {
  const [rows] = await getPool().query<RowDataPacket[]>("SELECT ip, blocked_until FROM ip_blocks");
  return blocksFromRows(rows);
}

export async function updateBlocks(change: (blocks: Blocks) => Blocks): Promise<void> {
  await withLock(locks.blocks, async (conn) => {
    const [rows] = await conn.query<RowDataPacket[]>("SELECT ip, blocked_until FROM ip_blocks");
    const next = change(blocksFromRows(rows));
    if (!next || typeof next !== "object" || Array.isArray(next)) {
      throw new Error("[store] blocks 变更必须返回对象");
    }
    const keep = new Set(Object.keys(next));
    for (const row of rows) {
      if (!keep.has(String(row.ip))) await conn.query("DELETE FROM ip_blocks WHERE ip = ?", [row.ip]);
    }
    for (const [ip, until] of Object.entries(next)) {
      await conn.query(
        "INSERT INTO ip_blocks (ip, blocked_until) VALUES (?, ?) AS new ON DUPLICATE KEY UPDATE blocked_until = new.blocked_until",
        [ip, new Date(Number(until))],
      );
    }
  });
}

export type SaveOutcome = "created" | "updated" | "conflict";

/** 并发新建同一个 slug 时唯一索引会报这个错，等同于乐观锁冲突。 */
function isDuplicateKey(error: unknown): boolean {
  return Boolean(error && typeof error === "object" && (error as { code?: string }).code === "ER_DUP_ENTRY");
}

/**
 * 单条原子保存。
 *
 * 与 updateCatalog 的区别是根本性的：后者「读全量 → 改一条 → 写全量」，
 * 55 条时无感，几万条时每次编辑都要重写整张表。这里只碰一行 + 它的子行。
 *
 * 并发正确性靠两层：
 *  - SELECT ... FOR UPDATE 拿行锁，避免同一行的写写交叉；
 *  - row_version 乐观锁：表单带回来的版本与库里不一致就返回 conflict（不覆盖别人的改动）。
 */
export async function saveItem(
  item: Software,
  options: { expectedVersion?: number; sortIndex?: number; renameFrom?: string } = {},
): Promise<SaveOutcome> {
  return withWriteTransaction(async (conn) => {
    // 改名：先按旧 slug 带版本条件地改 slug，再更新其余字段。
    // 不能「先删后插」—— 中途失败会把条目弄丢。
    if (options.renameFrom && options.renameFrom !== item.slug) {
      const source = await readItemIdAndVersion(conn, options.renameFrom);
      if (!source) return "conflict";
      if (options.expectedVersion !== undefined && options.expectedVersion !== source.rowVersion) return "conflict";
      if (await readItemIdAndVersion(conn, item.slug)) return "conflict";
      try {
        if (!(await renameItemSlugVersioned(conn, options.renameFrom, item.slug, source.rowVersion))) {
          return "conflict";
        }
      } catch (error) {
        if (isDuplicateKey(error)) return "conflict";
        throw error;
      }
      const sortIndex = options.sortIndex ?? (await currentSortIndex(conn, item.slug)) ?? 0;
      const bundle = toBundle(item, sortIndex);
      if (!(await updateItemRowVersioned(conn, bundle, source.rowVersion + 1, source.rowVersion))) {
        return "conflict";
      }
      await replaceItemChildren(conn, source.id, bundle);
      return "updated";
    }

    const existing = await readItemIdAndVersion(conn, item.slug);
    if (!existing) {
      // 并发新建同一个 slug 时，唯一索引会让其中一个抛 ER_DUP_ENTRY —— 那就是冲突。
      try {
        await insertItem(conn, toBundle(item, options.sortIndex ?? (await nextFrontSortIndex(conn))));
        return "created";
      } catch (error) {
        if (isDuplicateKey(error)) return "conflict";
        throw error;
      }
    }

    if (options.expectedVersion !== undefined && options.expectedVersion !== existing.rowVersion) return "conflict";
    const sortIndex = options.sortIndex ?? (await currentSortIndex(conn, item.slug)) ?? 0;
    const bundle = toBundle(item, sortIndex);
    if (!(await updateItemRowVersioned(conn, bundle, existing.rowVersion + 1, existing.rowVersion))) {
      return "conflict";
    }
    await replaceItemChildren(conn, existing.id, bundle);
    return "updated";
  });
}

export async function deleteItem(slug: string): Promise<boolean> {
  return withWriteTransaction((conn) => deleteItemBySlug(conn, slug));
}

export async function setItemStatus(
  slug: string,
  status: Software["status"],
  options: { expectedVersion?: number } = {},
): Promise<SaveOutcome> {
  return withWriteTransaction(async (conn) => {
    const existing = await readItemIdAndVersion(conn, slug, { forUpdate: true });
    if (!existing) return "conflict";
    if (options.expectedVersion !== undefined && options.expectedVersion !== existing.rowVersion) return "conflict";
    await conn.query("UPDATE items SET status = ?, updated_at = ?, row_version = row_version + 1 WHERE slug = ?", [
      status,
      new Date(),
      slug,
    ]);
    return "updated";
  });
}

/** 条目详情。后台要能读到草稿，所以默认不过滤状态，由调用方按需加 publishedOnly。 */
export async function getItem(
  slug: string,
  options: { publishedOnly?: boolean } = { publishedOnly: false },
): Promise<Software | undefined> {
  return withConnection((conn) => loadItem(conn, slug, options));
}

/** 编辑表单需要行版本号，用于提交时的乐观锁比对。 */
export async function getItemForEdit(slug: string): Promise<{ item: Software; rowVersion: number } | undefined> {
  return withConnection(async (conn) => {
    const row = await readItemIdAndVersion(conn, slug);
    if (!row) return undefined;
    const item = await loadItem(conn, slug, { publishedOnly: false });
    return item ? { item, rowVersion: row.rowVersion } : undefined;
  });
}

export async function recordAudit(entry: AuditRecord): Promise<void> {
  await getPool().query(
    "INSERT INTO audit_log (at, actor, action, slug, summary, fields, version_before, version_after) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [
      new Date(entry.at),
      entry.actor,
      entry.action,
      entry.slug,
      entry.summary,
      JSON.stringify(entry.fields),
      entry.versionBefore ?? null,
      entry.versionAfter ?? null,
    ],
  );
}

export async function listAudit(limit = 100): Promise<AuditRecord[]> {
  const [rows] = await getPool().query<RowDataPacket[]>(
    "SELECT at, actor, action, slug, summary, fields, version_before, version_after FROM audit_log ORDER BY at DESC, id DESC LIMIT ?",
    [limit],
  );
  return rows.map((row) => {
    const entry: AuditRecord = {
      at: new Date(row.at as Date).toISOString(),
      actor: String(row.actor),
      action: row.action as AuditRecord["action"],
      slug: String(row.slug),
      summary: String(row.summary),
      fields: (typeof row.fields === "string" ? JSON.parse(row.fields) : row.fields) as string[],
    };
    if (row.version_before != null) entry.versionBefore = Number(row.version_before);
    if (row.version_after != null) entry.versionAfter = Number(row.version_after);
    return entry;
  });
}

type UserRow = RowDataPacket & {
  username: string;
  display_name: string;
  password_hash: string;
  role: string;
  disabled: number;
  created_at: Date;
  last_login_at: Date | null;
};

function userFromRow(row: UserRow): UserRecord {
  const record: UserRecord = {
    username: String(row.username),
    displayName: String(row.display_name),
    passwordHash: String(row.password_hash),
    role: row.role === "admin" ? "admin" : "editor",
    disabled: Number(row.disabled) === 1,
    createdAt: new Date(row.created_at).toISOString(),
  };
  if (row.last_login_at) record.lastLoginAt = new Date(row.last_login_at).toISOString();
  return record;
}

const USER_COLUMNS = "username, display_name, password_hash, role, disabled, created_at, last_login_at";

export async function getUser(username: string): Promise<UserRecord | undefined> {
  const [rows] = await getPool().query<UserRow[]>(
    "SELECT " + USER_COLUMNS + " FROM users WHERE username = ?",
    [username],
  );
  return rows.length ? userFromRow(rows[0]) : undefined;
}

export async function listUsers(): Promise<PublicUser[]> {
  const [rows] = await getPool().query<UserRow[]>(
    "SELECT " + USER_COLUMNS + " FROM users ORDER BY created_at ASC, username ASC",
  );
  return rows.map((row) => toPublicUser(userFromRow(row)));
}

/**
 * 建号或改号。刻意不更新 created_at —— 它是账号的出生时间，不是最后修改时间。
 * 口令哈希由调用方生成，这里不碰明文。
 */
export async function upsertUser(record: UserRecord): Promise<void> {
  await getPool().query(
    "INSERT INTO users (username, display_name, password_hash, role, disabled, created_at, last_login_at) " +
      "VALUES (?, ?, ?, ?, ?, ?, ?) AS new ON DUPLICATE KEY UPDATE " +
      "display_name = new.display_name, password_hash = new.password_hash, role = new.role, disabled = new.disabled",
    [
      record.username,
      record.displayName,
      record.passwordHash,
      record.role,
      record.disabled ? 1 : 0,
      new Date(record.createdAt),
      record.lastLoginAt ? new Date(record.lastLoginAt) : null,
    ],
  );
}

export async function deleteUser(username: string): Promise<boolean> {
  const [result] = await getPool().query<ResultSetHeader>("DELETE FROM users WHERE username = ?", [username]);
  return Number(result.affectedRows) > 0;
}

export async function touchUserLogin(username: string): Promise<void> {
  await getPool().query("UPDATE users SET last_login_at = ? WHERE username = ?", [new Date(), username]);
}
