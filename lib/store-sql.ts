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
import { fromBundle, toBundle, type ItemBundle } from "./catalog-rows.ts";
import { getPool, withWriteTransaction } from "./db.ts";
import { changedFields, deltaBetween, replay, snapshotOf, type Revision } from "./item-revisions.ts";

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
  options: {
    expectedVersion?: number;
    sortIndex?: number;
    renameFrom?: string;
    /** 记历史用：谁在改。缺省不记（ETL 批量导入不该生成历史）。 */
    actor?: string;
    summary?: string;
  } = {},
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
      /**
       * 改名的历史记在**新 slug** 下，但基线要按**旧 slug** 找 —— 那条历史链
       * 是这个条目的前世。若按新 slug 找基线，查不到就会写成完整快照，
       * 于是「改名前的样子」永远查不到了。旧 slug 的历史不删：
       * 它回答的是「改名前长什么样」，删掉那个问题就没人能回答了。
       *
       * **注意这里必须把旧链一起搬过来。** 只写一条 delta 的话，新 slug 的链
       * 自己就没有基线，`replayBaseline(newSlug)` 会直接抛「缺少基线快照」——
       * 也就是说改过名的条目，其历史根本打不开。现在把旧链原样复制到新 slug 下，
       * 再追加这版改名记录：新链自洽，旧链也留着，两边都能读。
       */
      if (options.actor) {
        const carried = await replayBaseline(conn, options.renameFrom);
        if (carried) {
          await copyRevisions(conn, options.renameFrom, item.slug);
          const payload = deltaBetween(carried, bundle);
          await insertRevision(conn, {
            slug: item.slug,
            rowVersion: source.rowVersion + 1,
            kind: payload.kind,
            actor: options.actor,
            action: "create",
            summary: options.summary ?? ("由 " + options.renameFrom + " 改名而来"),
            fields: changedFields(payload),
            payload,
          });
        } else {
          //旧链不存在（从没记过历史）：写完整快照，让新 slug 至少有基线。
          const payload = snapshotOf(bundle);
          await insertRevision(conn, {
            slug: item.slug,
            rowVersion: source.rowVersion + 1,
            kind: "snapshot",
            actor: options.actor,
            action: "create",
            summary: options.summary ?? ("由 " + options.renameFrom + " 改名而来"),
            fields: changedFields(payload),
            payload,
          });
        }
      }
      return "updated";
    }

    const existing = await readItemIdAndVersion(conn, item.slug);
    if (!existing) {
      // 并发新建同一个 slug 时，唯一索引会让其中一个抛 ER_DUP_ENTRY —— 那就是冲突。
      try {
        const bundle = toBundle(item, options.sortIndex ?? (await nextFrontSortIndex(conn)));
        await insertItem(conn, bundle);
        if (options.actor) {
          // 首版必须存完整快照 —— 后面所有差异都要靠它重放。
          const payload = snapshotOf(bundle);
          await insertRevision(conn, {
            slug: item.slug,
            rowVersion: 1,
            kind: "snapshot",
            actor: options.actor,
            action: "create",
            summary: options.summary ?? "创建条目",
            fields: changedFields(payload),
            payload,
          });
          await pruneRevisions(conn, item.slug);
        }
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
    if (options.actor) await recordRevision(conn, {
      slug: item.slug,
      rowVersion: existing.rowVersion + 1,
      actor: options.actor,
      action: "update",
      summary: options.summary ?? "",
      bundle,
    });
    return "updated";
  });
}

/**
 * 删除条目。
 *
 * 历史**不跟着删**：条目没了，但「它什么时候下架的、下架前长什么样」要能回答。
 * 所以只记一条 action='delete' 的空差异，不存内容（内容已在历史链里）。
 */
export async function deleteItem(
  slug: string,
  options: { actor?: string } = {},
): Promise<boolean> {
  return withWriteTransaction(async (conn) => {
    const existing = await readItemIdAndVersion(conn, slug, { forUpdate: true });
    if (!existing) return false;
    const removed = await deleteItemBySlug(conn, slug);
    if (removed && options.actor) {
      await recordRevision(conn, {
        slug,
        // 删除不递增 row_version，所以历史里占用的版本号就是删除前那版 +0。
        // 用一个明确的较大值避免与既有版本冲突：这一条只表达「发生过删除」。
        rowVersion: existing.rowVersion + 1,
        actor: options.actor,
        action: "delete",
        summary: "删除条目",
      });
    }
    return removed;
  });
}

