import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";

import mysql from "mysql2/promise";

import { samples } from "../data/samples.ts";
import { software } from "../data/software.ts";
import { canonicalItem } from "../lib/catalog-rows.ts";
import { persistCatalog } from "../lib/catalog-persist.ts";
import { kindIds, parseCatalogFilters, platformIds, sceneIds, selectCatalogItems } from "../lib/catalog-query.ts";
import * as sql from "../lib/catalog-sql.ts";
import { closePool, connectionOptions, query } from "../lib/db.ts";
import { toCatalogItem } from "../lib/items.ts";
import { normalizeItems } from "../lib/normalize.ts";
import { seedToItem } from "../lib/seed.ts";

/**
 * SQL 读路径 vs 内存实现的一致性测试。
 *
 * 这是 P5 的核心闸门：把筛选、排序、分页下推到数据库之后，**结果必须和原来的内存实现逐字段相同**。
 * 只要两条路径还在并存（STORE_DRIVER=json 是回滚路径），它们就必须可互换。
 *
 * 打隔离库 MYSQL_TEST_URL；没设就整组跳过。
 */

const skip = process.env.MYSQL_TEST_URL ? false : "未设置 MYSQL_TEST_URL：跳过 SQL 读路径一致性测试";
if (process.env.MYSQL_TEST_URL) process.env.MYSQL_URL = process.env.MYSQL_TEST_URL;

const PAGE = 60;
const FALLBACK = new Date("2026-01-01T00:00:00.000Z");
const catalog = normalizeItems(
  [...software.map(seedToItem), ...samples.map((item) => structuredClone(item))],
  FALLBACK,
);
const published = catalog.filter((item) => item.status === "published");

const TABLES = [
  "item_tags", "item_scenes", "item_platforms", "item_alternatives", "item_links",
  "item_previews", "item_guide_resources", "items", "feedback", "submissions", "ip_blocks", "clicks",
];

