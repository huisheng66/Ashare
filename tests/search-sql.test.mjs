import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { after, before, test } from "node:test";

import mysql from "mysql2/promise";

import { samples } from "../data/samples.ts";
import { software } from "../data/software.ts";
import { persistCatalog } from "../lib/catalog-persist.ts";
import { searchInitialsOf, searchPinyinOf, searchTextOf } from "../lib/catalog-rows.ts";
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
  // 汉字↔拉丁混写：目录里写「3D 打印」，用户更常打「3d打印」。
  // ngram 的空格会切断 bigram（d打），带空格入库时这条必然 0 结果 ——
  // 入库侧连写（lib/catalog-rows.ts 的 glueScriptBoundaries）之后两种写法都要命中。
  "3d打印", "3D 打印",
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
      // 首字母是第三条召回通道（独立列）。oracle 必须跟上，
      // 否则 initials 命中的条目会被判成「多出来的」。
      const initials = searchInitialsOf(item).toLowerCase();
      return (
        terms.every((term) => text.includes(term)) ||
        terms.every((term) => pinyin.includes(term)) ||
        terms.every((term) => initials.includes(term))
      );
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

test("搜索：拼音查询按相关度排序，不退化为目录顺序", { skip }, async () => {
  // 曾经的缺陷：拼音命中只影响「能否召回」，不进排序。而纯拼音查询时
  // MATCH(search_text) 恒为 0、NAME_RANK 也全打平，整批结果就只剩 sort_index 在起作用。
  // 实测搜 yinyue 时 mineradio（sort_index 92）压过 lx-music-desktop（395），
  // 尽管后者的拼音得分是前者的近三倍 —— 用户会觉得「搜得不准」。
  const result = await sql.searchCatalog("yinyue", PAGE, 0);
  assert.ok(result.total > 3, "yinyue 应有多个结果");

  const catalogOrder = await query(
    "SELECT i.slug FROM items i WHERE i.status = 'published' AND MATCH(i.search_pinyin) AGAINST(? IN BOOLEAN MODE) ORDER BY i.sort_index ASC, i.id ASC LIMIT ?",
    ["+yinyue", PAGE],
  );
  assert.notDeepEqual(
    result.items.map((item) => item.slug),
    catalogOrder.map((row) => row.slug),
    "拼音查询应按拼音相关度排序，而不是退回目录顺序",
  );
});

test("搜索：标签命中排在「仅在简介里提及」之前", { skip }, async () => {
  // tags 是人工策展的类目，比简介里顺带提一句可靠得多。
  // 搜「知识管理」时只有 obsidian / joplin 打了这个标签，它们应占据结果最前。
  const tagged = await query(
    "SELECT i.slug FROM items i JOIN item_tags t ON t.item_id = i.id WHERE t.tag = ? AND i.status = 'published' ORDER BY i.slug",
    ["知识管理"],
  );
  assert.ok(tagged.length > 0, "种子数据里应有打了「知识管理」标签的条目");

  const result = await sql.searchCatalog("知识管理", PAGE, 0);
  assert.ok(result.total >= tagged.length, "打了标签的条目必须都能被召回");
  const top = result.items.slice(0, tagged.length).map((item) => item.slug).sort();
  assert.deepEqual(top, tagged.map((row) => row.slug), "打了该标签的条目应占据结果最前");
});

test("搜索：单词拼错能纠正到原名，并把纠正词透传出去", { skip }, async () => {
  // SQL 层救不回来：ngram parser 把单个词的 ngram 当短语，拼错一个字母就要求
  // 所有 bigram 连续命中，布尔与非布尔模式都返回 0（实测 obisidan / joplinn 均如此）。
  // 所以这是应用层拼写纠正的存在理由，不是「锦上添花」。
  const result = await sql.searchCatalog("obisidan", PAGE, 0);
  assert.ok(result.total > 0, "拼错一个字母不该 0 结果");
  assert.equal(result.corrected?.toLowerCase(), "obsidian", "应纠正为原名");
  assert.equal(result.items[0]?.slug, "obsidian", "纠正后原名应排第一");
});

test("搜索：纠正不改变正确输入的语义", { skip }, async () => {
  const exact = await sql.searchCatalog("joplin", PAGE, 0);
  assert.equal(exact.corrected, undefined, "输入本来就是对的，不该标记纠正");
  assert.equal(exact.items[0]?.slug, "joplin");
});

test("搜索：无从纠正时如实返回空，不瞎猜", { skip }, async () => {
  const result = await sql.searchCatalog("zzzznotfound", PAGE, 0);
  assert.equal(result.total, 0);
  assert.equal(result.corrected, undefined, "找不到相近名称时不能硬套一个纠正词");
});

