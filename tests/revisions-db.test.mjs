import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";

import mysql from "mysql2/promise";

import { closePool, connectionOptions, query } from "../lib/db.ts";
import { getItem, loadRevisionAt, listRevisions, saveItem, setItemStatus } from "../lib/store-sql.ts";

/**
 * 内容级历史的**数据库往返**（P7b-b）。
 *
 * 纯函数那组（tests/item-revisions.test.mjs）证明差异算法自洽；
 * 这组证明它接进真实写入后仍然成立 —— SQL 层的往返才是风险点，
 * 「算法对但存进库就变了」这种事，只有真跑一遍才看得见。
 *
 * 最关键的断言在最后：**最新一版重放出来必须与 items 表实际内容逐字段相同**。
 * 差一个字段就意味着历史在骗人。
 *
 * 打隔离库 MYSQL_TEST_URL；没设就整组跳过。
 */

const skip = process.env.MYSQL_TEST_URL ? false : "未设置 MYSQL_TEST_URL：跳过内容历史往返测试";
if (process.env.MYSQL_TEST_URL) process.env.MYSQL_URL = process.env.MYSQL_TEST_URL;

const SLUG = "revisions-probe";
/** 改名后的 slug。也要在 before/after 里清 —— 上一轮跑失败会留下它，
 *  下一轮再改同名就会撞上「目标 slug 已存在」而返回 conflict（连原因都像是被测代码的问题）。 */
const RENAMED_SLUG = "revisions-probe-2";