before(async () => {
  if (skip) return;
  const ddl = await mysql.createConnection({ ...connectionOptions(), multipleStatements: true });
  try {
    await ddl.query(readFileSync("db/migrations/0001_init.sql", "utf8"));
  } finally {
    await ddl.end();
  }
  for (const table of TABLES) await query("DELETE FROM " + table);

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

const CASES = [
  {},
  { scene: "code" },
  { scene: "code,docs" },
  { platform: "linux" },
  { platform: "windows,macos" },
  { kind: "opensource" },
  { kind: "app,script" },
  { discount: "1" },
  { scene: "code", platform: "windows" },
  { scene: "data", kind: "app" },
  { sort: "updated" },
  { scene: "docs", sort: "updated" },
  { scene: "code", platform: "linux", kind: "opensource" },
];

function memoryCounts() {
  const counts = {
    total: published.length,
    discount: 0,
    kinds: Object.fromEntries(kindIds.map((id) => [id, 0])),
    scenes: Object.fromEntries(sceneIds.map((id) => [id, 0])),
    platforms: Object.fromEntries(platformIds.map((id) => [id, 0])),
  };
  for (const item of published) {
    if (item.source === "discount") counts.discount += 1;
    if (Object.hasOwn(counts.kinds, item.kind)) counts.kinds[item.kind] += 1;
    for (const id of new Set(item.scenes)) if (Object.hasOwn(counts.scenes, id)) counts.scenes[id] += 1;
    for (const id of new Set(item.platforms)) if (Object.hasOwn(counts.platforms, id)) counts.platforms[id] += 1;
  }
  return counts;
}

/**
 * 去掉值为 undefined 的键。RSC 序列化时本来就会丢掉它们，
 * 但 deepStrictEqual / 键遍历会区分「键存在但为 undefined」与「键不存在」。
 */
function strip(value) {
  if (Array.isArray(value)) return value.map(strip);
  if (value && typeof value === "object") {
    const out = {};
    for (const [key, entry] of Object.entries(value)) {
      if (entry === undefined) continue;
      out[key] = strip(entry);
    }
    return out;
  }
  return value;
}

/**
 * 内存侧的期望卡片。featured 的 false 与「没有 featured」在库里都归一成 0，
 * 读出来只能是 undefined —— canonicalItem 已把这两者定义为等价（列是 TINYINT NOT NULL DEFAULT 0），
 * 卡片比对因此用同一口径。
 */
function expectedCard(item) {
  const card = toCatalogItem(item);
  if (!card.featured) card.featured = undefined;
  return strip(card);
}

/** 找出第一个不同字段，避免默认 reporter 把整篇正文打出来。 */
function mismatch(expected, actual, at = "") {
  if (Object.is(expected, actual)) return null;
  if (expected === null || actual === null || typeof expected !== "object" || typeof actual !== "object") {
    return at + " 期望 " + JSON.stringify(expected) + "，实际 " + JSON.stringify(actual);
  }
  if (Array.isArray(expected) || Array.isArray(actual)) {
    if (!Array.isArray(expected) || !Array.isArray(actual)) return at + " 一边是数组一边不是";
    if (expected.length !== actual.length) return at + " 长度 " + expected.length + " vs " + actual.length;
    for (let index = 0; index < expected.length; index += 1) {
      const nested = mismatch(expected[index], actual[index], at + "[" + index + "]");
      if (nested) return nested;
    }
    return null;
  }
  for (const key of new Set([...Object.keys(expected), ...Object.keys(actual)])) {
    const nested = mismatch(expected[key], actual[key], at ? at + "." + key : key);
    if (nested) return nested;
  }
  return null;
}

test("列表：SQL 下推与内存实现在各筛选组合下逐字段一致", { skip }, async () => {
  for (const raw of CASES) {
    const filters = parseCatalogFilters(raw);
    const expectedAll = selectCatalogItems(published, filters);
    const label = JSON.stringify(raw);

    assert.equal(await sql.countCatalog(filters), expectedAll.length, label + " 总数");

    const pageCount = Math.max(1, Math.ceil(expectedAll.length / PAGE));
    for (let page = 1; page <= pageCount; page += 1) {
      const offset = (page - 1) * PAGE;
      const actual = await sql.queryCatalog(filters, PAGE, offset);
      const expected = expectedAll.slice(offset, offset + PAGE).map(expectedCard);
      assert.equal(actual.length, expected.length, label + " 第 " + page + " 页条数");
      for (let index = 0; index < expected.length; index += 1) {
        const bad = mismatch(expected[index], strip(actual[index]));
        if (bad) assert.fail(label + " 第 " + page + " 页 [" + expected[index].slug + "] " + bad);
      }
    }
  }
});

test("计数：SQL 聚合与内存统计一致", { skip }, async () => {
  assert.deepEqual(await sql.catalogCountsSql(), memoryCounts());
});

test("精选：SQL 与内存取出的条目一致", { skip }, async () => {
  const expected = published.filter((item) => item.featured);
  const actual = await sql.featuredCatalog(5);
  assert.equal(actual.total, expected.length);
  const want = expected.slice(0, 5).map(expectedCard);
  assert.equal(actual.items.length, want.length);
  for (let index = 0; index < want.length; index += 1) {
    const bad = mismatch(want[index], strip(actual.items[index]));
    if (bad) assert.fail("精选 [" + want[index].slug + "] " + bad);
  }
});

test("详情：SQL 查到的一条与内存里的完全相同", { skip }, async () => {
  const sample = published[0];
  const actual = await sql.getSoftwareSql(sample.slug);
  // 用 canonicalItem 对齐期望值：它只抹平契约外的遗留键（officialLabel）与 featured:false。
  assert.deepEqual(actual, canonicalItem(sample));
  assert.equal(await sql.getSoftwareSql("no-such-slug"), undefined);
});

test("同类替代：保持传入顺序，跳过不存在的 slug", { skip }, async () => {
  const withAlts = published.find((item) => item.alternatives.length >= 2);
  assert.ok(withAlts, "种子数据里应有带同类替代的条目");
  const slugs = [withAlts.alternatives[1], "definitely-missing", withAlts.alternatives[0]];
  const actual = await sql.alternativesOfSql(slugs);
  assert.deepEqual(actual.map((item) => item.slug), [withAlts.alternatives[1], withAlts.alternatives[0]]);
});

test("场景：SQL 结果与内存过滤一致", { skip }, async () => {
  for (const scene of sceneIds) {
    const expected = published.filter((item) => item.scenes.includes(scene));
    const actual = await sql.bySceneSql(scene);
    assert.deepEqual(actual.map((item) => item.slug), expected.map((item) => item.slug), "场景 " + scene);
  }
});

test("窄投影：卡片不含 body / guide / tutorial / links 这些详情字段", { skip }, async () => {
  const [card] = await sql.queryCatalog(parseCatalogFilters({}), 1, 0);
  for (const heavy of ["body", "guide", "tutorial", "links", "whoFor", "whoNot", "license", "version"]) {
    assert.equal(heavy in card, false, "卡片不该带 " + heavy);
  }
  assert.deepEqual(
    Object.keys(card).sort(),
    ["featured", "icon", "iconImage", "kind", "name", "nameZh", "platforms", "previews", "price", "scenes", "slug", "source", "summary", "tags"],
    "卡片字段集合应恰好等于 CatalogItem",
  );
});

test("分页：越界偏移返回空数组而不是报错", { skip }, async () => {
  assert.deepEqual(await sql.queryCatalog(parseCatalogFilters({}), PAGE, 100000), []);
});

test("站点地图：分片只返回 slug 与更新时间", { skip }, async () => {
  const entries = await sql.sitemapPage(0, 3);
  assert.equal(entries.length, 3);
  assert.deepEqual(Object.keys(entries[0]).sort(), ["slug", "updatedAt"]);
  assert.equal(await sql.publishedCount(), published.length);
});
