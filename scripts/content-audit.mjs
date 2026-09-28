#!/usr/bin/env node
/**
 * 内容完整度审计：把「内容债」列成可执行清单。
 *
 *   node scripts/content-audit.mjs            默认列出最需要补的 15 条
 *   node scripts/content-audit.mjs --top 40   调整条数
 *   node scripts/content-audit.mjs --scene engineering   只看某个场景的待补条目
 *   node scripts/content-audit.mjs --json     机器可读输出
 *
 * 只读 data/store/catalog.json（运行库），不修改任何数据。
 * 运行库不存在时先启动一次应用（`npm run dev`），由种子生成。
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import { parseFlags, readCatalog } from "./_shared.mjs";

const USAGE = "用法: node scripts/content-audit.mjs [--top <条数>] [--scene <id>] [--json]";

/** 每项给出缺失时的扣分：越影响「详情页能不能说服人」权重越高。 */
const CHECKS = [
  { key: "body", label: "详细介绍", weight: 5, empty: (item) => !item.body?.trim() },
  { key: "tags", label: "标签", weight: 3, empty: (item) => !item.tags?.length },
  { key: "whoFor", label: "适合", weight: 3, empty: (item) => !item.whoFor?.trim() },
  { key: "whoNot", label: "不适合", weight: 2, empty: (item) => !item.whoNot?.trim() },
  { key: "alternatives", label: "同类替代", weight: 2, empty: (item) => !item.alternatives?.length },
  { key: "official", label: "官网链接", weight: 2, empty: (item) => !item.links?.official && !item.links?.github },
  { key: "previews", label: "预览图", weight: 1, empty: (item) => !item.previews?.length },
  { key: "tutorial", label: "使用教程", weight: 1, empty: (item) => !item.tutorial?.length },
];

const SCENE_MIN_STOCK = 3;

function parseArgs(argv) {
  const args = parseFlags(argv, { "--top": "number", "--scene": "value", "--json": "bool" });
  if (args.top !== undefined && (!Number.isInteger(args.top) || args.top < 1)) {
    throw new Error("--top 需为不小于 1 的整数");
  }
  args.top ??= 15;
  args.scene ??= "";
  return args;
}

function audit(items) {
  return items.map((item) => {
    const missing = CHECKS.filter((check) => check.empty(item)).map((check) => check.label);
    const score = CHECKS.filter((check) => check.empty(item)).reduce((sum, check) => sum + check.weight, 0);
    // 带上 scenes / primary：按场景分批补内容时，--json 要能直接筛出某一场景的待补条目；
    // primary 是 scenes[0]，跨场景条目按它归属，避免两边都跳过、永远轮不到。
    return {
      slug: item.slug, name: item.name, status: item.status,
      scenes: item.scenes ?? [], primary: (item.scenes ?? [])[0] ?? "",
      missing, score,
    };
  }).sort((a, b) => b.score - a.score || a.slug.localeCompare(b.slug));
}

function sceneCoverage(items, scenes) {
  return scenes.map((scene) => ({
    id: scene.id,
    name: scene.name,
    total: items.filter((item) => item.scenes?.includes(scene.id)).length,
    published: items.filter((item) => item.status === "published" && item.scenes?.includes(scene.id)).length,
  }));
}

