import assert from "node:assert/strict";
import { test } from "node:test";

import { samples } from "../data/samples.ts";
import { software as seed } from "../data/software.ts";
import { canonicalItem, fromBundle, ITEM_KEYS, nonContractKeys, searchTextOf, toBundle } from "../lib/catalog-rows.ts";
import { normalizeItems } from "../lib/normalize.ts";
import { seedToItem } from "../lib/seed.ts";

/**
 * 映射层往返测试：Software -> 数据库行 -> Software 必须一字不差。
 *
 * 用种子（data/software.ts + samples.ts）而不是 data/store/catalog.json：
 * 后者已 gitignore，CI 上没有，测试不能依赖它。
 *
 * 只对 canonicalItem() 抹平过的期望值比对 —— 它只丢两样东西：
 * 契约外的遗留键，以及 featured: false（与「没有 featured」等价）。
 */

// samples.ts 的条目没有时间戳，靠 normalizeItems 补齐 —— 与线上 getCatalogAll 同一套规则。
// 固定 fallback 让测试结果不随运行时刻变化。
const FALLBACK = new Date("2026-01-01T00:00:00.000Z");
const catalog = normalizeItems([...seed.map(seedToItem), ...samples.map((item) => structuredClone(item))], FALLBACK);

test("往返：全部种子条目 Software -> 行 -> Software 完全一致", () => {
  assert.ok(catalog.length >= 50, "种子条目数异常：" + catalog.length);
  const problems = [];
  catalog.forEach((item, index) => {
    const back = fromBundle(toBundle(item, index));
    try {
      assert.deepStrictEqual(back, canonicalItem(item));
    } catch (error) {
      problems.push(item.slug + ": " + error.message.split("\n").slice(0, 12).join(" | "));
    }
  });
  assert.deepStrictEqual(problems, []);
});

test("往返：顺序敏感字段（标签 / 场景 / 平台 / 替代品 / 教程 / 资源）保持原序", () => {
  for (const [index, item] of catalog.entries()) {
    const back = fromBundle(toBundle(item, index));
    assert.deepStrictEqual(back.tags, item.tags, item.slug + " 标签顺序");
    assert.deepStrictEqual(back.scenes, item.scenes, item.slug + " 场景顺序");
    assert.deepStrictEqual(back.platforms, item.platforms, item.slug + " 平台顺序");
    assert.deepStrictEqual(back.alternatives, item.alternatives, item.slug + " 替代品顺序");
    assert.deepStrictEqual(back.tutorial, item.tutorial, item.slug + " 教程步骤顺序");
    assert.deepStrictEqual(
      (back.guide?.resources ?? []).map((r) => r.title),
      (item.guide?.resources ?? []).map((r) => r.title),
      item.slug + " 教程资料顺序",
    );
  }
});

test("映射：sort_index 按入参落位，可作为稳定的目录顺序", () => {
  const bundle = toBundle(catalog[0], 7);
  assert.equal(bundle.item.sort_index, 7);
});

test("契约外的键只应有一个：种子遗留的 officialLabel", () => {
  const extras = new Set();
  for (const item of catalog) for (const key of nonContractKeys(item)) extras.add(key);
  assert.deepStrictEqual([...extras].sort(), ["officialLabel"]);
});

test("canonicalItem 只抹平契约外键与 featured:false，不吞真差异", () => {
  const base = structuredClone(catalog[0]);
  const withFalse = { ...base, featured: false, body: "" };
  const canonical = canonicalItem(withFalse);
  assert.equal("featured" in canonical, false, "featured:false 应被抹平");
  assert.equal(canonical.body, "", "空正文是真差异，不得被抹平");
  assert.equal(ITEM_KEYS.includes("officialLabel"), false);
});

test("search_text：NFKC 归一，且覆盖名称 / 别名 / 标签 / 简介", () => {
  const item = structuredClone(catalog[0]);
  item.name = "Ｔｅｓｔ";           // 全角
  item.nameZh = "测试";
  item.aliases = ["alias-one"];
  item.tags = ["标签甲"];
  item.summary = "简介文字";
  const text = searchTextOf(item);
  assert.ok(text.includes("Test"), "全角应归一成半角：" + text);
  for (const part of ["测试", "alias-one", "标签甲", "简介文字"]) assert.ok(text.includes(part), "缺 " + part);
});

test("往返：镜像校验三件套（diskNote / diskSha256 / diskFile）不丢", () => {
  const item = structuredClone(catalog[0]);
  item.links.disk = "https://example.com/mirror.zip";
  item.links.diskNote = "作者提供的官方镜像";
  item.links.diskSha256 = "a".repeat(64);
  item.links.diskFile = "mirror-1.0.zip";
  const back = fromBundle(toBundle(item, 0));
  assert.deepStrictEqual(back.links, item.links);
});

test("往返：featured 为真时保留，guide 缺失时不产出空 guide", () => {
  const item = structuredClone(catalog[0]);
  item.featured = true;
  delete item.guide;
  const back = fromBundle(toBundle(item, 0));
  assert.equal(back.featured, true);
  assert.equal("guide" in back, false);
});
