#!/usr/bin/env node
/**
 * 后台账号管理。
 *
 * 口令不走命令行参数（会留在 shell 历史与进程列表里），一律交互式隐藏输入。
 *
 * 用法：
 *   npm run user -- list
 *   npm run user -- add <账号> --name "显示名" [--role admin|editor]
 *   npm run user -- passwd <账号>
 *   npm run user -- disable <账号>
 *   npm run user -- enable <账号>
 *   npm run user -- remove <账号>
 */
import { randomBytes, scryptSync } from "node:crypto";
import process from "node:process";

import { closePool } from "../lib/db.ts";
import * as store from "../lib/store-sql.ts";
import { isRole, ROLE_LABEL, USERNAME_PATTERN } from "../lib/users.ts";
import { parseFlags } from "./_shared.mjs";

function hash(password) {
  const salt = randomBytes(16);
  return salt.toString("hex") + ":" + scryptSync(password, salt, 64).toString("hex");
}

/** 隐藏输入，读两次比对。与 scripts/hash-password.mjs 同一套按键处理。 */
function promptPassword(label) {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY) {
      reject(new Error("请在交互终端中运行（口令不走命令行参数）"));
      return;
    }
    console.log(label);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    let password = "";
    let first;
    const finish = () => {
      process.stdin.setRawMode(false);
      process.stdin.removeListener("keypress", onKey);
      process.stdin.pause();
    };
    const onKey = (text, key = {}) => {
      if (key.ctrl && key.name === "c") { finish(); reject(new Error("已取消")); return; }
      if (key.name === "return" || key.name === "enter") {
        if (password.length < 12 || password.length > 1024) {
          console.log("口令需为 12–1024 个字符，请重新输入：");
          password = "";
        } else if (first === undefined) {
          first = password;
          password = "";
          console.log("再次输入口令：");
        } else if (password !== first) {
          first = undefined;
          password = "";
          console.log("两次不一致，请重新输入：");
        } else {
          finish();
          resolve(password);
        }
      } else if (key.name === "backspace") {
        password = Array.from(password).slice(0, -1).join("");
      } else if (!key.ctrl && !key.meta && text && !/[\x00-\x1f\x7f]/.test(text)) {
        password += text;
      }
    };
    process.stdin.on("keypress", onKey);
  });
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  const args = parseFlags(rest, { "--name": "value", "--role": "value" });

  if (!command || command === "list") {
    const users = await store.listUsers();
    if (!users.length) {
      console.log("还没有任何账号。此时后台仍可用 ADMIN_PASSWORD_HASH 登录（引导模式）。");
      return;
    }
    for (const user of users) {
      console.log(
        [user.username, ROLE_LABEL[user.role], user.disabled ? "已停用" : "正常", user.displayName, user.lastLoginAt ?? "从未登录"].join("\t"),
      );
    }
    return;
  }

  const username = String(args._ ?? rest.find((value) => !value.startsWith("--")) ?? "").trim().toLowerCase();
  if (!USERNAME_PATTERN.test(username)) {
    throw new Error("账号需为 2–64 位小写字母、数字或中划线，且以字母或数字开头");
  }

  if (command === "add") {
    const existing = await store.getUser(username);
    if (existing) throw new Error("账号已存在：" + username);
    const role = args.role ?? "editor";
    if (!isRole(role)) throw new Error("--role 只能是 admin 或 editor");
    const password = await promptPassword("设置口令（至少 12 个字符）：");
    const record = {
      username,
      displayName: String(args.name ?? username),
      passwordHash: hash(password),
      role,
      disabled: false,
      createdAt: new Date().toISOString(),
    };
    await store.upsertUser(record);
    console.log("已创建 " + username + "（" + ROLE_LABEL[role] + "）");
    return;
  }

  const record = await store.getUser(username);
  if (!record) throw new Error("账号不存在：" + username);

  if (command === "passwd") {
    record.passwordHash = hash(await promptPassword("设置新口令（至少 12 个字符）："));
    await store.upsertUser(record);
    console.log("已更新口令：" + username);
  } else if (command === "disable" || command === "enable") {
    record.disabled = command === "disable";
    await store.upsertUser(record);
    console.log((record.disabled ? "已停用 " : "已启用 ") + username);
  } else if (command === "remove") {
    await store.deleteUser(username);
    console.log("已删除 " + username);
  } else {
    throw new Error("未知命令：" + command);
  }
}

main()
  .then(() => closePool())
  .catch(async (error) => {
    await closePool().catch(() => {});
    console.error("[user] " + (error && error.message ? error.message : error));
    process.exitCode = 1;
  });
