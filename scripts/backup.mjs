#!/usr/bin/env node
/**
 * Ashare 本地数据备份。
 *
 * 快照内容：
 *   - **MySQL 导出**（配了 MYSQL_URL 时，导出到快照的 db/ashare.sql）
 *   - 遗留的 JSON 运行库（data/store）与上传图片（data/media，以及历史落点 public/media）
 *
 * 为什么必须有数据库那一半：P4 之后运行库的权威位置是 MySQL，**只备文件根本恢复不了站点**。
 * 所以没配 MYSQL_URL 时会明确告警，而不是安静地出一份残缺快照。
 *
 * 不自己实现归档格式：--zip 时调用系统自带的 tar。
 * 环境变量不进备份——ADMIN_PASSWORD_HASH、SESSION_SECRET、MYSQL_URL 需另行保管。
 *
 *   node scripts/backup.mjs            备份到 backups/
 *   node scripts/backup.mjs --out D:   指定输出目录（建议指向另一块盘或网盘同步目录）
 *   node scripts/backup.mjs --zip      额外用系统 tar 打成 .tar.gz
 *   node scripts/backup.mjs --keep 10  只保留最近 10 份
 *   node scripts/backup.mjs --list     列出现有备份
 *
 * 恢复（停进程后）：
 *   1. 数据库：mysql -u <用户> -p "<库名>" < db/ashare.sql
 *      导出用的是 --single-transaction，备份期间站点可照常读写。
 *   2. 文件：把快照里的 data/media（以及历史落点 public/media）覆盖回项目根目录。
 *      data/store 只是历史快照，新部署不再需要。
 *   --zip 产生的归档用 tar -xzf <file> -C <项目根目录> 解开。
 */
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import { parseFlags } from "./_shared.mjs";

/** mysqldump 可执行文件，可用环境变量覆盖（PATH 里没有时）。 */
const MYSQL_DUMP = process.env.MYSQLDUMP?.trim() || "mysqldump";

// data/media 是新落点；public/media 是历史落点，存量部署仍要能一起备份。
const SOURCES = ["data/store", "data/media", "public/media"];
const DEFAULT_OUT = "backups";
const DIR_PATTERN = /^ashare-backup-\d{8}-\d{6}$/;
const ARCHIVE_PATTERN = /^ashare-backup-\d{8}-\d{6}\.tar\.gz$/;
// 这些文件装的是用户提交或反馈内容，恢复需要它们，但对外分享前应先剔除。
const SENSITIVE_FILES = new Set(["feedback.json", "blocks.json", "inbox.json"]);
const USAGE = "用法: node scripts/backup.mjs [--out <目录>] [--keep <份数>] [--zip] [--list]";

function parseArgs(argv) {
  const args = parseFlags(argv, { "--out": "value", "--keep": "number", "--zip": "bool", "--list": "bool" });
  if (args.out !== undefined && !args.out) throw new Error("--out 不能为空");
  if (args.keep !== undefined && (!Number.isInteger(args.keep) || args.keep < 1)) {
    throw new Error("--keep 需为不小于 1 的整数");
  }
  args.out ??= DEFAULT_OUT;
  args.keep ??= 0;
  return args;
}

