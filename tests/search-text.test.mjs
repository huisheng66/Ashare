import assert from "node:assert/strict";
import { test } from "node:test";

import { glueScriptBoundaries, searchTextOf } from "../lib/catalog-rows.ts";

/**
 * search_text 的入库口径。
 *
 * 这一组守的是「中文用户怎么打字」：目录里写「3D 打印」，用户打「3d打印」。
 * ngram 按字切 bigram，空格会切断 bigram（3d / d打 / 打印 vs 3d / 打印），
 * 布尔模式要求每个 token 都命中，于是不连写的那一侧永远 0 结果。
 * 实测 676 条里搜「3D 打印」4 条（四个切片器）、搜「3d打印」只剩 openscad 1 条。
 */

const item = (patch) => ({
  name: "",
  nameZh: "",
  aliases: [],
  tags: [],
  summary: "",
  ...patch,
});

test("汉字与拉丁/数字之间的空格会被合并", () => {
  assert.equal(glueScriptBoundaries("3D 打印"), "3D打印");
  assert.equal(glueScriptBoundaries("AI 绘画"), "AI绘画");
  assert.equal(glueScriptBoundaries("打印 3D"), "打印3D");
  assert.equal(glueScriptBoundaries("4K 显示器"), "4K显示器");
  // 全角空格同样处理（NFKC 之前也常出现）
  assert.equal(glueScriptBoundaries("3D\u3000打印"), "3D打印");
});

test("汉字与汉字之间的空格不动 —— 那是两个词，不是连读", () => {
  assert.equal(glueScriptBoundaries("视频 下载"), "视频 下载");
  assert.equal(glueScriptBoundaries("笔记 软件"), "笔记 软件");
  assert.equal(glueScriptBoundaries("hello world"), "hello world");
});

test("拉丁词也被粘上去，但查询侧仍按空格分词，不会因此串味", () => {
  // 刻意也合并 Latin→Han：用户同样会打「git提交」。
  // 这不影响「git 提交」的语义 —— 查询按空格切成 git / 提交 两个词，
  // 两个 bigram 在 git提交 里都在，各自独立命中。
  assert.equal(glueScriptBoundaries("git 提交"), "git提交");
  const text = searchTextOf(item({ name: "Git 提交规范", summary: "约定式提交" }));
  assert.ok(text.toLowerCase().includes("git提交"), text);
});

test("search_text 里带空格的标签也按连写口径入库", () => {
  const text = searchTextOf(item({ name: "UltiMaker Cura", tags: ["3D 打印", "切片"], summary: "把模型切成路径" }));
  assert.ok(text.includes("3D打印"), "标签「3D 打印」应连写成 3D打印：" + text);
  assert.ok(!text.includes("3D 打印"), "带空格的写法不该留在索引文本里：" + text);
  // 汉字之间的词边界必须保留，否则「切片」会和后面的词粘成一个假 token。
  assert.ok(text.includes("切片"), text);
});

test("NFKC 仍然生效（全角转半角）", () => {
  const text = searchTextOf(item({ name: "ＡＩ 绘画", tags: ["ＡＩ"] }));
  assert.ok(text.includes("AI绘画"), text);
});
