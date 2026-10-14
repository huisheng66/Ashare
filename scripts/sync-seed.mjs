#!/usr/bin/env node
/**
 * 把 ingest 草稿（运行库字段形态）同步进种子文件：slug 已存在则**整条重建**，
 * 不存在则追加到数组尾部。替代按字段打补丁的旧方式（块边界定位反复出过 6 个坑）。
 *
 *   node scripts/sync-seed.mjs <draft.json>          # 默认 data/software.ts
 *   node scripts/sync-seed.mjs <draft.json> --file data/samples.ts
 *
 * 字段映射（Software 运行库形态 → SeedSoftware 种子形态）：
 *   tutorial → installTips；officialLabel 从 official URL 的 host 推导；
 *   丢弃 status（种子默认 published）与 previews（SeedSoftware 无此字段）。
 * 跑完必须 npm run seed:drift 确认 0 不一致。
 */
import fs from "node:fs";

const args = process.argv.slice(2);
const draftFile = args[0];
const fileIdx = args.indexOf("--file");
const SEED_FILE = fileIdx >= 0 ? args[fileIdx + 1] : "data/software.ts";
if (!draftFile) throw new Error("用法: node scripts/sync-seed.mjs <draft.json> [--file <种子文件>]");

const drafts = JSON.parse(fs.readFileSync(draftFile, "utf8"));
const list = Array.isArray(drafts) ? drafts : [drafts];
const raw = fs.readFileSync(SEED_FILE, "utf8");
const eol = raw.includes("\r\n") ? "\r\n" : "\n";

const esc = (v) => JSON.stringify(v);

/** 由草稿生成一个种子条目的行数组（不含外层花括号缩进之外的包装）。 */
function seedBlock(d) {
  if (!d.slug) throw new Error("草稿缺 slug");
  const official = d.links?.official ?? d.officialUrl;
  if (!official) throw new Error(`${d.slug} 缺 links.official`);
  const host = new URL(official).host;
  const b = [];
  b.push("  {");
  if (d.license) b.push(`    license: ${esc(d.license)},`);
  if (d.version) b.push(`    version: ${esc(d.version)},`);
  b.push(`    slug: ${esc(d.slug)},`);
  if (d.linksCheckedAt) b.push(`    linksCheckedAt: ${esc(d.linksCheckedAt)},`);
  b.push(`    name: ${esc(d.name)},`);
  if (d.nameZh) b.push(`    nameZh: ${esc(d.nameZh)},`);
  b.push(`    aliases: [${(d.aliases ?? []).map(esc).join(", ")}],`);
  if (d.kind) b.push(`    kind: ${esc(d.kind)},`);
  b.push(`    source: ${esc(d.source)},`);
  b.push(`    scenes: [${(d.scenes ?? []).map(esc).join(", ")}],`);
  b.push(`    platforms: [${(d.platforms ?? []).map(esc).join(", ")}],`);
  if (d.tags?.length) b.push(`    tags: [${d.tags.map(esc).join(", ")}],`);
  b.push(`    summary: ${esc(d.summary)},`);
  if (d.body) b.push(`    body: ${esc(d.body)},`);
  b.push(`    officialUrl: ${esc(official)},`);
  b.push(`    officialLabel: ${esc(host)},`);
  b.push(`    links: {`);
  for (const [k, v] of Object.entries(d.links ?? {})) b.push(`      ${k}: ${esc(v)},`);
  b.push(`    },`);
  if (d.price) b.push(`    price: ${esc(d.price)},`);
  if (d.discountNote) b.push(`    discountNote: ${esc(d.discountNote)},`);
  b.push(`    installTips: [`);
  for (const tip of d.tutorial ?? []) b.push(`      ${esc(tip)},`);
  b.push(`    ],`);
  if (d.guide) {
    b.push(`    guide: {`);
    b.push(`      intro: ${esc(d.guide.intro)},`);
    b.push(`      markdown: \`${d.guide.markdown.replace(/\\/g, "\\\\").replace(/\`/g, "\\\`").replace(/\$\{/g, "\\\${")}\`,`);
    if (d.guide.resources?.length) {
      b.push(`      resources: [`);
      for (const r of d.guide.resources) {
        b.push(`        { kind: ${esc(r.kind)}, title: ${esc(r.title)}, url: ${esc(r.url)}, note: ${esc(r.note)} },`);
      }
      b.push(`      ],`);
    }
    b.push(`    },`);
  }
  b.push(`    whoFor: ${esc(d.whoFor ?? "")},`);
  b.push(`    whoNot: ${esc(d.whoNot ?? "")},`);
  b.push(`    alternatives: [${(d.alternatives ?? []).map(esc).join(", ")}],`);
  if (d.featured !== undefined) b.push(`    featured: ${d.featured ? "true" : "false"},`);
  b.push(`    icon: { letter: ${esc(d.icon?.letter ?? d.name[0].toUpperCase())}, color: ${esc(d.icon?.color ?? "#0071e3")}${d.icon?.simpleIcon ? `, simpleIcon: ${esc(d.icon.simpleIcon)}` : ""} },`);
  b.push("  },");
  return b;
}

const lines = raw.split(/\r?\n/);
const updated = [];
const appended = [];

for (const d of list) {
  const block = seedBlock(d);
  const slugLine = `    slug: ${esc(d.slug)},`;
  const at = lines.findIndex((l) => l === slugLine);
  if (at >= 0) {
    // 已存在：整条重建。条目边界 = 向上找 2 空格 `{`，向下找下一个 2 空格 `{` 或 0 缩进 `];`
    let start = at;
    while (start > 0 && lines[start] !== "  {") start -= 1;
    let end = at;
    let inTpl = false;
    for (let i = at + 1; i < lines.length; i += 1) {
      const t = lines[i].trim();
      if (inTpl) { if (t.endsWith("`,")) inTpl = false; continue; }
      if (t.startsWith("markdown: `") || t.startsWith("markdown:`")) { inTpl = true; continue; }
      if ((t === "{" && lines[i].startsWith("  {")) || (t === "];" && !lines[i].startsWith(" "))) { end = i - 1; break; }
    }
    if (end <= start) throw new Error(`${d.slug} 找不到条目块尾`);
    lines.splice(start, end - start + 1, ...block);
    updated.push(d.slug);
  } else {
    const close = lines.findIndex((l) => l.trim() === "];" && !l.startsWith(" "));
    if (close < 0) throw new Error("找不到种子数组的 ];");
    let atClose = close;
    while (atClose > 0 && lines[atClose - 1].trim() === "") atClose -= 1;
    lines.splice(atClose, 0, ...block, "");
    appended.push(d.slug);
  }
}

fs.writeFileSync(SEED_FILE, lines.join(eol));
if (updated.length) console.log(`已重建 ${updated.length} 条：${updated.join(", ")}`);
if (appended.length) console.log(`已追加 ${appended.length} 条：${appended.join(", ")}`);
console.log("下一步：npm run seed:drift 确认 0 不一致。");
