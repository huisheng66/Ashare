#!/usr/bin/env node
/**
 * 重建目录的全文索引、回填派生列，并在动手前检查停用词配置。
 *
 * 为什么需要它：ngram 的 token 是**插入时**按当时的停用词表生成的。把
 * innodb_ft_server_stopword_table 换成空表之后，已有行仍然是旧 token，
 * 必须重建索引，否则「配置对了但搜不到」这种最难查的状态会一直挂着。
 *
 * 配置不对时**拒绝执行**而不是照常重建：默认停用词表含单字母 a/i，
 * 会让含 a/i 的英文词搜不到（git / figma / kicad），这必须是响亮的失败。
 *
 * 本脚本同时负责回填 search_pinyin（迁移 0007 只加列不填值）。
 * **顺序不能反**：索引里的 token 取决于插入/更新时该列的内容，
 * 必须先 UPDATE 出值，再重建索引，否则索引里是空的。
 * 回填读的是**数据库当前行**而不是种子文件 —— 后台编辑过的条目也要覆盖到。
 *
 * 用法：
 *   npm run db:reindex            检查配置、回填 search_pinyin、重建两个索引
 *   npm run db:reindex -- --check 只检查，不写任何东西
 */
import process from "node:process";

import mysql from "mysql2/promise";

import { searchPinyinOf } from "../lib/catalog-rows.ts";
import { migrationConnectionOptions } from "../lib/db.ts";
import { parseFlags } from "./_shared.mjs";

const SEARCH_INDEX = "ft_items_search";
const PINYIN_INDEX = "ft_items_pinyin";

async function indexExists(conn, name) {
  const [rows] = await conn.query(
    "SELECT COUNT(*) AS c FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'items' AND INDEX_NAME = ?",
    [name],
  );
  return Number(rows[0].c) > 0;
}

/**
 * 回填 search_pinyin。基于数据库现有行计算，保证覆盖后台新建/编辑的条目。
 * 只传 searchPinyinOf 真正读取的三个字段，避免构造完整 Software。
 */
async function backfillPinyin(conn) {
  const [rows] = await conn.query("SELECT slug, name, name_zh, aliases FROM items");
  let filled = 0;
  for (const row of rows) {
    let aliases = [];
    try {
      aliases = JSON.parse(String(row.aliases) || "[]");
    } catch {
      aliases = [];
    }
    const value =
      searchPinyinOf({
        name: String(row.name ?? ""),
        nameZh: row.name_zh == null ? "" : String(row.name_zh),
        aliases: Array.isArray(aliases) ? aliases : [],
      }) || null;
    await conn.query("UPDATE items SET search_pinyin = ? WHERE slug = ?", [value, String(row.slug)]);
    filled += 1;
  }
  return filled;
}

async function main() {
  const args = parseFlags(process.argv.slice(2), { "--check": "bool" });
  const conn = await mysql.createConnection({ ...migrationConnectionOptions() });
  try {
    const [rows] = await conn.query(
      "SELECT @@innodb_ft_server_stopword_table AS server_table, @@innodb_ft_user_stopword_table AS user_table",
    );
    const serverTable = rows[0].server_table ? String(rows[0].server_table) : "";
    const userTable = rows[0].user_table ? String(rows[0].user_table) : "";
    // user 优先于 server；两个都空表示回落到内置英文表，也就是坏配置。
    const effective = userTable || serverTable;

    const [stopRows] = await conn.query("SELECT COUNT(*) AS c FROM ft_stopwords");
    const stopwordCount = Number(stopRows[0].c);

    console.log("[db:reindex] 生效的停用词表：" + (effective || "（内置默认表 —— 不可接受）"));
    console.log("[db:reindex] ft_stopwords 行数：" + stopwordCount);

    if (!effective) {
      throw new Error(
        "停用词表仍是内置默认表。它含单字母 a/i，会使 git、figma、kicad 这类词搜不到。\n" +
          "  请先在服务器上设置（写进 my.cnf 后重启，需要管理员权限）：\n" +
          "    innodb_ft_server_stopword_table=ashare/ft_stopwords\n" +
          "  再运行 npm run db:reindex。",
      );
    }
    if (stopwordCount !== 0) {
      throw new Error("ft_stopwords 必须是空表，当前有 " + stopwordCount + " 行");
    }

    const hasSearch = await indexExists(conn, SEARCH_INDEX);
    const hasPinyin = await indexExists(conn, PINYIN_INDEX);
    const [nullRows] = await conn.query("SELECT COUNT(*) AS c FROM items WHERE search_pinyin IS NULL OR search_pinyin = ''");

    if (args.check) {
      console.log(
        "[db:reindex] --check：配置可用；" +
          SEARCH_INDEX + (hasSearch ? " 存在" : " 缺失") +
          "；" + PINYIN_INDEX + (hasPinyin ? " 存在" : " 缺失") +
          "；search_pinyin 为空的行数 " + Number(nullRows[0].c),
      );
      return;
    }

    console.log("[db:reindex] 回填 search_pinyin …");
    const filled = await backfillPinyin(conn);
    console.log("[db:reindex] 已回填 " + filled + " 行");

    // 索引缺失才补建（正常由迁移负责）；存在与否都要走下面的 OPTIMIZE 重建 token。
    if (!hasSearch) {
      await conn.query("ALTER TABLE items ADD FULLTEXT KEY " + SEARCH_INDEX + " (search_text) WITH PARSER ngram");
    }
    if (!hasPinyin) {
      await conn.query("ALTER TABLE items ADD FULLTEXT KEY " + PINYIN_INDEX + " (search_pinyin) WITH PARSER ngram");
    }

    /**
     * 用 OPTIMIZE TABLE 重建，而不是 DROP INDEX + ADD INDEX。
     *
     * 实测（MySQL 8.0.46）：`ALTER TABLE ... DROP INDEX` / `ADD FULLTEXT INDEX` **不会**
     * 按当前停用词表重新生成 ngram token —— 换到空停用词表后重建，含 a/i 的 token 依然缺失
     * （搜 'af'/'an' 恒为 0，索引里没有 a 开头的 token）。而 `OPTIMIZE TABLE`（内部是
     * recreate + analyze）之后立刻恢复：a 开头的 token 重新出现、'af' 能命中 darktable。
     * 所以这里必须 OPTIMIZE；只 DROP/ADD 会让「配置对了但搜不到」继续挂着。
     */
    console.log("[db:reindex] 重建索引 token（OPTIMIZE TABLE）…");
    await conn.query("OPTIMIZE TABLE items");

    console.log("[db:reindex] 完成。索引 token 现在按空停用词表生成，search_pinyin 已回填。");
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error("[db:reindex] 失败：" + (error && error.message ? error.message : error));
  process.exitCode = 1;
});
