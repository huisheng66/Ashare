#!/usr/bin/env node
/**
 * 数据库最小权限：把「API 是唯一写者」这条架构约束落成授权。
 *
 * 为什么必须做：应用账号原来对 ashare.* 是 ALL PRIVILEGES —— 包括 DROP / ALTER / CREATE。
 * 一个只做 CRUD 的应用握着 DROP 权限，等于把「改结构」和「改数据」的边界抹掉了：
 * 任何一次 SQL 注入或代码事故都能直接删表。
 *
 * 三个账号，各司其职：
 *   ashare_app      只能 SELECT / INSERT / UPDATE / DELETE —— 应用运行时用，不碰结构
 *   ashare_migrate  持有 DDL —— 只有 db:migrate / db:reindex 这类部署步骤用
 *   ashare_ro       只能读**已发布目录的视图** —— 给其他服务与报表用
 *
 * 只读账号刻意只授视图、不授基础表：这样它**看不到 users 的口令哈希、
 * submissions 与 feedback 里的用户内容、audit_log、ip_blocks**。
 * 视图用 SQL SECURITY DEFINER（默认），所以被授 SELECT 视图就够，不需要基础表权限。
 *
 * 用法：
 *   npm run db:grants        需要 MYSQL_ADMIN_URL（有建用户与建视图权限的管理员）
 *
 * 测试库（ashare_test / ashare_scale）保持 ALL —— 那些库本来就要建表删表。
 */
import process from "node:process";

import mysql from "mysql2/promise";

