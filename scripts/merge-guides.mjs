// 一次性脚本：把 data/guides-incoming/batch-*.ts 里的教程合并进种子数据。
//
// 为什么需要这一步：guide 是软件条目的内联字段，35 条逐条手写容易漏字段、
// 也难统一校验。种子分两个文件 —— data/samples.ts（5 条）与 data/software.ts（30 条，
// 另有并行任务在改许可证字段），本脚本按 slug 自动判断该写进哪一个。
//
// 硬约束：先全量校验，任一条不过就退出且不写任何文件，避免留半成品。
// 幂等：靠 slug 覆盖同一份 guide，重复运行不会叠加。
import { promises as fs } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const { normalizeGuide, validateGuide } = await import("../lib/guide.ts");
const { samples } = await import("../data/samples.ts");
const { software } = await import("../data/software.ts");

/** 动态 import 必须是 file:// URL —— Windows 上 path.join 出的 D:\... 会被当成未知协议。 */
const importFile = (absPath) => import(pathToFileURL(absPath).href);

/** 去掉行尾 \r，让 CRLF 文件也能用严格等值比较（Windows 仓库默认是 CRLF）。 */
const bare = (line) => (line.endsWith("\r") ? line.slice(0, -1) : line);

const incomingDir = path.join(process.cwd(), "data", "guides-incoming");
const files = (await fs.readdir(incomingDir)).filter((f) => /^batch-[a-z]\d?\.ts$/.test(f)).sort();
if (!files.length) {
  console.log("data/guides-incoming 下没有 batch-*.ts，无需合并。");
  process.exit(0);
}

const incoming = {};
for (const file of files) {
  const mod = await importFile(path.join(incomingDir, file));
  for (const [slug, guide] of Object.entries(mod.guides ?? {})) {
    if (incoming[slug]) throw new Error(`slug 重复：${slug}（同时出现在多个 batch）`);
    incoming[slug] = guide;
  }
  console.log(`已读入 ${file}：${Object.keys(mod.guides ?? {}).length} 条`);
}

// slug → 目标文件与插入锚点。samples.ts 用 tutorial，software.ts 用 installTips，
// 两种条目字段不同，不能共用一个定位串。
const OWNER = (slug) => {
  if (samples.some((s) => s.slug === slug)) {
    return { file: path.join(process.cwd(), "data", "samples.ts"), anchor: "tutorial" };
  }
  if (software.some((s) => s.slug === slug)) {
    return { file: path.join(process.cwd(), "data", "software.ts"), anchor: "installTips" };
  }
  return undefined;
};

const problems = [];
const byTarget = new Map();
for (const [slug, guide] of Object.entries(incoming)) {
  const owner = OWNER(slug);
  if (!owner) {
    problems.push(`${slug}：两个种子文件里都没有这个 slug`);
    continue;
  }
  const clean = normalizeGuide(guide);
  const found = clean ? validateGuide(clean, { allowHttp: true }) : ["归一化后为空"];
  if (found.length) {
    problems.push(`${slug}：${found.join(" / ")}`);
    continue;
  }
  if (!byTarget.has(owner.file)) byTarget.set(owner.file, { anchor: owner.anchor, items: [] });
  byTarget.get(owner.file).items.push({ slug, guide: clean });
}

if (problems.length) {
  console.error("校验未通过，未写入任何内容：");
  for (const p of problems) console.error("  ✗ " + p);
  process.exit(1);
}

