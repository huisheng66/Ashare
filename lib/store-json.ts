import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import { samples } from "@/data/samples";
import { software as seed } from "@/data/software";
import type { FeedbackEntry, Software, Submission } from "@/data/types";
import type { AuditRecord } from "./audit.ts";
import { toPublicUser, type PublicUser, type UserRecord } from "./users.ts";
import { JsonStore } from "./json-store";
import { normalizeItems } from "./normalize";
import { seedToItem } from "./seed";

/**
 * 本机 JSON 运行库实现（STORE_DRIVER 未设为 mysql 时的默认路径）。
 *
 * 这是迁移前的原实现，P4 起由 lib/store.ts 按驱动转发进来；P11 会连同 lib/json-store.ts 一起删除。
 * server-only 只挂在门面 lib/store.ts 上：本文件要能被测试直接 import（见 tests/admin-actions.test.mjs）。
 *
 * 单进程假设：按文件串行的读改写队列只在一个进程内有效。
 */

export type Blocks = Record<string, number>;

const DIR = path.join(process.cwd(), "data", "store");
// One Node process owns this local store. Each mutation includes its read in the queue.
const store = new JsonStore(DIR);
let checkedCatalogIntegrity = false;

const seedCatalog = (): Software[] => [...seed.map(seedToItem), ...structuredClone(samples)];

function requireArray<T>(value: T[], name: string): T[] {
  if (!Array.isArray(value)) throw new Error("[store] " + name + ".json must contain an array");
  return value;
}

/** 补齐规则在 lib/normalize.ts —— ETL 与 db:verify 复用同一份。这里只做「必须是数组」校验。 */
function normalize(items: Software[], fallbackTime?: Date): Software[] {
  return normalizeItems(requireArray(items, "catalog"), fallbackTime);
}

async function catalogTime(): Promise<Date | undefined> {
  try {
    return (await fs.stat(path.join(DIR, "catalog.json"))).mtime;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    return undefined;
  }
}

export async function getCatalogAll(): Promise<Software[]> {
  const items = await store.readOrCreate("catalog", seedCatalog, async (current) => {
    if (checkedCatalogIntegrity) return;
    const recorded = await store.read<string>("catalog.sha256").catch((error: unknown) => {
      console.error("[store] Could not read catalog checksum", error);
      return null;
    });
    if (recorded && recorded !== createHash("sha256").update(JSON.stringify(current, null, 2)).digest("hex")) {
      console.warn("[store] catalog.json 与发布时的 SHA-256 不一致，文件可能被改动");
    }
    checkedCatalogIntegrity = true;
  });
  return normalize(items, await catalogTime());
}

export async function updateCatalog(
  change: (items: Software[]) => Software[] | Promise<Software[]>,
): Promise<void> {
  await store.update("catalog", seedCatalog, async (items) => {
    return requireArray(await change(normalize(items, await catalogTime())), "catalog");
  }, {
    backup: true,
    afterWrite: async (items) => {
      // The checksum is advisory. A sidecar failure must not report a committed save as failed.
      const digest = createHash("sha256").update(JSON.stringify(items, null, 2)).digest("hex");
      await store.update("catalog.sha256", () => "", () => digest).catch((error: unknown) => {
        console.error("[store] Could not update catalog checksum", error);
      });
    },
  });
}

export async function saveCatalog(items: Software[]): Promise<void> {
  await updateCatalog(() => items);
}

export async function getFeedback(): Promise<FeedbackEntry[]> {
  return requireArray((await store.read<FeedbackEntry[]>("feedback")) ?? [], "feedback");
}

export async function updateFeedback(change: (entries: FeedbackEntry[]) => FeedbackEntry[]): Promise<void> {
  await store.update<FeedbackEntry[]>("feedback", () => [], (entries) => change(requireArray(entries, "feedback")));
}

export async function addFeedback(entry: FeedbackEntry): Promise<void> {
  await updateFeedback((entries) => [entry, ...entries]);
}

export async function getSubmissions(): Promise<Submission[]> {
  return requireArray((await store.read<Submission[]>("submissions")) ?? [], "submissions");
}

export async function updateSubmissions(change: (entries: Submission[]) => Submission[]): Promise<void> {
  await store.update<Submission[]>("submissions", () => [], (entries) => change(requireArray(entries, "submissions")));
}

export async function addSubmission(entry: Submission): Promise<void> {
  await updateSubmissions((entries) => [entry, ...entries]);
}

function requireBlocks(value: Blocks): Blocks {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("[store] blocks.json must contain an object");
  }
  return value;
}

