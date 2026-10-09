import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { after, before, test } from "node:test";

import mysql from "mysql2/promise";

import { samples } from "../data/samples.ts";
import { software } from "../data/software.ts";
import { auditSummary, diffFields } from "../lib/audit.ts";
import { persistCatalog } from "../lib/catalog-persist.ts";
import { closePool, connectionOptions, query } from "../lib/db.ts";
import { normalizeItems } from "../lib/normalize.ts";
import { seedToItem } from "../lib/seed.ts";
import * as store from "../lib/store-sql.ts";

import { mysqlSkip } from "./_mysql-skip.mjs";

/**
 * P6 写路径闸门。
 *
 * 要证明的三件事：
 *  1. 单条保存不再重写整张表（这是几何增长下最先炸的地方）；
 *  2. 并发编辑同一条时**不静默覆盖**，而是明确返回 conflict；
 *  3. 改名是原子的，不会「先删后插」把条目弄丢。
 *
 * 打隔离库 MYSQL_TEST_URL；没设就整组跳过。
 */

const { skip } = await mysqlSkip("MYSQL_TEST_URL", "写路径测试");
if (process.env.MYSQL_TEST_URL) process.env.MYSQL_URL = process.env.MYSQL_TEST_URL;

const FALLBACK = new Date("2026-01-01T00:00:00.000Z");
const catalog = normalizeItems(
  [...software.map(seedToItem), ...samples.map((entry) => structuredClone(entry))],
  FALLBACK,
);

const TABLES = [
  "item_tags", "item_scenes", "item_platforms", "item_alternatives", "item_links",
  "item_previews", "item_guide_resources", "items", "feedback", "submissions", "ip_blocks", "clicks",
];

function item(slug, overrides = {}) {
  return {
    slug,
    name: slug,
    aliases: [],
    kind: "app",
    status: "draft",
    tags: ["标签"],
    summary: "摘要",
    body: "正文",
    scenes: ["tools"],
    platforms: ["windows"],
    source: "official",
    links: {},
    tutorial: [],
    whoFor: "适合",
    whoNot: "不适合",
    alternatives: [],
    previews: [],
    icon: { letter: "W", color: "#123456" },
    createdAt: "2026-02-01T00:00:00.000Z",
    updatedAt: "2026-02-01T00:00:00.000Z",
    ...overrides,
  };
}

before(async () => {
  if (skip) return;
  const ddl = await mysql.createConnection({ ...connectionOptions(), multipleStatements: true });
  try {
    for (const table of TABLES) await ddl.query("DROP TABLE IF EXISTS " + table);
    await ddl.query("DROP TABLE IF EXISTS ft_stopwords");
    await ddl.query("DROP TABLE IF EXISTS audit_log");
    await ddl.query("DROP TABLE IF EXISTS schema_migrations");
    for (const file of readdirSync("db/migrations").filter((name) => name.endsWith(".sql")).sort()) {
      await ddl.query(readFileSync("db/migrations/" + file, "utf8"));
    }
  } finally {
    await ddl.end();
  }
  const conn = await mysql.createConnection({ ...connectionOptions() });
  try {
    await conn.beginTransaction();
    await persistCatalog(conn, catalog, { prune: true });
    await conn.commit();
  } finally {
    await conn.end();
  }
});

after(async () => {
  await closePool();
});

test("diffFields 与 auditSummary：字段级 diff 只认真变化", () => {
  assert.deepEqual(diffFields({ a: 1, b: "x" }, { a: 1, b: "y" }), ["b"]);
  assert.deepEqual(diffFields({ a: 1 }, { a: 1, updatedAt: "later" }), [], "updatedAt 不算内容变更");
  assert.deepEqual(diffFields(undefined, { a: 1 }), ["a"]);
  assert.match(auditSummary("create", "工具甲"), /新增条目/);
  assert.match(auditSummary("update", "工具甲", ["summary", "tags"]), /2 个字段/);
  assert.match(auditSummary("update", "工具甲", []), /无字段变化/);
});

test("单条原子写：新增 created、再存 updated、row_version 自增", { skip }, async () => {
  assert.equal(await store.saveItem(item("__w1")), "created");
  const created = await store.getItemForEdit("__w1");
  assert.equal(created.rowVersion, 1);

  assert.equal(await store.saveItem(item("__w1", { summary: "改过" }), { expectedVersion: 1 }), "updated");
  const updated = await store.getItemForEdit("__w1");
  assert.equal(updated.rowVersion, 2);
  assert.equal(updated.item.summary, "改过");
  await store.deleteItem("__w1");
});

