#!/usr/bin/env node
/**
 * 一键采集收录素材：给一个 GitHub 仓库地址，把「收录一个项目需要的东西」
 * 全部收集到 data/inbox/<slug>/ 下。采集完只需要补 draft.json 里的判断字段
 * （scenes、body、tags、aliases、whoFor、whoNot、platforms、price）。
 *
 *   node scripts/collect-project.mjs <owner/repo 或完整 URL> [--slug <slug>]
 *
 * 产出：
 *   data/inbox/<slug>/material.json   仓库元数据 + 许可证检测结果 + 采集时间
 *   data/inbox/<slug>/README.md       README 原文（正文与教程的依据）
 *   data/inbox/<slug>/LICENSE.txt     许可证原文（license 字段的依据，红线要求）
 *   data/inbox/<slug>/icon.svg        图标（simple-icons 有才下载，可选）
 *
 * 下一步：node scripts/draft-from-inbox.mjs <slug>
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const USAGE = "用法: node scripts/collect-project.mjs <owner/repo> [--slug <slug>]";

function gh(path, { raw = false } = {}) {
  const r = spawnSync("gh", ["api", path, raw ? "-H" : "--jq", raw ? "Accept: application/vnd.github.raw" : "."], {
    encoding: "utf8",
    maxBuffer: 16 << 20,
  });
  if (r.status !== 0) {
    const msg = String(r.stderr || "").trim().split("\n")[0] || "gh api 失败";
    throw new Error(`gh api ${path} 失败：${msg}`);
  }
  return r.stdout;
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--slug") args.slug = argv[++i];
    else args._.push(argv[i]);
  }
  if (args._.length !== 1) throw new Error(USAGE);
  return args;
}

const args = parseArgs(process.argv.slice(2));
const repoPath = args._[0].replace(/^https?:\/\/github\.com\//, "").replace(/\.git$/, "").replace(/\/+$/, "");
if (!/^[\w.-]+\/[\w.-]+$/.test(repoPath)) throw new Error(`仓库地址不合法：${repoPath}\n${USAGE}`);

const meta = JSON.parse(gh(`repos/${repoPath}`));
if (meta.fork) console.log(`[提示] ${repoPath} 是 fork，收录前确认它是不是本尊。`);
if (meta.archived) console.log(`[提示] ${repoPath} 已归档（archived），正文要写明不再维护。`);

const slug = args.slug || meta.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const dir = path.join("data", "inbox", slug);
mkdirSync(dir, { recursive: true });

// README 原文
const readme = gh(`repos/${repoPath}/readme`, { raw: true });
writeFileSync(path.join(dir, "README.md"), readme);
console.log(`README.md：${(readme.length / 1024).toFixed(1)} KiB`);

// LICENSE 原文（红线：license 字段必须以原文为准）
let licenseNote = "未检测到许可证文件";
let licenseFile = "";
try {
  const lic = JSON.parse(gh(`repos/${repoPath}/license`));
  licenseFile = lic.path ?? "";
  const content = Buffer.from(lic.content ?? "", "base64").toString("utf8");
  writeFileSync(path.join(dir, "LICENSE.txt"), content);
  licenseNote = lic.license?.spdx_id ?? "unknown";
  console.log(`LICENSE.txt：${lic.path}（GitHub 检测 ${licenseNote}，人工核对原文后再填 license 字段）`);
} catch (error) {
  console.log(`LICENSE：${error.message.includes("Not Found") ? "仓库没有许可证文件——不收（开源断言无处核验）" : error.message}`);
}

// 最新正式版本
let latestVersion = "";
try {
  const rel = JSON.parse(gh(`repos/${repoPath}/releases/latest`));
  latestVersion = rel.tag_name ?? "";
  console.log(`最新 release：${latestVersion}（${(rel.published_at ?? "").slice(0, 10)}）`);
} catch {
  console.log("最新 release：无正式版本（version 字段留空）");
}

// simple-icons 图标
let icon = "";
for (const candidate of [meta.name.toLowerCase().replace(/[^a-z0-9]/g, ""), slug.replace(/[^a-z0-9]/g, "")]) {
  const r = spawnSync("gh", ["api", `repos/simple-icons/simple-icons/contents/icons/${candidate}.svg`, "--jq", ".content"], { encoding: "utf8" });
  if (r.status === 0) {
    const svg = Buffer.from(r.stdout.trim(), "base64").toString("utf8");
    if (svg.includes("<svg")) {
      writeFileSync(path.join(dir, "icon.svg"), svg);
      icon = candidate;
      console.log(`icon.svg：simple-icons 有（${candidate}），已下载`);
      break;
    }
  }
}
if (!icon) console.log("icon.svg：simple-icons 没有，用字母图标（icon.letter/color 人工定）");

const material = {
  slug,
  repo: repoPath,
  name: meta.name,
  description: meta.description ?? "",
  homepage: meta.homepage ?? "",
  stars: meta.stargazers_count,
  pushedAt: (meta.pushed_at ?? "").slice(0, 10),
  licenseDetected: licenseNote,
  licenseFile,
  latestVersion,
  simpleIcon: icon,
  topics: meta.topics ?? [],
  collectedAt: new Date().toISOString().slice(0, 10),
};
writeFileSync(path.join(dir, "material.json"), JSON.stringify(material, null, 2) + "\n");
console.log(`\n已采集 → ${dir}/`);
console.log(`下一步：node scripts/draft-from-inbox.mjs ${slug}`);
