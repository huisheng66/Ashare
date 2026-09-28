import assert from "node:assert/strict";
import test from "node:test";

import { software as seed } from "../data/software.ts";
import { seedToItem } from "../lib/seed.ts";

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

test("标了 opensource 的种子不允许显式 kind 为闭源类型，反之亦然", () => {
  for (const entry of seed) {
    if (!entry.kind) continue;
    if (entry.kind === "opensource") {
      assert.equal(entry.source, "opensource", `${entry.slug} 标了 kind=opensource 但 source 不是 opensource`);
    }
    if (entry.source === "opensource") {
      assert.equal(entry.kind, "opensource", `${entry.slug} 标了 source=opensource 但 kind 是 ${entry.kind}`);
    }
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