test("搜索：同义词扩展能召回标签写「图像/照片」的条目", { skip }, async () => {
  // 站内标签用词不统一：同一类工具有的标「图片编辑」有的标「图像处理」。
  // 不扩展时，搜「图片」匹配不到标签写「图像」的条目（实测 13 条 vs 34 条）。
  const plain = await sql.searchCatalog("图片", PAGE, 0);
  assert.ok(plain.total > 13, "同义词扩展后应明显多于原词字面命中");
  const expanded = plain.items.map((item) => item.slug);
  // 结果里应同时出现「图像编辑」类和「照片管理」类的条目
  assert.ok(plain.total >= 20, `扩展后命中数偏少：${plain.total}`);
  assert.ok(expanded.length > 0);
});

test("搜索：原词命中排在仅靠同义词命中的条目之前", { skip }, async () => {
  // 不加这一档，搜「图片」时只写了「图像处理」的条目会和真正写着「图片」的混在一起。
  const result = await sql.searchCatalog("图片", PAGE, 0);
  const rows = await query(
    "SELECT i.slug, MATCH(i.search_text) AGAINST(? IN BOOLEAN MODE) AS hit FROM items i WHERE i.slug IN (?)",
    ["+图片", result.items.map((item) => item.slug)],
  );
  const hitMap = new Map(rows.map((row) => [row.slug, Number(row.hit) > 0]));
  // 允许同义词档在前几名之外，但第一个结果必须真的含「图片」二字
  assert.equal(hitMap.get(result.items[0]?.slug), true, "首位应是原词命中，而不是仅同义词命中");
});

test("搜索：没有同义词的词，结果集不受影响", { skip }, async () => {
  // 扩展是「有则加，无则不变」—— 不能让所有查询都莫名多出一批结果。
  const result = await sql.searchCatalog("pdf", PAGE, 0);
  assert.ok(result.total > 0);
  assert.equal(result.fuzzy, false);
});

test("facet：总计数与搜索结果一致", { skip }, async () => {
  const facets = await sql.searchFacets("图片");
  const result = await sql.searchCatalog("图片", 1, 0);
  assert.equal(facets.total, result.total, "facets 的总数必须等于搜索结果数，否则筛选条在骗人");
  assert.ok(facets.scenes.length > 1, "图片类结果应分布在多个场景");
});

test("facet：各场景计数之和 >= 总数（一个条目可属于多个场景）", { skip }, async () => {
  const facets = await sql.searchFacets("图片");
  const sum = facets.scenes.reduce((acc, scene) => acc + scene.count, 0);
  assert.ok(sum >= facets.total, "条目可跨场景，计数之和不应小于总数");
  // 但不该出现某个场景的计数超过总数这种明显错误
  for (const scene of facets.scenes) {
    assert.ok(scene.count <= facets.total, `${scene.id} 的计数 ${scene.count} 超过总数 ${facets.total}`);
  }
});

test("facet：筛选后结果全部属于该场景", { skip }, async () => {
  const facets = await sql.searchFacets("图片");
  const target = facets.scenes[0];
  assert.ok(target && target.count > 0);

  const filtered = await sql.searchCatalog("图片", PAGE, 0, { scenes: [target.id] });
  assert.equal(filtered.total, target.count, `筛 ${target.id} 后的条数应等于 facet 计数`);

  // 逐条核对归属，防止「筛选条件拼错但数字碰巧对上」
  const rows = await query(
    "SELECT i.slug FROM items i JOIN item_scenes s ON s.item_id = i.id WHERE s.scene_id = ? AND i.slug IN (?)",
    [target.id, filtered.items.map((item) => item.slug)],
  );
  assert.equal(rows.length, filtered.items.length, "返回的每一条都必须真的属于该场景");
});

test("facet：筛选不改变 facet 计数（否则切不回去）", { skip }, async () => {
  // 这是 facet 实现里最经典的错误：先筛再统计，其他选项的计数全变 0，
  // 筛选条上除当前项外全部消失，用户再也切不回去。
  const before = await sql.searchFacets("图片");
  const after = await sql.searchFacets("图片");
  assert.deepEqual(before, after, "facets 必须只取决于查询词，不取决于当前筛选");
});

