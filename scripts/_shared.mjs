#!/usr/bin/env node
/**
 * 几个脚本共用的小工具：参数解析、运行库读取、并发限流、带 SSRF 防护的抓取。
 *
 * 本文件不是可执行入口，被 scripts/*.mjs 与技能脚本 import。
 */
import { lookup } from "node:dns/promises";
import { promises as fs } from "node:fs";
import net from "node:net";
import path from "node:path";
import process from "node:process";

const CATALOG_PATH = path.join("data", "store", "catalog.json");

/**
 * 通用参数解析。spec 里每个 flag 一种取值方式：
 *   bool   开关（--zip）
 *   value  取一个值（--out <目录>）
 *   number 取一个数字（--keep <份数>）
 *   list   可重复，累积成数组（--slug a --slug b）
 * 结果同时以带横线与驼峰两种名字提供（args["--out"] 与 args.out 等价）。
 * 取值范围、必填组合这类语义校验留给调用方。
 */
export function parseFlags(argv, spec) {
  const args = { help: false };
  const nameOf = (flag) => flag.replace(/^--/, "").replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  for (const [flag, kind] of Object.entries(spec)) args[nameOf(flag)] = kind === "list" ? [] : undefined;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      args.help = true;
      continue;
    }
    const kind = spec[arg];
    if (!kind) throw new Error(`未知参数：${arg}`);
    if (kind === "bool") {
      args[nameOf(arg)] = true;
      continue;
    }
    const value = argv[index + 1];
    if (value === undefined || value.startsWith("--")) throw new Error(`${arg} 缺少取值`);
    const name = nameOf(arg);
    if (kind === "list") args[name].push(value);
    else if (kind === "number") {
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) throw new Error(`${arg} 需要数字，收到「${value}」`);
      args[name] = parsed;
    } else args[name] = value;
    index += 1;
  }
  return args;
}

export async function readCatalog(cwd = process.cwd()) {
  const file = path.join(cwd, CATALOG_PATH);
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") throw new Error("data/store/catalog.json 不存在。先启动一次应用生成运行库。");
    throw error;
  }
}

export async function mapLimit(items, limit, worker) {
  const results = [];
  for (let index = 0; index < items.length; index += limit) {
    results.push(...await Promise.all(items.slice(index, index + limit).map(worker)));
  }
  return results;
}

/** 私有 / 保留 / 环回 / 组播网段——这些不该由脚本主动去请求。 */
const PRIVATE_V4 = [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8],
  ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24],
  ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24], ["203.0.113.0", 24],
  ["224.0.0.0", 4], ["240.0.0.0", 4],
];

const toInt = (ip) => ip.split(".").reduce((sum, part) => (sum << 8) + Number(part), 0) >>> 0;
const inCidr = (ip, base, bits) => (toInt(ip) & (bits ? (-1 << (32 - bits)) >>> 0 : 0)) === (toInt(base) & (bits ? (-1 << (32 - bits)) >>> 0 : 0));

export function isPrivateAddress(ip) {
  const value = String(ip).toLowerCase();
  if (value.includes(":")) {
    if (value === "::" || value === "::1") return true;
    const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(value);
    if (mapped) return isPrivateAddress(mapped[1]);
    if (value.startsWith("2001:db8")) return true; // 文档保留段
    // 取首段作为前 16 位：fc00::/7 与 fe80::/10 都落在这一段里
    const head = parseInt(value.split(":")[0].padStart(4, "0"), 16);
    if ((head & 0xfe00) === 0xfc00) return true; // fc00::/7 唯一本地
    if ((head & 0xffc0) === 0xfe80) return true; // fe80::/10 链路本地
    return value.startsWith("ff"); // 组播
  }
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(value)) return true;
  return PRIVATE_V4.some(([base, bits]) => inCidr(value, base, bits));
}

/**
 * 抓取前把主机名解析一遍，落到私有网段就拒绝。
 * 局限：解析与连接之间理论上存在 DNS rebinding 窗口，对本地 CLI 可接受；
 * 真正的防线是下面逐跳校验重定向——不给 redirect: "follow"，内网跳转无处可藏。
 */
async function assertReachable(hostname, allowPrivate) {
  if (allowPrivate) return;
  if (net.isIP(hostname)) {
    if (isPrivateAddress(hostname)) throw new Error(`拒绝请求私有地址 ${hostname}`);
    return;
  }
  let records;
  try {
    records = await lookup(hostname, { all: true });
  } catch (error) {
    throw new Error(`无法解析 ${hostname}：${error.code ?? error.message}`);
  }
  const blocked = records.find((record) => isPrivateAddress(record.address));
  if (blocked) throw new Error(`拒绝请求：${hostname} 解析到私有地址 ${blocked.address}`);
}

/** github.com 网页端在本机与 CI 上常被网络策略拦住（超时），api.github.com 通常可达。 */
const GIT_HOSTS = new Set(["github.com", "www.github.com"]);

/**
 * github.com 的仓库页 → 同仓库的 API 地址；非 github 或路径不完整时返回 undefined。
 * 探活脚本用它做代验：网页端超时不代表仓库不存在。
 */
export function githubApiOf(url) {
  try {
    const parsed = new URL(url);
    if (!GIT_HOSTS.has(parsed.hostname)) return undefined;
    const [owner, repo] = parsed.pathname.split("/").filter(Boolean);
    if (!owner || !repo) return undefined;
    return `https://api.github.com/repos/${owner}/${repo.replace(/\.git$/, "")}`;
  } catch {
    return undefined;
  }
}

/**
 * 带 SSRF 防护的抓取。只走 http/https，手动跟随重定向并逐跳校验。
 *
 * allowPrivate 只放宽第 0 跳（命令行里显式给出的那个地址），后续跳转一律按
 * 公网规则校验——否则「测一下本机 dev 服务」会被一个 302 带进内网。
 */
export async function safeFetch(url, options = {}) {
  const { timeout = 10_000, allowPrivate = false, headers = {}, method = "GET", maxRedirects = 5 } = options;
  let current = url;
  for (let hop = 0; hop <= maxRedirects; hop += 1) {
    let parsed;
    try {
      parsed = new URL(current);
    } catch {
      return { ok: false, status: 0, reason: "不是合法 URL" };
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { ok: false, status: 0, reason: `拒绝非 HTTP(S) 协议：${parsed.protocol}` };
    }
    try {
      await assertReachable(parsed.hostname, allowPrivate && hop === 0);
    } catch (error) {
      return { ok: false, status: 0, reason: error.message };
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    let response;
    try {
      response = await fetch(parsed, { method, redirect: "manual", signal: controller.signal, headers });
    } catch (error) {
      return {
        ok: false,
        status: 0,
        reason: error.name === "AbortError" ? `超时 ${timeout}ms` : (error.cause?.code ?? error.message),
      };
    } finally {
      clearTimeout(timer);
    }
    const location = response.headers.get("location");
    if (response.status >= 300 && response.status < 400 && location) {
      current = new URL(location, parsed).toString();
      continue;
    }
    return { ok: response.status < 400, status: response.status, finalUrl: response.url || parsed.toString() };
  }
  return { ok: false, status: 0, reason: `重定向超过 ${maxRedirects} 跳` };
}
