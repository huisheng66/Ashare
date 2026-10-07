#!/usr/bin/env node
/**
 * 外链巡检：找出该复验的条目，并可对复验通过的条目回写核验日期。
 *
 *   node scripts/stale-links.mjs                       列出超过 90 天没核验的条目
 *   node scripts/stale-links.mjs --days 30             改阈值
 *   node scripts/stale-links.mjs --all                 连刚核验过的也列出（看全量）
 *   node scripts/stale-links.mjs --check               顺便探活（只读，不改数据）
 *   node scripts/stale-links.mjs --check-all           探活全站（不看门槛）
 *   node scripts/stale-links.mjs --check --update      探活并回写通过者的核验日期
 *   node scripts/stale-links.mjs --all --json          机器可读
 *   node scripts/stale-links.mjs --strict              有该复验的条目时退出码 1（用于 CI）
 *   node scripts/stale-links.mjs --source seed         从种子读目录（CI 上没有运行库时用）
 *
 * **回写只覆盖本次真正探活过且可达的条目。** 失败项的日期保持不变 ——
 * 把失效链接的核验日期刷成今天，会让下一轮巡检以为它刚查过，掩盖真死链。
 *
 * `--check-all` 是 CI 真正该用的模式：链接昨天还正常、今天挂了，只查「过期」
 * 是发现不了的。门槛决定「什么时候必须复验」，不限制「能查什么」。
 *
 * `--source seed` 的存在是因为 `data/store/` 已 gitignore：CI 克隆后没有
 * 运行库，只有 `data/software.ts` 与 `data/samples.ts`。Node 靠类型擦除能
 * 直接 import 这两个 .ts，不必先构建。
 *
 * `--flaky-ok` 让 `--strict` 忽略人工确认过的误报域名。不用它的话，
 * inkscape / jasp 的 Cloudflare 403 与 texstudio 的代理超时会让流水线长期
 * 变红，人就开始习惯性忽略，真死链反而被淹没。
 *
 * 安全：抓取走 safeFetch（只放行 http/https、拒绝私有网段、逐跳校验重定向）。
 * 本机服务需显式加 --allow-private。
 */
import process from "node:process";

import { guideUrls } from "../lib/guide.ts";
import { DEFAULT_STALE_DAYS, checkFreshness, reasonLabel, staleItems, summarize, today } from "../lib/stale.ts";
import { isDbMode, mapLimit, githubApiOf, parseFlags, readCatalog, safeFetch, withDb } from "./_shared.mjs";

const CONCURRENCY = 5;
const UA = "Mozilla/5.0 (compatible; AshareStaleLinks/1.0; +https://example.invalid)";
const RETRY_STATUS = new Set([400, 403, 405, 501]);
const LINK_KEYS = ["official", "homepage", "github", "disk"];
const USAGE = `用法: node scripts/stale-links.mjs [--days <天数>] [--all] [--check] [--check-all] [--update] [--json] [--strict] [--flaky-ok] [--source <store|seed>] [--allow-private]`;

function parseArgs(argv) {
  const args = parseFlags(argv, {
    "--days": "number",
    "--all": "bool",
    "--check-all": "bool",
    "--check": "bool",
    "--update": "bool",
    "--json": "bool",
    "--strict": "bool",
    "--flaky-ok": "bool",
    "--source": "value",
    "--allow-private": "bool",
  });
  // 先做联动，再校验 —— 否则 --check-all 还没把 args.check 置上，
  // 下面的「--strict 需要 --check」会把合法组合判成非法。
  if (args.checkAll) args.check = true;

  if (args.days !== undefined && (!Number.isInteger(args.days) || args.days < 0)) {
    throw new Error("--days 需为不小于 0 的整数");
  }
  // --update 必须建立在 --check 上：没探活就刷新日期，等于伪造核验记录。
  if (args.update && !args.check) throw new Error("--update 必须配合 --check 使用");
  if (args.update && args.source === "seed") {
    throw new Error("--source seed 是只读模式：种子由代码仓库管理，不能回写核验日期");
  }
  if (args.strict && !args.check) throw new Error("--strict 需要配合 --check 才有意义");
  if (args.source !== undefined && !["store", "seed"].includes(args.source)) {
    throw new Error("--source 只支持 store 或 seed");
  }
  // 豁免误报只在 --strict 下有意义：平时输出里照样会提示这些域名。
  if (args.flakyOk && !args.strict) throw new Error("--flaky-ok 需要配合 --strict 使用");
  args.days ??= DEFAULT_STALE_DAYS;
  args.source ??= "store";
  return args;
}

/**
 * 从种子重建目录条目。CI 上没有运行库时用这条路径。
 *
 * **必须过 `seedToItem` 转换。** 种子是 `SeedSoftware` 形态：官网在
 * `officialUrl` 而非 `links.official`，30 条里只有 18 条填了 `links`。
 * 直接读种子会漏掉那 17 条的外链 —— 「全站探活却漏了半数条目」就是这么来的。
 */
