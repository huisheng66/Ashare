import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { after, before, test } from "node:test";

import mysql from "mysql2/promise";

import { closePool, connectionOptions, query } from "../lib/db.ts";
import * as store from "../lib/store-sql.ts";
import { can, canSetStatus, isRole, permissionsOf, ROLE_LABEL, STATUS_LABEL, toPublicUser, USERNAME_PATTERN } from "../lib/users.ts";

import { mysqlSkip } from "./_mysql-skip.mjs";

/**
 * P7 账号与权限闸门。
 *
 * 权限判断是本项目最容易漏的一类漏洞：新加一个入口却忘了加检查。所以先把矩阵本身测住，
 * 再测账号存储。账号表与目录无关，数据库部分没设 MYSQL_TEST_URL 时跳过。
 */

const { skip } = await mysqlSkip("MYSQL_TEST_URL", "账号存储测试");
if (process.env.MYSQL_TEST_URL) process.env.MYSQL_URL = process.env.MYSQL_TEST_URL;

before(async () => {
  if (skip) return;
  const ddl = await mysql.createConnection({ ...connectionOptions(), multipleStatements: true });
  try {
    // 迁移都是 CREATE TABLE IF NOT EXISTS，可重复执行。
    for (const file of readdirSync("db/migrations").filter((name) => name.endsWith(".sql")).sort()) {
      await ddl.query(readFileSync("db/migrations/" + file, "utf8"));
    }
  } finally {
    await ddl.end();
  }
  await query("DELETE FROM users");
});

after(async () => {
  await closePool();
});

test("权限矩阵：编辑只能写草稿与处理投稿，发布与管账号是管理员专属", () => {
  assert.deepEqual(permissionsOf("admin").sort(), ["edit", "moderate", "publish", "users"]);
  assert.deepEqual(permissionsOf("editor").sort(), ["edit", "moderate"]);
  assert.equal(can("editor", "publish"), false);
  assert.equal(can("editor", "users"), false);
  assert.equal(can("admin", "users"), true);
  assert.equal(can("editor", "edit"), true);
});

test("状态流转：发布与撤下都是管理员动作", () => {
  assert.equal(canSetStatus("editor", "draft", "review"), true, "编辑可以提交审核");
  assert.equal(canSetStatus("editor", "review", "draft"), true, "编辑可以撤回自己的提交");
  assert.equal(canSetStatus("editor", "draft", "published"), false, "编辑不能自己把草稿推上线");
  assert.equal(canSetStatus("editor", "published", "draft"), false, "编辑不能把已发布的撤下来");
  assert.equal(canSetStatus("admin", "draft", "published"), true);
  assert.equal(canSetStatus("admin", "published", "draft"), true);
});

test("toPublicUser 不泄露口令哈希，字段集合是显式的", () => {
  const view = toPublicUser({
    username: "a", displayName: "A", passwordHash: "salt:hash", role: "editor",
    disabled: false, createdAt: "2026-01-01T00:00:00.000Z",
  });
  assert.equal("passwordHash" in view, false);
  assert.deepEqual(Object.keys(view).sort(), ["createdAt", "disabled", "displayName", "role", "username"]);
});

test("用户名规则与标签", () => {
  assert.equal(isRole("admin"), true);
  assert.equal(isRole("root"), false);
  assert.ok(USERNAME_PATTERN.test("editor-01"));
  assert.equal(USERNAME_PATTERN.test("Editor"), false, "大写非法");
  assert.equal(USERNAME_PATTERN.test("a"), false, "至少 2 位");
  assert.equal(ROLE_LABEL.editor, "编辑");
  assert.equal(STATUS_LABEL.review, "待审核");
});

test("账号：建号、读号、列出、改角色、停用、登录时间、删除", { skip }, async () => {
  const record = {
    username: "tester-01",
    displayName: "测试员",
    passwordHash: "aa:bb",
    role: "editor",
    disabled: false,
    createdAt: "2026-04-01T00:00:00.000Z",
  };
  await store.upsertUser(record);

  const loaded = await store.getUser("tester-01");
  assert.equal(loaded.displayName, "测试员");
  assert.equal(loaded.role, "editor");
  assert.equal(loaded.disabled, false);
  assert.equal(loaded.createdAt, record.createdAt, "createdAt 应精确往返");

  const listed = await store.listUsers();
  assert.ok(listed.some((entry) => entry.username === "tester-01"));
  assert.equal("passwordHash" in listed[0], false, "列表不该带口令哈希");

  await store.upsertUser({ ...loaded, role: "admin", disabled: true });
  const again = await store.getUser("tester-01");
  assert.equal(again.role, "admin");
  assert.equal(again.disabled, true);
  assert.equal(again.createdAt, record.createdAt, "改号不该覆盖 created_at");

  await store.touchUserLogin("tester-01");
  assert.ok((await store.getUser("tester-01")).lastLoginAt, "应记录最近登录时间");

  assert.equal(await store.deleteUser("tester-01"), true);
  assert.equal(await store.deleteUser("tester-01"), false);
  assert.equal(await store.getUser("tester-01"), undefined);
});
