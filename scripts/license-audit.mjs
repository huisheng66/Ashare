#!/usr/bin/env node
/**
 * 许可证缺口审计：找出「标了开源、却写不出许可证」的条目，并给出可核验的候选值。
 *
 *   npm run license:audit              列缺口 + GitHub 的检测结果（只报告，不改数据）
 *   npm run license:audit -- --json    机器可读输出
 *   npm run license:audit -- --files   额外查仓库根目录的许可文件，识别 MIT+Apache 双许可
 *
 * 为什么需要它：`npm run content:audit` 只能告诉你「缺许可证」，缺什么、该填什么，
 * 得自己去翻 README。这里把**可核验的那一半**自动化：GitHub 的 licensee 会读仓库的
 * LICENSE 文件给出 SPDX 标识，比人从 README 里抄一句「MIT 开源」可靠。
 *
 * 三条边界，都是 2026-10-24 那轮补 98 条时踩出来的：
 *
 * 1. **只报告，不写数据。** 那次用脚本按行号插字段，判断「是否已有 license」时
 *    用的是行首缩进，结果把 guide 代码块里 4 空格缩进的示例代码当成字段，
 *    往 playwright / plasmic 的教程代码里插了一行 `license: "..."`。
 *    结论：结构改动靠行号不可靠，工具的职责止于给出候选值，落笔由人（或带上
 *    「插入后 item.license 是否真的生效」这种反查）来做。
 *
 * 2. **licensee 只报一个结果。** Rust 生态惯例是 `MIT OR Apache-2.0`，
 *    GitHub 会报 Apache-2.0。按单值记会把「可以按 MIT 用」这个条件说窄，
 *    所以 Apache-2.0 的结果要用 --files 再查一眼根目录有没有 LICENSE-MIT。
 *
 * 3. **NOASSERTION 不等于没有许可。** 自定义许可（Apache-2.0 + 附加条款）、
 *    多组件分许可、只在 README 写一句的，licensee 一律认不出。这类必须人工读原文 ——
 *    项目约定是「核验不到就留空」，不要拿 Apache-2.0 去凑。
 *
 * 依赖 `gh`（已登录）。未安装或未授权时如实报错并退出，不静默返回空结果。
 */
import { execFileSync } from "node:child_process";
import process from "node:process";

const { software } = await import("../data/software.ts");
const { parseFlags } = await import("./_shared.mjs");

const args = parseFlags(process.argv.slice(2), { "--json": "bool", "--files": "bool" });

function repoOf(item) {
  const url = item.links?.github || (/github\.com/.test(item.officialUrl ?? "") ? item.officialUrl : null);
  if (!url) return null;
  const match = url.match(/github\.com\/([^/#?]+)\/([^/#?]+)/i);
  return match ? `${match[1]}/${match[2].replace(/\.git$/, "")}` : null;
}

function ghApi(path, jq) {
  return JSON.parse(execFileSync("gh", ["api", path, "--jq", jq], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }));
}

const gaps = software
  .filter((item) => item.source === "opensource" && (item.kind ?? "opensource") !== "app" && !item.license?.trim())
  .map((item) => ({ slug: item.slug, name: item.name, repo: repoOf(item) }));

/**
 * 「源码公开但按约定不要求填 license」的条目：kind 明确标了 app，
 * 说明它不是 OSI 开源项目（BSL、fair-code、自定义 EULA 都是这一档）。
 * 单独列出来而不是当成缺口，也别让它悄悄消失 —— 这批的许可形态由正文承担，
 * 换人接手时要能一眼看到是哪些。
 */
const byBody = software
  .filter((item) => item.source === "opensource" && item.kind === "app" && !item.license?.trim())
  .map((item) => ({ slug: item.slug, repo: repoOf(item) }));

if (!gaps.length) {
  console.log("没有缺口：所有标为「开源项目」（kind ≠ app）的条目都写了许可证。");
  if (byBody.length) {
    console.log(`\n另有 ${byBody.length} 条源码公开、许可由正文承担的条目（kind=app，按约定不填 SPDX）：`);
    for (const row of byBody) console.log(`  ${row.slug.padEnd(24)} ${row.repo ?? "(无仓库)"}`);
  }
  process.exit(0);
}

const rows = [];
for (const gap of gaps) {
  if (!gap.repo) {
    rows.push({ ...gap, proposal: null, state: "无 GitHub 仓库，只能人工核" });
    continue;
  }
  try {
    const data = ghApi(`repos/${gap.repo}`, "{full_name, license: .license.spdx_id}");
    const spdx = data.license;
    if (!spdx || spdx === "NOASSERTION") {
      rows.push({ ...gap, proposal: null, state: "GitHub 认不出（自定义/多许可），需人工读原文" });
      continue;
    }
    let proposal = spdx;
    let state = "GitHub 检测";
    if (args.files) {
      try {
        const names = ghApi(`repos/${gap.repo}/contents`, "[.[] | .name]");
        const hasMit = names.some((name) => /^licen[cs]e.*mit/i.test(name));
        const hasApache = names.some((name) => /^licen[cs]e.*apache/i.test(name));
        if (hasMit && hasApache && spdx === "Apache-2.0") {
          proposal = "MIT OR Apache-2.0";
          state = "双许可（根目录有 MIT 与 Apache 两个许可文件）";
        }
      } catch {
        // 目录列表失败不影响主结论，保留单值方案。
      }
    }
    rows.push({ ...gap, proposal, state });
  } catch (error) {
    rows.push({ ...gap, proposal: null, state: "请求失败：" + String(error.stderr || error.message || error).trim().slice(0, 120) });
  }
}

if (args.json) {
  console.log(JSON.stringify({ total: software.length, gaps: rows.length, rows }, null, 2));
  process.exit(0);
}

const ready = rows.filter((row) => row.proposal);
const manual = rows.filter((row) => !row.proposal);

console.log(`许可证缺口 ${rows.length} 条，其中 ${ready.length} 条可从 GitHub 核验：\n`);
for (const row of ready) console.log(`  ${row.slug.padEnd(28)} ${String(row.proposal).padEnd(26)} ${row.state}`);
if (manual.length) {
  console.log(`\n需要人工读原文 ${manual.length} 条：`);
  for (const row of manual) console.log(`  ${row.slug.padEnd(28)} ${row.repo ?? "(无仓库)"}  ${row.state}`);
}
console.log("\n本命令只报告，不写数据：确认后再改 data/software.ts，然后 npm run seed:drift -- --strict 复核。");
