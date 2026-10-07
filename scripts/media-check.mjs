#!/usr/bin/env node
/**
 * 对真实对象存储做一次冒烟：PUT / HEAD / GET / DELETE 一个探针对象，并校验字节往返。
 *
 * 为什么必须有它：tests/s3.test.mjs 验证的是 SigV4 的**规范化与请求形态**，
 * **没有对着真实 bucket 签过**。签名里任何一处环境相关的差异（region、path-style、
 * STS token、bucket 策略）都只有真机能暴露。启用 MEDIA_DRIVER=s3 之前先跑这个。
 *
 * 用法：
 *   npm run media:check          # 读 .env.local 里的 S3_* 配置
 */
import { randomBytes } from "node:crypto";
import process from "node:process";

import { s3ConfigFromEnv } from "../lib/media-storage.ts";
import { deleteObject, getObject, headObject, putObject } from "../lib/s3.ts";

async function main() {
  const config = s3ConfigFromEnv();
  const key = "probe/" + randomBytes(8).toString("hex") + ".png";
  const payload = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3, 4]);

  console.log("[media:check] endpoint=" + config.endpoint + " bucket=" + config.bucket +
    " region=" + config.region + " pathStyle=" + config.forcePathStyle + " prefix=" + config.prefix);
  console.log("[media:check] 探针对象 " + key);

  await putObject(config, key, payload, "image/png");
  console.log("[media:check] PUT ok");

  if (!(await headObject(config, key))) throw new Error("HEAD 说对象不存在 —— PUT 之后应当可见");
  console.log("[media:check] HEAD ok");

  const back = await getObject(config, key);
  if (!back || !back.equals(payload)) throw new Error("GET 回来的字节与上传不一致");
  console.log("[media:check] GET ok（字节一致）");

  await deleteObject(config, key);
  if (await headObject(config, key)) throw new Error("DELETE 之后 HEAD 仍说存在");
  console.log("[media:check] DELETE ok");
  console.log("[media:check] 通过：对象存储配置可用");
}

main().catch((error) => {
  console.error("[media:check] 失败：" + (error && error.message ? error.message : error));
  process.exitCode = 1;
});
