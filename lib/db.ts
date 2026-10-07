import mysql from "mysql2/promise";

/**
 * MySQL 连接层：应用与 .mjs 脚本共用。
 *
 * 刻意不写 "server-only"：scripts/*.mjs 与技能脚本要 import 本模块，
 * 而 Node 24 的类型擦除可以直接跑 .ts（项目已有先例：scripts/seed-drift.mjs -> lib/seed.ts）。
 * 也刻意不用 "@/..." 别名：脚本侧没有 tsconfig 的 paths 解析。
 *
 * 连接池挂在 globalThis 上：Next dev 的 HMR 会反复求值模块，不缓存会在热更新中泄漏连接
 * （与 lib/click-store.ts 的 processRef 同一模式）。
 */

type Pool = ReturnType<typeof mysql.createPool>;
type PoolConnection = Awaited<ReturnType<Pool["getConnection"]>>;

const globalRef = globalThis as typeof globalThis & { __ashareMysqlPool?: Pool };

export type DbConnectionOptions = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  charset: string;
  timezone: string;
  dateStrings: Array<"TIMESTAMP" | "DATETIME" | "DATE">;
  supportBigNumbers: boolean;
  ssl?: { rejectUnauthorized: boolean };
};

/** 读取 MYSQL_URL。缺变量时立刻报错，不要等到第一次查询才炸。 */
export function databaseUrl(): string {
  const url = process.env.MYSQL_URL?.trim();
  if (!url) {
    throw new Error("[db] 缺少 MYSQL_URL。把 .env.example 复制为 .env.local 并填写 mysql://user:password@host:port/database");
  }
  return url;
}

/**
 * 结构变更（建表、加索引、DROP）用的连接。
 *
 * 应用账号现在只有 SELECT/INSERT/UPDATE/DELETE —— 连 DROP 都没有（见 npm run db:grants）。
 * 迁移脚本必须走 MYSQL_MIGRATE_URL，否则会以 "command denied" 失败。
 * 没配时回落到应用账号并**明确告警**：本地图省事可以，生产不该如此。
 */
export function migrationConnectionOptions(): DbConnectionOptions {
  const migrate = process.env.MYSQL_MIGRATE_URL?.trim();
  if (migrate) return connectionOptions(migrate);
  if (process.env.MYSQL_URL?.trim()) {
    console.warn("[db] 未配置 MYSQL_MIGRATE_URL，结构变更将用应用账号执行；生产环境应配置迁移账号");
  }
  return connectionOptions();
}

export function connectionOptions(url = databaseUrl()): DbConnectionOptions {
  const parsed = new URL(url);
  if (parsed.protocol !== "mysql:") {
    throw new Error("[db] MYSQL_URL 必须是 mysql:// 协议，收到 " + parsed.protocol);
  }
  const database = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
  if (!database) throw new Error("[db] MYSQL_URL 缺少数据库名");
  const options: DbConnectionOptions = {
    host: parsed.hostname,
    port: parsed.port ? Number(parsed.port) : 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database,
    charset: "utf8mb4",
    // 一律按 UTC 存取；展示层再按 Asia/Shanghai 格式化（与 lib/items.ts:formatDate 同一口径）。
    timezone: "Z",
    // DATE 直接按 'YYYY-MM-DD' 字符串返回：linksCheckedAt 只精确到天，
    // 让它过一遍 Date 只会平添时区漂移的风险。DATETIME(3) 仍按 Date 返回。
    dateStrings: ["DATE"],
    supportBigNumbers: true,
  };
  if (parsed.searchParams.get("ssl") === "1") options.ssl = { rejectUnauthorized: false };
  return options;
}

function poolSize(): number {
  const raw = Number(process.env.MYSQL_POOL_SIZE ?? "");
  return Number.isInteger(raw) && raw > 0 && raw <= 100 ? raw : 10;
}

export function getPool(): Pool {
  if (!globalRef.__ashareMysqlPool) {
    globalRef.__ashareMysqlPool = mysql.createPool({
      ...connectionOptions(),
      waitForConnections: true,
      queueLimit: 0,
      connectionLimit: poolSize(),
      enableKeepAlive: true,
    });
  }
  return globalRef.__ashareMysqlPool;
}

/** 普通查询。值一律走占位符，不要拼字符串。 */
export async function query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]> {
  const [rows] = await getPool().query(sql, params);
  return rows as unknown as T[];
}

export async function queryOne<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T | undefined> {
  return (await query<T>(sql, params))[0];
}

/**
 * 事务。回调抛错即回滚。
 * 注意：MySQL 的 DDL 会隐式提交，事务保护不了建表/改表 —— 迁移脚本不要走这里。
 */
export async function withTransaction<T>(fn: (conn: PoolConnection) => Promise<T>): Promise<T> {
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    try {
      const result = await fn(conn);
      await conn.commit();
      return result;
    } catch (error) {
      await conn.rollback();
      throw error;
    }
  } finally {
    conn.release();
  }
}

/** 释放连接池。脚本收尾与测试用；应用进程不需要调用。 */
export async function closePool(): Promise<void> {
  const pool = globalRef.__ashareMysqlPool;
  if (!pool) return;
  globalRef.__ashareMysqlPool = undefined;
  await pool.end();
}

/** 死锁与锁等待超时是瞬态错误：InnoDB 已经回滚了整个事务，重试是官方推荐的处理方式。 */
const RETRYABLE_LOCK_ERRORS = new Set(["ER_LOCK_DEADLOCK", "ER_LOCK_WAIT_TIMEOUT"]);

/**
 * 写事务 + 有界重试。
 *
 * 为什么必须重试：并发 INSERT 会命中间隙锁与全文索引的锁，实测两个「保存不同条目」
 * 的并发请求会直接死锁。把重试收在这里，调用方不用各自写一遍。
 * 回调必须是可重放的纯数据库操作 —— 文件上传这类副作用要放在事务之外。
 */
export async function withWriteTransaction<T>(
  work: (conn: PoolConnection) => Promise<T>,
  attempts = 3,
): Promise<T> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await withTransaction(work);
    } catch (error) {
      const code = (error as { code?: string } | null)?.code;
      if (attempt >= attempts || !code || !RETRYABLE_LOCK_ERRORS.has(code)) throw error;
      console.warn("[db] 写事务遇到 " + code + "，第 " + attempt + " 次重试");
    }
  }
}
