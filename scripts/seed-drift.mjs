#!/usr/bin/env node
/**
 * 运行库与种子的漂移检查：确认「两个落点」真的写到了同一份内容。
 *
 *   node scripts/seed-drift.mjs           列出不一致的条目
 *   node scripts/seed-drift.mjs --strict  有不一致时以非零码退出（用于 CI / 收录收尾）
 *
 * 只做一件事：把种子经 seedToItem() 转换后，与 data/store/catalog.json 的条目逐字段比对。
 * 运行库是线上真实数据，种子只影响全新部署——两边不一致意味着重建后会丢内容或退回旧版。
 *
 * 注意：后台里手工改过的条目会合法地偏离种子，这类需要人工判断是「补回种子」还是「接受差异」。
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";

import { samples } from "../data/samples.ts";
import { software as seed } from "../data/software.ts";
import { seedToItem } from "../lib/seed.ts";

const CATALOG = path.join(process.cwd(), "data", "store", "catalog.json");
const COMPARE = ["summary", "body", "tags", "aliases", "links", "kind", "source", "price", "scenes", "platforms"];
const strict = process.argv.includes("--strict");

const show = (value) =>
  Array.isArray(value) ? `[${value.join(", ")}]`
    : value && typeof value === "object" ? JSON.stringify(value)
      : value === undefined ? "(空)" : String(value);

const catalog = JSON.parse(await fs.readFile(CATALOG, "utf8"));
const fromSeed = [...seed.map(seedToItem), ...samples];

const drifts = [];
const onlyInStore = [];
for (const item of catalog) {
  const seedItem = fromSeed.find((entry) => entry.slug === item.slug);
  if (!seedItem) {
    onlyInStore.push(item.slug);
    continue;
  }
  const diffs = [];
  for (const field of COMPARE) {
    const a = show(item[field]);
    const b = show(seedItem[field]);
    if (a !== b) diffs.push(`${field}：运行库 ${a} ≠ 种子 ${b}`);
  }
  if (diffs.length) drifts.push({ slug: item.slug, diffs });
}

const seedOnly = fromSeed.filter((entry) => !catalog.some((item) => item.slug === entry.slug)).map((e) => e.slug);

console.log(`运行库 ${catalog.length} 条，种子 ${fromSeed.length} 条`);
console.log(`内容不一致 ${drifts.length} 条，仅在运行库 ${onlyInStore.length} 条，仅在种子 ${seedOnly.length} 条\n`);

for (const drift of drifts) {
  console.log(`不一致 ${drift.slug}`);
  for (const diff of drift.diffs) console.log(`   ${diff}`);
}
if (onlyInStore.length) console.log(`\n仅存在于运行库（种子里没有，全新部署会缺失）：${onlyInStore.join("、")}`);
if (seedOnly.length) console.log(`\n仅存在于种子（运行库里没有，前台看不到）：${seedOnly.join("、")}`);

const problems = drifts.length + onlyInStore.length + seedOnly.length;
if (!problems) console.log("两个落点完全一致。");
else console.log(`\n共 ${problems} 处需要处理。`);
if (strict && problems) process.exitCode = 1;
