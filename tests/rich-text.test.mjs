import assert from "node:assert/strict";
import test from "node:test";

import { inlineToPlainText, parseInline } from "../lib/inlineText.ts";

const kinds = (text) => parseInline(text).map((p) => p.kind);
const values = (text) => parseInline(text).map((p) => p.value);

test("成对的双星号识别为粗体", () => {
  assert.deepEqual(kinds("工程规模**很**重要"), ["text", "strong", "text"]);
  assert.deepEqual(values("工程规模**很**重要"), ["工程规模", "很", "重要"]);
});

test("行内代码识别为 code", () => {
  assert.deepEqual(kinds("跑一次 `npm test` 就行"), ["text", "code", "text"]);
  assert.deepEqual(values("跑一次 `npm test` 就行"), ["跑一次 ", "npm test", " 就行"]);
});

test("落单的双星号原样保留，不吞后文", () => {
  // 作者少写一个星号时，绝不能把后面的正文一起吃掉。
  const parts = parseInline("这里有 ** 一个落单的标记，还有正文");
  assert.ok(!parts.some((p) => p.kind === "strong"), "落单星号不应产生粗体");
  assert.equal(inlineToPlainText("这里有 ** 一个落单的标记，还有正文"), "这里有 ** 一个落单的标记，还有正文");
});

test("落单的反引号同样原样保留", () => {
  assert.ok(!parseInline("代码是 ` 半个").some((p) => p.kind === "code"));
});

test("纯文本不被拆碎", () => {
  assert.deepEqual(kinds("没有任何标记的一段话。"), ["text"]);
});

test("多组标记各自独立", () => {
  assert.deepEqual(kinds("**甲**和**乙**"), ["strong", "text", "strong"]);
  assert.deepEqual(kinds("`a` 与 `b`"), ["code", "text", "code"]);
});

test("标记不跨行匹配", () => {
  // 跨行的 ** 会把中间整段正文卷进 strong，看起来像「这一大段都重要」。
  const parts = parseInline("前一句 ** 后一句");
  assert.ok(!parts.some((p) => p.kind === "strong"), "空内容或跨行的标记不应成为粗体");
});

test("空标记不产生空元素", () => {
  assert.deepEqual(kinds("**"), ["text"]);
  assert.deepEqual(kinds("`"), ["text"]);
  assert.deepEqual(kinds("****"), ["text"]);
  assert.deepEqual(kinds("``"), ["text"]);
});

test("还原成纯文本时内容不丢失", () => {
  for (const s of [
    "工程规模**很**重要",
    "跑一次 `npm test` 就行",
    "**甲**和**乙**以及`丙`",
    "没有标记",
    "落单 ** 标记",
  ]) {
    // 基准不是「去掉所有标记符」—— 落单的标记不该被去掉。
    // 正确基准是：原文里凡是**没有**被解析成标记的字符，一个都不能少。
    // 直接比对 parseInline 的结果与原文，能验证的正是这一点。
    const rebuilt = parseInline(s).map((p) => p.value).join("");
    const markers = parseInline(s)
      .filter((p) => p.kind !== "text")
      .reduce((n, p) => n + (p.kind === "strong" ? 4 : 2), 0);
    assert.equal(rebuilt.length + markers, s.length, `解析丢了字符: ${s}`);
    assert.equal(inlineToPlainText(s), rebuilt, "两种还原方式应一致");
  }
});

test("真实种子正文解析后必须一字不丢", async () => {
  const { software } = await import("../data/software.ts");
  const { seedToItem } = await import("../lib/seed.ts");
  let checked = 0;
  for (const seed of software) {
    const item = seedToItem(seed);
    for (const line of item.body.split(/\n+/)) {
      if (!line.includes("**") && !line.includes("`")) continue;
      checked++;
      const parts = parseInline(line);
      // 原文长度 = 解析后内容长度 + 被识别成标记的定界符长度。
      // 两者不等就说明解析吞了字或改了字 —— 页面上会直接缺内容，
      // 这比多显示两个星号严重得多。
      const markers = parts
        .filter((p) => p.kind !== "text")
        .reduce((n, p) => n + (p.kind === "strong" ? 4 : 2), 0);
      assert.equal(
        parts.map((p) => p.value).join("").length + markers,
        line.length,
        `${item.slug}: 解析后与原文长度不符`,
      );
    }
  }
  assert.ok(checked > 0, "种子里应存在含标记的正文，否则这条断言是空的");
});