/**
 * 改发布状态。
 *
 * **必须记历史**：它会递增 row_version。若只改 items 而不记历史，
 * 历史里的版本号就会与实际断开 —— 之后重放会算错版本，界面上「回到第 N 版」
 * 拿到的是错的内容。状态变更本身也是内容的一部分（草稿/待审核/已发布）。
 */
export async function setItemStatus(
  slug: string,
  status: Software["status"],
  options: { expectedVersion?: number; actor?: string; sortIndex?: number } = {},
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
    if (options.actor) {
      const item = await loadItem(conn, slug, { publishedOnly: false });
      if (item) {
        const bundle = toBundle(item, options.sortIndex ?? (await currentSortIndex(conn, slug)) ?? 0);
        await recordRevision(conn, {
          slug,
          rowVersion: existing.rowVersion + 1,
          actor: options.actor,
          action: "status",
          summary: "状态改为 " + status,
          bundle,
        });
      }
    }
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

// ---------------------------------------------------------------------------
// 内容级历史（P7b-b）
//
// 历史与条目写在**同一个事务**里：否则会出现「条目已改但历史没记」的窗口 ——
// 那种情况下历史不再是真相，只是看起来像真相。
// ---------------------------------------------------------------------------

/** 保留策略：一条历史链上最近留这么多版，或这么长时间内的（满足其一即可）。 */
const REVISIONS_KEEP_VERSIONS = 20;
const REVISIONS_KEEP_DAYS = 90;

/** 兜底上限，防止异常情况下无上限增长。 */
const REVISIONS_HARD_CAP = 50000;

/**
 * 记一版历史，并在记完后顺带清理。
 *
 * 基线来源是「这条 slug 已有的最新一版重放结果」—— 不是读当前 items 表：
 * 用当前表当基准会把并发写覆盖掉，且 ETL 批量导入时拿不到正确的上一版。
 * 查不到基线就写完整快照，保证后面永远有重放的起点。
 */
async function recordRevision(
  conn: PoolConnection,
  input: {
    slug: string;
    rowVersion: number;
    actor: string;
    action: "create" | "update" | "delete" | "status";
    summary: string;
    bundle?: ItemBundle;
  },
): Promise<void> {
  // 差异的基准 = 该slug 已有历史的重放结果。
  const baseline = await replayBaseline(conn, input.slug);

  if (!input.bundle) {
    // 删除：只记「删了」这一事实，没有内容可存。
    await insertRevision(conn, {
      slug: input.slug,
      rowVersion: input.rowVersion,
      kind: "delta",
      actor: input.actor,
      action: input.action,
      summary: input.summary || "删除条目",
      fields: [],
      payload: { kind: "delta", columns: {} },
    });
    return;
  }

  const payload = baseline ? deltaBetween(baseline, input.bundle) : snapshotOf(input.bundle);
  await insertRevision(conn, {
    slug: input.slug,
    rowVersion: input.rowVersion,
    kind: payload.kind,
    actor: input.actor,
    action: input.action,
    summary: input.summary,
    fields: changedFields(payload),
    payload,
  });
  await pruneRevisions(conn, input.slug);
}

/**
 * 某 slug 已有历史的重放结果；没有历史则返回 undefined（表示需要写基线）。
 *
 * @param upToVersion 只重放到这一版；不给就是重放到最新。
 */
async function replayBaseline(
  conn: PoolConnection,
  slug: string,
  upToVersion?: number,
): Promise<ItemBundle | undefined> {
  const [rows] = await conn.query<RowDataPacket[]>(
    "SELECT row_version, kind, actor, action, summary, fields, payload, created_at"
      + " FROM item_revisions WHERE slug = ?" + (upToVersion === undefined ? "" : " AND row_version <= ?")
      + " ORDER BY row_version ASC",
    upToVersion === undefined ? [slug] : [slug, upToVersion],
  );
  if (!rows.length) return undefined;
  return replay(
    rows.map((row) => ({
      rowVersion: Number(row.row_version),
      kind: row.kind,
      actor: row.actor,
      action: row.action,
      summary: row.summary,
      fields: typeof row.fields === "string" ? JSON.parse(row.fields) : row.fields,
      at: new Date(row.created_at).toISOString(),
      payload: typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload,
    })),
  );
}

async function insertRevision(
  conn: PoolConnection,
  input: {
    slug: string;
    rowVersion: number;
    kind: "snapshot" | "delta";
    actor: string;
    action: string;
    summary: string;
    fields: string[];
    payload: unknown;
  },
): Promise<void> {
  await conn.query(
    "INSERT INTO item_revisions (slug, row_version, kind, actor, action, summary, fields, payload, created_at)"
      + " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      input.slug,
      input.rowVersion,
      input.kind,
      input.actor,
      input.action,
      input.summary.slice(0, 300),
      JSON.stringify(input.fields),
      JSON.stringify(input.payload),
      new Date(),
    ],
  );
}

