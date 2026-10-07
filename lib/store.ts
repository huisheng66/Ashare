import "server-only";

import type { FeedbackEntry, Software, Submission } from "@/data/types";
import type { AuditRecord } from "./audit.ts";
import type { PublicUser, UserRecord } from "./users.ts";
import * as json from "./store-json.ts";
import * as sql from "./store-sql.ts";

/**
 * 运行库门面：按 STORE_DRIVER 选择实现，导出签名保持不变。
 *
 * 为什么默认仍是 json：npm test 不加载 .env.local，tests/admin-actions.test.mjs 靠
 * process.chdir 到临时目录里的 JSON 文件做隔离。默认走 mysql 会让「没有数据库的 CI」
 * 被迫连库，把一条纯逻辑回归变成集成测试。切换是显式的：
 *   .env.local / 生产环境设 STORE_DRIVER=mysql
 *
 * 这是「一次切换」的开关，不是双写：同一时刻只有一个实现生效，数据库始终是唯一事实源。
 * P11 会把默认值翻成 mysql 并删掉 JSON 分支，届时本文件只剩转发。
 *
 * server-only 挂在这里而不是实现里：实现需要被测试直接 import。
 */

export type Blocks = Record<string, number>;

function mysqlDriver(): boolean {
  return process.env.STORE_DRIVER === "mysql";
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
  options: { expectedVersion?: number; sortIndex?: number; renameFrom?: string } = {},
): Promise<SaveOutcome> {
  return mysqlDriver() ? sql.saveItem(item, options) : json.saveItem(item, options);
}

export async function deleteItem(slug: string): Promise<boolean> {
  return mysqlDriver() ? sql.deleteItem(slug) : json.deleteItem(slug);
}

export async function setItemStatus(
  slug: string,
  status: Software["status"],
  options: { expectedVersion?: number } = {},
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
