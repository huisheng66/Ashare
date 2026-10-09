import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { after, before, test } from "node:test";

import mysql from "mysql2/promise";

import { samples } from "../data/samples.ts";
import { software } from "../data/software.ts";
import { persistCatalog } from "../lib/catalog-persist.ts";
import { searchTextOf } from "../lib/catalog-rows.ts";
import * as sql from "../lib/catalog-sql.ts";
import { closePool, connectionOptions, query } from "../lib/db.ts";
import { normalizeItems } from "../lib/normalize.ts";
import { seedToItem } from "../lib/seed.ts";

import { mysqlSkip } from "./_mysql-skip.mjs";

/**
 * SQL 搜索的闸门。
 *
 * 这里**不比对内存打分** —— FULLTEXT 与逐字段打分本来就不是一回事，强行对齐只会掩盖问题。
 * 改用一条可解释的预言机：search_text 全字段包含所有查询词。
 * 用它能同时抓住两类错：漏（FULLTEXT 没找到该找的）与多（ngram 命中不该命中的）。
 *
 * 打隔离库 MYSQL_TEST_URL；没设就整组跳过。
 */

const { skip } = await mysqlSkip("MYSQL_TEST_URL", "SQL 搜索测试");
if (process.env.MYSQL_TEST_URL) process.env.MYSQL_URL = process.env.MYSQL_TEST_URL;

const PAGE = 60;
const FALLBACK = new Date("2026-01-01T00:00:00.000Z");
const catalog = normalizeItems(
  [...software.map(seedToItem), ...samples.map((item) => structuredClone(item))],
  FALLBACK,
);
const published = catalog.filter((item) => item.status === "published");

/** 覆盖：中文任务词、英文名、别名、多词、单字（ngram 查不到，走 LIKE 兜底）、纯符号。 */
const QUERIES = [
  "python", "Python", "python3",
  "git", "vs code", "visual studio", "code",
  "pdf", "PDF", "笔记", "论文", "修图", "建模", "电路", "统计",
  "图", "记", "管",
  "git", "figma", "kicad", "inkscape", "audacity",
  "-foo", "(", "\"", "+++", "   ", "zzzznotfound",
];

/** 删除/建表顺序：子表在前，items 在后（外键）。 */
const TABLES = [
  "item_tags", "item_scenes", "item_platforms", "item_alternatives", "item_links",
  "item_previews", "item_guide_resources", "items", "feedback", "submissions", "ip_blocks", "clicks",
];