async function catalogFromSeed() {
  const [{ software }, { samples }, { seedToItem }] = await Promise.all([
    import("../data/software.ts"),
    import("../data/samples.ts"),
    import("../lib/seed.ts"),
  ]);
  return [...software.map(seedToItem), ...samples];
}

function label(url) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

/** 已知误报域名：探活失败但站点活着，附人工确认日期。 */
const FLAKY = new Map([
  ["inkscape.org", "Cloudflare 拦自动化，403 是误报（2026-09-28 人工确认）"],
  ["jasp-stats.org", "同上，403 是误报（2026-09-28 人工确认）"],
  ["texstudio.org", "本机代理隧道超时，站点活着（2026-09-28 人工确认）"],
  ["gimp.org", "同上，代理超时（2026-09-28 人工确认）"],
]);

async function probe(url, args) {
  const started = Date.now();
  const headers = { "user-agent": UA, accept: "*/*" };
  const options = { timeout: 10_000, allowPrivate: args.allowPrivate, headers };
  const once = async () => {
    const head = await safeFetch(url, { ...options, method: "HEAD" });
    return RETRY_STATUS.has(head.status) ? await safeFetch(url, { ...options, method: "GET" }) : head;
  };
  let last = await once();
  if (!last.ok && !last.status) last = await once();
  // github.com 网页端在本机与 CI 上都常被网络策略拦住，改用同仓库的 API 代验。
  // 不做这一步，CI 会把 6 个正常的 GitHub 链接全判成超时。
  if (!last.ok) {
    const api = githubApiOf(url);
    if (api) {
      const viaApi = await safeFetch(api, { ...options, method: "GET" });
      if (viaApi.ok) {
        return { ok: true, status: viaApi.status, finalUrl: `${api}（GitHub API 代验）`, ms: Date.now() - started };
      }
    }
  }
  return { ...last, ms: Date.now() - started };
}

/**
 * 复验通过后回写核验日期。只改本次确实探活过、且全部链接可达的条目。
 *
 * P10 起写的是 MySQL（运行库的权威位置）。--source seed 时无法回写 —— 种子在 git 里，
 * 由收录流程维护，不该被巡检脚本改。
 */
