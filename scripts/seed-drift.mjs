#!/usr/bin/env node
/**
 * 运行库与种子的漂移检查：确认「两个落点」真的写到了同一份内容。
 *
 *   node scripts/seed-drift.mjs           列出不一致的条目
 *   node scripts/seed-drift.mjs --strict  有不一致时以非零码退出（用于 CI / 收录收尾）
 *
 * 只做一件事：把种子经 seedToItem() 转换后，与**运行库**（MYSQL_URL 时读 MySQL，否则读 JSON）
 * 的条目逐字段比对。
 * 运行库是线上真实数据，种子只影响全新部署——两边不一致意味着重建后会丢内容或退回旧版。
 *
 * 注意：后台里手工改过的条目会合法地偏离种子，这类需要人工判断是「补回种子」还是「接受差异」。
 */
import process from "node:process";

import { samples } from "../data/samples.ts";
import { software as seed } from "../data/software.ts";
import { normalizeGuide } from "../lib/guide.ts";
import { SEED_DRIFT_FIELDS, seedToItem } from "../lib/seed.ts";
import { readCatalog } from "./_shared.mjs";
// 比对字段**不再手写**：从 lib/seed.ts 的登记表取。
// 手写清单漏字段 = 对该字段静默失明（本项目踩过两次：linksCheckedAt、guide）。
const COMPARE = SEED_DRIFT_FIELDS;
const strict = process.argv.includes("--strict");

/**
 * 归一化后再比对。要同时解决两件事：
 *
 * 1. **键顺序**：DB 往返会重排 links 的键（diskSha256/diskFile 先后不同），
 *    直接 JSON.stringify 会报假漂移。
 * 2. **「缺省」与「显式空值」是同一件事**：可选字段为 false / [] / "" 等价于不存在。
 *    实测 featured 就是这样：运行库把它省略，种子写着 false —— 语义相同却被报成不一致。
 *    一个会误报的漂移检查比没有更糟，它训练人忽略它。
 */
const canonical = (value) => {
  if (value === undefined || value === null || value === false || value === "") return null;
  if (Array.isArray(value)) return value.length ? value.map(canonical) : null;
  if (typeof value === "object") {
    const entries = Object.keys(value).sort()
      .map((key) => [key, canonical(value[key])])
      .filter(([, inner]) => inner !== null);
    return entries.length ? Object.fromEntries(entries) : null;
  }
  return value;
};

const show = (value) => {
  const normalized = canonical(value);
  return normalized === null ? "(空)" : JSON.stringify(normalized);
};

const catalog = await readCatalog();
// guide 必须先过 normalizeGuide —— 同步脚本写的就是归一化后的值。
// 不比归一化就比对，会得到「漂移说 55 条不一致、同步说已是最新」的甩锅现场。
const fromSeed = [...seed.map(seedToItem), ...samples].map((entry) =>
  entry.guide ? { ...entry, guide: normalizeGuide(entry.guide) ?? undefined } : entry,
);

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
