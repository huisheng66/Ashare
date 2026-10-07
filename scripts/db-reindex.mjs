#!/usr/bin/env node
/**
 * 重建目录的全文索引，并在动手前检查停用词配置。
 *
 * 为什么需要它：ngram 的 token 是**插入时**按当时的停用词表生成的。把
 * innodb_ft_server_stopword_table 换成空表之后，已有行仍然是旧 token，
 * 必须重建索引，否则「配置对了但搜不到」这种最难查的状态会一直挂着。
 *
 * 配置不对时**拒绝执行**而不是照常重建：默认停用词表含单字母 a/i，
 * 会让含 a/i 的英文词搜不到（git / figma / kicad），这必须是响亮的失败。
 *
 * 用法：
 *   npm run db:reindex            检查配置并重建
 *   npm run db:reindex -- --check 只检查，不重建
 */
import process from "node:process";

import mysql from "mysql2/promise";

import { migrationConnectionOptions } from "../lib/db.ts";
import { parseFlags } from "./_shared.mjs";

const INDEX = "ft_items_search";

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

    const [indexRows] = await conn.query(
      "SELECT COUNT(*) AS c FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'items' AND INDEX_NAME = ?",
      [INDEX],
    );
    if (args.check) {
      console.log("[db:reindex] --check：配置可用，索引" + (Number(indexRows[0].c) ? "存在" : "缺失"));
      return;
    }

    console.log("[db:reindex] 重建 " + INDEX + " …");
    if (Number(indexRows[0].c)) await conn.query("ALTER TABLE items DROP INDEX " + INDEX);
    await conn.query("ALTER TABLE items ADD FULLTEXT KEY " + INDEX + " (search_text) WITH PARSER ngram");
    console.log("[db:reindex] 完成。索引 token 现在按空停用词表生成。");
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error("[db:reindex] 失败：" + (error && error.message ? error.message : error));
  process.exitCode = 1;
});
