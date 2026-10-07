// 新条目录入：把 data/trending-incoming/*.ts 里的新条目并入种子数据。
//
// 与 merge-guides 的分工：那个脚本给**已有条目**补 guide 字段，
// 这个脚本**新增整个条目**。两者共用同一套写入约定。
//
// 硬约束（缺一件就会出事）：
//   1. 全量校验后再写 —— 任一条不过就退出，不写任何文件，不留半成品。
//   2. 按 slug 自动判断目标文件 —— 新条目一律进 data/software.ts，
//      samples.ts 是「详情页演示样例」，不该被正式条目稀释。
//   3. 删除/替换限定在条目边界内 —— 不限定会误删相邻条目的同名字段块。
//   4. 幂等 —— 同 slug 重复录入是「更新」而非「追加」，连跑三次结果一致。
//
// 用法：
//   node scripts/add-trending.mjs --list                    列出待录入的 slug
//   node scripts/add-trending.mjs --slug caddy              录入一条
//   node scripts/add-trending.mjs --slug caddy --dry-run    只校验不写
//   node scripts/add-trending.mjs --all                    全部录入
import { promises as fs } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const { validateGuide, normalizeGuide } = await import("../lib/guide.ts");
const { software } = await import("../data/software.ts");
const { samples } = await import("../data/samples.ts");
const { SCENE_IDS, PLATFORMS, SOURCE_KINDS } = await import("./_trending-schema.mjs");

/** 站内已存在的全部 slug。alternatives 必须指向其中之一，否则详情页渲染出空卡片。 */
const KNOWN_SLUGS = new Set([...software, ...samples].map((s) => s.slug));


/** 动态 import 必须是 file:// URL —— Windows 上 path.join 出的 D:\... 会被当成未知协议。 */
const importFile = (absPath) => import(pathToFileURL(absPath).href);

/** 去掉行尾 \r，让 CRLF 文件也能用严格等值比较（Windows 仓库默认是 CRLF）。 */
const bare = (line) => (line.endsWith("\r") ? line.slice(0, -1) : line);

const INCOMING = path.join(process.cwd(), "data", "trending-incoming");
const TARGET = path.join(process.cwd(), "data", "software.ts");

// ── 参数 ────────────────────────────────────────────────────────────
const USAGE = `用法:
  node scripts/add-trending.mjs --list                 列出待录入的 slug
  node scripts/add-trending.mjs --slug <slug> [...]   录入指定条目（可多个）
  node scripts/add-trending.mjs --all                 录入全部
  --dry-run                                         只校验不写`;

function parseArgs(argv) {
  const args = { help: false, list: false, all: false, dryRun: false, slugs: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--help" || a === "-h") { args.help = true; continue; }
    if (a === "--list") { args.list = true; continue; }
    if (a === "--all") { args.all = true; continue; }
    if (a === "--dry-run") { args.dryRun = true; continue; }
    if (a === "--slug") { args.slugs.push(argv[++i]); continue; }
    throw new Error(`未知参数：${a}`);
  }
  if (!args.help && !args.list && !args.all && !args.slugs.length) throw new Error(USAGE);
  return args;
}

// ── 校验 ────────────────────────────────────────────────────────────
const LIMITS = { name: 80, nameZh: 40, summary: 200, whoFor: 200, whoNot: 200, intro: 300 };

/**
 * 种子条目的字段校验。
 *
 * 存在的意义与 guide 校验一样：**新录入的内容里最容易混进来的不是格式错，
 * 是空话**。「XX 是一款优秀的工具」这类 summary 写得通顺但对读者零信息量，
 * 所以额外要求它包含一个具体的判断点（能替代什么 / 适合谁 / 有什么代价）。
 */