/**
 * 顺带清理，只在写入时做。
 *
 * **「最近 N 版」与「N 天内」是或的关系，不是二选一。** 二选一的话，
 * 一个半年没动过、今天被改了一次的条目，会因为「不在最近 20 版里」而把整段历史清空 ——
 * 而那段历史可能正是想查的。
 *
 * 首版（kind='snapshot'）永不删除：它是没有基线就重放不出任何版本的唯一凭据。
 */
async function pruneRevisions(conn: PoolConnection, slug: string): Promise<void> {
  const cutoff = new Date(Date.now() - REVISIONS_KEEP_DAYS * 86400000);
  const [rows] = await conn.query<RowDataPacket[]>(
    "SELECT id, kind, created_at FROM item_revisions WHERE slug = ? ORDER BY row_version DESC",
    [slug],
  );
  if (rows.length <= REVISIONS_KEEP_VERSIONS && rows.every((row) => new Date(row.created_at) >= cutoff)) return;

  const keep = new Set<number>();
  for (const [index, row] of rows.entries()) {
    const withinCount = index < REVISIONS_KEEP_VERSIONS;
    const withinTime = new Date(row.created_at) >= cutoff;
    if ((withinCount || withinTime) && row.kind !== "snapshot") keep.add(Number(row.id));
  }
  // 全局上限：超了就把最老的非基线丢掉，直到回到上限内。
  let overflow = rows.length - keep.size - REVISIONS_HARD_CAP;
  if (overflow > 0) {
    for (const row of rows.slice().reverse()) {
      if (overflow <= 0) break;
      const id = Number(row.id);
      if (keep.has(id) || row.kind === "snapshot") continue;
      keep.delete(id);
      overflow -= 1;
    }
  }
  if (!keep.size) return;
  const ids = rows.map((row) => Number(row.id)).filter((id) => !keep.has(id));
  if (!ids.length) return;
  await conn.query("DELETE FROM item_revisions WHERE id IN (" + ids.map(() => "?").join(", ") + ")", ids);
}

/**
 * 把一条 slug 的整条历史链原样复制到另一个 slug 下。
 *
 * 改名时用：让新 slug 的历史链**自洽**（有自己的基线），同时旧 slug 的链也留着 ——
 * 「改名前长什么样」与「改名后长什么样」都能查，且互不影响。
 */
async function copyRevisions(conn: PoolConnection, from: string, to: string): Promise<void> {
  const [rows] = await conn.query<RowDataPacket[]>(
    "SELECT row_version, kind, actor, action, summary, fields, payload, created_at"
      + " FROM item_revisions WHERE slug = ? ORDER BY row_version ASC",
    [from],
  );
  for (const row of rows) {
    await conn.query(
      "INSERT INTO item_revisions (slug, row_version, kind, actor, action, summary, fields, payload, created_at)"
        + " VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        to,
        row.row_version,
        row.kind,
        row.actor,
        row.action,
        row.summary,
        typeof row.fields === "string" ? row.fields : JSON.stringify(row.fields),
        typeof row.payload === "string" ? row.payload : JSON.stringify(row.payload),
        row.created_at,
      ],
    );
  }
}

/** 某条目的全部历史版本，新的在前。给后台历史面板用。 */
export async function listRevisions(slug: string): Promise<Revision[]> {
  const [rows] = await getPool().query<RowDataPacket[]>(
    "SELECT row_version, kind, actor, action, summary, fields, payload, created_at"
      + " FROM item_revisions WHERE slug = ? ORDER BY row_version DESC",
    [slug],
  );
  return rows.map((row) => ({
    rowVersion: Number(row.row_version),
    kind: row.kind,
    actor: row.actor,
    action: row.action,
    summary: row.summary,
    fields: typeof row.fields === "string" ? JSON.parse(row.fields) : row.fields,
    at: new Date(row.created_at).toISOString(),
    payload: typeof row.payload === "string" ? JSON.parse(row.payload) : row.payload,
  }));
}

/** 还原到指定版本；不给版本号就是当前内容。 */
export async function loadRevisionAt(slug: string, rowVersion?: number): Promise<Software | undefined> {
  const bundle = await withConnection((conn) => replayBaseline(conn, slug, rowVersion));
  return bundle ? fromBundle(bundle) : undefined;
}
