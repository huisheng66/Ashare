import assert from "node:assert/strict";
import test from "node:test";

import { software as seed } from "../data/software.ts";
import { seedToItem } from "../lib/seed.ts";
import { describeSourceKind, isValidSourceKind } from "../lib/semantics.ts";

const baseSeed = {
  slug: "x-tool",
  name: "X Tool",
  aliases: [],
  summary: "s",
  scenes: ["code"],
  platforms: ["windows"],
  source: "official",
  officialUrl: "https://example.com/",
  officialLabel: "example.com",
  whoFor: "a",
  whoNot: "b",
  installTips: ["t1"],
  alternatives: [],
  icon: { letter: "X", color: "#111111" },
};

test("seedToItem 缺省行为与历史一致：空正文空标签，links 取 officialUrl", () => {
  const item = seedToItem({ ...baseSeed });
  assert.equal(item.body, "");
  assert.deepEqual(item.tags, []);
  assert.deepEqual(item.links, { official: "https://example.com/" });
  assert.equal(item.kind, "app");
  assert.equal(item.status, "published");
  assert.deepEqual(item.tutorial, ["t1"]);
});

test("seedToItem 透传种子自带的 body / tags / kind / links", () => {
  const item = seedToItem({
    ...baseSeed,
    tags: ["a", "b"],
    body: "第一段。\n第二段。",
    kind: "script",
    links: { official: "https://example.com/", github: "https://github.com/a/b" },
  });
  assert.deepEqual(item.tags, ["a", "b"]);
  assert.equal(item.body, "第一段。\n第二段。");
  assert.equal(item.kind, "script");
  assert.deepEqual(item.links, { official: "https://example.com/", github: "https://github.com/a/b" });
});

test("source 为 opensource 时 kind 默认推导为 opensource，显式 kind 优先", () => {
  assert.equal(seedToItem({ ...baseSeed, source: "opensource" }).kind, "opensource");
  assert.equal(seedToItem({ ...baseSeed, source: "opensource", kind: "app" }).kind, "app");
});

test("种子里写了正文的条目，全新部署后仍然带正文（不再被 seedToItem 清空）", () => {
  const withBody = seed.filter((entry) => typeof entry.body === "string" && entry.body.length > 0);
  assert.ok(withBody.length > 0, "至少应有一条种子带正文");
  const built = seed.map(seedToItem);
  for (const entry of withBody) {
    const item = built.find((candidate) => candidate.slug === entry.slug);
    assert.ok(item, `${entry.slug} 应出现在种子目录里`);
    assert.equal(item.body, entry.body, `${entry.slug} 的正文在灌库时被丢了`);
    assert.deepEqual(item.tags, entry.tags, `${entry.slug} 的标签在灌库时被丢了`);
  }
});

test("显式写了 kind 的种子，其 source/kind 组合必须在语义矩阵内", () => {
  // 早先的版本断言「source=opensource 就必须是 kind=opensource」，
  // 那条约束过严：opensource + app 是 lib/semantics.ts 里明确允许的组合
  // （「开源但以应用形态分发的工具」），也是覆盖 inferKind推导值的正规手段。
  //
  // n8n 就是这个用法：它是 fair-code，不是 OSI 开源，却因源码公开
  // 而标了 source=opensource；若不加显式 kind，就会被推成 kind=opensource、
  // 前台挂出「开源」徽章，与正文「n8n 不是 OSI 意义上的开源软件」矛盾。
  //
  // 真正该守的是**组合合法**，而不是某个字段的固定搭配 ——
  // 合法性由 validateSemantics() 判定，不在这里重写一遍矩阵。
  for (const entry of seed) {
    if (!entry.kind) continue;
    assert.ok(
      isValidSourceKind(entry.source, entry.kind),
      `${entry.slug} 的 source=${entry.source} + kind=${entry.kind} 不是合法组合` +
        `（${describeSourceKind(entry.source, entry.kind)}）`,
    );
  }
});

test("种子条目的正文若非空，至少两段且不含 Markdown 标题", () => {
  for (const entry of seed) {
    if (!entry.body) continue;
    const paragraphs = entry.body.split("\n").filter((p) => p.trim().length > 0);
    assert.ok(paragraphs.length >= 2, `${entry.slug} 的正文只有 ${paragraphs.length} 段`);
    assert.ok(!entry.body.includes("##"), `${entry.slug} 的正文不应含 Markdown 标题`);
  }
});

