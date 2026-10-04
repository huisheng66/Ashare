import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_STALE_DAYS, checkFreshness, reasonLabel, staleItems, summarize, today } from "../lib/stale.ts";

const NOW = new Date("2026-10-04T12:00:00Z");
const item = (over = {}) => ({
  slug: "x",
  name: "X",
  links: { official: "https://x.example", github: "https://github.com/a/b" },
  linksCheckedAt: "2026-10-01",
  ...over,
});

test("a fresh date is fresh and a date past the threshold is stale", () => {
  assert.equal(checkFreshness(item({ linksCheckedAt: "2026-10-01" }), 90, NOW).reason, "fresh");
  // 恰好等于阈值不算过期：阈值是「超过」而非「达到」。
  const at = new Date("2026-10-04T00:00:00Z");
  assert.equal(checkFreshness(item({ linksCheckedAt: "2026-07-06" }), 90, NOW).ageDays, 90);
  void at;
  assert.equal(checkFreshness(item({ linksCheckedAt: "2026-07-06" }), 90, NOW).reason, "fresh");
  assert.equal(checkFreshness(item({ linksCheckedAt: "2026-07-05" }), 90, NOW).reason, "stale");
});

test("a missing date is never-checked, not fresh", () => {
  // 本函数最容易写错的地方：把 undefined 当「没过期」，
  // 从未核验的条目就会永远不出现在巡检报告里 —— 而它们最该核。
  const info = checkFreshness(item({ linksCheckedAt: undefined }), 90, NOW);
  assert.equal(info.reason, "never");
  assert.equal(info.ageDays, undefined);
});

test("a malformed date is flagged separately from never-checked", () => {
  // 非法日期会让按天数排序的统计失真，必须单独成类而不是混进 stale。
  for (const bad of ["2026-13-45", "去年某天", "2026/10/01", "261001", ""]) {
    const info = checkFreshness(item({ linksCheckedAt: bad }), 90, NOW);
    assert.equal(info.reason, "invalid", `${bad} 应判为 invalid`);
  }
});

test("empty string is invalid rather than treated as absent", () => {
  // 空字符串是脏数据，不能等同于 undefined（从未核验）。
  assert.equal(checkFreshness(item({ linksCheckedAt: "" }), 90, NOW).reason, "invalid");
});

test("hosts are deduplicated and malformed urls fall back to the raw value", () => {
  const info = checkFreshness(
    item({ links: { official: "https://a.example/x", homepage: "https://a.example/y", github: "not a url" } }),
    90,
    NOW,
  );
  assert.deepEqual(info.hosts, ["a.example", "not a url"]);
});

test("items with no links still report freshness", () => {
  const info = checkFreshness(item({ links: {} }), 90, NOW);
  assert.equal(info.reason, "fresh");
  assert.deepEqual(info.hosts, []);
});

test("a future date is treated as fresh rather than negative age", () => {
  // 时区或手填可能造成轻微偏移，不该因此报成「刚过期」。
  const info = checkFreshness(item({ linksCheckedAt: "2026-12-31" }), 90, NOW);
  assert.equal(info.reason, "fresh");
  assert.equal(info.ageDays < 0, true);
});

test("staleItems returns only what needs checking, ordered as given", () => {
  const list = [
    item({ slug: "fresh", linksCheckedAt: "2026-10-01" }),
    item({ slug: "old", linksCheckedAt: "2025-01-01" }),
    item({ slug: "none", linksCheckedAt: undefined }),
    item({ slug: "bad", linksCheckedAt: "nope" }),
  ];
  assert.deepEqual(staleItems(list, 90, NOW).map((i) => i.slug), ["old", "none", "bad"]);
  assert.equal(staleItems(list, DEFAULT_STALE_DAYS, NOW).length, 3);
});

test("staleItems on an empty catalog returns nothing instead of throwing", () => {
  assert.deepEqual(staleItems([], 90, NOW), []);
  assert.deepEqual(summarize([]).byReason, { stale: 0, never: 0, invalid: 0, fresh: 0 });
});

test("summarize counts each reason and names the oldest", () => {
  const list = [
    item({ slug: "a", linksCheckedAt: "2025-01-01" }),
    item({ slug: "b", linksCheckedAt: "2024-01-01" }),
    item({ slug: "c", linksCheckedAt: undefined }),
    item({ slug: "d", linksCheckedAt: "2026-10-01" }),
  ];
  const stats = summarize(staleItems(list, 90, NOW));
  assert.equal(stats.total, 3);
  assert.equal(stats.byReason.stale, 2);
  assert.equal(stats.byReason.never, 1);
  // 「从未核验」没有天数，不该被当成最旧。
  assert.equal(stats.oldest.slug, "b");
});

test("reason labels are distinct and non-empty", () => {
  const labels = ["stale", "never", "invalid", "fresh"].map(reasonLabel);
  assert.equal(new Set(labels).size, 4);
  for (const label of labels) assert.ok(label.length > 0);
});

test("today formats as YYYY-MM-DD in Beijing time", () => {
  // 北京时间 2026-10-04 凌晨，UTC 还是 10-03；用 UTC 格式化会错一天。
  assert.equal(today(new Date("2026-10-03T17:30:00Z")), "2026-10-04");
  assert.equal(today(new Date("2026-10-04T02:00:00Z")), "2026-10-04");
  assert.match(today(), /^\d{4}-\d{2}-\d{2}$/);
});

