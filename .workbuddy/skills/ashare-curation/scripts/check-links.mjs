#!/usr/bin/env node
/**
 * 条目链接探活：确认收录来源是否还可达。
 *
 *   node scripts/check-links.mjs --slug vscode
 *   node scripts/check-links.mjs --url https://example.com/a --url https://example.com/b
 *   node scripts/check-links.mjs --all
 *   node scripts/check-links.mjs --all --strict       有不可达链接时退出码 1
 *   node scripts/check-links.mjs --all --timeout 5000 --retries 0
 *
 * HEAD 被拒（403/405/400/501）时自动改用 GET 再判一次。
 * 403 也可能是站点拦截自动化请求，需人工打开确认，不要直接判定链接失效。
 * 网络抖动会造成偶发超时（同一地址重跑一次就 200），默认失败后重试 1 次；
 * --retries 0 退回「只测一次」。
 *
 * 安全：--url 可以传入任意地址，因此抓取走 safeFetch——只放行 http/https，
 * 拒绝解析到私有/保留网段的主机，并手动跟随重定向逐跳校验。要测本机服务
 * 才加 --allow-private，别用它去碰内网。
 */
import process from "node:process";
import { githubApiOf, mapLimit, parseFlags, readCatalog, safeFetch } from "../../../../scripts/_shared.mjs";

const UA = "Mozilla/5.0 (compatible; AshareLinkCheck/1.0; +https://example.invalid)";
const RETRY_STATUS = new Set([400, 403, 405, 501]);
const CONCURRENCY = 5;
const USAGE =
  "用法: node scripts/check-links.mjs [--slug <slug> ...] [--url <url> ...] [--all] [--timeout <毫秒>] [--retries <次数>] [--strict] [--allow-private]";

function parseArgs(argv) {
  const args = parseFlags(argv, {
    "--slug": "list",
    "--url": "list",
    "--all": "bool",
    "--timeout": "number",
    "--retries": "number",
    "--strict": "bool",
    "--allow-private": "bool",
  });
  if (args.timeout !== undefined && (!Number.isInteger(args.timeout) || args.timeout < 1000)) {
    throw new Error("--timeout 需为不小于 1000 的整数（毫秒）");
  }
  if (args.retries !== undefined && (!Number.isInteger(args.retries) || args.retries < 0 || args.retries > 5)) {
    throw new Error("--retries 需为 0–5 的整数");
  }
  args.timeout ??= 10_000;
  args.retries ??= 1;
  if (!args.help && !args.all && !args.slug.length && !args.url.length) {
    throw new Error(`必须指定 --all、至少一个 --slug 或 --url\n${USAGE}`);
  }
  return args;
}

/**
 * 探活会失败、但站点其实活着的域名。每行都曾人工打开确认过，标注日期。
 * 输出时只做提示、不改变判定——真死链时这条提示会误导，所以过期要重验。
 */
const FLAKY = new Map([
  ["inkscape.org", "Cloudflare 拦自动化请求，403 是误报（2026-09-28 人工打开确认）"],
  ["jasp-stats.org", "同上，403 是误报（2026-09-28 人工打开确认）"],
  ["texstudio.org", "本机代理隧道超时，站点活着（2026-09-28 人工打开确认）"],
  ["gimp.org", "同上，代理超时（2026-09-28 人工打开确认）"],
]);

/** 单次判定：HEAD 被拒就改用 GET。 */
async function once(url, options) {
  const head = await safeFetch(url, { ...options, method: "HEAD" });
  return RETRY_STATUS.has(head.status) ? await safeFetch(url, { ...options, method: "GET" }) : head;
}

/** 4xx 是站点的明确响应，重试没意义；5xx 与网络失败才重试。 */
async function probe(url, options) {
  const started = Date.now();
  const headers = { "user-agent": UA, accept: "*/*" };
  let last = await once(url, { ...options, headers });
  for (let round = 0; round < options.retries && !last.ok; round += 1) {
    if (last.status >= 400 && last.status < 500) break;
    last = await once(url, { ...options, headers });
  }
  if (!last.ok) {
    const api = githubApiOf(url);
    if (api) {
      const viaApi = await safeFetch(api, { ...options, headers, method: "GET" });
      if (viaApi.ok) {
        return { ok: true, status: viaApi.status, finalUrl: `${api}（GitHub API 代验）`, ms: Date.now() - started };
      }
    }
  }
  return { ...last, ms: Date.now() - started };
}

function label(url) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(USAGE);
    return;
  }

  const jobs = [];
  // --url 用于核验还没入库的候选地址（选题阶段），不需要运行库。
  for (const url of args.url) jobs.push({ slug: "(直连)", key: label(url), url });

  if (args.all || args.slug.length) {
    const catalog = await readCatalog();
    const targets = catalog.filter((item) => args.all || args.slug.includes(item.slug));
    if (!targets.length) {
      console.log(`没有匹配 ${args.slug.join("、")} 的条目。`);
      return;
    }
    for (const item of targets) {
      for (const key of ["official", "homepage", "github", "disk"]) {
        if (item.links?.[key]) jobs.push({ slug: item.slug, key, url: item.links[key] });
      }
    }
  }
  if (!jobs.length) {
    console.log("没有可检查的链接：这些条目没有填写外链。");
    return;
  }

  console.log(`检查 ${jobs.length} 个链接（并发 ${CONCURRENCY}，超时 ${args.timeout}ms，重试 ${args.retries} 次${args.allowPrivate ? "，允许私有地址" : ""}）\n`);
  const results = await mapLimit(jobs, CONCURRENCY, async (job) => ({ ...job, ...await probe(job.url, args) }));

  for (const result of results) {
    const status = result.status ? String(result.status) : result.reason;
    const verdict = result.ok ? "可达" : result.status ? "异常" : "失败";
    console.log(`${verdict}  ${result.slug.padEnd(14)} ${result.key.padEnd(9)} ${String(status).padEnd(24)} ${result.ms}ms`);
  }

  const broken = results.filter((result) => !result.ok);
  console.log(`\n合计 ${results.length} 个，异常 ${broken.length} 个。`);
  if (broken.length) {
    console.log("需人工确认：403/405 多为站点拦截自动化请求，超时多为网络问题，别直接判定失效。");
    for (const result of broken) {
      const note = FLAKY.get(label(result.url).replace(/^www\./, ""));
      if (note) console.log(`  ${result.slug} ${result.key}：${note}`);
    }
    if (args.strict) process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(`[check-links] ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
