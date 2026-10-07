#!/usr/bin/env node
/**
 * 规模验证闸门。
 *
 * 整个迁移的理由是「条目会几何式增长」，但在真实数据涨起来之前，**没有数字能证明设计撑得住**。
 * 这个脚本往一个**隔离库**灌入 N 条合成数据，测代表性查询的耗时，并用 EXPLAIN 确认
 * 列表与搜索走的是索引，而不是退化成全表扫描。
 *
 * 用法：
 *   npm run scale:check                 默认 5000 条
 *   npm run scale:check -- --items 20000
 *   npm run scale:check -- --keep       保留数据，便于再做手工实验
 *
 * 需要 MYSQL_SCALE_URL（见 .env.example）。刻意不复用 MYSQL_URL —— 它会清空库。
 */
import { performance } from "node:perf_hooks";
import process from "node:process";

import mysql from "mysql2/promise";

import { persistCatalog } from "../lib/catalog-persist.ts";
import { catalogCountsSql, countCatalog, getSoftwareSql, queryCatalog, searchCatalog, sitemapPage } from "../lib/catalog-sql.ts";
import { closePool, connectionOptions } from "../lib/db.ts";
import { parseCatalogFilters } from "../lib/catalog-query.ts";
import { parseFlags } from "./_shared.mjs";

const SCENES = ["code", "docs", "design", "data", "office", "engineering", "tools", "games", "education", "music", "social"];
const PLATFORMS = ["windows", "macos", "linux"];
const FIXED = "2026-01-01T00:00:00.000Z";
const CHUNK = 500;

const NO_FILTERS = parseCatalogFilters({});

function filler(seed, paragraphs) {
  const sentence = "第 " + seed + " 条合成条目的正文段落，用来逼近真实条目的体量；这里刻意写成中文，以便同时检验 utf8mb4 与全文索引的表现。";
  return Array.from({ length: paragraphs }, (_, index) => sentence + "（段落 " + (index + 1) + "）").join("\n\n");
}

function makeItem(index) {
  const slug = "scale-" + String(index).padStart(6, "0");
  return {
    slug,
    name: "规模验证工具 " + index,
    aliases: ["scale " + index, "scaletool" + index],
    kind: "app",
    status: "published",
    source: "official",
    tags: ["规模", "标签" + (index % 20), "分类" + (index % 7)],
    summary: "第 " + index + " 条合成条目，用于验证目录在几何增长下的表现。含有常见词 markdown、编辑器、笔记，以及唯一串 uniq" + index + "。",
    body: filler(index, 12),
    scenes: [SCENES[index % SCENES.length]],
    platforms: [PLATFORMS[index % 3], PLATFORMS[(index + 1) % 3]],
    links: { official: "https://example.com/" + slug, github: "https://github.com/example/" + slug },
    tutorial: ["第一步：安装", "第二步：配置", "第三步：验证"],
    guide: {
      intro: "第 " + index + " 条的详细教程导读。",
      markdown: "## 配置\n\n" + filler(index, 8),
      resources: [{ kind: "pdf", title: "手册 " + index, url: "https://example.com/" + slug + ".pdf", note: "官方手册" }],
    },
    whoFor: "需要验证目录规模的人",
    whoNot: "只想要一条数据的人",
    alternatives: [],
    previews: [],
    icon: { letter: "S", color: "#123456" },
    createdAt: FIXED,
    updatedAt: FIXED,
  };
}

const time = async (label, work) => {
  const started = performance.now();
  const value = await work();
  return { label, ms: performance.now() - started, value };
};