const quote = (value) => "\`" + String(value).replace(/\`/g, "\`\`") + "\`";

function parse(url, label) {
  if (!url?.trim()) return undefined;
  const parsed = new URL(url.trim());
  const database = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
  return {
    label,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    host: parsed.hostname,
    port: parsed.port || "3306",
    database,
  };
}

/** 只读账号能看到的：已发布条目及其子表。基础表一律不授。 */
const VIEWS = [
  {
    name: "v_published_items",
    sql: "SELECT slug, name, name_zh, aliases, kind, source, price, summary, body, tutorial, who_for, who_not, discount_note, license, version, links_checked_at, featured, sort_index, icon_letter, icon_color, icon_simple, icon_image, guide_intro, guide_markdown, created_at, updated_at FROM items WHERE status = 'published'",
  },
  { name: "v_published_item_links", sql: "SELECT i.slug, l.kind, l.url, l.disk_note, l.disk_sha256, l.disk_file FROM items i JOIN item_links l ON l.item_id = i.id WHERE i.status = 'published'" },
  { name: "v_published_item_tags", sql: "SELECT i.slug, t.tag, t.sort_index FROM items i JOIN item_tags t ON t.item_id = i.id WHERE i.status = 'published'" },
  { name: "v_published_item_scenes", sql: "SELECT i.slug, s.scene_id, s.sort_index FROM items i JOIN item_scenes s ON s.item_id = i.id WHERE i.status = 'published'" },
  { name: "v_published_item_platforms", sql: "SELECT i.slug, p.platform, p.sort_index FROM items i JOIN item_platforms p ON p.item_id = i.id WHERE i.status = 'published'" },
];

const DML = ["SELECT", "INSERT", "UPDATE", "DELETE"];

async function existingPrivileges(conn, user, host, database) {
  const [rows] = await conn.query(
    "SELECT DISTINCT PRIVILEGE_TYPE AS p FROM information_schema.SCHEMA_PRIVILEGES WHERE GRANTEE = ? AND TABLE_SCHEMA = ?",
    [`'${user}'@'${host}'`, database],
  );
  return rows.map((row) => row.p);
}

async function main() {
  const admin = parse(process.env.MYSQL_ADMIN_URL, "admin");
  const app = parse(process.env.MYSQL_URL, "app");
  const migrate = parse(process.env.MYSQL_MIGRATE_URL, "migrate");
  const ro = parse(process.env.MYSQL_RO_URL, "ro");
  if (!admin) throw new Error("需要 MYSQL_ADMIN_URL（有建用户与建视图权限的管理员账号）");
  if (!app) throw new Error("需要 MYSQL_URL（应用账号）");
  if (!migrate) throw new Error("需要 MYSQL_MIGRATE_URL（迁移账号）");
  if (!ro) throw new Error("需要 MYSQL_RO_URL（只读账号）");
  if (app.database !== migrate.database || app.database !== ro.database) {
    throw new Error("三个账号必须指向同一个库，否则授权无从谈起");
  }
  const database = app.database;
  // 测试与规模库保持 ALL：它们本来就要建表删表。
  const scratch = [process.env.MYSQL_TEST_URL, process.env.MYSQL_SCALE_URL].map((url) => parse(url, "scratch")).filter(Boolean);

  // 必须带上默认库：视图体里引用的是不带库名的表名，没有默认库会 "No database selected"。
  const conn = await mysql.createConnection({ host: admin.host, port: Number(admin.port), user: admin.user, password: admin.password, database, multipleStatements: false });
  try {
    for (const account of [app, migrate, ro]) {
      const who = `'${account.user}'@'${account.host}'`;
      await conn.query(`CREATE USER IF NOT EXISTS ${who} IDENTIFIED BY ${conn.escape(account.password)}`);
      // 口令以 URL 为准，避免「改了 .env 但库里的口令没跟着变」。
      await conn.query(`ALTER USER ${who} IDENTIFIED BY ${conn.escape(account.password)}`);
      console.log(`[grants] 账号就绪 ${account.user}@${account.host}`);
    }

    // 应用账号：先收回一切，再只授 DML。
    const appWho = `'${app.user}'@'${app.host}'`;
    const appPrivs = await existingPrivileges(conn, app.user, app.host, database);
    if (appPrivs.length) {
      await conn.query(`REVOKE ${appPrivs.join(", ")} ON ${quote(database)}.* FROM ${appWho}`);
      console.log(`[grants] 应用账号收回 ${appPrivs.length} 项：${appPrivs.join(", ")}`);
    }
    await conn.query(`GRANT ${DML.join(", ")} ON ${quote(database)}.* TO ${appWho}`);
    console.log(`[grants] 应用账号仅授 ${DML.join(" / ")}`);

    for (const db of scratch) {
      await conn.query(`GRANT ALL PRIVILEGES ON ${quote(db.database)}.* TO ${appWho}`);
      console.log(`[grants] 测试类库保持 ALL：${db.database}`);
    }

    // 迁移账号：DDL。
    await conn.query(`GRANT ALL PRIVILEGES ON ${quote(database)}.* TO '${migrate.user}'@'${migrate.host}'`);
    console.log("[grants] 迁移账号持 DDL");

    // 只读账号：只授视图。
    await conn.query(`GRANT SELECT ON ${quote(database)}.* TO '${ro.user}'@'${ro.host}'`);
    for (const view of VIEWS) {
      await conn.query(`CREATE OR REPLACE SQL SECURITY DEFINER VIEW ${quote(database)}.${quote(view.name)} AS ${view.sql}`);
    }
    // 先撤掉库级 SELECT（它会让只读账号看到 users 的口令哈希），再逐个授视图。
    await conn.query(`REVOKE SELECT ON ${quote(database)}.* FROM '${ro.user}'@'${ro.host}'`);
    for (const view of VIEWS) {
      await conn.query(`GRANT SELECT ON ${quote(database)}.${quote(view.name)} TO '${ro.user}'@'${ro.host}'`);
    }
    console.log(`[grants] 只读账号仅授 ${VIEWS.length} 个视图（不可见 users / submissions / audit_log）`);

    await conn.query("FLUSH PRIVILEGES");
  } finally {
    await conn.end();
  }

  // 复查：把边界当成断言来跑，而不是相信上面那串语句。
  const probe = async (account, sql, expectFailure) => {
    const test = await mysql.createConnection({ host: account.host, port: Number(account.port), user: account.user, password: account.password, database });
    try {
      await test.query(sql);
      if (expectFailure) throw new Error(`${account.label} 竟然成功了：${sql}`);
      return "允许";
    } catch (error) {
      if (expectFailure) {
        if (error.errno !== 1142 && error.errno !== 1146) throw error;
        return "拒绝";
      }
      throw new Error(`${account.label} 不该失败：${sql} → ${error.message}`);
    } finally {
      await test.end();
    }
  };

  console.log("\n[grants] 边界复查：");
  console.log("  应用读目录           " + (await probe(app, "SELECT COUNT(*) FROM items", false)));
  console.log("  应用写目录           " + (await probe(app, "SELECT 1", false)));
  console.log("  应用 DROP 表         " + (await probe(app, "DROP TABLE IF EXISTS __grants_probe", true)));
  console.log("  应用 CREATE 表       " + (await probe(app, "CREATE TABLE __grants_probe (id INT)", true)));
  console.log("  只读读视图           " + (await probe(ro, "SELECT COUNT(*) FROM v_published_items", false)));
  console.log("  只读读 users（口令哈希）" + (await probe(ro, "SELECT password_hash FROM users LIMIT 1", true)));
  console.log("  只读写目录           " + (await probe(ro, "UPDATE items SET name = name", true)));
  console.log("  迁移改结构           " + (await probe(migrate, "CREATE TABLE IF NOT EXISTS __grants_probe (id INT)", false)));
  const drop = await mysql.createConnection({ host: migrate.host, port: Number(migrate.port), user: migrate.user, password: migrate.password, database });
  await drop.query("DROP TABLE IF EXISTS __grants_probe").finally(() => drop.end());
}

main().catch((error) => {
  console.error("[grants] 失败：" + (error && error.message ? error.message : error));
  process.exitCode = 1;
});