async function readScenes() {
  // data/scenes.ts 是 TS 源码，这里只取 id/name 两个字段，避免引入编译步骤。
  const source = await fs.readFile(path.join(process.cwd(), "data", "scenes.ts"), "utf8");
  const scenes = [];
  const pattern = /id:\s*"([a-z]+)",\s*\n\s*name:\s*"([^"]+)"/g;
  let match;
  while ((match = pattern.exec(source)) !== null) scenes.push({ id: match[1], name: match[2] });
  return scenes;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(USAGE);
    return;
  }

  let items;
  try {
    items = await readCatalog();
  } catch (error) {
    if (error.code === "ENOENT") {
      console.error("data/store/catalog.json 不存在。先启动一次应用（npm run dev）生成运行库。");
      process.exitCode = 1;
      return;
    }
    throw error;
  }
  if (!Array.isArray(items)) throw new Error("catalog.json 必须是数组");
  const scenes = await readScenes();
  // --scene 用于「一次只做一批」的节奏：只收窄统计与待补清单；
  // 场景库存始终按全量算，否则会显示出「其他场景 0 条」这种误导数字。
  const scoped = args.scene ? items.filter((item) => (item.scenes ?? []).includes(args.scene)) : items;
  if (args.scene && !scoped.length) throw new Error(`没有属于场景 ${args.scene} 的条目。可用 id：${scenes.map((s) => s.id).join(" ")}`);

  const published = scoped.filter((item) => item.status === "published");
  const rows = audit(scoped);
  const coverage = sceneCoverage(items, scenes);

  const fieldStats = CHECKS.map((check) => ({
    label: check.label,
    missing: scoped.filter((item) => check.empty(item)).length,
  }));
  const emptyScenes = coverage.filter((scene) => scene.published === 0);
  const thinScenes = coverage.filter((scene) => scene.published > 0 && scene.published < SCENE_MIN_STOCK);

  if (args.json) {
    console.log(JSON.stringify({
      total: items.length,
      published: published.length,
      draft: scoped.length - published.length,
      fieldStats,
      emptyScenes: emptyScenes.map((scene) => scene.id),
      thinScenes: thinScenes.map((scene) => ({ id: scene.id, published: scene.published })),
      items: rows,
    }, null, 2));
    return;
  }

  const scopeNote = args.scene ? `（场景 ${args.scene}）` : "";
  console.log(`条目 ${scoped.length} 条${scopeNote}（已发布 ${published.length}，草稿 ${scoped.length - published.length}）\n`);
  console.log("缺失字段统计");
  for (const stat of fieldStats) {
    const bar = "#".repeat(Math.round((stat.missing / scoped.length) * 20));
    console.log(`  ${stat.label.padEnd(6, "　")} ${String(stat.missing).padStart(3)} / ${scoped.length}  ${bar}`);
  }

  console.log("\n场景库存（低于 3 条视为开栏不足）");
  for (const scene of coverage) {
    const flag = scene.published === 0 ? "空" : scene.published < SCENE_MIN_STOCK ? "薄" : "　";
    console.log(`  ${flag}  ${scene.name.padEnd(6, "　")} ${scene.published} 条`);
  }

  const needing = rows.filter((row) => row.missing.length);
  console.log(`\n待补条目（按缺口排序，显示前 ${Math.min(args.top, needing.length)} / ${needing.length} 条）`);
  for (const row of needing.slice(0, args.top)) {
    const flag = row.status === "draft" ? "草稿 " : "　　 ";
    // 主场景不是当前场景的条目标注出来：它们迟早会在自己所属的那批里被清掉。
    const owner = args.scene && row.primary && row.primary !== args.scene ? `（主场景 ${row.primary}）` : "";
    console.log(`  ${row.slug.padEnd(14)} ${flag}缺：${row.missing.join("、")}${owner}`);
  }

  const nextActions = [];
  if (fieldStats[0].missing) nextActions.push(`补 ${fieldStats[0].missing} 条「详细介绍」——搜索正文命中、详情页说服力、SEO 同时受益`);
  if (emptyScenes.length) nextActions.push(`${emptyScenes.length} 个空场景（${emptyScenes.map((s) => s.name).join("、")}）：导航标灰或先补库存`);
  if (thinScenes.length) nextActions.push(`${thinScenes.length} 个场景不足 ${SCENE_MIN_STOCK} 条：${thinScenes.map((s) => s.name).join("、")}`);
  if (!nextActions.length) nextActions.push("当前条目字段完整，可以推进下一步：来源核验时间或录入自动化");
  // 建议下一批：按「一批一个场景」的节奏，挑主场景待补最多的那个场景。
  if (!args.scene) {
    // 只按「正文 / 标签」这类真能补的内容债来推荐；预览图是全站缺失的已知项，参与排序只会干扰。
    const contentDebt = needing.filter((row) => row.missing.includes("详细介绍") || row.missing.includes("标签"));
    let best = null;
    for (const scene of scenes) {
      const candidates = contentDebt.filter((row) => row.primary === scene.id);
      if (candidates.length && (!best || candidates.length > best.rows.length)) best = { scene, rows: candidates };
    }
    if (best) {
      nextActions.push(`建议下一批：${best.scene.name}（主场景待补 ${best.rows.length} 条）——先做 ${best.rows.slice(0, 3).map((r) => r.slug).join("、")}`);
    }
  }
  console.log("\n建议动作");
  for (const action of nextActions) console.log(`  - ${action}`);
}

main().catch((error) => {
  console.error(`[content-audit] ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
