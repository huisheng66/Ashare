import assert from "node:assert/strict";
import { test } from "node:test";

import { SYNONYM_GROUPS, synonymGroupOf, synonymsOf } from "../data/synonyms.ts";

test("同义词：组内互查，且不含自身", () => {
  const group = synonymsOf("图片");
  assert.ok(group.includes("图像"));
  assert.ok(group.includes("照片"));
  assert.ok(!group.includes("图片"), "同义词不应包含自身");
});

test("同义词：任意成员查到的组一致", () => {
  const a = synonymGroupOf("图片").sort();
  const b = synonymGroupOf("图像").sort();
  const c = synonymGroupOf("照片").sort();
  assert.deepEqual(a, b);
  assert.deepEqual(b, c);
});

test("同义词：没有收录的词返回空，不猜", () => {
  assert.deepEqual(synonymsOf("blender"), []);
  assert.deepEqual(synonymsOf("完全不存在的词"), []);
  assert.deepEqual(synonymGroupOf("blender"), []);
});

test("同义词：查询前做 trim 与大小写归一", () => {
  // 英文词（cli / shell）不依赖大小写：全文索引的排序规则本身就不敏感，
  // 但查表这一步也要一致，否则 "CLI" 查不到 "命令行" 组。
  assert.ok(synonymsOf("CLI").includes("命令行"));
  assert.ok(synonymsOf("  cli  ").length > 0);
});

test("词表结构：每组至少两个词、无重复、无空白", () => {
  for (const group of SYNONYM_GROUPS) {
    assert.ok(group.length >= 2, `同义词组应至少两个词：${group.join("/")}`);
    const normalized = group.map((word) => word.trim());
    assert.deepEqual(normalized, [...group], `组内有前后空格：${group.join("/")}`);
    assert.equal(new Set(normalized).size, normalized.length, `组内有重复词：${group.join("/")}`);
    for (const word of normalized) {
      assert.ok(word.length > 0, "同义词不能是空串");
      // 带空格的词会被查询侧的分词拆开，成为两个独立词，语义完全变样。
      assert.ok(!/\s/.test(word), `同义词不能含空格：${word}`);
    }
  }
});

test("词表结构：一个词只能属于一个组", () => {
  // 跨组会让 synonymsOf 的行为取决于遍历顺序 —— 同一份词表在不同调用下给出不同结果，
  // 是那种「平时看不出、改一行就炸」的隐患。
  const seen = new Map();
  for (const group of SYNONYM_GROUPS) {
    for (const word of group) {
      assert.equal(seen.has(word), false, `「${word}」同时出现在 ${seen.get(word)} 与 ${group.join("/")}`);
      seen.set(word, group.join("/"));
    }
  }
});

test("词表结构：不收单字词", () => {
  // 单字扩展会把查询放大成巨型 OR：搜「图」时把「图片/图像/照片」全算上，
  // 结果几乎等于「所有跟图形沾边的条目」。这类词让用户多打一个字更划算。
  for (const group of SYNONYM_GROUPS) {
    for (const word of group) {
      assert.ok([...word].length >= 2, `不该收录单字词：${word}`);
    }
  }
});
