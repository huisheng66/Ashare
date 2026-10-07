// 种子 → 运行库同步。种子与运行库的关系决定了这里要做什么：
//
// `data/store/catalog.json` 已 gitignore，只在首次启动时由 seedToItem 灌入。
// 之后**种子改了不会自动同步**，全靠脚本。分两种情况：
//
//   补 guide（已有条目）—— 原 seed-guides.mjs 干的事。
//   新增条目 —— 原脚本完全做不到：它只 map 现有 catalog，
//   种子里多出来的 slug 会被无声忽略，漂移检查才报「仅存在于种子」。
//
// 所以这里显式区分：**种子有、运行库没有 → 追加；有 → 合并 guide**。
//
// 用法：
//   node scripts/seed-sync.mjs --dry-run    只报告会变什么，不写
//   node scripts/seed-sync.mjs             执行同步
//   node scripts/seed-sync.mjs --guides-only  只补 guide，不追加新条目
import { persistCatalog } from "../lib/catalog-persist.ts";
import { readCatalog, withDb } from "./_shared.mjs";

const { samples } = await import("../data/samples.ts");
const { software } = await import("../data/software.ts");
const { normalizeGuide } = await import("../lib/guide.ts");
const { seedToItem, SEED_SYNC_FIELDS } = await import("../lib/seed.ts");

function parseArgs(argv) {
  const args = { dryRun: false, guidesOnly: false, help: false };
  for (const a of argv) {
    if (a === "--dry-run") args.dryRun = true;
    else if (a === "--guides-only") args.guidesOnly = true;
    else if (a === "--help" || a === "-h") args.help = true;
    else throw new Error(`未知参数：${a}`);
  }
  return args;
}

const USAGE = `用法:
  node scripts/seed-sync.mjs [--dry-run] [--guides-only]

  --dry-run      只报告会变什么，不写文件
  --guides-only  只补 guide，不追加种子里的新条目`;

/** 递归按键排序后比对：与对象键顺序无关。 */
function same(a, b) {
  const stable = (value) => {
    if (Array.isArray(value)) return value.map(stable);
    if (value && typeof value === "object") {
      return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
    }
    return value;
  };
  return JSON.stringify(stable(a) ?? null) === JSON.stringify(stable(b) ?? null);
}