test("乐观锁：同一行并发的第二个写拿到 conflict，不覆盖别人的改动", { skip }, async () => {
  await store.saveItem(item("__w2"));
  const outcomes = await Promise.all([
    store.saveItem(item("__w2", { summary: "A 的改动" }), { expectedVersion: 1 }),
    store.saveItem(item("__w2", { summary: "B 的改动" }), { expectedVersion: 1 }),
  ]);
  assert.deepEqual([...outcomes].sort(), ["conflict", "updated"], "应恰好一个成功、一个冲突");

  const after = await store.getItemForEdit("__w2");
  assert.equal(after.rowVersion, 2, "只应自增一次 —— 冲突的那次不该写库");
  assert.ok(["A 的改动", "B 的改动"].includes(after.item.summary));
  await store.deleteItem("__w2");
});

test("不同条目的并发保存都不丢", { skip }, async () => {
  await Promise.all([store.saveItem(item("__w3")), store.saveItem(item("__w4"))]);
  assert.ok(await store.getItem("__w3"));
  assert.ok(await store.getItem("__w4"));
  await store.deleteItem("__w3");
  await store.deleteItem("__w4");
});

test("单条保存只碰一行：其它条目的 row_version 与更新时间不变", { skip }, async () => {
  const reference = catalog[0].slug;
  const [before] = await query("SELECT row_version, updated_at FROM items WHERE slug = ?", [reference]);
  await store.saveItem(item("__w5"));
  const [after] = await query("SELECT row_version, updated_at FROM items WHERE slug = ?", [reference]);
  assert.deepEqual(after, before, "保存新条目不该重写整张表 —— 这是替换掉「读全量写全量」的核心证据");
  await store.deleteItem("__w5");
});

test("改名是原子的：旧 slug 消失、新 slug 出现、子表跟着走", { skip }, async () => {
  await store.saveItem(item("__old", { tags: ["甲"] }));
  assert.equal(
    await store.saveItem(item("__new", { tags: ["乙"] }), { renameFrom: "__old", expectedVersion: 1 }),
    "updated",
  );
  assert.equal(await store.getItem("__old"), undefined);
  const renamed = await store.getItemForEdit("__new");
  assert.deepEqual(renamed.item.tags, ["乙"]);
  assert.equal(renamed.rowVersion, 2);
  await store.deleteItem("__new");
});

test("改名撞车：目标 slug 已存在时返回 conflict，不动任何一条", { skip }, async () => {
  await store.saveItem(item("__keep"));
  await store.saveItem(item("__moved"));
  assert.equal(
    await store.saveItem(item("__keep"), { renameFrom: "__moved", expectedVersion: 1 }),
    "conflict",
  );
  assert.ok(await store.getItem("__keep"));
  assert.ok(await store.getItem("__moved"), "源条目必须还在 —— 不能先删后插");
  await store.deleteItem("__keep");
  await store.deleteItem("__moved");
});

test("删除：条目与子行一起消失，重复删除返回 false", { skip }, async () => {
  await store.saveItem(item("__w6", { tags: ["将被删"] }));
  assert.equal(await store.deleteItem("__w6"), true);
  assert.equal(await store.deleteItem("__w6"), false);
  const rows = await query("SELECT COUNT(*) AS c FROM item_tags WHERE tag = ?", ["将被删"]);
  assert.equal(Number(rows[0].c), 0);
});

test("状态变更：版本不符返回 conflict，版本正确才落库", { skip }, async () => {
  await store.saveItem(item("__w8"));
  assert.equal(await store.setItemStatus("__w8", "published", { expectedVersion: 99 }), "conflict");
  assert.equal((await store.getItemForEdit("__w8")).item.status, "draft");
  assert.equal(await store.setItemStatus("__w8", "published", { expectedVersion: 1 }), "updated");
  assert.equal((await store.getItemForEdit("__w8")).item.status, "published");
  await store.deleteItem("__w8");
});

test("审计：listAudit 新的在前，字段与版本号可查", { skip }, async () => {
  await query("DELETE FROM audit_log");
  await store.recordAudit({
    at: "2026-03-01T00:00:00.000Z", actor: "admin", action: "create", slug: "a", summary: "新增条目「甲」", fields: [],
  });
  await store.recordAudit({
    at: "2026-03-02T00:00:00.000Z", actor: "admin", action: "update", slug: "a", summary: "改了两个字段", fields: ["summary", "tags"],
    versionBefore: 1, versionAfter: 2,
  });

  const entries = await store.listAudit(10);
  assert.equal(entries.length, 2);
  assert.equal(entries[0].action, "update", "新的在前");
  assert.deepEqual(entries[0].fields, ["summary", "tags"]);
  assert.equal(entries[0].versionBefore, 1);
  assert.equal(entries[0].versionAfter, 2);
  assert.equal(entries[1].action, "create");
});
