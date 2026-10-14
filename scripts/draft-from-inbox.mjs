#!/usr/bin/env node
/**
 * 从 data/inbox/<slug>/ 的采集素材生成 draft.json（运行库字段形态）。
 *
 *   node scripts/draft-from-inbox.mjs <slug>
 *
 * 自动填（依据 material.json 与 LICENSE.txt 原文，无需人工）：
 *   slug / name / summary（仓库描述，可润色）/ license（仅标准许可证，自定义留空）/
 *   version / links / linksCheckedAt（今天）/ source / kind / icon
 *
 * 需要人工补（生成器会列出清单，不填过不了 --strict）：
 *   scenes / platforms / tags / aliases / body（四段式，依据 README.md）/
 *   whoFor / whoNot / price / alternatives
 */
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const slug = process.argv[2];
if (!slug) throw new Error("用法: node scripts/draft-from-inbox.mjs <slug>");
const dir = path.join("data", "inbox", slug);
if (!existsSync(path.join(dir, "material.json"))) throw new Error(`${dir}/material.json 不存在，先跑 collect-project.mjs`);

const material = JSON.parse(readFileSync(path.join(dir, "material.json"), "utf8"));
// 采集时无论远程文件叫什么（LICENSE / COPYING / LICENCE…），落盘统一是 LICENSE.txt。
const licensePath = path.join(dir, "LICENSE.txt");
let license = "";
let licenseNote = "";
if (material.licenseFile && existsSync(licensePath)) {
  // GitHub 检测仅作参考（会误报 NOASSERTION，llms-from-scratch 就是）：
  // 有许可证原文就按原文判读，判不出来才留空给人工。
  const head = readFileSync(licensePath, "utf8").slice(0, 600);
  const full = readFileSync(licensePath, "utf8").slice(0, 8000);
  const table = [
    ["MIT License", "MIT"],
    ["Apache License\n                           Version 2.0", "Apache-2.0"],
    ["Apache License\n      Version 2.0", "Apache-2.0"],
    ["GNU GENERAL PUBLIC LICENSE\n                       Version 3", "GPL-3.0"],
    ["GNU GENERAL PUBLIC LICENSE\n                       Version 2", "GPL-2.0"],
    ["GNU AFFERO GENERAL PUBLIC LICENSE\n                       Version 3", "AGPL-3.0"],
    ["GNU LESSER GENERAL PUBLIC LICENSE\n                       Version 3", "LGPL-3.0"],
    ["Creative Commons Attribution-NonCommercial-ShareAlike 4.0", "CC-BY-NC-SA-4.0"],
    ["CC0 1.0", "CC0-1.0"],
  ];
  for (const [needle, spdx] of table) {
    if (head.replace(/\r/g, "").includes(needle)) { license = spdx; break; }
  }
  // 兜底：很多项目用的是「应用式 GPL 声明」（This program is free software…），
  // 没有全文标题，按关键词在全文里判；BSD 需人工确认是 2 还是 3 条款。
  if (!license) {
    const has = (re) => re.test(full);
    if (has(/affero general public license/i)) license = "AGPL-3.0";
    else if (has(/general public license/i)) license = has(/version 3/i) ? "GPL-3.0" : has(/version 2/i) ? "GPL-2.0" : "";
    else if (has(/apache license/i) && has(/version 2/i)) license = "Apache-2.0";
    else if (has(/mit license/i)) license = "MIT";
    else if (has(/creative commons attribution-noncommercial-sharealike 4\.0/i)) license = "CC-BY-NC-SA-4.0";
    else if (has(/cc0 1\.0/i)) license = "CC0-1.0";
  }
  if (!license) licenseNote = `许可证原文在 ${material.licenseFile}，GitHub 检测 ${material.licenseDetected} 但不在标准表内——人工判读，自定义许可留空`;
  else console.log(`  （license 按原文判为 ${license}，与 GitHub 检测 ${material.licenseDetected} 不同属正常——以原文为准）`);
} else if (material.licenseDetected) {
  licenseNote = `自定义/混合许可（GitHub 检测 ${material.licenseDetected}），按 n8n 先例 license 留空，正文第 4 段写明许可状态`;
}

const official = material.homepage && /^https:\/\//.test(material.homepage) ? material.homepage : `https://github.com/${material.repo}`;

// 防覆盖：draft.json 里若已有人工补的字段（body 非空即视为编辑过），
// 重新生成会全部冲掉——拒绝执行，要重来就先删掉 draft.json。
const draftPath = path.join(dir, "draft.json");
if (existsSync(draftPath)) {
  const existing = JSON.parse(readFileSync(draftPath, "utf8"));
  if ((existing.body ?? "").trim()) {
    throw new Error(`${draftPath} 已有手工内容（body 非空），拒绝覆盖。确要重新生成请先删除该文件。`);
  }
}

const draft = {
  slug,
  name: material.name,
  summary: (material.description || "").slice(0, 200),
  kind: "opensource",
  status: "published",
  source: "opensource",
  license: license || undefined,
  version: material.latestVersion || undefined,
  linksCheckedAt: new Date().toISOString().slice(0, 10),
  links: { official, github: `https://github.com/${material.repo}` },
  scenes: [],
  platforms: [],
  tags: [],
  aliases: [slug],
  body: "",
  whoFor: "",
  whoNot: "",
  alternatives: [],
  icon: material.simpleIcon
    ? { letter: material.name[0].toUpperCase(), color: "#0071e3", simpleIcon: material.simpleIcon }
    : { letter: material.name[0].toUpperCase(), color: "#0071e3" },
};

// 图标落位：simple-icons 的 SVG 要进 data/icons/<名称>.svg 前端才能显示，
// 只留在 inbox 里会 404 并回落字母图标（静默失效，--strict 之前没人拦）。
if (material.simpleIcon) {
  const src = path.join(dir, "icon.svg");
  const dst = path.join("data", "icons", `${material.simpleIcon}.svg`);
  if (existsSync(src) && !existsSync(dst)) {
    copyFileSync(src, dst);
    console.log(`  icon：已复制到 ${dst}`);
  }
}

writeFileSync(path.join(dir, "draft.json"), JSON.stringify(draft, null, 2) + "\n");

console.log(`draft.json 已生成 → ${dir}/`);
if (license) console.log(`  license：${license}（已按 ${material.licenseFile} 原文核对头部）`);
if (licenseNote) console.log(`  许可证注意：${licenseNote}`);
console.log(`  summary：暂用仓库描述，建议按「是什么/解决什么」润色`);
console.log(`\n待人工补齐（--strict 的硬要求）：`);
console.log(`  scenes（1 个主场景即可）、platforms、tags ≥3、aliases、`);
console.log(`  body ≥2 段且 ≥200 字（第 3 段写代价，依据 README.md）、whoFor、whoNot`);
console.log(`  price（收费的写清楚）、alternatives（任务链邻居，编不出就留空）`);
console.log(`\n补完后：node .workbuddy/skills/ashare-curation/scripts/ingest-item.mjs --file ${dir}/draft.json --dry-run --strict`);