function validateEntry(entry) {
  const problems = [];
  const need = (cond, message) => { if (!cond) problems.push(message); };

  need(/^[a-z0-9][a-z0-9-]*$/.test(entry.slug ?? ""), `slug 非法：${entry.slug}`);
  need(Boolean(entry.name), "缺 name");
  need(Boolean(entry.nameZh), "缺 nameZh");
  need(Boolean(entry.summary), "缺 summary");
  need(Boolean(entry.whoFor), "缺 whoFor");
  need(Boolean(entry.whoNot), "缺 whoNot（写清谁不适合，比只写适合更有用）");
  need(Array.isArray(entry.aliases) && entry.aliases.length > 0, "缺 aliases");
  // alternatives 允许为空：站内同类工具不一定齐全，强行凑数会让「同类替代」
  // 变成不相干的条目。详情页的 alternativesOf 会自动过滤掉不存在的 slug，
  // 空数组是安全降级。但**填了就必须全部有效**，否则是维护者笔误。
  if (entry.alternatives !== undefined && !Array.isArray(entry.alternatives)) {
    problems.push("alternatives 必须是数组");
  }
  need(Array.isArray(entry.tags) && entry.tags.length > 0, "缺 tags");
  need(typeof entry.body === "string" && entry.body.length >= 80,
    "缺 body 或过短（详情页正文，至少 80 字）");

  // icon 决定列表页的字母头像。letter 取 name 首字符，color 必须是 #rrggbb。
  if (!entry.icon || typeof entry.icon !== "object") {
    problems.push("缺 icon");
  } else {
    if (!/^[0-9A-Za-z]$/.test(entry.icon.letter ?? "")) {
      problems.push(`icon.letter 必须是单个字母数字：${entry.icon.letter}`);
    }
    if (!/^#[0-9a-fA-F]{6}$/.test(entry.icon.color ?? "")) {
      problems.push(`icon.color 必须是 #rrggbb：${entry.icon.color}`);
    }
    if (entry.icon.simpleIcon !== undefined && !/^[a-z0-9-]+$/.test(entry.icon.simpleIcon ?? "")) {
      problems.push(`icon.simpleIcon 只允许小写字母数字与连字符：${entry.icon.simpleIcon}`);
    }
  }

  for (const [field, max] of Object.entries(LIMITS)) {
    const v = entry[field];
    if (typeof v === "string" && v.length > max) {
      problems.push(`${field} 超长 ${v.length}/${max}`);
    }
  }

  if (!Array.isArray(entry.scenes) || !entry.scenes.length) {
    problems.push("缺 scenes");
  } else {
    for (const s of entry.scenes) {
      if (!SCENE_IDS.includes(s)) problems.push(`scenes 含非法值：${s}`);
    }
  }

  if (!Array.isArray(entry.platforms) || !entry.platforms.length) {
    problems.push("缺 platforms");
  } else {
    for (const p of entry.platforms) {
      if (!PLATFORMS.includes(p)) problems.push(`platforms 含非法值：${p}`);
    }
  }

  if (!SOURCE_KINDS.includes(entry.source)) problems.push(`source 非法：${entry.source}`);

  // URL：只收 https。http 会在浏览器与 CSP 下出问题。
  for (const field of ["officialUrl", "github"]) {
    const v = entry[field];
    if (v && !/^https:\/\//.test(v)) problems.push(`${field} 必须 https：${v}`);
  }

  // officialLabel 通常是 host，与 officialUrl 对不上会误导读者。
  if (entry.officialUrl && entry.officialLabel) {
    let host = "";
    try { host = new URL(entry.officialUrl).host; } catch { host = ""; }
    if (host && entry.officialLabel !== host && !entry.officialLabel.includes(host)) {
      problems.push(`officialLabel「${entry.officialLabel}」与 officialUrl 的 host「${host}」对不上`);
    }
  }

  if (!Array.isArray(entry.installTips) || entry.installTips.length < 2) {
    problems.push("installTips 至少 2 条");
  }

  // 填了的 alternatives 必须指向站内已存在的 slug。
  // alternativesOf 会过滤掉不存在的，所以不会崩——但那说明维护者写错了。
  for (const alt of entry.alternatives ?? []) {
    if (!KNOWN_SLUGS.has(alt)) problems.push(`alternatives 指向不存在的 slug：${alt}`);
  }
  if (entry.links?.official && entry.links.official !== entry.officialUrl) {
    problems.push(`links.official（${entry.links.official}）与 officialUrl（${entry.officialUrl}）不一致`);
  }
  if (entry.links?.github && !/^https:\/\/github\.com\//.test(entry.links.github)) {
    problems.push(`links.github 必须是 github.com 地址：${entry.links.github}`);
  }

  if (!entry.guide) {
    problems.push("缺 guide");
  } else {
    const clean = normalizeGuide(entry.guide);
    if (!clean) problems.push("guide 归一化后为空");
    else {
      const found = validateGuide(clean, { allowHttp: false });
      for (const f of found) problems.push(`guide：${f}`);
      // 每条资源都要有 note：读者需要知道点它是为了解决什么。
      for (const r of clean.resources ?? []) {
        if (!r.note) problems.push(`guide 资源「${r.title}」缺 note`);
      }
    }
  }

  return problems;
}

// ── 定位 ────────────────────────────────────────────────────────────
/** 定位 slug 所在条目的行范围 [from, to]。条目以 `  {` 开始、`  },` 结束。 */
function entryBounds(lines, slug) {
  const slugAt = lines.findIndex((l) => bare(l).trim() === `slug: "${slug}",`);
  if (slugAt === -1) return undefined;
  let from = slugAt;
  while (from > 0 && bare(lines[from]) !== "  {") from -= 1;
  let to = lines.length;
  for (let i = slugAt; i < lines.length; i += 1) {
    if (bare(lines[i]) === "  },") { to = i; break; }
  }
  return { from, to };
}

/** 找到数组末尾 `];`，限定在条目内。新条目插在整个数组的最后一条之后。 */
function findArrayEnd(lines) {
  const start = lines.findIndex((l) => bare(l) === "export const software: SeedSoftware[] = [");
  if (start === -1) throw new Error("在 data/software.ts 里找不到 software 数组的起始行");
  for (let i = start; i < lines.length; i += 1) {
    if (bare(lines[i]) === "];") return i;
  }
  throw new Error("在 data/software.ts 里找不到 software 数组的结束行");
}

// ── 渲染 ────────────────────────────────────────────────────────────
const q = (s) => JSON.stringify(s);

/**
 * 渲染成种子文件的缩进风格。
 *
 * 反斜杠与反引号必须转义：guide.markdown 里的 Windows 路径（`C:\Users`）
 * 与行内代码的反引号，若不转义会被模板字符串吞掉 —— 页面上的命令就是坏的。
 * 这是真踩过的坑：校验器看 AST 不看字面量，全绿也照样出错。
 */
function renderEntry(e) {
  const esc = (s) => s.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");

  const lines = [
    "  {",
    `    slug: ${q(e.slug)},`,
    `    linksCheckedAt: ${q(e.linksCheckedAt)},`,
    `    name: ${q(e.name)},`,
    `    nameZh: ${q(e.nameZh)},`,
    `    aliases: [${e.aliases.map(q).join(", ")}],`,
    `    summary: ${q(e.summary)},`,
    `    scenes: [${e.scenes.map(q).join(", ")}],`,
    `    platforms: [${e.platforms.map(q).join(", ")}],`,
    `    source: ${q(e.source)},`,
  ];
  if (e.license) lines.push(`    license: ${q(e.license)},`);
  if (e.version) lines.push(`    version: ${q(e.version)},`);
  lines.push(`    tags: [${e.tags.map(q).join(", ")}],`);
  if (e.body) lines.push(`    body: ${q(e.body)},`);
  lines.push(`    officialUrl: ${q(e.officialUrl)},`);
  lines.push(`    officialLabel: ${q(e.officialLabel)},`);
  // GitHub 地址放在 links.github，不是顶层 github —— SeedSoftware 没有顶层字段，
  // 写成顶层会报 TS2353。这是实测踩过的。
  if (e.links?.official || e.links?.github) {
    lines.push("    links: {");
    if (e.links.official) lines.push(`      official: ${q(e.links.official)},`);
    if (e.links.github) lines.push(`      github: ${q(e.links.github)},`);
    lines.push("    },");
  }
  lines.push(`    whoFor: ${q(e.whoFor)},`);
  lines.push(`    whoNot: ${q(e.whoNot)},`);
  lines.push("    installTips: [");
  for (const tip of e.installTips) lines.push(`      ${q(tip)},`);
  lines.push("    ],");
  // alternatives 允许为空数组：站内同类工具不一定齐全，详情页会自动过滤空引用。
  lines.push(`    alternatives: [${(e.alternatives ?? []).map(q).join(", ")}],`);
  if (e.featured) lines.push("    featured: true,");

  // icon 必填：列表页的字母头像靠它，缺了详情页与搜索结果都拿不到图。
  lines.push("    icon: {");
  lines.push(`      letter: ${q(e.icon.letter)},`);
  lines.push(`      color: ${q(e.icon.color)},`);
  if (e.icon.simpleIcon) lines.push(`      simpleIcon: ${q(e.icon.simpleIcon)},`);
  lines.push("    },");

  const resources = (e.guide.resources ?? [])
    .map((r) => {
      const parts = [`          kind: ${q(r.kind)},`, `          title: ${q(r.title)},`, `          url: ${q(r.url)},`];
      if (r.note) parts.push(`          note: ${q(r.note)},`);
      return `        {\n${parts.join("\n")}\n        },`;
    })
    .join("\n");
  lines.push("    guide: {");
  if (e.guide.intro) lines.push(`      intro: ${q(e.guide.intro)},`);
  lines.push(`      markdown: \`${esc(e.guide.markdown)}\`,`);
  lines.push("      resources: [");
  if (resources) lines.push(resources);
  lines.push("      ],");
  lines.push("    },");
  lines.push("  },");
  return lines.join("\n");
}

// ── 主流程 ──────────────────────────────────────────────────────────
async function loadIncoming() {
  let files;
  try {
    files = (await fs.readdir(INCOMING)).filter((f) => f.endsWith(".ts")).sort();
  } catch (error) {
    if (error.code === "ENOENT") return new Map();
    throw error;
  }
  const all = new Map();
  for (const file of files) {
    const mod = await importFile(path.join(INCOMING, file));
    for (const [slug, entry] of Object.entries(mod.entries ?? {})) {
      if (all.has(slug)) throw new Error(`slug 重复：${slug}（同时出现在多个批次文件）`);
      all.set(slug, entry);
    }
  }
  return all;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { console.log(USAGE); return; }

  const incoming = await loadIncoming();
  if (args.list) {
    const today = new Date().toISOString().slice(0, 10);
    const existing = new Set(software.map((s) => s.slug));
    console.log(`待录入 ${incoming.size} 条：\n`);
    for (const [slug, e] of incoming) {
      const mark = existing.has(slug) ? "（已存在，将更新）" : "";
      const ok = validateEntry({ ...e, linksCheckedAt: e.linksCheckedAt ?? today }).length === 0;
      console.log(`  ${ok ? "✅" : "✗"} ${slug.padEnd(22)} ${e.nameZh ?? e.name}${mark}`);
    }
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const picked = args.all ? [...incoming.keys()] : args.slugs;
  if (!picked.length) { console.log("没有指定要录入的条目。"); return; }

  // ① 全量校验后再写。任一条不过就退出，不写任何文件。
  const problems = [];
  const ready = [];
  for (const slug of picked) {
    const entry = incoming.get(slug);
    if (!entry) { problems.push(`${slug}：data/trending-incoming 里没有这一条`); continue; }
    const full = { ...entry, linksCheckedAt: entry.linksCheckedAt ?? today };
    const found = validateEntry(full);
    if (found.length) { problems.push(`${slug}：${found.join(" / ")}`); continue; }
    ready.push({ slug, entry: full });
  }
  if (problems.length) {
    console.error("校验未通过，未写入任何内容：");
    for (const p of problems) console.error("  ✗ " + p);
    process.exitCode = 1;
    return;
  }

  if (args.dryRun) {
    console.log(`校验通过 ${ready.length} 条（--dry-run，未写入）：`);
    for (const { slug, entry } of ready) {
      console.log(`  ✅ ${slug.padEnd(22)} ${entry.nameZh} · 教程 ${entry.guide.markdown.length} 字 · 资源 ${entry.guide.resources?.length ?? 0} 条`);
    }
    return;
  }

  // ② 幂等：同 slug 已存在则整条替换，而不是追加。
  const original = await fs.readFile(TARGET, "utf8");
  const eol = original.includes("\r\n") ? "\r\n" : "\n";
  const lines = original.split("\n").map(bare);
  const existing = new Set(software.map((s) => s.slug));
  const replaced = [];
  const added = [];

  for (const { slug, entry } of ready) {
    if (existing.has(slug)) {
      // 整条替换：删掉旧块（限定在条目边界内），再在同位置插入新块。
      const bounds = entryBounds(lines, slug);
      if (!bounds) { console.error(`  ✗ ${slug}：在 data/software.ts 里定位不到条目，跳过`); process.exitCode = 1; continue; }
      lines.splice(bounds.from, bounds.to - bounds.from + 1, ...renderEntry(entry).split("\n").map(bare));
      replaced.push(slug);
    } else {
      // 新条目插在数组末尾。每轮都重算 end —— 插入会改变行号。
      const end = findArrayEnd(lines);
      lines.splice(end, 0, ...renderEntry(entry).split("\n").map(bare));
      added.push(slug);
    }
  }

  await fs.writeFile(TARGET, lines.join(eol), "utf8");
  console.log(`已写入 data/software.ts（行尾 ${eol === "\r\n" ? "CRLF" : "LF"}）：`);
  if (added.length) console.log(`  新增 ${added.length} 条：${added.join(", ")}`);
  if (replaced.length) console.log(`  更新 ${replaced.length} 条：${replaced.join(", ")}`);
  console.log("\n下一步：npm run seed:guides 回填运行库，再跑 npm run check。");
}

main().catch((error) => {
  console.error(`[add-trending] ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