const base = {
  slug: SLUG,
  name: "历史探针",
  aliases: [],
  kind: "app",
  status: "draft",
  tags: ["甲", "乙"],
  summary: "第一版摘要",
  body: "第一版正文。",
  scenes: ["code"],
  platforms: ["windows"],
  source: "official",
  links: {},
  tutorial: [],
  whoFor: "",
  whoNot: "",
  alternatives: [],
  previews: [],
  icon: { letter: "H", color: "#111111" },
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

before(async () => {
  if (skip) return;
  const ddl = await mysql.createConnection({ ...connectionOptions(), multipleStatements: true });
  try {
    await ddl.query(readFileSync("db/migrations/0001_init.sql", "utf8"));
    await ddl.query(readFileSync("db/migrations/0006_item-revisions.sql", "utf8"));
  } finally {
    await ddl.end();
  }
  for (const slug of [SLUG, RENAMED_SLUG]) {
    await query("DELETE FROM item_revisions WHERE slug = ?", [slug]);
    await query("DELETE FROM items WHERE slug = ?", [slug]);
  }
});

after(async () => {
  if (!skip) {
    for (const slug of [SLUG, RENAMED_SLUG]) {
      await query("DELETE FROM item_revisions WHERE slug = ?", [slug]).catch(() => {});
      await query("DELETE FROM items WHERE slug = ?", [slug]).catch(() => {});
    }
  }
  await closePool();
});

const revisionRows = async () => {
  const rows = await query(
    "SELECT row_version, kind, actor, action, summary, LENGTH(payload) AS bytes"
      + " FROM item_revisions WHERE slug = ? ORDER BY row_version ASC",
    [SLUG],
  );
  return rows.map((row) => ({ ...row, row_version: Number(row.row_version), bytes: Number(row.bytes) }));
};

test("首版是完整快照，之后每版只存变化的列", { skip }, async () => {
  assert.equal(await saveItem({ ...base }, { actor: "alice", summary: "创建条目" }), "created");

  const v2 = { ...base, summary: "第二版摘要", updatedAt: "2026-01-02T00:00:00.000Z" };
  assert.equal(await saveItem(v2, { actor: "alice", summary: "改摘要" }), "updated");

  const v3 = { ...v2, body: "第二版正文。", tags: ["甲", "乙", "丙"], updatedAt: "2026-01-03T00:00:00.000Z" };
  assert.equal(await saveItem(v3, { actor: "bob", summary: "改正文与标签" }), "updated");

  const rows = await revisionRows();
  assert.equal(rows.length, 3);
  assert.equal(rows[0].kind, "snapshot", "首版必须是完整快照，否则后面没有重放起点");
  assert.equal(rows[1].kind, "delta");
  assert.equal(rows[2].kind, "delta");

  // 这是选「基线+差异」的全部理由：基线最大，差异通常只有几十字节。
  assert.ok(
    rows[1].bytes < rows[0].bytes / 4,
    `差异 ${rows[1].bytes}B 应远小于基线 ${rows[0].bytes}B`,
  );
  assert.ok(rows[2].bytes < rows[0].bytes / 4, "改正文与标签的差异也不该接近全量");

  // 操作者要能对上：历史是给人看的。
  assert.deepEqual(rows.map((row) => row.actor), ["alice", "alice", "bob"]);
});

test("状态变更也记历史，否则版本号会与实际断开", { skip }, async () => {
  assert.equal(await setItemStatus(SLUG, "published", { actor: "alice" }), "updated");
  const rows = await revisionRows();
  const last = rows[rows.length - 1];
  assert.equal(last.action, "status", "改状态必须入历史");
  assert.equal(last.actor, "alice");
});

test("逐版还原：任意版本都能拿回当时的样子", { skip }, async () => {
  const v1 = await loadRevisionAt(SLUG, 1);
  assert.equal(v1.summary, "第一版摘要");
  assert.equal(v1.body, "第一版正文。");
  assert.equal(v1.status, "draft", "第一版还是草稿");
  assert.deepEqual(v1.tags, ["甲", "乙"]);

  const v2 = await loadRevisionAt(SLUG, 2);
  assert.equal(v2.summary, "第二版摘要");
  assert.equal(v2.body, "第一版正文。", "只改了摘要，正文该仍是第一版的");

  const v3 = await loadRevisionAt(SLUG, 3);
  assert.equal(v3.body, "第二版正文。");
  assert.deepEqual(v3.tags, ["甲", "乙", "丙"], "标签顺序也要原样还原");

  const v4 = await loadRevisionAt(SLUG, 4);
  assert.equal(v4.status, "published");
});

test("最新一版重放必须与 items 表实际内容逐字段相同", { skip }, async () => {
  // **这组测试里最重要的一条。** 差一个字段，历史就在骗人：
  // 页面上「回到第 4 版」会给出一份看着可信但内容不对的数据。
  const latest = (await revisionRows()).at(-1).row_version;
  const stored = await loadRevisionAt(SLUG);
  assert.ok(stored, "最新版必须能还原");

  const current = await getItem(SLUG, { publishedOnly: false });
  assert.ok(current, "items 表里应有这条");

  for (const key of ["summary", "body", "status", "whoFor", "whoNot", "kind", "source", "price", "license", "version"]) {
    assert.deepEqual(
      stored[key],
      current[key],
      `字段 ${key} 重放结果与实际不一致：重放 ${JSON.stringify(stored[key])} vs 实际 ${JSON.stringify(current[key])}`,
    );
  }
  for (const key of ["tags", "scenes", "platforms", "previews", "alternatives"]) {
    assert.deepEqual(stored[key], current[key], `子表 ${key} 重放结果与实际不一致`);
  }
  assert.deepEqual(stored.links, current.links, "links 重放结果与实际不一致");
  // 契约上的字段名是 updatedAt（camelCase），不是库列名 updated_at。
  assert.ok(stored.updatedAt, "updatedAt 必须存在（前台「最近更新」要用）");
  assert.ok(stored.createdAt, "createdAt 必须存在");
  assert.equal(latest, 4);
});

test("listRevisions 按版本倒序返回，给后台面板用", { skip }, async () => {
  const revisions = await listRevisions(SLUG);
  assert.ok(revisions.length >= 4);
  // 新的在前：后台列表不需要再排。
  const versions = revisions.map((revision) => revision.rowVersion);
  assert.deepEqual(versions, [...versions].sort((a, b) => b - a));
  assert.ok(revisions[0].summary, "每版都要有摘要可读");
});

test("改名后旧 slug 的历史留着，新 slug 的历史接得上", { skip }, async () => {
  // 改名必须带 expectedVersion（乐观锁），先取当前版本 —— 与后台表单的做法一致。
  const current = await query("SELECT row_version FROM items WHERE slug = ?", [SLUG]);
  const now = await getItem(SLUG, { publishedOnly: false });
  assert.ok(now, "改名前条目应存在");
  /**
   * 改名时传的是**当前内容**（后台表单就是这么做的：拿最新数据改个 slug 再存）。
   * 早先用 `...base` 展开等于「拿第一版的内容改名」，于是新版历史里摘要退回第一版 ——
   * 那不是实现的错，是测试造了个假场景。
   */
  const renamed = {
    ...now,
    slug: RENAMED_SLUG,
    name: "历史探针改名",
    tags: ["甲"],
    createdAt: now.createdAt,
    updatedAt: "2026-01-05T00:00:00.000Z",
  };
  assert.equal(
    await saveItem(renamed, {
      renameFrom: SLUG,
      expectedVersion: Number(current[0].row_version),
      actor: "alice",
      summary: "改名",
    }),
    "updated",
  );

  // 旧 slug 的历史必须还在：它回答「改名前长什么样」，删了那个问题就没人能答。
  const oldRevisions = await listRevisions(SLUG);
  assert.ok(oldRevisions.length >= 4, "改名前的历史不该消失");

  /**
   * 新 slug 的历史必须**自洽** —— 能独立重放。这是本条真正要守的东西：
   * 早先只写一条 delta 而不搬旧链，新 slug 的链就没有基线，
   * `loadRevisionAt` 直接抛「缺少基线快照」——**改过名的条目其历史根本打不开**。
   */
  const restored = await loadRevisionAt(RENAMED_SLUG);
  assert.ok(restored, "新 slug 的历史必须能独立重放");
  assert.equal(restored.summary, "第二版摘要", "内容应与改名前接得上");
  assert.deepEqual(restored.tags, ["甲"], "改名这次改了标签");
  assert.equal(restored.status, "published", "改名不该把已发布状态弄丢");

  // 新 slug 也要能还原到更早的版本。
  const beforeRename = await loadRevisionAt(RENAMED_SLUG, 1);
  assert.ok(beforeRename, "新 slug 也能看到更早的版本");
  assert.equal(beforeRename.summary, "第一版摘要");

  await query("DELETE FROM item_revisions WHERE slug = ?", [RENAMED_SLUG]);
  await query("DELETE FROM items WHERE slug = ?", [RENAMED_SLUG]);
});

test("不传 actor 时不生成历史（ETL 批量导入不该污染历史）", { skip }, async () => {
  const batchSlug = "revisions-batch-probe";
  const batch = { ...base, slug: batchSlug, name: "批量导入探针" };
  assert.equal(await saveItem({ ...batch }), "created");
  assert.equal(await saveItem({ ...batch, summary: "批量改的" }), "updated");
  const rows = await query("SELECT id FROM item_revisions WHERE slug = ?", [batchSlug]);
  assert.equal(rows.length, 0, "没有 actor 就不该写历史");

  await query("DELETE FROM items WHERE slug = ?", [batchSlug]);
});