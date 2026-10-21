import assert from "node:assert/strict";
import { test } from "node:test";

import { highlight, highlightTermsOf } from "../lib/highlight.ts";

/** 把片段拼回原文本，顺带给出命中标记，便于断言。 */
const flat = (segments) => segments;
const joined = (segments) => segments.map((s) => s.text).join("");

test("切分后拼回原文本，一个字符不差", () => {
  const segments = highlight("Visual Studio Code", ["vs", "code"]);
  assert.equal(joined(segments), "Visual Studio Code");
});

test("命中片段被标记，未命中不标记", () => {
  const segments = flat(highlight("Python 编程", ["python"]));
  assert.deepEqual(segments, [
    { text: "Python", hit: true },
    { text: " 编程", hit: false },
  ]);
});

test("大小写不敏感", () => {
  const segments = flat(highlight("Docker", ["docker"]));
  assert.deepEqual(segments, [{ text: "Docker", hit: true }]);
});

test("重叠命中合并，不产生碎片", () => {
  // "python" 里同时含 py 与 python，应合成一段而不是两段 mark
  const segments = flat(highlight("python", ["py", "python"]));
  assert.deepEqual(segments, [{ text: "python", hit: true }]);
  assert.equal(segments.filter((s) => s.hit).length, 1, "相邻/重叠命中应合并成一段");
});

test("多个命中各自成段", () => {
  const segments = flat(highlight("abcXdefYghi", ["X", "Y"]));
  assert.deepEqual(segments, [
    { text: "abc", hit: false },
    { text: "X", hit: true },
    { text: "def", hit: false },
    { text: "Y", hit: true },
    { text: "ghi", hit: false },
  ]);
});

test("无命中时原样返回单段", () => {
  assert.deepEqual(flat(highlight("abc", ["zzz"])), [{ text: "abc", hit: false }]);
});

test("空词与空文本都安全", () => {
  assert.deepEqual(flat(highlight("abc", [])), [{ text: "abc", hit: false }]);
  assert.deepEqual(flat(highlight("abc", ["  "])), [{ text: "abc", hit: false }]);
  assert.deepEqual(flat(highlight("", ["a"])), [{ text: "", hit: false }]);
});

test("中文按子串命中", () => {
  const segments = flat(highlight("图片工具", ["图片"]));
  assert.deepEqual(segments, [
    { text: "图片", hit: true },
    { text: "工具", hit: false },
  ]);
});

test("highlightTermsOf 去重并去掉空词", () => {
  assert.deepEqual(highlightTermsOf("  python   python  git "), ["python", "git"]);
  assert.deepEqual(highlightTermsOf("   "), []);
});