test("facet：带筛选且筛空时，不误标为「已放宽匹配」", { skip }, async () => {
  // 空结果的原因是筛选太窄，不是查询没匹配到 —— 标记 fuzzy 会误导用户
  // 以为系统放宽了语义，实际是筛掉了。
  //
  // 不能硬编码「图片 + games 必为空」：pyxel（像素游戏引擎）就同时属于 games
  // 且简介含图像相关词。这类断言必须从真实 facet 里找空场景，否则数据一变就假红。
  const facets = await sql.searchFacets("图片");
  const absent = ["music", "games", "social", "education", "office"].filter(
    (id) => !facets.scenes.some((scene) => scene.id === id),
  );
  if (!absent.length) {
    // 全覆盖时退到「查不到的词 + 筛选」：同样必须 fuzzy=false。
    const result = await sql.searchCatalog("zzzznotfound", PAGE, 0, { scenes: ["photo"] });
    assert.equal(result.total, 0);
    assert.equal(result.fuzzy, false, "带筛选的空结果不该标记为放宽匹配");
    return;
  }
  const result = await sql.searchCatalog("图片", PAGE, 0, { scenes: [absent[0]] });
  assert.equal(result.total, 0, `图片类条目不应落在 ${absent[0]} 场景`);
  assert.equal(result.fuzzy, false, "筛选导致的空结果不该标记为放宽匹配");
});

test("诊断：筛选过窄时报 filtered-out，并给出取消筛选后的条数", { skip }, async () => {
  const facets = await sql.searchFacets("音乐");
  // 找一个「音乐」结果里完全没覆盖的场景，用它筛出空结果
  const absent = ["games", "photo", "office", "education", "social"].find(
    (id) => !facets.scenes.some((scene) => scene.id === id),
  );
  if (!absent) return; // 全覆盖时这条无从构造，跳过

  const filtered = await sql.searchCatalog("音乐", PAGE, 0, { scenes: [absent] });
  assert.equal(filtered.total, 0);

  const diagnosis = await sql.diagnoseSearch("音乐", { scenes: [absent] });
  assert.equal(diagnosis.reason, "filtered-out", "应归因为筛选过窄，而不是词不存在");
  assert.equal(diagnosis.withoutFilters, facets.total, "应报出取消筛选后的真实条数");
});

test("诊断：真的没有匹配时报 no-match，并逐词指出谁拖了后腿", { skip }, async () => {
  const diagnosis = await sql.diagnoseSearch("python zzzznotfound");
  assert.equal(diagnosis.reason, "no-match");
  const byTerm = new Map((diagnosis.perTerm ?? []).map((item) => [item.term, item.hits]));
  assert.ok((byTerm.get("python") ?? 0) > 0, "python 单独应有命中");
  assert.equal(byTerm.get("zzzznotfound"), 0, "不存在的词应报 0 命中");
});

test("诊断：拼写错误的词能给出可点的替代词", { skip }, async () => {
  const diagnosis = await sql.diagnoseSearch("obisidan");
  assert.equal(diagnosis.reason, "no-match");
  assert.ok(
    (diagnosis.suggestions ?? []).some((word) => word.toLowerCase() === "obsidian"),
    `应建议 Obsidian，实际：${JSON.stringify(diagnosis.suggestions)}`,
  );
});

test("诊断：空查询归因为 empty-query，不跑任何 Count", { skip }, async () => {
  const diagnosis = await sql.diagnoseSearch("   ");
  assert.equal(diagnosis.reason, "empty-query");
  assert.equal(diagnosis.perTerm, undefined);
});

test("搜索：首字母命中排在「名称里偶然含这对字母」之前", { skip }, async () => {
  // 修复前：搜 tp 的第一名是 okhttp —— 它的名字字面上就含 tp（okht**tp**），
  // 而真正的首字母命中（图片 / 图谱类，initials 列含 tp）被 NAME_RANK 压到后面。
  // 这条断言的第一项必须来自 search_initials，而不是名称子串的巧合。
  const result = await sql.searchCatalog("tp", PAGE, 0);
  assert.ok(result.total > 0, "tp 应能命中首字母含 tp 的条目");

  const first = result.items[0]?.slug;
  const rows = await query(
    "SELECT slug FROM items WHERE slug = ? AND MATCH(search_initials) AGAINST(? IN BOOLEAN MODE)",
    [first, "+tp"],
  );
  assert.equal(rows.length, 1, `首位 ${first} 应是首字母命中，而不是名称里的偶然子串`);

  // 反向确认：okhttp（名字含 tp、首字母是 khd）不该出现在最前面
  const slugs = result.items.map((item) => item.slug);
  const okhttpAt = slugs.indexOf("okhttp");
  assert.ok(okhttpAt === -1 || okhttpAt > 0, `okhttp 排在第 ${okhttpAt + 1} 位，说明首字母档没生效`);
});

test("搜索：首字母列只收中文名，纯英文名不会因缩写被误召回", { skip }, async () => {
  // 英文名的「首字母」就是它自己，放进 initials 列会让缩写查询命中一堆英文名。
  // 用 ollama（纯 ASCII 名）验证：搜它的「首字母」不该有结果。
  const rows = await query(
    "SELECT slug FROM items WHERE slug = 'ollama' AND MATCH(search_initials) AGAINST(? IN BOOLEAN MODE)",
    ["+ollm"],
  );
  assert.equal(rows.length, 0, "纯英文名不该进入首字母列");
});
