import assert from "node:assert/strict";
import { test } from "node:test";

import mysql from "mysql2/promise";

/**
 * P9 最小权限的边界闸门。
 *
 * 权限这东西「配好了」和「还在」是两件事：下一次手动 GRANT、或者有人图省事把应用账号
 * 提回 ALL，边界就悄悄没了，而且不会有任何报错。所以把它测住 ——
 * 这些断言失败意味着「应用是唯一写者、其他服务只读目录」这条约束已经破了。
 *
 * 需要 MYSQL_MIGRATE_URL 与 MYSQL_RO_URL；没配则整组跳过（npm test 不依赖数据库）。
 */
const URLS = {
  app: process.env.MYSQL_URL,
  migrate: process.env.MYSQL_MIGRATE_URL,
  ro: process.env.MYSQL_RO_URL,
};
const skip = URLS.migrate && URLS.ro ? false : "未配置 MYSQL_MIGRATE_URL / MYSQL_RO_URL：跳过权限边界测试";

/** mysql2 拒绝访问是 1142；表不存在是 1146。 */
const DENIED = 1142;

function parse(url) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: Number(parsed.port || 3306),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: decodeURIComponent(parsed.pathname.replace(/^\/+/, "")),
  };
}

/** 以某个账号执行一条语句，成功返回 0，失败返回 errno。 */
async function attempt(account, sql) {
  const conn = await mysql.createConnection(parse(URLS[account]));
  try {
    await conn.query(sql);
    return 0;
  } catch (error) {
    return error.errno ?? -1;
  } finally {
    await conn.end();
  }
}

test("应用账号能读写数据，但不能改结构", { skip }, async () => {
  assert.equal(await attempt("app", "SELECT COUNT(*) FROM items"), 0);
  assert.equal(await attempt("app", "CREATE TABLE __grants_probe (id INT)"), DENIED, "应用账号不该能建表");
  assert.equal(await attempt("app", "DROP TABLE IF EXISTS __grants_probe"), DENIED, "应用账号不该能删表");
  assert.equal(await attempt("app", "ALTER TABLE items ADD COLUMN __probe INT"), DENIED, "应用账号不该能改表");
});

test("只读账号只能看已发布目录视图：读不到口令哈希，也不能写", { skip }, async () => {
  assert.equal(await attempt("ro", "SELECT COUNT(*) FROM v_published_items"), 0);
  assert.equal(await attempt("ro", "SELECT COUNT(*) FROM v_published_item_links"), 0);
  for (const table of ["users", "submissions", "audit_log", "ip_blocks", "items"]) {
    const errno = await attempt("ro", `SELECT * FROM ${table} LIMIT 1`);
    assert.ok(errno === DENIED || errno === 1146, `只读账号不该能读 ${table}，实际 errno=${errno}`);
  }
  // users 是核心：只读账号看得到它，等于把口令哈希发给每一个接入的服务。
  assert.equal(await attempt("ro", "SELECT password_hash FROM users LIMIT 1"), DENIED);
  assert.equal(await attempt("ro", "UPDATE items SET name = name"), DENIED);
  assert.equal(await attempt("ro", "DELETE FROM items"), DENIED);
});

test("迁移账号持有 DDL", { skip }, async () => {
  assert.equal(await attempt("migrate", "CREATE TABLE IF NOT EXISTS __grants_probe (id INT)"), 0);
  assert.equal(await attempt("migrate", "DROP TABLE IF EXISTS __grants_probe"), 0);
});