async function updateChecked(slugs, date) {
  if (!isDbMode()) {
    throw new Error("--update 需要 MySQL 运行库（配置 MYSQL_URL）。种子在 git 里，巡检不回写。");
  }
  let changed = 0;
  await withDb(async (conn) => {
    for (const slug of slugs) {
      // 只动 links_checked_at：核验外链不是内容更新，改 updated_at 会让条目虚假地跳到「最近更新」。
      const [result] = await conn.query(
        "UPDATE items SET links_checked_at = ? WHERE slug = ? AND (links_checked_at IS NULL OR links_checked_at <> ?)",
        [date, slug, date],
      );
      changed += Number(result.affectedRows ?? 0);
    }
  });
  return { changed };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(USAGE);
    return;
  }

  const fromSeed = args.source === "seed";
  const catalog = fromSeed ? await catalogFromSeed() : await readCatalog();
  const now = new Date();
  // --check-all：即便没有过期条目也把全站链接探一遍。
  // 死链巡检的本意是发现失效链接，而链接昨天还正常、今天挂了，只看「过期」
  // 是发现不了的 —— 门槛只是决定「什么时候必须复验」，不是「能查什么」。
  const allMode = args.all || args.checkAll;
  const infos = allMode
    ? catalog.map((item) => checkFreshness(item, args.days, now))
    : staleItems(catalog, args.days, now);

  const needCheck = allMode ? infos : infos.filter((info) => info.reason !== "fresh");
  const stats = summarize(infos);

  if (args.json) {
    console.log(JSON.stringify({
      source: args.source,
      thresholdDays: args.days,
      total: catalog.length,
      needCheck: needCheck.length,
      byReason: stats.byReason,
      items: needCheck,
    }, null, 2));
    if (args.check) {
      console.error("[stale-links] --json 与 --check 同用时只输出过期清单，探活结果见文本模式。");
    }
    if (args.strict && needCheck.length) process.exitCode = 1;
    return;
  }

  const origin = fromSeed ? "（来源：种子，CI 只读）" : "";
  const scope = allMode ? "全站" : "需复验";
  console.log(`阈值 ${args.days} 天 · 目录 ${catalog.length} 条 · ${scope} ${needCheck.length} 条 ${origin}`.trimEnd());
  console.log(`  已过期 ${stats.byReason.stale} · 从未核验 ${stats.byReason.never} · 日期非法 ${stats.byReason.invalid}\n`);

  if (!needCheck.length) {
    console.log("所有条目的外链都在阈值内，无需复验。");
    return;
  }

  const width = Math.max(...needCheck.map((info) => info.slug.length), 4);
  for (const info of needCheck) {
    const age = typeof info.ageDays === "number" ? `${info.ageDays} 天前` : "—";
    // 全站模式下清单太长，逐条列出会淹没真正需要看的部分。
    if (args.check) continue;
    console.log(`${reasonLabel(info.reason).padEnd(6)} ${info.slug.padEnd(width)} ${age.padStart(8)}  ${info.hosts.join(" ")}`);
  }

  if (!args.check) {
    console.log(`\n加 --check 探活这 ${needCheck.length} 条；确认无误后加 --update 回写核验日期。`);
    if (args.strict) process.exitCode = 1;
    return;
  }

  const jobs = [];
  for (const info of needCheck) {
    const item = catalog.find((entry) => entry.slug === info.slug);
    for (const key of LINK_KEYS) {
      if (item?.links?.[key]) jobs.push({ slug: item.slug, key, url: item.links[key] });
    }
    // 教程正文与配套资料里的外链同样会失效，而核验日期是与 links 共用的
    // 那一个 —— 只探 links 会让教程链接永远轮不到复验。
    for (const url of guideUrls(item?.guide)) {
      jobs.push({ slug: item.slug, key: "guide", url });
    }
  }
  if (!jobs.length) {
    console.log("\n这些条目没有填写外链，无从探活。");
    return;
  }

  console.log(`\n探活 ${jobs.length} 个链接（并发 ${CONCURRENCY}）…\n`);
  const results = await mapLimit(jobs, CONCURRENCY, (job) => probe(job.url, args).then((r) => ({ ...job, ...r })));

  // 只有全部链接都可达的条目才回写日期：部分可达说明还有问题没解决。
  const fullyOk = new Set();
  const bySlug = new Map();
  for (const result of results) {
    const status = result.ok ? "可达" : result.status ? `异常 ${result.status}` : `失败 ${result.reason}`;
    console.log(`${status.padEnd(12)} ${result.slug.padEnd(width)} ${result.key.padEnd(9)} ${label(result.url)}`);
    if (!bySlug.has(result.slug)) bySlug.set(result.slug, []);
    bySlug.get(result.slug).push(result);
  }
  for (const [slug, list] of bySlug) {
    if (list.every((r) => r.ok)) fullyOk.add(slug);
  }

  const broken = results.filter((r) => !r.ok);
  console.log(`\n合计 ${results.length} 个，异常 ${broken.length} 个；条目层面 ${fullyOk.size}/${needCheck.length} 条全部可达。`);
  if (broken.length) {
    console.log("需人工确认：403/405 多为站点拦截自动化，超时多为网络问题，别直接判定失效。");
    for (const result of broken) {
      const note = FLAKY.get(label(result.url).replace(/^www\./, ""));
      if (note) console.log(`  ${result.slug} ${result.key}：${note}`);
    }
  }

  // --strict 的失败判定排除已知误报。否则 inkscape / jasp 的 Cloudflare 403
  // 与 texstudio 的代理超时会让流水线长期变红，人就开始习惯性忽略它 ——
  // 真死链反而被淹没。人工确认过的域名可以再用 --flaky-ok 显式豁免。
  const realBroken = broken.filter((r) => !FLAKY.has(label(r.url).replace(/^www\./, "")));
  if (broken.length > realBroken.length) {
    console.log(`\n已豁免 ${broken.length - realBroken.length} 个已知误报（--flaky-ok）。`);
  }

  if (args.update) {
    if (fromSeed) {
      // parseArgs 已拦下，这里是双保险：种子由代码仓库管理，不该被运行库数据改写。
      console.log("\n--source seed 为只读模式，核验日期未改动。");
    } else if (!fullyOk.size) {
      console.log("\n没有全部可达的条目，核验日期未改动。");
    } else {
      const date = today(now);
      const { changed } = await updateChecked([...fullyOk], date);
      console.log(`\n已把 ${changed} 条的核验日期更新为 ${date}${changed ? "" : "（无变化）"}。`);
      if (changed) console.log("别忘了同步种子（两个落点），再跑 npm run seed:drift。");
    }
  } else if (fullyOk.size && !fromSeed) {
    console.log(`\n加 --update 可把 ${fullyOk.size} 条的核验日期更新为今天。`);
  }

  if (args.strict) {
    if (args.flakyOk && realBroken.length < broken.length) {
      // 误报已豁免，只看真异常。
      if (realBroken.length) process.exitCode = 1;
    } else if (broken.length) {
      process.exitCode = 1;
    }
  }
}

main().catch((error) => {
  console.error(`[stale-links] ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
