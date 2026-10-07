import assert from "node:assert/strict";
import test from "node:test";

import { splitBodyColumns } from "../lib/bodyColumns.ts";

/** 造指定长度的段落，末尾编号便于断言顺序。 */
const paras = (...lens) => lens.map((n, i) => "字".repeat(n) + "#" + i);

const chars = (col) => col.reduce((s, t) => s + t.length, 0);

const imbalance = (cols) => {
  const sizes = cols.map(chars);
  return (Math.max(...sizes) - Math.min(...sizes)) / Math.max(...sizes);
};

test("段落够多且长度相近时应分栏，且两栏高度接近", () => {
  // 8 段每段 100 字：无论怎么切都该是 4+4
  const r = splitBodyColumns(paras(100, 100, 100, 100, 100, 100, 100, 100), 2);
  assert.equal(r.length, 2, "应分两栏");
  assert.deepEqual(r.map((c) => c.length), [4, 4], "应均分为 4+4");
  assert.ok(imbalance(r) <= 0.05, `两栏字数应几乎相等，实际差 ${imbalance(r)}`);
});

test("分栏不得打乱段落顺序", () => {
  const items = paras(100, 100, 100, 100, 100, 100, 100, 100);
  const r = splitBodyColumns(items, 2);
  // 拼回去必须与原文完全一致：分栏只该决定「哪段归哪栏」，
  // 绝不能重排或丢段 —— 读者是顺着读的。
  assert.deepEqual(r.flat(), items, "两栏拼回应与原顺序完全一致");
});

test("最优解仍不均衡时退回单栏（内容天生不适合分栏）", () => {
  // 3 段 73/147/69：段数不到 4，且任何切点都拉不平
  const r = splitBodyColumns(paras(73, 147, 69), 2);
  assert.equal(r.length, 1, "段数不足时应保持单栏");
  assert.equal(r[0].length, 3, "退回单栏时不能丢段");
});

test("段落数够但长度悬殊时同样退回单栏", () => {
  // 4 段但一枝独秀：160/40/40/40 —— 分栏必然一高一矮，不如不分
  const r = splitBodyColumns(paras(160, 40, 40, 40), 2);
  const balanced = r.length > 1 && imbalance(r) <= 0.35;
  assert.ok(
    !balanced,
    `悬殊内容不该分栏，实际得到 ${r.map(chars).join("/")}，差 ${imbalance(r)}`,
  );
});

test("内容太少不摊开", () => {
  // 三段各 10 字：撑不起一栏，摊开只有稀疏几行
  const r = splitBodyColumns(paras(10, 10, 10), 2);
  assert.equal(r.length, 1, "总字数不足时应保持单栏");
});

test("只有一个栏位时不做任何事", () => {
  const items = paras(100, 100, 100, 100);
  assert.deepEqual(splitBodyColumns(items, 1), [items]);
});

test("不得产生空栏", () => {
  // 段数远多于栏数时，每栏都要有内容
  const r = splitBodyColumns(paras(100, 100, 100, 100, 100, 100, 100, 100), 2);
  for (const col of r) assert.ok(col.length > 0, "不允许空栏");
});

test("三栏时每栏都分到内容", () => {
  const r = splitBodyColumns(paras(100, 100, 100, 100, 100, 100), 3);
  assert.equal(r.length, 3, "应分三栏");
  for (const col of r) assert.ok(col.length > 0, "不允许空栏");
  assert.equal(r.flat().length, 6, "不得丢段");
});

test("真实种子数据下分栏必须均衡（对全部 50 条做断言）", async () => {
  // 走 seedToItem 而不是直接读种子：页面拿到的是映射后的对象，
  // 种子上的 body 是可选的（缺省补空串）。直接读种子会在
  // 「字段是否存在」上和页面的实际行为对不上。
  const { software } = await import("../data/software.ts");
  const { seedToItem } = await import("../lib/seed.ts");
  let two = 0;
  let withBody = 0;
  for (const seed of software) {
    const item = seedToItem(seed);
    if (!item.body.trim()) continue;
    withBody++;
    const paragraphs = item.body.split(/\n+/).map((t) => t.trim()).filter(Boolean);
    const r = splitBodyColumns(paragraphs, 2);
    if (r.length === 1) continue;
    two++;
    const ratio = imbalance(r);
    // 这是本函数存在的全部意义：一旦返回双栏，就必须真的平。
    assert.ok(ratio <= 0.35, `${item.slug} 分栏后两栏高度差 ${(ratio * 100).toFixed(0)}%`);
    assert.deepEqual(r.flat(), paragraphs, `${item.slug} 分栏打乱了段落顺序`);
  }
  assert.ok(withBody > 0, "种子应至少有带正文的条目，否则这条断言是空的");
  // 反向校验：判据不能过严到把所有内容都退回单栏，那等于功能没生效。
  assert.ok(two >= 10, `应有相当一部分条目启用双栏，实际只有 ${two}/${withBody} 条`);
});
