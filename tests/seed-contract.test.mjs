import assert from "node:assert/strict";
import { test } from "node:test";

import { seedToItem, SEED_CARRIED_FIELDS, SEED_DRIFT_EXCLUDED, SEED_DRIFT_FIELDS, SEED_SYNC_FIELDS } from "../lib/seed.ts";

/**
 * 种子透传契约。
 *
 * 这组断言防的是一类**静默失明**：漂移检查与同步脚本各有一份手写字段清单，
 * 新增可透传字段却忘了登记，检查就对它永远「相等」——不报错、不警告，
 * 只是从此看不见那个字段。guide 就是这么漏掉的（漂移报 0 不一致，同步却每轮重写 55 条）。
 */

const SOFTWARE_KEYS = new Set([
  "slug", "name", "nameZh", "aliases", "kind", "status", "tags", "summary", "body",
  "scenes", "platforms", "source", "price", "links", "tutorial", "guide", "whoFor", "whoNot",
  "discountNote", "alternatives", "featured", "previews", "iconImage", "createdAt", "updatedAt",
  "license", "version", "linksCheckedAt", "icon",
]);

test("登记表里的名字必须真的是 Software 的键", () => {
  // 写错名字的后果和漏登记一样：item[field] 两边都是 undefined，永远判定「相等」。
  for (const field of SEED_CARRIED_FIELDS) {
    assert.ok(SOFTWARE_KEYS.has(field), `登记表里的 ${field} 不是 Software 的键`);
  }
});

test("登记表被完整交代：CARRIED = DRIFT ∪ EXCLUDED，且 SYNC ⊆ DRIFT", () => {
  for (const field of SEED_CARRIED_FIELDS) {
    const covered = SEED_DRIFT_FIELDS.includes(field) || field in SEED_DRIFT_EXCLUDED;
    assert.ok(covered, `${field} 既没进漂移比对、也没登记例外 —— 这会让漂移检查对它失明`);
  }
  for (const field of Object.keys(SEED_DRIFT_EXCLUDED)) {
    assert.ok(SEED_CARRIED_FIELDS.includes(field), `例外里的 ${field} 不在登记表中`);
    assert.ok(SEED_DRIFT_EXCLUDED[field].length >= 4, `${field} 的例外必须写明理由`);
  }
  // guide 曾经是反例：同步会写它，漂移却看不见它。
  for (const field of SEED_SYNC_FIELDS) {
    assert.ok(SEED_DRIFT_FIELDS.includes(field), `同步会写 ${field}，漂移检查却看不见它`);
  }
});

test("登记表与实际透传行为一致：每个字段都能从种子带进运行库", () => {
  const base = seedToItem({ slug: "s", name: "n", aliases: [], summary: "", scenes: [], platforms: [], source: "official", officialUrl: "https://e.invalid", officialLabel: "官网", whoFor: "", whoNot: "", installTips: [], alternatives: [], icon: { letter: "A", color: "#000" } });
  const probe = seedToItem({
    slug: "s2", name: "n2", nameZh: "中文名", aliases: ["a"], summary: "SUMMARY", body: "BODY", tags: ["t"],
    scenes: ["code"], platforms: ["windows"], source: "opensource", price: "P",
    officialUrl: "https://e.invalid", officialLabel: "官网", discountNote: "D",
    whoFor: "W", whoNot: "N", installTips: ["tip"], alternatives: ["x"], featured: true,
    license: "MIT", version: "1.0", linksCheckedAt: "2026-01-01",
    guide: { intro: "I", markdown: "M", resources: [] },
    links: { official: "https://e.invalid", github: "https://github.com/x/y" },
    kind: "script",
    icon: { letter: "B", color: "#111", simpleIcon: "x" },
  });

  const untouched = [];
  for (const field of SEED_CARRIED_FIELDS) {
    if (JSON.stringify(base[field]) === JSON.stringify(probe[field])) {
      untouched.push(field);
    }
  }
  assert.deepEqual(untouched, [], "这些字段登记在表里，但 seedToItem 并不会带上它们：" + untouched.join(", "));
});