export async function getBlocks(): Promise<Blocks> {
  return requireBlocks((await store.read<Blocks>("blocks")) ?? {});
}

export async function updateBlocks(change: (blocks: Blocks) => Blocks): Promise<void> {
  await store.update<Blocks>("blocks", () => ({}), (blocks) => change(requireBlocks(blocks)));
}

export type SaveOutcome = "created" | "updated" | "conflict";

/**
 * JSON 回滚路径是单进程 + 文件队列，不存在真正的写写并发；版本号恒为 0，
 * 因此 saveItem 不会返回 conflict。这里保持与 SQL 实现相同的签名与语义。
 */
export async function saveItem(item: Software, options: { renameFrom?: string } = {}): Promise<SaveOutcome> {
  let created = false;
  await updateCatalog((all) => {
    const source = options.renameFrom && options.renameFrom !== item.slug
      ? all.find((entry) => entry.slug === options.renameFrom)
      : undefined;
    const exists = Boolean(source) || all.some((entry) => entry.slug === item.slug);
    created = !exists;
    if (source) return all.map((entry) => (entry.slug === options.renameFrom ? item : entry));
    return exists ? all.map((entry) => (entry.slug === item.slug ? item : entry)) : [item, ...all];
  });
  return created ? "created" : "updated";
}

export async function deleteItem(slug: string): Promise<boolean> {
  let removed = false;
  await updateCatalog((all) => {
    removed = all.some((entry) => entry.slug === slug);
    return all.filter((entry) => entry.slug !== slug);
  });
  return removed;
}

export async function setItemStatus(slug: string, status: Software["status"]): Promise<SaveOutcome> {
  let found = false;
  await updateCatalog((all) =>
    all.map((entry) => {
      if (entry.slug !== slug) return entry;
      found = true;
      return { ...entry, status, updatedAt: new Date().toISOString() };
    }),
  );
  return found ? "updated" : "conflict";
}

export async function getItem(slug: string, options: { publishedOnly?: boolean } = {}): Promise<Software | undefined> {
  const publishedOnly = options.publishedOnly ?? false;
  const item = (await getCatalogAll()).find((entry) => entry.slug === slug);
  if (!item) return undefined;
  return publishedOnly && item.status !== "published" ? undefined : item;
}

export async function getItemForEdit(slug: string): Promise<{ item: Software; rowVersion: number } | undefined> {
  const item = await getItem(slug, { publishedOnly: false });
  return item ? { item, rowVersion: 0 } : undefined;
}

/** 审计留在本地时同样只追加，并保留最近 500 条，避免无限增长。 */
export async function recordAudit(entry: AuditRecord): Promise<void> {
  await store.update<AuditRecord[]>("audit", () => [], (entries) => [entry, ...entries].slice(0, 500));
}

export async function listAudit(limit = 100): Promise<AuditRecord[]> {
  return ((await store.read<AuditRecord[]>("audit")) ?? []).slice(0, limit);
}

/**
 * 账号在本机 JSON 里。回滚路径同样要能登录，否则 STORE_DRIVER=json 就没人进得去后台。
 * 文件不存在时返回空 —— 此时 lib/auth.ts 会回落到 ADMIN_PASSWORD_HASH。
 */
export async function getUser(username: string): Promise<UserRecord | undefined> {
  return (await listUsersRaw()).find((record) => record.username === username);
}

export async function listUsers(): Promise<PublicUser[]> {
  return (await listUsersRaw()).map(toPublicUser);
}

async function listUsersRaw(): Promise<UserRecord[]> {
  const records = await store.read<UserRecord[]>("users");
  return Array.isArray(records) ? records : [];
}

export async function upsertUser(record: UserRecord): Promise<void> {
  await store.update<UserRecord[]>("users", () => [], (records) => {
    const list = Array.isArray(records) ? records : [];
    return list.some((entry) => entry.username === record.username)
      ? list.map((entry) => (entry.username === record.username ? record : entry))
      : [...list, record];
  });
}

export async function deleteUser(username: string): Promise<boolean> {
  let removed = false;
  await store.update<UserRecord[]>("users", () => [], (records) => {
    const list = Array.isArray(records) ? records : [];
    removed = list.some((entry) => entry.username === username);
    return list.filter((entry) => entry.username !== username);
  });
  return removed;
}

export async function touchUserLogin(username: string): Promise<void> {
  await store.update<UserRecord[]>("users", () => [], (records) =>
    (Array.isArray(records) ? records : []).map((entry) =>
      entry.username === username ? { ...entry, lastLoginAt: new Date().toISOString() } : entry,
    ),
  );
}