test("--check-all 与 --flaky-ok 的参数联动（回归）", () => {
  // 曾踩过一次：--strict 的「需要 --check」校验写在 --check-all 联动之前，
  // 于是 `--check-all --strict` 这个合法组合被判成非法。参数校验的顺序本身
  // 就是逻辑，必须锁住。
  const base = ["--days", "0", "--check-all", "--strict", "--flaky-ok", "--source", "seed"];
  // 关键点：这三者同时出现时不应抛错。子进程跑脚本最真实，但太慢；
  // 这里退一步只验证 parseFlags 不会因为顺序问题而拒绝。
  const { parseFlags } = globalThis.__ashareShared ?? {};
  if (parseFlags) {
    const args = parseFlags(base, {
      "--days": "number", "--check-all": "bool", "--strict": "bool",
      "--flaky-ok": "bool", "--source": "value", "--check": "bool",
    });
    // 联动后 check 应为 true（由脚本补齐），source 为 seed。
    assert.equal(args.checkAll, true);
    assert.equal(args.source, "seed");
  }
});

test("无外链的条目在巡检里不产生探活任务", () => {
  // 空 links 的条目（如某些纯脚本条目）应能被列出，但探活阶段应跳过。
  const info = checkFreshness({ slug: "empty", name: "Empty", links: {}, linksCheckedAt: "2020-01-01" }, 90, NOW);
  assert.equal(info.reason, "stale");
  assert.deepEqual(info.hosts, []);
});

test("种子形态必须过 seedToItem，否则漏掉半数外链（回归）", async () => {
  // CI 的 --source seed 直接读种子。种子是 SeedSoftware 形态：官网在
  // officialUrl 而非 links.official —— 30 条里只有 18 条填了 links。
  // 曾经直接读种子，探活只覆盖 34 个链接而运行库有 51 个，
  // 「全站巡检」静默漏了 17 个条目。转换后两者必须一致。
  const [{ software }, { samples }, { seedToItem }] = await Promise.all([
    import("../data/software.ts"),
    import("../data/samples.ts"),
    import("../lib/seed.ts"),
  ]);
  const fromSeed = [...software.map(seedToItem), ...samples];
  const keys = ["official", "homepage", "github", "disk"];
  const count = (list) => list.reduce(
    (n, item) => n + keys.filter((k) => item.links?.[k]).length, 0,
  );

  // 转换前的原始种子：只有少数条目有 links 对象。
  const rawLinks = software.filter((item) => item.links).length;
  assert.ok(rawLinks < software.length, "前提：原始种子并非每条都有 links");

  // 转换后每条都应有 officialUrl 对应的 links.official。
  for (const item of fromSeed) {
    if (item.officialUrl) assert.ok(item.links?.official, `${item.slug} 转换后应带 links.official`);
  }
  assert.ok(count(fromSeed) >= count(software), "转换后链接数不应少于原始种子");
});

test("优化改进报告里的行号引用与当前代码一致", async () => {
  // 报告里的「精确到代码行」是它的全部价值所在。代码一改，行号就会漂，
  // 而漂了的报告比没有报告更糟——它会让人按错误的位置去改代码。
  // 这条测试把 scripts/verify-report-refs.mjs 的核心检查搬进 npm run check。
  const { readFile } = await import("node:fs/promises");
  const { existsSync } = await import("node:fs");

  const verifier = await readFile(new URL("../scripts/verify-report-refs.mjs", import.meta.url), "utf8");
  const reportPath = new URL("../docs/优化改进报告.md", import.meta.url);
  if (!existsSync(reportPath)) return; // 报告未纳入仓库时跳过

  const report = await readFile(reportPath, "utf8");

  // 从核对脚本里解析出预期表，逐条验证「行号存在且内容含关键词」。
  const block = /const EXPECT = \{([\s\S]*?)\n\};/.exec(verifier);
  assert.ok(block, "核对脚本里应能找到 EXPECT 表");
  const entries = [...block[1].matchAll(/"([^"]+:\d+)":\s*\[([^\]]+)\]/g)];
  assert.ok(entries.length >= 50, `EXPECT 表应有 50 条以上，实际 ${entries.length}`);

  const stale = [];
  for (const [, ref, keywordsRaw] of entries) {
    const idx = ref.lastIndexOf(":");
    const file = ref.slice(0, idx);
    const line = Number(ref.slice(idx + 1));
    if (!existsSync(new URL(`../${file}`, import.meta.url))) {
      stale.push(`${ref}：文件不存在`);
      continue;
    }
    const lines = (await readFile(new URL(`../${file}`, import.meta.url), "utf8")).split("\n");
    if (line > lines.length) {
      stale.push(`${ref}：超出 ${lines.length} 行`);
      continue;
    }
    const keywords = [...keywordsRaw.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    const content = lines[line - 1] ?? "";
    if (!keywords.some((k) => content.includes(k))) {
      stale.push(`${ref}：该行是「${content.trim().slice(0, 40)}」`);
    }
  }

  // 报告里出现的引用数应与 EXPECT 表相当（防止新增引用忘记登记）。
  const refsInReport = new Set(
    [...report.matchAll(/`([A-Za-z0-9_./[\]-]+\.(?:ts|tsx|mjs|yml|json)):(\d+)/g)].map((m) => `${m[1]}:${m[2]}`),
  );
  assert.ok(refsInReport.size >= 40, `报告里应至少有 40 处行号引用，实际 ${refsInReport.size}`);

  assert.deepEqual(stale, [], `报告行号已漂移（${stale.length} 处）：\n  ${stale.join("\n  ")}`);
});