async function main() {
  const args = parseFlags(process.argv.slice(2), { "--items": "number", "--keep": "bool" });
  const total = args.items ?? 5000;
  const scaleUrl = process.env.MYSQL_SCALE_URL?.trim();
  if (!scaleUrl) throw new Error("需要 MYSQL_SCALE_URL（规模验证会清空目标库，不能指向运行库）");
  // 必须在任何 getPool() 之前指向隔离库 —— 连接池缓存在 globalThis 上。
  process.env.MYSQL_URL = scaleUrl;

  const admin = await mysql.createConnection({ ...connectionOptions(), multipleStatements: true });
  try {
    const { readFileSync, readdirSync } = await import("node:fs");
    for (const file of readdirSync("db/migrations").filter((name) => name.endsWith(".sql")).sort()) {
      await admin.query(readFileSync("db/migrations/" + file, "utf8"));
    }
    const tables = ["item_tags", "item_scenes", "item_platforms", "item_alternatives", "item_links", "item_previews", "item_guide_resources", "items", "audit_log", "clicks", "feedback", "submissions", "ip_blocks", "users"];
    // TRUNCATE 会被外键挡下（子表引用 items），会话级关掉外键检查再清。
    await admin.query("SET FOREIGN_KEY_CHECKS = 0");
    for (const table of tables) await admin.query("TRUNCATE TABLE " + table);
    await admin.query("SET FOREIGN_KEY_CHECKS = 1");
  } finally {
    await admin.end();
  }

  console.log("[scale] 目标库：" + new URL(scaleUrl).pathname.slice(1) + " · 计划灌入 " + total + " 条");
  const loadStarted = performance.now();
  for (let start = 0; start < total; start += CHUNK) {
    const batch = Array.from({ length: Math.min(CHUNK, total - start) }, (_, offset) => makeItem(start + offset));
    const conn = await mysql.createConnection({ ...connectionOptions() });
    try {
      await conn.beginTransaction();
      await persistCatalog(conn, batch, { prune: false });
      await conn.commit();
    } finally {
      await conn.end();
    }
    if ((start / CHUNK) % 4 === 0) process.stdout.write(".");
  }
  const loadMs = performance.now() - loadStarted;
  console.log("\n[scale] 灌入完成，用时 " + (loadMs / 1000).toFixed(1) + " s（含每条的子表写入）");

  const victim = "scale-000001";
  const results = [];
  results.push(await time("首页列表（第 1 页）", () => queryCatalog(NO_FILTERS, 60, 0)));
  results.push(await time("深分页（第 50 页）", () => queryCatalog(NO_FILTERS, 60, 60 * 49)));
  results.push(await time("按场景筛选", () => queryCatalog(parseCatalogFilters({ scene: "code" }), 60, 0)));
  results.push(await time("组合筛选", () => queryCatalog(parseCatalogFilters({ scene: "code", platform: "windows", kind: "app" }), 60, 0)));
  results.push(await time("总数计数", () => countCatalog(NO_FILTERS)));
  results.push(await time("聚合计数（根布局每页都用）", () => catalogCountsSql()));
  results.push(await time("全文搜索（常见词）", () => searchCatalog("markdown", 60, 0)));
  results.push(await time("全文搜索（唯一串）", () => searchCatalog("uniq1234", 60, 0)));
  results.push(await time("全文搜索（单字，走 LIKE 兜底）", () => searchCatalog("图", 60, 0)));
  results.push(await time("详情单条", () => getSoftwareSql(victim)));
  results.push(await time("站点地图分片（全量 5 万上限）", () => sitemapPage(0, 50000)));

  const { saveItem } = await import("../lib/store-sql.ts");
  results.push(await time("单条写入（原子 + 乐观锁）", () => saveItem(makeItem(total + 1))));

  console.log("\n[scale] 查询耗时：");
  for (const result of results) {
    console.log("  " + result.label.padEnd(30) + result.ms.toFixed(1).padStart(8) + " ms");
  }

  // EXPLAIN：确认列表与搜索走索引，而不是全表扫描。
  const conn = await mysql.createConnection({ ...connectionOptions() });
  try {
    const [listPlan] = await conn.query(
      "EXPLAIN SELECT id FROM items i WHERE i.status = 'published' ORDER BY i.featured DESC, i.sort_index ASC, i.id ASC LIMIT 60",
    );
    const [searchPlan] = await conn.query(
      "EXPLAIN SELECT id FROM items i WHERE i.status = 'published' AND MATCH(i.search_text) AGAINST('+markdown' IN BOOLEAN MODE) LIMIT 60",
    );
    console.log("\n[scale] EXPLAIN：");
    console.log("  列表 → type=" + listPlan[0].type + " key=" + (listPlan[0].key ?? "(无)") + " rows=" + listPlan[0].rows);
    console.log("  搜索 → type=" + searchPlan[0].type + " key=" + (searchPlan[0].key ?? "(无)") + " rows=" + searchPlan[0].rows);
    if (!listPlan[0].key) throw new Error("列表查询没有走索引 —— 规模上会全表扫描");
    if (!searchPlan[0].key) throw new Error("搜索没有走全文索引");
  } finally {
    await conn.end();
  }

  const slowest = results.reduce((worst, result) => (result.ms > worst.ms ? result : worst));
  console.log("\n[scale] 最慢一项：" + slowest.label + " " + slowest.ms.toFixed(1) + " ms");

  if (!args.keep) {
    const cleanup = await mysql.createConnection({ ...connectionOptions(), multipleStatements: true });
    try {
      await cleanup.query("SET FOREIGN_KEY_CHECKS = 0");
      for (const table of ["item_tags", "item_scenes", "item_platforms", "item_alternatives", "item_links", "item_previews", "item_guide_resources", "items"]) {
        await cleanup.query("TRUNCATE TABLE " + table);
      }
      await cleanup.query("SET FOREIGN_KEY_CHECKS = 1");
    } finally {
      await cleanup.end();
    }
    console.log("[scale] 已清空合成数据（--keep 可保留）");
  }
  await closePool();
}

main().catch(async (error) => {
  await closePool().catch(() => {});
  console.error("[scale] 失败：" + (error && error.message ? error.message : error));
  process.exitCode = 1;
});
