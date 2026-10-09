import "server-only";

import type { FeedbackEntry, Software, Submission } from "@/data/types";
import type { AuditRecord } from "./audit.ts";
import type { Revision } from "./item-revisions.ts";
import type { PublicUser, UserRecord } from "./users.ts";
import * as json from "./store-json.ts";
import * as sql from "./store-sql.ts";

/**
 * 运行库门面：默认走 MySQL，STORE_DRIVER=json 是显式的回滚开关。
 *
 * 默认值从json 翻到 mysql（迁移 P11 收尾）。翻转的理由是「默认值本身就是一种决定」：
 * 原来的 `=== "mysql"` 意味着**忘了配就静默退回JSON** —— 而JSON 路径的读写代价
 * （整目录读进内存、整目录重写）在生产上正是这次迁移要消除的东西。
 * 忘了配就悄悄跑在一个为回滚保留的实现上，这类错比启动失败难发现得多。
 *
 * 保留 json 分支而不是删掉：它是迁移出问题时唯一的回滚路径，也是
 * tests/admin-actions.test.mjs 的隔离手段（显式设 STORE_DRIVER=json，
 * 免得开发者环境里的mysql 把它变成集成测试）。删掉它就没有回头路。
 *
 * 注意这**不是双写**：同一时刻只有一个实现生效，数据库始终是唯一事实源。
 *
 * server-only 挂在这里而不是实现里：实现需要被测试直接 import。
 */

export type Blocks = Record<string, number>;

/** 只有显式写 STORE_DRIVER=json 才走回滚路径；未配置（生产、CI）一律走数据库。 */
function mysqlDriver(): boolean {
  return process.env.STORE_DRIVER !== "json";
}

export async function getCatalogAll(): Promise<Software[]> {
  return mysqlDriver() ? sql.getCatalogAll() : json.getCatalogAll();
}

export async function updateCatalog(
  change: (items: Software[]) => Software[] | Promise<Software[]>,
): Promise<void> {
  return mysqlDriver() ? sql.updateCatalog(change) : json.updateCatalog(change);
}

export async function saveCatalog(items: Software[]): Promise<void> {
  return mysqlDriver() ? sql.saveCatalog(items) : json.saveCatalog(items);
}

export async function getFeedback(): Promise<FeedbackEntry[]> {
  return mysqlDriver() ? sql.getFeedback() : json.getFeedback();
}

export async function updateFeedback(change: (entries: FeedbackEntry[]) => FeedbackEntry[]): Promise<void> {
  return mysqlDriver() ? sql.updateFeedback(change) : json.updateFeedback(change);
}

export async function addFeedback(entry: FeedbackEntry): Promise<void> {
  return mysqlDriver() ? sql.addFeedback(entry) : json.addFeedback(entry);
}

export async function getSubmissions(): Promise<Submission[]> {
  return mysqlDriver() ? sql.getSubmissions() : json.getSubmissions();
}

export async function updateSubmissions(change: (entries: Submission[]) => Submission[]): Promise<void> {
  return mysqlDriver() ? sql.updateSubmissions(change) : json.updateSubmissions(change);
}

export async function addSubmission(entry: Submission): Promise<void> {
  return mysqlDriver() ? sql.addSubmission(entry) : json.addSubmission(entry);
}

export async function getBlocks(): Promise<Blocks> {
  return mysqlDriver() ? sql.getBlocks() : json.getBlocks();
}

export async function updateBlocks(change: (blocks: Blocks) => Blocks): Promise<void> {
  return mysqlDriver() ? sql.updateBlocks(change) : json.updateBlocks(change);
}

export type SaveOutcome = "created" | "updated" | "conflict";

/**
 * 单条原子写。与 updateCatalog（整表读改写）并存：
 * 后台的保存 / 状态 / 删除走这里，批量导入与 ETL 仍走 updateCatalog。
 */
export async function saveItem(
  item: Software,
  options: {
    expectedVersion?: number;
    sortIndex?: number;
    renameFrom?: string;
    /** 记内容级历史用；缺省不记（ETL 批量导入不该生成历史）。 */
    actor?: string;
    summary?: string;
  } = {},
): Promise<SaveOutcome> {
  return mysqlDriver() ? sql.saveItem(item, options) : json.saveItem(item, options);
}

export async function deleteItem(slug: string, options: { actor?: string } = {}): Promise<boolean> {
  return mysqlDriver() ? sql.deleteItem(slug, options) : json.deleteItem(slug);
}

export async function setItemStatus(
  slug: string,
  status: Software["status"],
  options: { expectedVersion?: number; actor?: string; sortIndex?: number } = {},
): Promise<SaveOutcome> {
  return mysqlDriver() ? sql.setItemStatus(slug, status, options) : json.setItemStatus(slug, status);
}

export async function getItem(
  slug: string,
  options: { publishedOnly?: boolean } = {},
): Promise<Software | undefined> {
  return mysqlDriver() ? sql.getItem(slug, options) : json.getItem(slug, options);
}

/** 编辑表单用：带上行版本号，提交时做乐观锁比对。 */
export async function getItemForEdit(slug: string): Promise<{ item: Software; rowVersion: number } | undefined> {
  return mysqlDriver() ? sql.getItemForEdit(slug) : json.getItemForEdit(slug);
}

/**
 * 取某个历史版本的内容。
 *
 * JSON 驱动没有历史（那边靠git），所以返回 undefined —— 调用方据此提示「该驱动下无历史」，
 * 而不是假装没有历史。
 */
export async function getRevisionAt(slug: string, rowVersion: number): Promise<Software | undefined> {
  return mysqlDriver() ? sql.loadRevisionAt(slug, rowVersion) : undefined;
}

/** 某条目的全部历史版本，新的在前。JSON 驱动下永远为空数组。 */
export async function listRevisions(slug: string): Promise<Revision[]> {
  return mysqlDriver() ? sql.listRevisions(slug) : [];
}

export async function recordAudit(entry: AuditRecord): Promise<void> {
  return mysqlDriver() ? sql.recordAudit(entry) : json.recordAudit(entry);
}

export async function listAudit(limit = 100): Promise<AuditRecord[]> {
  return mysqlDriver() ? sql.listAudit(limit) : json.listAudit(limit);
}

export async function getUser(username: string): Promise<UserRecord | undefined> {
  return mysqlDriver() ? sql.getUser(username) : json.getUser(username);
}

export async function listUsers(): Promise<PublicUser[]> {
  return mysqlDriver() ? sql.listUsers() : json.listUsers();
}

export async function upsertUser(record: UserRecord): Promise<void> {
  return mysqlDriver() ? sql.upsertUser(record) : json.upsertUser(record);
}

export async function deleteUser(username: string): Promise<boolean> {
  return mysqlDriver() ? sql.deleteUser(username) : json.deleteUser(username);
}

export async function touchUserLogin(username: string): Promise<void> {
  return mysqlDriver() ? sql.touchUserLogin(username) : json.touchUserLogin(username);
}
