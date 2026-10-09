import assert from "node:assert/strict";
import { test } from "node:test";

import { fromBundle, toBundle } from "../lib/catalog-rows.ts";
import { applyDelta, changedFields, deltaBetween, replay, snapshotOf } from "../lib/item-revisions.ts";

/**
 * 内容级历史：基线快照 + 差异重放。
 *
 * **这组测试的全部意义在往返一致性。** 差异算错了，重放出来的就是一个看起来合理
 * 但内容错误的历史版本 —— 那比没有历史更糟：人会拿它当依据做判断。
 * 所以每个测试都断言「重放出来的结果与当时的实际状态逐字段相同」。
 *
 * 纯函数，不连库。
 */

function bundleOf(overrides = {}) {
  const item = {
    slug: "vscode",
    name: "VS Code",
    name_zh: null,
    aliases: "[]",
    status: "draft",
    kind: "app",
    source: "official",
    price: "免费",
    summary: "代码编辑器",
    body: "第一版正文。",
    tutorial: "[]",
    who_for: "写代码的人",
    who_not: "只想编辑文本的人",
    discount_note: null,
    license: "MIT",
    version: null,
    links_checked_at: null,
    featured: 0,
    sort_index: 0,
    icon_letter: "V",
    icon_color: "#007ACC",
    icon_simple: "visualstudiocode",
    icon_image: null,
    guide_intro: null,
    guide_markdown: null,
    search_text: "派生字段不该进差异",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
  return {
    item,
    tags: ["编辑器", "IDE"],
    scenes: ["code"],
    platforms: ["windows", "macos"],
    alternatives: [],
    links: [
      { kind: "official", url: "https://code.visualstudio.com/", disk_note: null, disk_sha256: null, disk_file: null },
      { kind: "github", url: "https://github.com/microsoft/vscode", disk_note: null, disk_sha256: null, disk_file: null },
    ],
    previews: [],
    guideResources: [{ kind: "doc", title: "官方文档", url: "https://code.visualstudio.com/docs", note: null }],
  };
}

const norm = (bundle) => JSON.parse(JSON.stringify(bundle));

/**
 * 比对时排除派生字段（search_text / updated_at）。
 *
 * 它们不进 payload —— 因为每次都变，记进差异是噪音，重放时重算即可。
 * 所以「内容是否一致」这个问题上不该拿它们当判据；但它们**必须存在**，
 * 那是另一回事，由各自的断言守着。
 */
const content = (bundle) => ({
  ...bundle,
  item: { ...bundle.item, search_text: null, updated_at: null },
});

function revisionOf(rowVersion, payload, kind = payload.kind) {
  return {
    rowVersion,
    kind,
    actor: "tester",
    action: rowVersion === 1 ? "create" : "update",
    summary: "",
    fields: changedFields(payload),
    at: "2026-01-01T00:00:00.000Z",
    payload,
  };
}

test("首版存完整快照，之后只存差异", () => {
  const first = bundleOf();
  const second = { ...bundleOf(), item: { ...bundleOf().item, summary: "改过的摘要" } };

  const baseline = snapshotOf(first);
  assert.equal(baseline.kind, "snapshot");
  /** 每次都变的派生字段不进快照 —— 重放时重算。 */
  assert.equal("search_text" in baseline.columns, false);
  assert.equal("row_version" in baseline.columns, false);
  assert.equal("updated_at" in baseline.columns, false);
  /**
   * created_at 与上面三个不同：**不可变**，所以差异比较永远为 false，
   * 但必须存 —— 丢掉它重放出来的条目就没有创建时间了。
   * 「存不存」与「比不比」是两个问题，这一行就是把它们分开的断言。
   */
  assert.equal(baseline.columns.created_at, "2026-01-01T00:00:00.000Z");
  assert.equal(baseline.columns.slug, "vscode", "基线要带着 slug，重放才知道这条历史属于谁");

  const delta = deltaBetween(first, second);
  assert.equal(delta.kind, "delta");
  assert.deepEqual(Object.keys(delta.columns), ["summary"], "只该有摘要这一列变了");
  assert.equal(delta.columns.summary, "改过的摘要");
  assert.equal(delta.children, undefined, "子表没变就不该记");
});

test("差异体积明显小于全量（这是选差异的理由）", () => {
  const first = bundleOf();
  const second = { ...bundleOf(), item: { ...bundleOf().item, body: "改过的正文，其他都不动。" } };
  const delta = deltaBetween(first, second);
  const deltaSize = JSON.stringify(delta).length;
  const snapshotSize = JSON.stringify(snapshotOf(second)).length;
  assert.ok(
    deltaSize < snapshotSize / 4,
    `差异 ${deltaSize} 字节 vs 全量 ${snapshotSize} 字节，应差一个量级`,
  );
});

test("重放到任意版本，结果与当时的实际状态逐字段相同", () => {
  const v1 = bundleOf();
  const v2 = {
    ...bundleOf(),
    item: { ...bundleOf().item, summary: "第二版摘要", body: "第二版正文。" },
    tags: ["编辑器", "IDE", "VS"],
  };
  const v3 = {
    ...bundleOf(),
    item: { ...bundleOf().item, summary: "第三版摘要", status: "published", price: "免费（个人）" },
    tags: ["编辑器"],
    links: [{ kind: "official", url: "https://code.visualstudio.com/", disk_note: null, disk_sha256: null, disk_file: null }],
  };
  const v4 = {
    ...bundleOf(),
    item: { ...bundleOf().item, summary: "第四版摘要", featured: 1 },
    platforms: ["windows"],
    guideResources: [],
  };

  const revisions = [
    revisionOf(1, snapshotOf(v1)),
    revisionOf(2, deltaBetween(v1, v2)),
    revisionOf(3, deltaBetween(v2, v3)),
    revisionOf(4, deltaBetween(v3, v4)),
  ];

  for (const [version, expected] of [[1, v1], [2, v2], [3, v3], [4, v4]]) {
    const restored = replay(revisions, version);
    assert.deepEqual(
      // search_text 与 updated_at 不进 payload（派生字段），重放时重算。
      // 所以比对时要排除它们 —— 它们的值由 searchTextOf 决定，不该在这里重复断言。
      norm({ ...restored, item: { ...restored.item, search_text: null, updated_at: null } }),
      norm({ ...expected, item: { ...expected.item, search_text: null, updated_at: null } }),
      `重放到第 ${version} 版应与实际完全一致`,
    );
    // 但派生字段必须**存在** —— 丢了它前台「最近更新」会拿到空值。
    assert.equal(typeof restored.item.search_text, "string");
    assert.ok(restored.item.updated_at, "updated_at 也要还原出来");
  }
});

test("不回放时得到的是最新版", () => {
  const v1 = bundleOf();
  const v2 = { ...bundleOf(), item: { ...bundleOf().item, name: "VS Code 2" } };
  const revisions = [revisionOf(1, snapshotOf(v1)), revisionOf(2, deltaBetween(v1, v2))];
  assert.deepEqual(norm(content(replay(revisions))), norm(content(v2)));
});

test("删除某个字段会如实还原：null 与未设置是两回事", () => {
  const v1 = bundleOf();
  // 第二版把 price 与 license 都清成 null
  const v2 = { ...bundleOf(), item: { ...bundleOf().item, price: null, license: null } };
  // 第三版又填回来
  const v3 = { ...bundleOf(), item: { ...bundleOf().item, price: "免费", license: "MIT" } };
  const revisions = [
    revisionOf(1, snapshotOf(v1)),
    revisionOf(2, deltaBetween(v1, v2)),
    revisionOf(3, deltaBetween(v2, v3)),
  ];
  assert.equal(replay(revisions, 2).item.price, null, "第二版该是 null");
  assert.equal(replay(revisions, 2).item.license, null);
  assert.equal(replay(revisions, 3).item.price, "免费", "第三版该填回来");
  assert.equal(replay(revisions, 1).item.price, "免费", "第一版本来就有值");
});

test("什么都没改时不产生空差异", () => {
  const v1 = bundleOf();
  const payload = deltaBetween(v1, bundleOf());
  assert.deepEqual(changedFields(payload), [], "保存但没改，不该留下「改了某字段」的错觉");
  assert.equal(payload.kind, "delta");
});

test("子表是整体替换，还原后顺序也要一致", () => {
  const v1 = bundleOf();
  const v2 = { ...bundleOf(), tags: ["a", "b", "c"], platforms: ["linux"] };
  const revisions = [revisionOf(1, snapshotOf(v1)), revisionOf(2, deltaBetween(v1, v2))];
  const back = replay(revisions, 1);
  assert.deepEqual(back.tags, ["编辑器", "IDE"], "子表顺序属于内容，必须原样还原");
  assert.deepEqual(back.platforms, ["windows", "macos"]);
  assert.deepEqual(replay(revisions, 2).tags, ["a", "b", "c"]);
});

test("links 的顺序与 disk 附加字段都能还原", () => {
  const v1 = bundleOf();
  const v2 = {
    ...bundleOf(),
    links: [
      { kind: "disk", url: "https://example.com/a.zip", disk_note: "作者镜像", disk_sha256: "abc", disk_file: "a.zip" },
      { kind: "official", url: "https://code.visualstudio.com/", disk_note: null, disk_sha256: null, disk_file: null },
    ],
  };
  const revisions = [revisionOf(1, snapshotOf(v1)), revisionOf(2, deltaBetween(v1, v2))];
  assert.deepEqual(norm(replay(revisions, 1).links), norm(v1.links));
  assert.deepEqual(norm(replay(revisions, 2).links), norm(v2.links));
});

test("版本号乱序也能正确重放", () => {
  const v1 = bundleOf();
  const v2 = { ...bundleOf(), item: { ...bundleOf().item, body: "第二版。" } };
  const v3 = { ...bundleOf(), item: { ...bundleOf().item, body: "第三版。" } };
  const revisions = [
    revisionOf(3, deltaBetween(v2, v3)),
    revisionOf(1, snapshotOf(v1)),
    revisionOf(2, deltaBetween(v1, v2)),
  ];
  assert.deepEqual(norm(content(replay(revisions, 2))), norm(content(v2)), "顺序错乱不能影响结果");
  assert.deepEqual(norm(content(replay(revisions, 3))), norm(content(v3)));
});

test("差异却没有基线时显式失败，不给残缺内容", () => {
  // 这是不该发生的状态（写入时永远先存基线）。宁可报错也不要静默返回半份内容 ——
  // 残缺的历史比没有历史危险：它看起来是可信的。
  const v1 = bundleOf();
  const v2 = { ...bundleOf(), item: { ...bundleOf().item, body: "第二版。" } };
  assert.throws(
    () => applyDelta(undefined, deltaBetween(v1, v2)),
    /缺少基线快照/,
  );
});

test("还原出的内容能走回 Software 契约（与实际写入同一条路径）", () => {
  const v1 = bundleOf();
  const v2 = { ...bundleOf(), item: { ...bundleOf().item, name_zh: "视觉工作室代码", body: "第二版正文。" } };
  const revisions = [revisionOf(1, snapshotOf(v1)), revisionOf(2, deltaBetween(v1, v2))];

  // 重放 -> toBundle -> fromBundle -> toBundle：走一遍真实读写用的往返，
  // 确认历史里的内容能无损变回条目，而不是只在 bundle 层面看着对。
  const restored = replay(revisions, 2);
  const item = fromBundle(restored);
  assert.equal(item.nameZh, "视觉工作室代码");
  assert.equal(item.body, "第二版正文。");
  assert.deepEqual(norm(toBundle(item, 0)), norm(toBundle(fromBundle(restored), 0)));
});