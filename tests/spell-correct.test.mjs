import assert from "node:assert/strict";
import { test } from "node:test";

import { editDistance, maxDistanceFor, pickCorrection } from "../lib/spell-correct.ts";

const VOCAB = ["Obsidian", "Joplin", "Kubernetes", "VS Code", "Zotero", "Trilium", "Obsidian Skills"];

test("编辑距离：基本用例", () => {
  assert.equal(editDistance("abc", "abc"), 0);
  assert.equal(editDistance("", "abc"), 3);
  assert.equal(editDistance("abc", ""), 3);
  assert.equal(editDistance("joplin", "joplinn"), 1); // 多打一个字母
  assert.equal(editDistance("obisidan", "obsidian"), 2); // 字母顺序打反
  assert.equal(editDistance("kitten", "sitting"), 3); // 教科书用例
});

test("纠正：字母顺序打反能找到原名", () => {
  assert.equal(pickCorrection("obisidan", VOCAB), "Obsidian");
});

test("纠正：多打/漏打一个字母能找到原名", () => {
  assert.equal(pickCorrection("joplinn", VOCAB), "Joplin");
  assert.equal(pickCorrection("zotro", VOCAB), "Zotero");
});

test("纠正：本来正确的词不会被换掉", () => {
  assert.equal(pickCorrection("obsidian", VOCAB), "Obsidian");
});

test("纠正：短词一律不纠正", () => {
  // 3~4 字母的编辑距离 1 覆盖面太大，「git」可能被纠成「get」之类。
  assert.equal(pickCorrection("git", VOCAB), null);
  assert.equal(pickCorrection("vim", VOCAB), null);
  assert.equal(maxDistanceFor("abc"), 0);
});

test("纠正：中文不参与（中文只有打错字，没有拼错）", () => {
  assert.equal(pickCorrection("奥布西迪安", ["Obsidian"]), null);
  assert.equal(pickCorrection("笔记", ["笔记软件"]), null);
});

test("纠正：距离过远时宁可返回 null，也不瞎猜", () => {
  assert.equal(pickCorrection("photoshop", VOCAB), null);
  assert.equal(pickCorrection("zzzzzzzz", VOCAB), null);
});

test("纠正：平局取更短的候选", () => {
  // Obsidian 与 Obsidian Skills 对 obisidan 的距离不同，用更接近的用例：
  // 「obsidia」（漏一个 n）到 Obsidian 距离 1，到 Obsidian Skills 距离 8。
  assert.equal(pickCorrection("obsidia", VOCAB), "Obsidian");
});
