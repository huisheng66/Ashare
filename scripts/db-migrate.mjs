#!/usr/bin/env node
/**
 * 执行 db/migrations/*.sql，并把已应用的版本记进 schema_migrations。
 *
 * 为什么不用事务包住整份迁移：MySQL 的 DDL 会隐式提交，事务保护不了
 * CREATE TABLE / ALTER TABLE。因此约定每个迁移都必须可重复执行
 * （CREATE TABLE IF NOT EXISTS、加列前先判断），失败后修好再跑是安全的。
 * 版本行的写入时机是整份文件执行成功之后。
 *
 * 用法：
 *   npm run db:migrate             应用未执行的迁移
 *   npm run db:migrate -- --list   只列出迁移与状态
 *   npm run db:migrate -- --dry-run
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";

import mysql from "mysql2/promise";

import { migrationConnectionOptions } from "../lib/db.ts";
import { parseFlags } from "./_shared.mjs";

const DIR = path.join(process.cwd(), "db", "migrations");
const FILE_PATTERN = /^[0-9]{4}_[a-z0-9-]+\.sql$/;

const BOOTSTRAP = [
  "CREATE TABLE IF NOT EXISTS schema_migrations (",
  "  version VARCHAR(64) NOT NULL,",
  "  applied_at DATETIME(3) NOT NULL,",
  "  PRIMARY KEY (version)",
  ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci",
].join("\n");

async function migrationFiles() {
  let names;
  try {
    names = await fs.readdir(DIR);
  } catch (error) {
    if (error.code === "ENOENT") throw new Error("db/migrations 目录不存在");
    throw error;
  }
  const files = names.filter((name) => FILE_PATTERN.test(name)).sort();
  if (!files.length) throw new Error("db/migrations 下没有迁移文件");
  return files.map((name) => ({ file: name, version: name.replace(/\.sql$/, "") }));
}

async function main() {
  const args = parseFlags(process.argv.slice(2), { "--list": "bool", "--dry-run": "bool" });
  const migrations = await migrationFiles();
  const conn = await mysql.createConnection({ ...migrationConnectionOptions(), multipleStatements: true });
  try {
    await conn.query(BOOTSTRAP);
    const [rows] = await conn.query("SELECT version FROM schema_migrations");
    const applied = new Set(rows.map((row) => row.version));

    if (args.help || args.list) {
      for (const migration of migrations) {
        console.log((applied.has(migration.version) ? "  applied  " : "  pending  ") + migration.version);
      }
      return;
    }

    let ran = 0;
    for (const migration of migrations) {
      if (applied.has(migration.version)) {
        console.log("[db] skip   " + migration.version);
        continue;
      }
      if (args.dryRun) {
        console.log("[db] dry-run 将应用 " + migration.version);
        continue;
      }
      const sql = await fs.readFile(path.join(DIR, migration.file), "utf8");
      process.stdout.write("[db] apply  " + migration.version + " ... ");
      await conn.query(sql);
      await conn.query("INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)", [migration.version, new Date()]);
      console.log("ok");
      ran += 1;
    }
    console.log("[db] 完成：新应用 " + ran + " 个，共 " + migrations.length + " 个迁移文件，此前已应用 " + applied.size + " 个");
  } finally {
    await conn.end();
  }
}

main().catch((error) => {
  console.error("[db] 失败：" + (error && error.message ? error.message : error));
  process.exitCode = 1;
});