// 写回：把 guide 插到锚点数组（tutorial / installTips）之后。
// 用行级扫描而非整体反序列化，避免 TS 注释与格式被工具重排。
for (const [file, { anchor, items }] of byTarget) {
  const original = await fs.readFile(file, "utf8");
  const eol = original.includes("\r\n") ? "\r\n" : "\n";

  const pending = items.map(({ slug, guide }) => ({ slug, guide }));
  // 整体剥掉行尾 \r，让所有行（原有的与新插入的）形态一致。
  const lines = original.split("\n").map(bare);
  const skipped = [];
  for (;;) {
    // 每轮挑出行号最大的那条插入，保证前面的插入不影响它的定位。
    let pick = -1;
    let pickAt = -1;
    for (let i = 0; i < pending.length; i += 1) {
      if (!pending[i]) continue;
      const at = findAnchorEnd(lines, pending[i].slug, anchor);
      if (at === -1) continue;
      if (at > pickAt) {
        pickAt = at;
        pick = i;
      }
    }
    if (pick === -1) break;
    const spot = pending[pick];
    removeExistingGuide(lines, spot.slug);
    // 删块后行号会变，重新定位一次再插。
    const at = findAnchorEnd(lines, spot.slug, anchor);
    if (at === -1) {
      skipped.push(spot.slug);
      pending[pick] = undefined;
      continue;
    }
    // 原文件按 \n 切开时行尾可能残留 \r。新插入的块统一剥成纯 LF，
    // 最后 join 时再按 eol 补回 —— 否则块内行与原有行行尾不一致，
    // 第二次运行时锚点定位会失配（这正是混排导致的 bug）。
    lines.splice(at + 1, 0, ...renderGuide(spot.guide).split("\n").map(bare));
    pending[pick] = undefined;
  }
  for (const rest of pending) if (rest) skipped.push(rest.slug);

  const written = pending.length - skipped.length;
  if (written) await fs.writeFile(file, lines.join(eol), "utf8");
  const name = path.relative(process.cwd(), file);
  console.log(
    `${name}：写入 ${written} 条（行尾 ${eol === "\r\n" ? "CRLF" : "LF"}）` +
      (skipped.length ? `，跳过 ${skipped.length} 条（${skipped.join(", ")}）` : ""),
  );
}

console.log("\n下一步：npm run seed:guides 回填运行库，然后 npm run check。");

/** 找到 slug 所在条目里锚点数组的结束行下标。
 *  从 slug 行往后找 `    <anchor>: [`，再找与之配对的 `    ],`。
 *  搜索一律限制在**本条目内**（到下一个 `  },` 即条目结尾为止），
 *  否则会跨到相邻条目，把别人的 guide 块当成自己的删掉。
 *  返回该结束行的下标；找不到返回 -1。 */
function findAnchorEnd(lines, slug, anchor) {
  const bounds = entryBounds(lines, slug);
  if (!bounds) return -1;
  const { from, to } = bounds;
  const open = lines.findIndex((l, i) => i > from && i < to && bare(l).trim() === `${anchor}: [`);
  if (open === -1) return -1;
  return lines.findIndex((l, i) => i > open && i < to && bare(l) === "    ],");
}

/**
 * 定位 slug 所属条目的行范围 [from, to]。
 * 条目以 4 空格缩进的 `  {` 开始、以 `  },` 结束。
 */
function entryBounds(lines, slug) {
  const slugAt = lines.findIndex((l) => bare(l).trim() === `slug: "${slug}",`);
  if (slugAt === -1) return undefined;
  // 往前找最近的条目起始 `  {`
  let from = slugAt;
  while (from > 0 && bare(lines[from]) !== "  {") from -= 1;
  // 往后找最近的条目结束 `  },`
  let to = lines.length;
  for (let i = slugAt; i < lines.length; i += 1) {
    if (bare(lines[i]) === "  },") {
      to = i;
      break;
    }
  }
  return { from, to };
}

/** 幂等：若该条目内已有 guide 块，先删掉整块（从 `    guide: {` 到配对的 `    },`）。
 *  同样限定在条目范围内，避免删掉相邻条目的 guide。 */
function removeExistingGuide(lines, slug) {
  const bounds = entryBounds(lines, slug);
  if (!bounds) return;
  const { from, to } = bounds;
  const open = lines.findIndex((l, i) => i > from && i < to && bare(l) === "    guide: {");
  if (open === -1) return;
  // guide 块内部会嵌套 resources 数组（缩进 6 空格），所以只认 4 空格缩进的 `    },`。
  const close = lines.findIndex((l, i) => i > open && i < to && bare(l) === "    },");
  if (close === -1) return;
  lines.splice(open, close - open + 1);
}

/** 把 guide 渲染成种子文件里的缩进风格。模板字符串中的反引号与 ${ 需转义。 */
function renderGuide(guide) {
  const esc = (s) => s.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
  const resources = guide.resources
    .map((r) => {
      const parts = [
        `          kind: "${r.kind}",`,
        `          title: ${JSON.stringify(r.title)},`,
        `          url: ${JSON.stringify(r.url)},`,
      ];
      if (r.note) parts.push(`          note: ${JSON.stringify(r.note)},`);
      return `        {\n${parts.join("\n")}\n        },`;
    })
    .join("\n");
  const intro = guide.intro ? `      intro: ${JSON.stringify(guide.intro)},\n` : "";
  return [
    "    guide: {",
    intro + "      markdown: `" + esc(guide.markdown) + "`,",
    "      resources: [",
    resources,
    "      ],",
    "    },",
  ].join("\n");
}
