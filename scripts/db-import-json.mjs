#!/usr/bin/env node
/**
 * 把本机 JSON 运行库导入 MySQL（P3 的 ETL，可重复执行）。
 *
 * 目录写入走 lib/catalog-persist.ts，附件写入走 lib/store-sql.ts —— 与应用共用同一份实现。
 * 本脚本刻意不自己写任何 items / feedback / submissions / ip_blocks 的 SQL：
 * 有两份实现就迟早分叉成「导入的形态」与「读出的形态」不一致。
 *
 * 输入：data/store/{catalog,feedback,submissions,blocks}.json 与 clicks.jsonl。
 * 缺失的文件按「没有这份数据」处理 —— 全新部署本来就没有 feedback / submissions / blocks。
 *
 * 为什么默认镜像：本脚本的职责是让数据库等于当前运行库；留着 JSON 里没有的条目，
 * db:verify 的比对就失去意义。要保留多余条目请加 --no-prune。
 *
 * --dry-run 只回滚目录事务，并跳过附件与点击（什么都不落库）。
 * 正式执行时目录先提交，附件随后写入；中途失败重跑即可，各步骤都幂等。
 *
 * 用法：
 *   npm run db:import [-- --dry-run] [--no-prune] [--force-clicks]
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";

import mysql from "mysql2/promise";

import { persistCatalog } from "../lib/catalog-persist.ts";
import { closePool, connectionOptions } from "../lib/db.ts";
import { normalizeItems } from "../lib/normalize.ts";
import * as store from "../lib/store-sql.ts";
import { parseFlags } from "./_shared.mjs";

const STORE = path.join(process.cwd(), "data", "store");

async function readJson(name) {
  try {
    return JSON.parse(await fs.readFile(path.join(STORE, name + ".json"), "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function readClicks() {
  try {
    const text = await fs.readFile(path.join(STORE, "clicks.jsonl"), "utf8");
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line))
      .filter((click) => typeof click.slug === "string" && typeof click.channel === "string");
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function main() {
  const args = parseFlags(process.argv.slice(2), {
    "--dry-run": "bool",
    "--no-prune": "bool",
    "--force-clicks": "bool",
  });

  const rawCatalog = await readJson("catalog");
  if (!Array.isArray(rawCatalog)) {
    throw new Error("data/store/catalog.json 不存在或不是数组。先启动一次应用生成运行库。");
  }
  const catalog = normalizeItems(rawCatalog, (await fs.stat(path.join(STORE, "catalog.json"))).mtime);
  const feedback = await readJson("feedback");
  const submissions = await readJson("submissions");
  const blocks = await readJson("blocks");
  const clicks = await readClicks();

  const skipped = [];
  const conn = await mysql.createConnection({ ...connectionOptions() });
  try {
    await conn.beginTransaction();
    const stats = await persistCatalog(conn, catalog, { prune: !args.noPrune });
    if (args.dryRun) {
      await conn.rollback();
      console.log("[db:import] --dry-run，目录事务已回滚（附件与点击未处理）");
      console.log("[db:import] 目录 items " + stats.items + " · 清理多余 " + stats.pruned);
      return;
    }
    await conn.commit();
    console.log("[db:import] 目录 items " + stats.items + " · 清理多余 " + stats.pruned);
  } catch (error) {
    await conn.rollback().catch(() => {});
    throw error;
  } finally {
    await conn.end();
  }

  let extra = "";
  if (Array.isArray(feedback)) {
    await store.updateFeedback(() => feedback);
    extra += " · feedback " + feedback.length;
  } else skipped.push("feedback.json 不存在");
  if (Array.isArray(submissions)) {
    await store.updateSubmissions(() => submissions);
    extra += " · submissions " + submissions.length;
  } else skipped.push("submissions.json 不存在");
  if (blocks && typeof blocks === "object" && !Array.isArray(blocks)) {
    await store.updateBlocks(() => blocks);
    extra += " · ip_blocks " + Object.keys(blocks).length;
  } else skipped.push("blocks.json 不存在");

  if (clicks) {
    const conn2 = await mysql.createConnection({ ...connectionOptions() });
    try {
      const [counted] = await conn2.query("SELECT COUNT(*) AS c FROM clicks");
      if (Number(counted[0].c) === 0 || args.forceClicks) {
        for (const click of clicks) {
          await conn2.query("INSERT INTO clicks (slug, channel, at) VALUES (?, ?, ?)", [click.slug, click.channel, new Date(click.at)]);
        }
        extra += " · clicks " + clicks.length;
      } else {
        skipped.push("clicks 表非空（" + counted[0].c + " 行），未导入 " + clicks.length + " 条历史点击；要追加请加 --force-clicks");
      }
    } finally {
      await conn2.end();
    }
  } else skipped.push("clicks.jsonl 不存在");

  console.log("[db:import] 附件" + (extra || "（无）"));
  for (const note of skipped) console.log("[db:import] 跳过：" + note);
}

main()
  .then(() => closePool())
  .catch(async (error) => {
    await closePool().catch(() => {});
    console.error("[db:import] 失败：" + (error && error.message ? error.message : error));
    process.exitCode = 1;
  });
