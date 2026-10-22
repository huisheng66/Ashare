import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { after, before, test } from "node:test";

import mysql from "mysql2/promise";

import { samples } from "../data/samples.ts";
import { software } from "../data/software.ts";
import { persistCatalog } from "../lib/catalog-persist.ts";
import { searchPinyinOf, searchTextOf } from "../lib/catalog-rows.ts";
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
  // 拼音召回通道：这些字母在原文里不存在，只能靠 search_pinyin 命中
  // （anfang → 暗房，wsjq → 无损剪切，gkml → 公开目录）
  "anfang", "wsjq", "gkml",
  // 2 字符首字母：**含 a/i 的 token 最容易被停用词坑掉**（af → 暗房的首字母）。
  // db:reindex 必须用 OPTIMIZE TABLE 才能正确重建 token，只 DROP/ADD INDEX 时这条会红。
  "af", "an fang",
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

  // InnoDB 全文索引对**新事务提交**的行有可见性延迟：实测批量 persistCatalog 提交后
  // 立即查询会漏行（单条 autocommit 插入则立即可见）。OPTIMIZE 强制重建全文索引，
  // 让下面的「不漏也不多」断言看到完整索引 —— 否则它会随机报缺（如「电路」漏 kicad）。
  await query("OPTIMIZE TABLE items");
});

after(async () => {
  await closePool();
});

/**
 * 预言机：**search_text 或 search_pinyin** 包含全部查询词。
 *
 * 两条召回通道是 OR 关系（见 searchCatalog 的注释），所以预言机也要取并集 ——
 * 否则拼音命中（如 tupian → 图片）会被判成「多」。
 *
 * 词还要做与实现同口径的**布尔操作符净化**：实现会把 `- + > < ( ) ~ * " @`
 * 从词里剥掉再查（否则 `-foo` 会被当成排除、`(` 会直接语法错误）。
 * 预言机不剥就会把 `-foo` 当成原文而判「多」——zoxide 就是这么暴露的。
 */
function oracle(raw) {
  const normalized = raw.normalize("NFKC").toLowerCase();
  const terms = [...new Set(normalized.split(" "))]
    .map((term) => term.replace(/[+\-><()~*"@]/g, "").trim())
    .filter(Boolean);

  // 与实现同口径的兜底：词全被净化掉（如 "("、"+++"）时，退回「整串包含」。
  // 实现里对应的是 searchCatalog 的 `if (!conditions.length) … LIKE %query%`。
  if (!terms.length) {
    const whole = normalized.trim();
    if (!whole) return [];
    return published
      .filter((item) => searchTextOf(item).toLowerCase().includes(whole))
      .map((item) => item.slug)
      .sort();
  }

  return published
    .filter((item) => {
      const text = searchTextOf(item).toLowerCase();
      const pinyin = searchPinyinOf(item).toLowerCase();
      return terms.every((term) => text.includes(term)) || terms.every((term) => pinyin.includes(term));
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

test("搜索：拼音召回走独立通道（anfang 能找到「暗房」）", { skip }, async () => {
  // 原文（search_text）里没有 anfang 这串字母，唯一来源是 search_pinyin。
  const hit = await sql.searchCatalog("anfang", 60, 0);
  assert.ok(hit.items.some((item) => item.slug === "darktable"), "anfang 应召回 darktable");
  // 首字母缩写同理：wsjq → 无损剪切（lossless-cut）
  const initials = await sql.searchCatalog("wsjq", 60, 0);
  assert.ok(initials.items.some((item) => item.slug === "lossless-cut"), "wsjq 应召回 lossless-cut");
});

test("搜索：拼音命中不会盖过真名命中", { skip }, async () => {
  // darktable 的拼音里有 anfang，原文里也有 darktable 这个词。
  // 搜 darktable 时，精确名称命中必须排第一 —— 拼音只负责召回，不参与排序打分。
  const r = await sql.searchCatalog("darktable", 60, 0);
  assert.ok(r.items.length > 0);
  assert.equal(r.items[0].slug, "darktable", "真名精确命中应排在拼音命中之前");
  assert.equal(r.fuzzy, false, "正常命中不该标 fuzzy");
});

test("搜索：严格无结果时降级为 OR 并标记 fuzzy", { skip }, async () => {
  // "rustdesk zzzznotaword"：严格 AND 下第二个词不存在 → 无结果；
  // 降级为 OR 后应能召回 rustdesk，并如实标记 fuzzy。
  const relaxed = await sql.searchCatalog("rustdesk zzzznotaword", 60, 0);
  assert.ok(relaxed.total > 0, "降级后应召回 rustdesk");
  assert.equal(relaxed.fuzzy, true, "放宽后的结果必须标记 fuzzy");
  // 对照组：正常查询不该被标记
  const strict = await sql.searchCatalog("rustdesk", 60, 0);
  assert.ok(strict.total > 0);
  assert.equal(strict.fuzzy, false, "严格命中的结果不应标记 fuzzy");
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
  assert.deepEqual(await sql.searchCatalog("", PAGE, 0), { items: [], total: 0, fuzzy: false });
  assert.deepEqual(await sql.searchCatalog("   ", PAGE, 0), { items: [], total: 0, fuzzy: false });
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

test("搜索：多词默认是 AND，严格无结果才降级为 OR", { skip }, async () => {
  // 严格能命中时不降级
  const hit = await sql.searchCatalog("python", PAGE, 0);
  assert.equal(hit.fuzzy, false, "严格命中不该标记 fuzzy");

  // 含不存在的词：严格 AND 下无结果 → 容错降级为 OR（给部分结果）并标记。
  // 取舍说明：降级后是**并集**语义，结果可能比单词查询更多 —— 这是
  // 「宁可给部分结果也不空手」的代价（与 Meilisearch 的 partial results 同取向），
  // 由 fuzzy 标记让前台如实提示读者「已放宽匹配」。
  const relaxed = await sql.searchCatalog("python zzzznotfound", PAGE, 0);
  assert.equal(relaxed.fuzzy, true, "严格无结果应降级并标记 fuzzy");
  assert.ok(relaxed.total > 0, "降级后应召回 python");
  assert.ok(relaxed.total >= hit.total, "降级是并集语义，不会比单词查询更少");
});

test("搜索：分页越界返回空数组，total 仍是全量", { skip }, async () => {
  const first = await sql.searchCatalog("python", PAGE, 0);
  const beyond = await sql.searchCatalog("python", PAGE, 100000);
  assert.equal(beyond.total, first.total);
  assert.deepEqual(beyond.items, []);
});
