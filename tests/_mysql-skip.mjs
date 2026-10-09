import mysql from "mysql2/promise";

/**
 * 数据库测试组的跳过判定。
 *
 * **为什么不能只看「URL 有没有配」**：那是更糟的一种失败。配置了 URL 但服务没启动时，
 * 原来每个文件都在 before hook 里失败，报出来的是 `hookFailed` + `ECONNREFUSED` ——
 * 看不出是「环境没就绪」还是「代码坏了」，而这两者的处置完全不同。
 * 实测中这误导过一次排查方向。
 *
 * 所以这里**真的去连一次**：连不上就整组跳过，并把原因写进跳过原因里。
 *
 * **代价与取舍**：每个文件多一次连接往返（本地 1~2ms）。换来的是「红」与「环境没起」
 * 永远能区分开 —— 这在 CI 上尤其重要，那里 MySQL 常常是另起的服务。
 *
 * 用法：
 *   const { skip } = await mysqlSkip("MYSQL_TEST_URL", "SQL 读路径一致性测试");
 *   test("…", { skip }, async () => { … });
 */

/**
 * @param {string|undefined} urlKey   环境变量名，如 MYSQL_TEST_URL
 * @param {string} label             测试组名，写进跳过原因里
 * @returns {Promise<{skip: false}|{skip: string}>} 传给 node:test 的 options
 */
export async function mysqlSkip(urlKey, label) {
  const url = process.env[urlKey];
  if (!url || !url.trim()) {
    return { skip: `未设置 ${urlKey}：跳过${label}` };
  }
  let connection;
  try {
    connection = await mysql.createConnection({ uri: url, connectTimeout: 3000 });
    await connection.query("SELECT 1");
    return { skip: false };
  } catch (error) {
    // 只报可操作的信息：错误码 + 主机端口，不把整个 URL（含口令）打出来。
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "未知";
    const message = error instanceof Error ? error.message : String(error);
    // 从 URL 里只取 host:port 用于提示，避免泄露口令。
    let where = "";
    try {
      const parsed = new URL(url);
      where = `${parsed.hostname}:${parsed.port || 3306}`;
    } catch {
      where = "（URL 解析失败）";
    }
    return {
      skip: `${urlKey} 指向的数据库连不上（${where}，${code}）：${message}；跳过${label}。`
        + `若是本地隔离实例，先按 docs/MySQL 迁移计划.md 第八章启动它。`,
    };
  } finally {
    if (connection) await connection.end().catch(() => {});
  }
}