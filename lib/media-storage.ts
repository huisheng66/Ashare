import { promises as fs } from "node:fs";
import path from "node:path";

import { deleteObject, getObject, putObject, type S3Config } from "./s3.ts";

/**
 * 媒体（预览图与图标）的存储抽象。
 *
 * 为什么需要它：图片原本写在 public/media 上。单个 Node 进程 + 持久磁盘时没问题，
 * 但多进程/多副本一上来，「请求落到哪台机器」就决定了图片 404 不 404 ——
 * 这是横向扩容剩下的最后一块硬骨头。
 *
 * 驱动由 MEDIA_DRIVER 选择：
 *   local（默认）—— 写在 data/media（不在 public/ 下，理由见 localMediaRoot）；
 *   s3          —— S3 兼容对象存储（AWS S3 / 阿里 OSS / 腾讯 COS / MinIO）。
 *
 * 刻意不写 server-only：scripts/media-check.mjs 要 import 它做真实 bucket 的冒烟。
 */

export type MediaDriver = "local" | "s3";

export function mediaDriver(): MediaDriver {
  return process.env.MEDIA_DRIVER === "s3" ? "s3" : "local";
}

/**
 * 本地驱动的媒体根。
 *
 * **刻意放在 data/ 而不是 public/**：放在 public/ 下的文件会被 next start 当静态资源
 * 直接送出，app/media/[...path]/route.ts 根本不会执行 —— 于是防盗链失效。
 * 实测（生产模式，跨站 Referer）：响应头是 next 的静态默认（cache-control: max-age=0、
 * 带 last-modified），没有 immutable，也没有 403。移到 public/ 之外后所有请求都走路由，
 * 本地驱动与对象存储的行为才一致。
 */
export function localMediaRoot(): string {
  return path.join(process.cwd(), "data", "media");
}

/** 只接受上传流程生成过的形状：<slug>/<16 位 hex>.<扩展名>。 */
const KEY_PATTERN = /^[a-z0-9][a-z0-9-]{0,99}\/[a-f0-9]{16}\.(?:jpe?g|png|webp|gif)$/;

export function isValidMediaKey(key: string): boolean {
  return KEY_PATTERN.test(key);
}

export function s3ConfigFromEnv(): S3Config {
  const required = (name: string): string => {
    const value = process.env[name]?.trim();
    if (!value) throw new Error("[media] MEDIA_DRIVER=s3 需要配置 " + name);
    return value;
  };
  const sessionToken = process.env.S3_SESSION_TOKEN?.trim();
  return {
    endpoint: required("S3_ENDPOINT"),
    region: process.env.S3_REGION?.trim() || "us-east-1",
    bucket: required("S3_BUCKET"),
    accessKeyId: required("S3_ACCESS_KEY_ID"),
    secretAccessKey: required("S3_SECRET_ACCESS_KEY"),
    prefix: process.env.S3_PREFIX?.trim() || "media",
    // 自建服务（MinIO 等）只能用 path-style；AWS 两者都支持。默认开启。
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== "0",
    ...(sessionToken ? { sessionToken } : {}),
  };
}

export async function putMedia(key: string, body: Buffer, contentType: string): Promise<void> {
  if (!isValidMediaKey(key)) throw new Error("[media] 非法的媒体键：" + key);
  if (mediaDriver() === "s3") {
    await putObject(s3ConfigFromEnv(), key, body, contentType);
    return;
  }
  const file = path.join(localMediaRoot(), key);
  await fs.mkdir(path.dirname(file), { recursive: true });
  const handle = await fs.open(file, "wx", 0o600);
  try {
    await handle.writeFile(body);
    await handle.sync();
  } finally {
    await handle.close();
  }
}

export async function getMedia(key: string): Promise<Buffer | undefined> {
  if (!isValidMediaKey(key)) return undefined;
  if (mediaDriver() === "s3") return getObject(s3ConfigFromEnv(), key);
  try {
    return await fs.readFile(path.join(localMediaRoot(), key));
  } catch (error) {
    if (["ENOENT", "ENOTDIR"].includes((error as NodeJS.ErrnoException).code ?? "")) return undefined;
    throw error;
  }
}

export async function removeMedia(key: string): Promise<void> {
  if (!isValidMediaKey(key)) return;
  if (mediaDriver() === "s3") {
    await deleteObject(s3ConfigFromEnv(), key);
    return;
  }
  await fs.rm(path.join(localMediaRoot(), key), { force: true });
}
