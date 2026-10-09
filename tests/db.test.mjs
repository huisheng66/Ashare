import assert from "node:assert/strict";
import { after, test } from "node:test";

import { closePool, query, queryOne, withTransaction } from "../lib/db.ts";

import { mysqlSkip } from "./_mysql-skip.mjs";

/**
 * 数据库集成测试。
 *
 * 没有 MYSQL_URL 时整组跳过：npm test 不该因为在没起 MySQL 的机器上跑而变红。
 * 需要真跑时用 npm run test:db（会加载 .env.local）。
 *
 * 所有写操作都在事务里做完后主动回滚，测试不往库里留数据。
 */

const { skip } = await mysqlSkip("MYSQL_URL", "数据库集成测试");

const EXPECTED_TABLES = [
  "audit_log", "clicks", "feedback", "ft_stopwords", "ip_blocks", "item_alternatives", "item_guide_resources",
  "item_links", "item_platforms", "item_previews", "item_scenes", "item_tags",
  "items", "schema_migrations", "submissions", "users",
  // P7b-b 的内容级历史。新增迁移时**必须**在这里加一行：
  // 这个断言的全部价值就是「迁移漏建表时立刻发现」。
  "item_revisions",
];

const INSERT_ITEM = [
  "INSERT INTO items (slug, name, aliases, status, kind, source, summary, body, tutorial, who_for, who_not, icon_letter, search_text, created_at, updated_at)",
  "VALUES (?, ?, ?, 'published', 'app', 'official', ?, ?, '[]', ?, ?, ?, ?, NOW(3), NOW(3))",
].join(" ");

const insertItem = (conn, slug, searchText) =>
  conn.query(INSERT_ITEM, [slug, "探针", "[]", "摘要", "正文", "适合", "不适合", "P", searchText]);

const ROLLBACK = new Error("__rollback__");
const rolledBack = (error) => {
  if (error !== ROLLBACK) throw error;
};

test("迁移：0001 已应用且表齐全", { skip }, async () => {
  const rows = await query("SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()");
  const names = new Set(rows.map((row) => row.name));
  for (const table of EXPECTED_TABLES) assert.ok(names.has(table), "缺表：" + table);

  const applied = await query("SELECT version FROM schema_migrations ORDER BY version");
  // 新增迁移时**必须**在这里加一行。这个清单的作用和上面的表清单一样：
  // 「迁移文件写了但没应用」是最容易被忽略的错 —— 文件在那儿，db:migrate 报成功，
  // 但表没建，运行时才发现。
  assert.deepEqual(applied.map((row) => row.version), [
    "0001_init", "0002_search-stopwords", "0003_audit-log", "0004_users",
    "0005_list-indexes", "0006_item-revisions",
  ]);
});

test("索引：列表排序各有匹配的复合索引（规模验证的产物）", { skip }, async () => {
  // 实测来自 npm run scale:check：没有这些索引时默认排序是 type=ALL / rows=全表。
  const rows = await query(
    "SELECT INDEX_NAME AS name FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'items' GROUP BY INDEX_NAME",
  );
  const names = new Set(rows.map((row) => row.name));
  for (const index of ["idx_items_status_featured", "idx_items_status_updated", "idx_items_status_name"]) {
    assert.ok(names.has(index), "缺索引：" + index);
  }
  assert.equal(names.has("idx_items_status_sort"), false, "被覆盖的旧索引应已删除");
});

test("索引：items.search_text 是 FULLTEXT", { skip }, async () => {
  const rows = await query(
    "SELECT INDEX_NAME AS name, INDEX_TYPE AS type FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'items' AND INDEX_NAME = 'ft_items_search'",
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].type, "FULLTEXT");
});

test("ngram：多字命中，单字不命中（ngram_token_size=2 的已知约束）", { skip }, async () => {
  // 必须先提交再查：InnoDB FULLTEXT 看不到本事务刚插入的行（实测），所以这里不走事务，用 finally 清理。
  await query(INSERT_ITEM, ["__test_ngram", "探针", "[]", "摘要", "正文", "适合", "不适合", "P", "探针软件 图像编辑 gimp"]);
  try {
    const hit = await query("SELECT slug FROM items WHERE MATCH(search_text) AGAINST(? IN BOOLEAN MODE)", ["图像"]);
    // 不断言「唯一命中」：真实目录里也有含「图像」的条目，这里只要求探针行被找到。
    assert.ok(hit.some((row) => row.slug === "__test_ngram"), "两字中文应命中");
    const miss = await query("SELECT slug FROM items WHERE MATCH(search_text) AGAINST(? IN BOOLEAN MODE)", ["图"]);
    assert.equal(miss.length, 0, "单字查询在 ngram_token_size=2 下必然为空，应用层需要 LIKE 兜底");
  } finally {
    await query("DELETE FROM items WHERE slug = '__test_ngram'");
  }
  const leftover = await queryOne("SELECT COUNT(*) AS c FROM items WHERE slug = '__test_ngram'");
  assert.equal(Number(leftover.c), 0, "清理后不应留数据");
});

test("级联：删除条目会清掉 item_tags", { skip }, async () => {
  await withTransaction(async (conn) => {
    await insertItem(conn, "__test_cascade", "探针");
    const [rows] = await conn.query("SELECT id FROM items WHERE slug = '__test_cascade'");
    const id = rows[0].id;
    await conn.query("INSERT INTO item_tags (item_id, tag, sort_index) VALUES (?, ?, 0)", [id, "标签"]);
    await conn.query("DELETE FROM items WHERE id = ?", [id]);
    const [left] = await conn.query("SELECT COUNT(*) AS c FROM item_tags WHERE item_id = ?", [id]);
    assert.equal(Number(left[0].c), 0);
    throw ROLLBACK;
  }).catch(rolledBack);
});

test("约束：slug 唯一、枚举拒绝非法值", { skip }, async () => {
  await withTransaction(async (conn) => {
    await insertItem(conn, "__test_unique", "探针");
    await assert.rejects(
      () => insertItem(conn, "__test_unique", "探针"),
      /Duplicate entry/,
    );
    await assert.rejects(
      () => conn.query(
        "INSERT INTO items (slug, name, aliases, status, kind, source, summary, body, tutorial, who_for, who_not, icon_letter, search_text, created_at, updated_at) VALUES ('__test_enum','x','[]','published','app','bogus','s','b','[]','a','b','X','t',NOW(3),NOW(3))",
      ),
      /Data truncated|Incorrect enum/i,
    );
    throw ROLLBACK;
  }).catch(rolledBack);
});

// 连接池会让事件循环保持活跃，不关闭则 node --test 永不退出。
after(async () => {
  await closePool();
});
