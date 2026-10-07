import assert from "node:assert/strict";
import test from "node:test";
import { channelTotals, dailySeries, itemClickRows, shortDay } from "../lib/click-analytics.ts";
import { isChannelId, linkChannels } from "../lib/links.ts";

const items = [
  { slug: "blender", name: "Blender", kind: "app", scenes: ["design"], source: "official" },
  { slug: "git", name: "Git", kind: "app", scenes: ["code"], source: "opensource" },
];

test("the analytics whitelist matches the channel slots in lib/links", () => {
  // lib/click-analytics.ts 就地复制了一份渠道白名单（原因见该文件顶部注释）。
  // 这份测试是两份列表唯一的同步保证 —— 改一处必须改另一处。
  const slots = linkChannels({
    official: "https://o.example",
    homepage: "https://h.example",
    github: "https://github.com/a/b",
    disk: "https://d.example",
  }).map((c) => c.id);
  assert.deepEqual([...slots].sort(), ["disk", "github", "homepage", "official"]);

  // 统计里出现的每个合法渠道都应被分析层接受，反之亦然。
  for (const id of slots) {
    assert.equal(isChannelId(id), true, `${id} 应被接受`);
    assert.equal(itemClickRows([{ slug: "x", channel: id, count: 1 }], []).length, 1, `${id} 应被计入`);
  }
  assert.equal(isChannelId("nope"), false);
  assert.equal(itemClickRows([{ slug: "x", channel: "nope", count: 1 }], []).length, 0);
});

test("clicks fold into one row per item with channels broken out", () => {
  const rows = itemClickRows(
    [
      { slug: "blender", channel: "official", count: 38 },
      { slug: "blender", channel: "github", count: 2 },
      { slug: "git", channel: "github", count: 10 },
    ],
    items,
  );
  assert.deepEqual(rows.map((r) => r.slug), ["blender", "git"]);
  assert.equal(rows[0].name, "Blender");
  assert.equal(rows[0].total, 40);
  // 渠道顺序必须与详情页一致：官网 → 主页 → GitHub → 镜像。
  assert.deepEqual(rows[0].breakdown.map((b) => b.channel), ["official", "github"]);
  assert.deepEqual(rows[0].breakdown.map((b) => b.label), ["官网", "GitHub"]);
  assert.equal(rows[1].total, 10);
});

test("shares are computed against the grand total and sum to one", () => {
  const rows = itemClickRows(
    [
      { slug: "blender", channel: "official", count: 30 },
      { slug: "git", channel: "github", count: 10 },
    ],
    items,
  );
  assert.equal(rows[0].share, 0.75);
  assert.equal(rows[1].share, 0.25);
  const sum = rows.reduce((acc, r) => acc + r.share, 0);
  assert.ok(Math.abs(sum - 1) < 1e-9, `占比之和应为 1，实际 ${sum}`);
});

test("a deleted item keeps its history but loses the name", () => {
  // 删条目不该让历史点击凭空消失 —— 顺便也能提示该清理这个 slug。
  const rows = itemClickRows([{ slug: "gone", channel: "official", count: 5 }], items);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].name, undefined);
  assert.equal(rows[0].slug, "gone");
  assert.equal(rows[0].kind, undefined);
  assert.equal(rows[0].total, 5);
});

test("unknown channels and non-positive counts are discarded", () => {
  const rows = itemClickRows(
    [
      { slug: "blender", channel: "official", count: 3 },
      // 白名单外的 id：脏数据或旧版本残留。
      { slug: "blender", channel: "evil", count: 99 },
      { slug: "blender", channel: "__proto__", count: 99 },
      { slug: "blender", channel: "official", count: 0 },
      { slug: "blender", channel: "official", count: -5 },
      { slug: "", channel: "official", count: 4 },
    ],
    items,
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].total, 3);
});

test("ties break by slug so the ordering is stable across renders", () => {
  const rows = itemClickRows(
    [
      { slug: "git", channel: "github", count: 7 },
      { slug: "blender", channel: "official", count: 7 },
    ],
    items,
  );
  assert.deepEqual(rows.map((r) => r.slug), ["blender", "git"]);
});

test("empty input yields no rows and no division by zero", () => {
  assert.deepEqual(itemClickRows([], items), []);
  assert.deepEqual(itemClickRows([], []), []);
});

test("channel totals keep the display order and merge across items", () => {
  const rows = itemClickRows(
    [
      { slug: "blender", channel: "github", count: 2 },
      { slug: "blender", channel: "official", count: 3 },
      { slug: "git", channel: "github", count: 5 },
    ],
    items,
  );
  const totals = channelTotals(rows);
  assert.deepEqual(totals.map((t) => t.channel), ["official", "github"]);
  assert.deepEqual(totals.map((t) => t.count), [3, 7]);
  assert.deepEqual(channelTotals([]), []);
});

test("the daily series fills gaps instead of skipping quiet days", () => {
  const byDay = new Map([["2026-10-03", 5]]);
  const series = dailySeries(byDay, 4, new Date("2026-10-03T12:00:00Z"));
  assert.equal(series.length, 4);
  assert.deepEqual(series.map((d) => d.count), [0, 0, 0, 5]);
  // 末位是今天，日期连续不跳号。
  assert.equal(series.at(-1).day, "2026-10-03");
  assert.equal(series.at(-2).day, "2026-10-02");
  // 没有点击的日子也必须在图上占一格，否则连续 7 天看起来只有 3 天。
  assert.equal(series[0].count, 0);
});

test("shortDay drops the year and leading zeros for display", () => {
  assert.equal(shortDay("2026-10-03"), "10 月 3 日");
  assert.equal(shortDay("2026-01-09"), "1 月 9 日");
  // 异常输入原样返回，不抛。
  assert.equal(shortDay("bad"), "bad");
});
