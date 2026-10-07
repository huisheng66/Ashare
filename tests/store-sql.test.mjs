import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, beforeEach, test } from "node:test";

import mysql from "mysql2/promise";

import { closePool, connectionOptions, query } from "../lib/db.ts";

/**
 * SQL 运行库（lib/store-sql.ts）的契约测试。
 *
 * 打的是隔离库 MYSQL_TEST_URL，不是开发库：saveCatalog / updateCatalog 是「整表镜像」语义，
 * 跑在开发库上会把导入的 55 条目录清空。没设 MYSQL_TEST_URL 就整组跳过，CI 不会因此变红。
 *
 * 必须在任何 getPool() 之前把 MYSQL_URL 指向测试库 —— 连接池缓存在 globalThis 上，
 * 建成之后再改环境变量不会生效。
 */

const skip = process.env.MYSQL_TEST_URL ? false : "未设置 MYSQL_TEST_URL：跳过 SQL 运行库契约测试";
if (process.env.MYSQL_TEST_URL) process.env.MYSQL_URL = process.env.MYSQL_TEST_URL;

const store = skip ? null : await import("../lib/store-sql.ts");

const TABLES = [
  "item_tags", "item_scenes", "item_platforms", "item_alternatives", "item_links",
  "item_previews", "item_guide_resources", "items", "feedback", "submissions", "ip_blocks", "clicks",
];

async function clean() {
  for (const table of TABLES) await query("DELETE FROM " + table);
}

function item(slug, overrides = {}) {
  return {
    slug,
    name: slug,
    aliases: [],
    kind: "app",
    status: "published",
    tags: [],
    summary: "摘要",
    body: "正文",
    scenes: ["tools"],
    platforms: ["windows"],
    source: "official",
    links: { official: "https://example.com/" },
    tutorial: [],
    whoFor: "适合",
    whoNot: "不适合",
    alternatives: [],
    previews: [],
    icon: { letter: "T", color: "#123456" },
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

before(async () => {
  if (skip) return;
  const conn = await mysql.createConnection({ ...connectionOptions(), multipleStatements: true });
  try {
    await conn.query(readFileSync("db/migrations/0001_init.sql", "utf8"));
  } finally {
    await conn.end();
  }
  await clean();
});

beforeEach(async () => {
  if (skip) return;
  await clean();
});

after(async () => {
  await closePool();
});

test("catalog：saveCatalog 后 getCatalogAll 逐字段往返", { skip }, async () => {
  const alpha = item("alpha", {
    tags: ["甲", "乙"],
    scenes: ["code", "tools"],
    platforms: ["windows", "linux"],
    featured: true,
    price: "免费",
    alternatives: ["beta"],
    aliases: ["阿尔法"],
  });
  const beta = item("beta", {
    nameZh: "贝塔",
    guide: {
      intro: "导读",
      markdown: "# 标题",
      resources: [{ kind: "pdf", title: "手册", url: "https://example.com/m.pdf", note: "说明" }],
    },
  });
  await store.saveCatalog([alpha, beta]);
  const back = await store.getCatalogAll();
  assert.deepEqual(back.map((entry) => entry.slug), ["alpha", "beta"]);
  assert.deepEqual(back[0].tags, ["甲", "乙"]);
  assert.deepEqual(back[0].scenes, ["code", "tools"]);
  assert.deepEqual(back[0].platforms, ["windows", "linux"]);
  assert.deepEqual(back[0].alternatives, ["beta"]);
  assert.deepEqual(back[0].aliases, ["阿尔法"]);
  assert.equal(back[0].featured, true);
  assert.equal(back[0].price, "免费");
  assert.equal(back[1].nameZh, "贝塔");
  assert.deepEqual(back[1].guide, beta.guide);
});

test("catalog：updateCatalog 能加能删，且只动指定条目", { skip }, async () => {
  await store.saveCatalog([item("keep")]);
  await store.updateCatalog((items) => [...items, item("added")]);
  assert.deepEqual((await store.getCatalogAll()).map((entry) => entry.slug), ["keep", "added"]);
  await store.updateCatalog((items) => items.filter((entry) => entry.slug !== "keep"));
  assert.deepEqual((await store.getCatalogAll()).map((entry) => entry.slug), ["added"], "多余的条目应被镜像删除");
});

test("catalog：并发 updateCatalog 不互相覆盖（GET_LOCK 跨进程串行）", { skip }, async () => {
  await store.saveCatalog([]);
  await Promise.all([
    store.updateCatalog((items) => [...items, item("left")]),
    store.updateCatalog((items) => [...items, item("right")]),
  ]);
  assert.deepEqual((await store.getCatalogAll()).map((entry) => entry.slug).sort(), ["left", "right"]);
});

test("catalog：子表随条目删除级联清理", { skip }, async () => {
  await store.saveCatalog([item("gone", { tags: ["标签"] })]);
  await store.updateCatalog(() => []);
  const rows = await query("SELECT COUNT(*) AS c FROM item_tags");
  assert.equal(Number(rows[0].c), 0);
});

test("feedback：新条目在前，可标记已读与删除", { skip }, async () => {
  await store.addFeedback({ id: "f1", at: "2026-01-01T00:00:00.000Z", type: "issue", content: "第一条" });
  await store.addFeedback({
    id: "f2", at: "2026-01-02T00:00:00.000Z", type: "correction", slug: "alpha", contact: "a@b.c", content: "第二条",
  });

  const list = await store.getFeedback();
  assert.deepEqual(list.map((entry) => entry.id), ["f2", "f1"]);
  assert.equal(list[0].slug, "alpha");
  assert.equal(list[0].contact, "a@b.c");
  assert.equal("read" in list[0], false, "未读不该出现 read 字段");

  await store.updateFeedback((entries) => entries.map((entry) => (entry.id === "f2" ? { ...entry, read: true } : entry)));
  assert.equal((await store.getFeedback())[0].read, true);

  await store.updateFeedback((entries) => entries.filter((entry) => entry.id !== "f1"));
  assert.deepEqual((await store.getFeedback()).map((entry) => entry.id), ["f2"]);
});

test("submissions：新增、读取与清空", { skip }, async () => {
  await store.addSubmission({
    id: "s1", at: "2026-01-01T00:00:00.000Z", kind: "script", name: "小工具", url: "https://example.com/x", need: "需要一个脚本",
  });
  const list = await store.getSubmissions();
  assert.equal(list.length, 1);
  assert.equal(list[0].kind, "script");
  await store.updateSubmissions(() => []);
  assert.deepEqual(await store.getSubmissions(), []);
});

test("blocks：毫秒到期时间往返，可增可删", { skip }, async () => {
  const until = Date.parse("2026-06-01T00:00:00.000Z");
  await store.updateBlocks(() => ({ "203.0.113.7": until }));
  const blocks = await store.getBlocks();
  assert.deepEqual(Object.keys(blocks), ["203.0.113.7"]);
  assert.equal(blocks["203.0.113.7"], until);

  await store.updateBlocks((current) => {
    const next = { ...current };
    delete next["203.0.113.7"];
    return next;
  });
  assert.deepEqual(await store.getBlocks(), {});
});