async function main() {

  const args = parseArgs(process.argv.slice(2));
  if (args.help) { console.log(USAGE); return; }

  // samples 是 SeedSoftware[]；software 同样是种子形态，都要过 seedToItem。
  // 直接读种子会漏掉 links —— 种子形态把外链放在 officialUrl 而非 links.official，
  // 不转换的话「全站探活」会漏掉半数条目。
  const seedEntries = [...software, ...samples];
  /** slug → 种子条目。samples 与 software 无重叠 slug。 */
  const seeds = new Map(seedEntries.map((s) => [s.slug, s]));

  // P10：运行库的权威位置是 MySQL；readCatalog 有 MYSQL_URL 时读库，否则回落 JSON 并告警。
  const catalog = await readCatalog();
  const bySlug = new Map(catalog.map((item) => [item.slug, item]));

  const added = [];
  const guideUpdated = [];
  const fieldsUpdated = [];
  const next = [];

  // 种子透传到运行库的字段，必须与 scripts/seed-drift.mjs 的 COMPARE 保持一致。
  //
  // 为什么需要这张表：早期版本只同步 guide，于是**改了 body、summary 之类的字段
  // 会被静默忽略** —— 运行库留着旧值，漂移检查报出不一致，
  // 但 seed-sync 又说「已是最新」，两个脚本互相甩锅。
  //
  // 同步范围的边界：只覆盖「种子是唯一事实源」的字段。
  // price 可能由后台按商业谈判结果维护，不在其中——
  // 它合法地偏离种子（seed-drift.mjs 开头的注释也说明了这一点）。
  //
  // license 与 kind 曾被排除在外，那是误判：
  //   - license 是项目自身的客观属性，后台无从手工裁定，不存在合法偏离；
  //   - kind 必须能在种子里显式覆盖推导值（n8n 是 fair-code，不能让
  //     seedToItem 按 source 推成 "opensource"），不同步修正就传不到运行库。
  // 留在外面会让漂移检查报出不一致、而同步又说「已是最新」，
  // 正是本文件开头那段注释描述的甩锅现场。
  // 同步范围同样从登记表取（比漂移比对窄：有些字段后台改得更准）。
  const SYNCED_FIELDS = SEED_SYNC_FIELDS;

  for (const item of catalog) {
    // 比对必须与对象键顺序无关：DB 往返会重排 links 的键（diskSha256/diskFile 先后不同），
    // 直接 JSON.stringify 会每轮都判定「有变化」，脚本就不幂等了 —— 而且会和 seed:drift 互相甩锅。
    const source = seeds.get(item.slug);
    if (!source) { next.push(item); continue; }

    const fresh = seedToItem(source);
    const merged = { ...item };
    const changed = [];
    for (const field of SYNCED_FIELDS) {
      // guide 由下面的专门分支处理：它必须先过 normalizeGuide 再比对，
      // 走通用分支会比到「原始值 vs 归一化值」的假差异（实测一次报 20 条）。
      if (field === "guide") continue;
      // 种子没给这个字段时不覆盖：种子形态允许省略 version / license，
      // 直接写 undefined 会把运行库里已有的值抹掉。
      if (fresh[field] === undefined) continue;
      if (same(item[field], fresh[field])) continue;
      merged[field] = fresh[field];
      changed.push(field);
    }

    // guide 走 normalizeGuide：**seedToItem 原样透传，normalizeGuide 会 trim。**
    // 两者产出的字符串差一个末尾换行，不归一化的话下一轮又判定「有变化」，
    // 幂等性就没了。
    if (source.guide) {
      const guide = normalizeGuide(source.guide);
      // 同样要用 same()：DB 往返把 guide 的键排成 resources/intro/markdown，
      // 种子是 intro/markdown/resources —— 直接 stringify 会让**全部 55 条**每轮都判定「有变化」。
      if (guide && !same(item.guide, guide)) {
        merged.guide = guide;
        changed.push("guide");
      }
    }

    if (!changed.length) { next.push(item); continue; }
    if (changed.includes("guide")) guideUpdated.push(item.slug);
    const others = changed.filter((f) => f !== "guide");
    if (others.length) fieldsUpdated.push(`${item.slug}(${others.join(",")})`);
    next.push(merged);
  }

  if (!args.guidesOnly) {
    // 追加种子有、运行库没有的条目。放在末尾，保持运行库既有顺序不变 ——
    // 顺序变了会让每次 diff 都显示全量重排，审阅时看不出真正改了什么。
    //
    // guide 必须过 normalizeGuide：**seedToItem 是原样透传，normalizeGuide 会 trim。**
    // 两者产出的字符串差一个末尾换行，于是下一轮比对又判定「有变化」，
    // 脚本永远报告同一条被更新，幂等性就没了。
    for (const source of seedEntries) {
      if (bySlug.has(source.slug)) continue;
      const item = seedToItem(source);
      if (item.guide) item.guide = normalizeGuide(item.guide) ?? undefined;
      added.push(source.slug);
      next.push(item);
    }
  }

  const report = [
    added.length ? `  新增 ${added.length} 条：${added.join(", ")}` : null,
    guideUpdated.length ? `  补 guide ${guideUpdated.length} 条：${guideUpdated.join(", ")}` : null,
    fieldsUpdated.length ? `  同步字段 ${fieldsUpdated.length} 处：${fieldsUpdated.join("；")}` : null,
  ].filter(Boolean);

  if (!report.length) {
    console.log(`运行库已是最新（${next.length} 条）。`);
    return;
  }

  if (args.dryRun) {
    console.log(`--dry-run，未写入。将会：\n${report.join("\n")}`);
    console.log(`\n写入后运行库共 ${next.length} 条。`);
    return;
  }

  // 不 prune：种子只管「种子是唯一事实源」的字段与新增条目，
  // 后台新建的条目不该因为种子里没有就被删掉。
  const stats = await withDb(async (conn) => {
    await conn.beginTransaction();
    try {
      const result = await persistCatalog(conn, next, { prune: false });
      await conn.commit();
      return result;
    } catch (error) {
      await conn.rollback().catch(() => {});
      throw error;
    }
  });
  console.log(`已同步到运行库：\n${report.join("\n")}\n运行库共 ${stats.items} 条。`);
}

main().catch((error) => {
  console.error(`[seed-sync] ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
