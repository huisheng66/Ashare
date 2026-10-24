import assert from "node:assert/strict";
import { test } from "node:test";

import { software } from "../data/software.ts";
import { samples } from "../data/samples.ts";
import { describeLicense } from "../lib/license-info.ts";
import { inferKind, isValidSourceKind } from "../lib/semantics.ts";

/**
 * 种子数据的完整性契约。
 *
 * 这组断言防的是**批量收录带来的退化**：一批几十条靠人肉判断写进去，
 * 单个条目看不出问题，坏的是**条目之间的关系**——
 *   - alternatives 指向一个不存在的 slug（前台点了没有去处，等于死链）；
 *   - 同一个产品被收了两遍（用户在同一场景里看到两张一样的卡）；
 *   - license 写了映射表里没有的值（前台静默不显示，读者无从判断能不能商用）。
 *
 * 这三类都实测发生过：heroic / heroicgameslauncher 与 musicfree / musicfreedesktop
 * 是同产品两条；voicestudio→audacity、yoinks→yt-dlp、keepassxc→syncthing
 * 指向当时还没收录的 slug。靠人眼过 600 多条是不现实的，只能机器拦。
 */

const all = [...software, ...samples];
const slugs = new Set(all.map((item) => item.slug));

/** officialUrl 归一化：去掉协议、www、末尾斜杠与查询串，只留 host + path。 */
function normalizeUrl(url) {
  try {
    const parsed = new URL(url);
    return (parsed.hostname.replace(/^www\./, "") + parsed.pathname)
      .replace(/\/+$/, "")
      .toLowerCase();
  } catch {
    return url;
  }
}

const normalizeName = (name) => name.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]/g, "");

test("alternatives 必须指向真实存在的条目，且不能指向自己", () => {
  const broken = [];
  for (const item of all) {
    for (const alt of item.alternatives ?? []) {
      if (!slugs.has(alt)) broken.push(`${item.slug} -> ${alt}`);
      if (alt === item.slug) broken.push(`${item.slug} -> 自己`);
    }
  }
  assert.deepEqual(broken, [], "同类替代指向了不存在的 slug：" + broken.join("；"));
});

test("同一份官网 / 同一个仓库只能出现一次（防重复收录）", () => {
  const byUrl = new Map();
  const byRepo = new Map();
  for (const item of all) {
    const url = item.officialUrl ? normalizeUrl(item.officialUrl) : null;
    if (url) byUrl.set(url, [...(byUrl.get(url) ?? []), item.slug]);
    const repo = item.links?.github ? normalizeUrl(item.links.github) : null;
    // GitLab 上的项目共用 host+path 也同样不该重复，这里一并纳入。
    if (repo) byRepo.set(repo, [...(byRepo.get(repo) ?? []), item.slug]);
  }
  const dupUrl = [...byUrl.entries()].filter(([, v]) => v.length > 1);
  const dupRepo = [...byRepo.entries()].filter(([, v]) => v.length > 1);
  assert.deepEqual(dupUrl, [], "同一条目被收了两次（官网相同）：" + dupUrl.map(([k, v]) => `${k} = ${v.join("/")}`).join("；"));
  assert.deepEqual(dupRepo, [], "同一条目被收了两次（仓库相同）：" + dupRepo.map(([k, v]) => `${k} = ${v.join("/")}`).join("；"));
});

test("同名条目只能有一条（大小写与符号差异不算不同）", () => {
  const byName = new Map();
  for (const item of all) {
    const key = normalizeName(item.name);
    byName.set(key, [...(byName.get(key) ?? []), item.slug]);
  }
  const dup = [...byName.entries()].filter(([, v]) => v.length > 1);
  assert.deepEqual(dup, [], "同名重复：" + dup.map(([k, v]) => `${k} = ${v.join("/")}`).join("；"));
});

test("每条目的来源与类型组合必须符合矩阵", () => {
  // 矩阵在 lib/semantics.ts，后台保存与 ingest 都走它；但**种子是人工写的**，
  // 没人保证它先过一遍校验。实测就漏过：一条 AGPL 双轨项目被标成 official
  // （矩阵里 official 只有 app / script），前台会同时显示「官方」和「开源项目」。
  const offenders = all
    .filter((item) => !isValidSourceKind(item.source, item.kind ?? inferKind(item.source)))
    .map((item) => `${item.slug}（${item.source} + ${item.kind ?? inferKind(item.source)}）`);
  assert.deepEqual(offenders, [], "来源与类型组合不合法：" + offenders.join("；"));
});

test("用到的每个许可证都必须能给出人话说明", () => {
  // 映射表缺一条，前台就不显示许可说明 —— 静默的，不影响构建，也不报错。
  const missing = new Set();
  for (const item of all) {
    if (!item.license) continue;
    if (!describeLicense(item.license)) missing.add(item.license);
  }
  assert.deepEqual([...missing], [], "许可证映射表里没有：" + [...missing].join(", "));
});

test("源码公开但不是 OSI 开源的条目，必须在正文交代许可形态", () => {
  // 这批（n8n 的 fair-code、BSL、自定义 EULA）按约定 kind 标 app、license 留空，
  // 前台因而不显示许可行 —— `components/LicenseNote.tsx` 的注释写明「空状态由正文第 4 段承担」。
  // 于是正文成了唯一出处：正文也没写，读者就完全无从判断能不能商用。
  const offenders = all.filter(
    (item) =>
      item.source === "opensource" &&
      item.kind === "app" &&
      !item.license?.trim() &&
      !/(许可|授权|License|EULA)/i.test(item.body ?? ""),
  );
  assert.deepEqual(
    offenders.map((item) => item.slug),
    [],
    "这些条目既没有 SPDX 标识、正文也没说许可形态：" + offenders.map((item) => item.slug).join(", "),
  );
});

test("场景与平台字段必须自洽", () => {
  const bad = [];
  for (const item of all) {
    if (!item.scenes?.length) bad.push(`${item.slug}: scenes 为空`);
    if (new Set(item.scenes).size !== item.scenes.length) bad.push(`${item.slug}: scenes 有重复项`);
    if (!item.platforms?.length) bad.push(`${item.slug}: platforms 为空`);
    if (new Set(item.platforms).size !== item.platforms.length) bad.push(`${item.slug}: platforms 有重复项`);
  }
  assert.deepEqual(bad, [], "场景 / 平台字段异常：" + bad.join("；"));
});

test("外链一律 https，slug 与链接不得互相矛盾", () => {
  const bad = [];
  for (const item of all) {
    if (item.officialUrl && !item.officialUrl.startsWith("https://")) {
      bad.push(`${item.slug}: officialUrl 不是 https`);
    }
    for (const [key, url] of Object.entries(item.links ?? {})) {
      // diskFile / diskNote / diskSha256 不是链接。
      if (key === "diskFile" || key === "diskNote" || key === "diskSha256") continue;
      if (url && !url.startsWith("https://")) bad.push(`${item.slug}: links.${key} 不是 https`);
    }
  }
  assert.deepEqual(bad, [], "链接协议不合规：" + bad.join("；"));
});