function stamp(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

/** 符号链接一律跳过：快照只包含仓库内的真实文件，不跟随到目录之外。 */
async function collect(absBase, relBase) {
  const files = [];
  const dirs = [relBase];
  async function visit(absDir, relDir) {
    const items = await fs.readdir(absDir, { withFileTypes: true });
    for (const item of items) {
      const abs = path.join(absDir, item.name);
      const rel = `${relDir}/${item.name}`;
      if (item.isDirectory()) {
        dirs.push(rel);
        await visit(abs, rel);
      } else if (item.isFile()) {
        files.push({ rel, abs });
      }
    }
  }
  await visit(absBase, relBase);
  return { files: files.sort((a, b) => a.rel.localeCompare(b.rel)), dirs: dirs.sort() };
}

function toPosix(value) {
  return value.split(path.sep).join("/");
}

async function existingSources(root) {
  const found = [];
  for (const source of SOURCES) {
    try {
      if ((await fs.stat(path.join(root, source))).isDirectory()) found.push(source);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  return found;
}

async function readBackups(outDir) {
  let names = [];
  try {
    names = await fs.readdir(outDir, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
  const backups = [];
  for (const entry of names) {
    const isArchive = ARCHIVE_PATTERN.test(entry.name);
    const isDir = entry.isDirectory() && DIR_PATTERN.test(entry.name);
    if (!isArchive && !isDir) continue;
    const stat = await fs.stat(path.join(outDir, entry.name));
    backups.push({
      name: entry.name,
      kind: isArchive ? "归档" : "目录",
      time: entry.name.slice("ashare-backup-".length, "ashare-backup-".length + 15),
      size: stat.size,
      mtime: stat.mtime,
    });
  }
  return backups.sort((a, b) => a.time.localeCompare(b.time));
}

async function listBackups(outDir) {
  const backups = await readBackups(outDir);
  if (!backups.length) {
    console.log(`${outDir} 下没有备份。先跑一次 node scripts/backup.mjs。`);
    return;
  }
  for (const backup of backups) {
    const size = backup.kind === "目录" ? "—" : `${(backup.size / 1024).toFixed(1)} KiB`;
    console.log(`${backup.name}\t${backup.kind}\t${size}\t${backup.mtime.toLocaleString("zh-CN")}`);
  }
}

async function zipSnapshot(outDir, baseName) {
  const probe = spawnSync("tar", ["--version"], { encoding: "utf8" });
  if (probe.error || probe.status !== 0) {
    throw new Error("未找到系统 tar（Windows 10+ 与 Linux/macOS 自带）。已保留未压缩的快照目录，可手动压缩。");
  }
  const archive = path.join(outDir, `${baseName}.tar.gz`);
  const result = spawnSync("tar", ["-czf", archive, "-C", outDir, baseName], { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`tar 打包失败：${(result.stderr || "").trim() || "未知错误"}`);
  }
  return archive;
}

/**
 * --keep 会真的删目录，所以只认本脚本产出的快照：
 * 目录必须有 manifest.json 且带 createdAt；归档用 tar 列出内容确认含 manifest.json。
 * 名字长得像不算数——万一 --out 指向的目录里本来就有同名文件夹呢。
 */
async function isOwnBackup(outDir, backup) {
  if (backup.kind === "目录") {
    try {
      const manifest = JSON.parse(await fs.readFile(path.join(outDir, backup.name, "manifest.json"), "utf8"));
      return Boolean(manifest?.createdAt);
    } catch {
      return false;
    }
  }
  const listing = spawnSync("tar", ["-tzf", path.join(outDir, backup.name)], { encoding: "utf8", maxBuffer: 8 << 20 });
  if (listing.status !== 0) return false;
  return listing.stdout.split("\n").some((line) => line.endsWith("/manifest.json"));
}

async function prune(outDir, keep) {
  const backups = await readBackups(outDir);
  let skipped = 0;
  for (const backup of backups.slice(0, Math.max(0, backups.length - keep))) {
    if (!(await isOwnBackup(outDir, backup))) {
      skipped += 1;
      console.log(`跳过 ${backup.name}：没有本脚本写的 manifest.json，不敢删`);
      continue;
    }
    await fs.rm(path.join(outDir, backup.name), { recursive: true, force: true });
    console.log(`已清理旧备份 ${backup.name}`);
  }
  if (skipped) console.log(`${skipped} 个同名目录不是备份产物，已保留。`);
}

/** 从 MYSQL_URL 拆出连接信息。口令只进临时 defaults 文件，绝不上命令行。 */
function mysqlDumpArgs(url) {
  const parsed = new URL(url);
  const database = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
  if (!database) throw new Error("MYSQL_URL 缺少数据库名");
  const defaults = [
    "[client]",
    "host=" + parsed.hostname,
    "port=" + (parsed.port || "3306"),
    "user=" + decodeURIComponent(parsed.username),
    "password=" + decodeURIComponent(parsed.password),
    "",
  ].join("\n");
  return { database, defaults };
}

/**
 * 导出数据库到快照的 db/ashare.sql。
 *
 * 两个刻意的选择：
 *  - 口令走 --defaults-extra-file（0600，用完立即删）而不是命令行 —— 后者会出现在进程列表里；
 *  - 导出失败就抛错，不留一份「看起来成功了」但没有库的快照。
 */
async function dumpDatabase(target, manifest) {
  const url = process.env.MYSQL_URL?.trim();
  if (!url) return false;
  const { database, defaults } = mysqlDumpArgs(url);
  const dir = path.join(target, "db");
  await fs.mkdir(dir, { recursive: true });
  const file = path.join(dir, "ashare.sql");
  const defaultsFile = path.join(dir, ".mysqldump.cnf");
  await fs.writeFile(defaultsFile, defaults, { mode: 0o600 });
  try {
    const result = spawnSync(
      MYSQL_DUMP,
      [
        "--defaults-extra-file=" + defaultsFile,
        // 一致性快照：InnoDB 下不锁表，备份期间站点照常读写。
        "--single-transaction",
        "--routines",
        "--triggers",
        "--events",
        "--default-character-set=utf8mb4",
        "--databases",
        database,
        "--result-file=" + file,
      ],
      { encoding: "utf8" },
    );
    if (result.error) {
      throw new Error("mysqldump 执行失败：" + result.error.message + "（可用 MYSQLDUMP 环境变量指定可执行文件路径）");
    }
    if (result.status !== 0) {
      throw new Error("mysqldump 退出码 " + result.status + "：" + String(result.stderr || "").trim().slice(0, 300));
    }
  } finally {
    // 凭据文件必须立刻删除，哪怕导出失败。
    await fs.rm(defaultsFile, { force: true });
  }
  const content = await fs.readFile(file);
  manifest.database = {
    file: "db/ashare.sql",
    bytes: content.length,
    sha256: createHash("sha256").update(content).digest("hex"),
    database,
  };
  console.log("已导出数据库 " + database + "：" + (content.length / 1024).toFixed(1) + " KiB");
  return true;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(USAGE);
    return;
  }
  const root = process.cwd();
  const outDir = path.resolve(root, args.out);

  if (args.list) {
    await listBackups(outDir);
    return;
  }

  const sources = await existingSources(root);
  const hasDatabase = Boolean(process.env.MYSQL_URL?.trim());
  if (!sources.length && !hasDatabase) {
    throw new Error("既没有 data/store / data/media，也没有配置 MYSQL_URL —— 没有可备份的数据。");
  }

  const baseName = `ashare-backup-${stamp()}`;
  const target = path.join(outDir, baseName);
  await fs.mkdir(target, { recursive: true });
  const manifest = { createdAt: new Date().toISOString(), files: [], sensitive: [] };
  let totalBytes = 0;

  for (const source of sources) {
    const { files, dirs } = await collect(path.join(root, source), source);
    for (const rel of dirs) await fs.mkdir(path.join(target, rel), { recursive: true });
    for (const { rel, abs } of files) {
      const content = await fs.readFile(abs);
      await fs.writeFile(path.join(target, rel), content);
      manifest.files.push({
        path: toPosix(rel),
        bytes: content.length,
        sha256: createHash("sha256").update(content).digest("hex"),
      });
      if (SENSITIVE_FILES.has(path.basename(rel))) manifest.sensitive.push(toPosix(rel));
      totalBytes += content.length;
    }
    console.log(`复制 ${source}：${files.length} 个文件`);
  }

  // 数据库那一半放在写 manifest 之前：导出失败就整个失败，不留残缺快照。
  if (!(await dumpDatabase(target, manifest))) {
    console.warn("[backup] 未配置 MYSQL_URL：本次**没有备份数据库**。运行库的权威位置已是 MySQL，只有文件快照恢复不了站点。");
  }

  await fs.writeFile(path.join(target, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`已备份 ${manifest.files.length} 个文件（${(totalBytes / 1024).toFixed(1)} KiB）→ ${path.relative(root, target) || target}`);

  if (args.zip) {
    const archive = await zipSnapshot(outDir, baseName);
    await fs.rm(target, { recursive: true, force: true });
    console.log(`已打包并移除快照目录 → ${path.relative(root, archive) || archive}`);
  }

  console.log("注意：环境变量（ADMIN_PASSWORD_HASH、SESSION_SECRET）不在备份内，需另行保管。");
  if (manifest.sensitive.length) {
    console.log(`注意：快照含 ${manifest.sensitive.length} 个用户提交内容文件（${manifest.sensitive.join("、")}），对外分享或上传前先剔除。`);
  }
  if (args.keep) await prune(outDir, args.keep);
}

main().catch((error) => {
  console.error(`[backup] ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