test("种子里的许可证与核验日期格式合法", async () => {
  // SPDX 标识的常见形态；核验不到时应当整字段留空，而不是填「未知」之类占位。
  // 表达式（A OR B、A WITH B）交给 describeLicense 判定，不自己写正则 ——
  // 自写的那版漏掉了 OR，LibreOffice 的双许可被误判为非法。
  const { describeLicense } = await import("../lib/license-info.ts");
  for (const entry of seed) {
    if (entry.license !== undefined) {
      assert.ok(entry.license, `${entry.slug} 的 license 不应为空字符串`);
      // 单个标识必须能被认出来；双许可允许无法推断（AND/WITH），
      // 但至少不能是空白或明显不是标识的东西。
      const looksLikeSpdx = /^[A-Za-z0-9.+-]+(\s+(OR|AND|WITH)\s+[A-Za-z0-9.+-]+)*$/.test(entry.license);
      assert.ok(
        looksLikeSpdx,
        `${entry.slug} 的 license「${entry.license}」不像 SPDX 标识`,
      );
      // 凡是单个（非表达式）标识，都必须有对应的展示文案，否则前台会静默不显示。
      if (!/\s+(OR|AND|WITH)\s+/.test(entry.license)) {
        assert.ok(describeLicense(entry.license), `${entry.slug} 的 license「${entry.license}」缺少展示文案`);
      }
    }
    if (entry.linksCheckedAt !== undefined) {
      assert.match(entry.linksCheckedAt, /^\d{4}-\d{2}-\d{2}$/, `${entry.slug} 的 linksCheckedAt 应为 YYYY-MM-DD`);
    }
    if (entry.version !== undefined) {
      assert.ok(entry.version.trim(), `${entry.slug} 的 version 不应为空字符串`);
    }
  }
});

test("漂移检测的字段清单覆盖全部可透传字段", async () => {
  // 背景：加 linksCheckedAt 时只把它加进了类型与种子，忘了加进 seed-drift 的
  // COMPARE 清单，于是运行库 35 条都有值、种子全空，脚本却报「0 不一致」。
  // **漂移检测的失明是静默的，不会报错** —— 只能靠这条测试兜住。
  const { readFile } = await import("node:fs/promises");
  const script = await readFile(new URL("../scripts/seed-drift.mjs", import.meta.url), "utf8");
  const match = /const COMPARE = \[([\s\S]*?)\]/.exec(script);
  assert.ok(match, "seed-drift.mjs 里应能找到 COMPARE 数组");

  const compared = new Set(
    match[1]
      .split(",")
      .map((s) => s.trim().replace(/^["']|["']$/g, ""))
      .filter(Boolean),
  );
  // 凡是 Software 上存在、且种子允许写入的可选字段，都必须被比对。
  for (const field of ["license", "version", "linksCheckedAt"]) {
    assert.ok(compared.has(field), `seed-drift 的 COMPARE 漏了 ${field}，该字段的漂移将无法被发现`);
  }
});

test("seed-sync 的同步字段覆盖漂移检测的全部字段", async () => {
  // 背景：seed-sync 早期只同步 guide，于是改了 body / summary 会被静默忽略——
  // 运行库留旧值，seed:drift 报出不一致，而 seed-sync 又说「已是最新」，
  // 两个脚本互相甩锅，只能靠人肉比对JSON 才发现。
  //
  // 这条测试锁住两个脚本的字段清单必须一致：**漂移能查出来的，同步就必须能修。**
  const { readFile } = await import("node:fs/promises");
  const drift = await readFile(new URL("../scripts/seed-drift.mjs", import.meta.url), "utf8");
  const sync = await readFile(new URL("../scripts/seed-sync.mjs", import.meta.url), "utf8");

  const driftMatch = /const COMPARE = \[([\s\S]*?)\]/.exec(drift);
  const syncMatch = /const SYNCED_FIELDS = \[([\s\S]*?)\]/.exec(sync);
  assert.ok(driftMatch, "seed-drift.mjs 里应能找到 COMPARE 数组");
  assert.ok(syncMatch, "seed-sync.mjs 里应能找到 SYNCED_FIELDS 数组");

  const toSet = (body) =>
    new Set(
      body.split(",")
        .map((s) => s.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean),
    );

  const compared = toSet(driftMatch[1]);
  const synced = toSet(syncMatch[1]);

  // price 有意不同步：它是商业信息，可能由后台按谈判结果维护，
  // 种子里的值只是录入时的快照，合法地与运行库不同。
  //
  // license 与 kind 曾被列在这里，判断是错的，两者已移入 SYNCED_FIELDS：
  //   - license 是项目自身的客观属性，后台无从手工裁定；
  //   - kind 需要在种子里显式覆盖推导值（如 n8n 是 fair-code，
  //     不能让 seedToItem 按 source 推成 "opensource"），
  //     不同步的话种子里的修正永远传不到运行库。
  const intentionallyManual = new Set(["price"]);

  const missing = [...compared].filter((f) => !synced.has(f) && !intentionallyManual.has(f));

  assert.deepEqual(
    missing,
    [],
    `这些字段漂移检查会报，但 seed-sync 不同步，修不掉：${missing.join(", ")}`,
  );
});