before(async () => {
  if (skip) return;
  const ddl = await mysql.createConnection({ ...connectionOptions(), multipleStatements: true });
  try {
    // 整库重建，而不是 CREATE TABLE IF NOT EXISTS：
    // **停用词表是在创建全文索引时绑定的**（实测：改完 innodb_ft_server_stopword_table
    // 再往旧索引里插数据，token 仍按旧表生成）。所以要让测试反映当前配置，必须重建索引。
    // TABLES 已是子表在前的顺序，按原序删除即可满足外键。
    for (const table of TABLES) await ddl.query("DROP TABLE IF EXISTS " + table);
    await ddl.query("DROP TABLE IF EXISTS ft_stopwords");
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

/** 预言机：search_text 里包含全部查询词。 */
function oracle(raw) {
  const terms = [...new Set(raw.normalize("NFKC").toLowerCase().split(" "))].filter(Boolean);
  if (!terms.length) return [];
  return published
    .filter((item) => {
      const text = searchTextOf(item).toLowerCase();
      return terms.every((term) => text.includes(term));
    })
    .map((item) => item.slug)
    .sort();
}

/** 把搜索结果翻页取全。 */
async function searchAll(raw) {
  const slugs = [];
  let total = 0;
  for (let offset = 0; offset < 1000; offset += PAGE) {
    const page = await sql.searchCatalog(raw, PAGE, offset);
    total = page.total;
    slugs.push(...page.items.map((item) => item.slug));
    if (!page.items.length || slugs.length >= total) break;
  }
  return { slugs, total };
}

test("搜索：结果集与 search_text 的包含口径一致（不漏也不多）", { skip }, async () => {
  const problems = [];
  for (const raw of QUERIES) {
    const expected = oracle(raw);
    const { slugs, total } = await searchAll(raw);
    const missing = expected.filter((slug) => !slugs.includes(slug));
    const extra = slugs.filter((slug) => !expected.includes(slug));
    if (missing.length || extra.length || total !== expected.length) {
      problems.push(
        JSON.stringify(raw) + " 期望 " + expected.length + " 实际 " + total +
        (missing.length ? " 漏[" + missing.join(",") + "]" : "") +
        (extra.length ? " 多[" + extra.join(",") + "]" : ""),
      );
    }
  }
  assert.deepEqual(problems, [], "搜索与包含口径不一致：\n  " + problems.join("\n  "));
});

test("配置：全文索引必须用空停用词表，否则含 a/i 的词会搜不到", { skip }, async () => {
  // 受控实验结论（见计划文档第七章）：InnoDB 默认停用词表含单字母 a 与 i，
  // 而 ngram 会丢弃**包含**停用词的 token —— 'gimp' 只剩 mp、'git' 一个不剩。
  // 这条断言故意做成硬失败：配置一旦回退，git / figma / kicad 会静默搜不到。
  const rows = await query(
    "SELECT @@innodb_ft_server_stopword_table AS server_table, @@innodb_ft_user_stopword_table AS user_table",
  );
  const effective = String(rows[0].user_table || rows[0].server_table || "");
  assert.ok(
    effective,
    "停用词表仍是内置默认表。请在服务器设置 innodb_ft_server_stopword_table=ashare/ft_stopwords 后跑 npm run db:reindex",
  );
  const stop = await query("SELECT COUNT(*) AS c FROM ft_stopwords");
  assert.equal(Number(stop[0].c), 0, "ft_stopwords 必须是空表");

  for (const term of ["git", "figma", "kicad"]) {
    const result = await sql.searchCatalog(term, PAGE, 0);
    assert.ok(result.total >= 1, "搜索「" + term + "」应有结果；0 条通常意味着停用词配置回退了");
  }
});

test("搜索：空查询与纯空白返回空结果，不报错", { skip }, async () => {
  assert.deepEqual(await sql.searchCatalog("", PAGE, 0), { items: [], total: 0 });
  assert.deepEqual(await sql.searchCatalog("   ", PAGE, 0), { items: [], total: 0 });
});

test("搜索：布尔模式操作符与 LIKE 通配符不会造成语法错误或通配", { skip }, async () => {
  for (const raw of ["-foo", "(", ")", "~*", '"a"', "@x", "100%", "a_b", "+++"]) {
    const result = await sql.searchCatalog(raw, PAGE, 0);
    assert.ok(Array.isArray(result.items), raw + " 应返回数组");
    assert.ok(Number.isInteger(result.total), raw + " total 应为整数");
  }
  // % 必须是字面量：种子简介里没有 "100%"，不该被当成通配符匹配到全部。
  const percent = await sql.searchCatalog("100%", PAGE, 0);
  assert.ok(percent.total < published.length, "100% 不该匹配全部条目");
});

test("搜索：单字查询走 LIKE 兜底，能查到 ngram 查不到的结果", { skip }, async () => {
  const single = await sql.searchCatalog("图", PAGE, 0);
  assert.ok(single.total > 0, "单字应能查到结果（ngram_token_size=2 下 FULLTEXT 必然为空）");
  // 与 MATCH 走不到一起：直接确认 FULLTEXT 对单字确实无结果，证明兜底是必要的。
  const [rows] = await query("SELECT COUNT(*) AS c FROM items WHERE MATCH(search_text) AGAINST(? IN BOOLEAN MODE)", ["+图"]);
  assert.equal(Number(rows.c), 0, "FULLTEXT 对单字应无结果");
});

test("搜索：精确名称排在最前", { skip }, async () => {
  const exact = published.find((item) => item.name === "Python");
  assert.ok(exact, "种子数据里应有名称恰为 Python 的条目");
  const result = await sql.searchCatalog("Python", PAGE, 0);
  assert.equal(result.items[0]?.slug, exact.slug, "名称精确匹配应排第一");
});

test("搜索：多词是 AND，一个词不命中就不返回", { skip }, async () => {
  const both = await sql.searchCatalog("python git", PAGE, 0);
  const onlyOne = await sql.searchCatalog("python zzzznotfound", PAGE, 0);
  assert.equal(onlyOne.total, 0, "含不存在的词应无结果");
  assert.ok(both.total <= (await sql.searchCatalog("python", PAGE, 0)).total, "加词只会收窄结果");
});

test("搜索：分页越界返回空数组，total 仍是全量", { skip }, async () => {
  const first = await sql.searchCatalog("python", PAGE, 0);
  const beyond = await sql.searchCatalog("python", PAGE, 100000);
  assert.equal(beyond.total, first.total);
  assert.deepEqual(beyond.items, []);
});
