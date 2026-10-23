import assert from "node:assert/strict";
import { test } from "node:test";

import { searchInitialsOf, searchPinyinOf } from "../lib/catalog-rows.ts";

/**
 * 拼音派生列的纯函数测试。
 *
 * 这一层的价值全在「三档覆盖」与「不污染」两件事上：
 *  - 三档：分音节全拼 / 连写全拼 / 首字母，缺一档就有一种输入习惯搜不到；
 *  - 不污染：pinyin-pro 对纯 ASCII 会**逐字符**返回（'Ollama' → ['O','l','l','a','m','a']），
 *    必须先剥离非汉字再转，否则英文名会变成 `O l l a m a` 这种噪音灌进索引。
 */

/** 只构造 searchPinyinOf 真正读取的字段，其余给空默认。 */
const make = (over) => ({ slug: "x", name: "X", aliases: [], tags: [], summary: "", ...over });

test("中文名产出两档全拼：分音节 / 连写", () => {
  // 首字母已拆到 searchInitialsOf / 独立的 search_initials 列 ——
  // 混在同一列时无法区分「tp 是首字母」与「khttp 里恰好有 tp」，
  // 实测搜 tp 会把 okhttp 排到第一。这里只断言全拼部分。
  const out = searchPinyinOf(make({ name: "PicTool", nameZh: "图片" }));
  assert.ok(out.includes("tu pian"), "分音节全拼应命中 tu pian");
  assert.ok(out.includes("tupian"), "连写全拼应命中 tupian");
  assert.ok(!/(^| )tp( |$)/.test(out), "首字母不该再出现在全拼列里");
});

test("longer 中文名逐字转换，全拼两档都在", () => {
  const out = searchPinyinOf(make({ name: "Zotero", nameZh: "文献管理" }));
  assert.ok(out.includes("wen xian guan li"));
  assert.ok(out.includes("wenxianguanli"));
});

test("首字母独立成列：图片 → tp，文献管理 → wxgl", () => {
  assert.equal(searchInitialsOf(make({ name: "PicTool", nameZh: "图片" })), "tp");
  assert.equal(searchInitialsOf(make({ name: "Zotero", nameZh: "文献管理" })), "wxgl");
});

test("首字母列只收中文：纯英文名不该产出任何内容", () => {
  // 英文名的「首字母」是它自己，放进 initials 列只会让缩写查询命中一堆英文名。
  assert.equal(searchInitialsOf(make({ name: "Ollama" })), "");
  assert.equal(searchInitialsOf(make({ name: "RustDesk" })), "");
});

test("纯 ASCII 不会被逐字符拆成噪音", () => {
  const out = searchPinyinOf(make({ name: "Ollama" }));
  // Ollama 本身不该产生 'O l l a m a' 这种逐字符串
  assert.ok(!/O l l a m a/.test(out), "不应出现逐字符拆分的 ASCII");
  // 去元音后是 llm（Ollama 全去元音只剩辅音），这是已知副作用，与「大模型」缩写撞车可接受
  assert.ok(out.includes("llm"), "应含去元音折叠 llm");
});

test("英数名去元音折叠，兼容漏打元音", () => {
  assert.ok(searchPinyinOf(make({ name: "RustDesk" })).includes("rstdsk"));
  assert.ok(searchPinyinOf(make({ name: "VSCode" })).includes("vscd"));
});

test("过短的英数名不折叠，避免无意义串", () => {
  const out = searchPinyinOf(make({ name: "PC" }));
  assert.equal(out, "", "PC 只有 2 个字母，既不转拼音也不折叠");
});

test("中英混排：只对汉字部分转拼音", () => {
  const item = make({ name: "RustDesk 远程桌面" });
  const out = searchPinyinOf(item);
  assert.ok(out.includes("yuan cheng zhuo mian"), "汉字部分转拼音");
  assert.ok(out.includes("rstdsk"), "英数部分去元音");
  assert.ok(!/r u s t/i.test(out), "英数部分不应被逐字符拆开");
  // 首字母在独立列里：只取汉字部分，英文名不参与（否则初始化串会混入英文字母）。
  assert.equal(searchInitialsOf(item), "yczm");
});

test("别名也参与拼音生成", () => {
  const out = searchPinyinOf(make({ name: "X", nameZh: "笔记", aliases: ["备忘录"] }));
  assert.ok(out.includes("biji"), "来自中文名");
  assert.ok(out.includes("beiwanglu"), "来自别名（备忘录）");
});

test("无汉字且英文过短时返回空串（调用方会落成 null）", () => {
  assert.equal(searchPinyinOf(make({ name: "Go", nameZh: "" })), "");
});

test("输出做 NFKC 归一：全角与半角输入结果一致", () => {
  const full = searchPinyinOf(make({ name: "Ｏllama" })); // 全角 O
  const half = searchPinyinOf(make({ name: "Ollama" }));
  assert.equal(full, half, "全角应先归一，否则英文部分会整段丢失");
  assert.ok(full.includes("llm"), "归一后仍能拿到去元音形");
});
