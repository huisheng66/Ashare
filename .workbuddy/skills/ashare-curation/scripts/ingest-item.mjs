#!/usr/bin/env node
/**
 * 收录条目：校验草稿并写入运行库 data/store/catalog.json，同步 SHA-256。
 *
 *   node scripts/ingest-item.mjs --file drafts/foo.json --dry-run
 *   node scripts/ingest-item.mjs --file drafts/foo.json
 *   node scripts/ingest-item.mjs --file drafts/补正文.json --patch   只更新草稿里写到的字段
 *   node scripts/ingest-item.mjs --file drafts/batch.json --allow-http
 *   node scripts/ingest-item.mjs --file drafts/batch.json --strict   内容质量提示升级为错误
 *
 * --patch 用于给已有条目补内容（正文、标签、别名）：先与库中条目合并再校验，
 * 避免漏掉必填字段或覆盖掉 links / previews / icon 这些不想动的数据。
 *
 * --strict 把 SKILL.md「完成标准」里的软要求变成硬错误：正文至少 2 段且 ≥200 字、
 * 标签至少 3 个、别名非空、已发布必须有来源链接、适合/不适合不出现身份词、正文不含 Markdown。
 * 正式收录新条目的批次建议带 --strict。
 *
 * 校验规则与后台 app/admin/actions.ts 的 saveItem 保持一致。
 * 写入前请先跑 npm run backup。运行库不在 git 里，本脚本不替代备份。
 * 别忘了同步种子文件（data/software.ts 或 data/samples.ts，只影响全新部署）与 CHANGELOG.md。
 */
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import process from "node:process";
import { parseFlags } from "../../../../scripts/_shared.mjs";

const ROOT = process.cwd();
const STORE = path.join(ROOT, "data", "store");
const CATALOG = path.join(STORE, "catalog.json");
const CHECKSUM = path.join(STORE, "catalog.sha256.json");

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,99}$/;
const ITEM_KINDS = ["app", "script", "opensource"];
const PUBLISH_STATUSES = ["draft", "published"];
const SOURCE_KINDS = ["official", "opensource", "discount"];
const PLATFORMS = ["windows", "macos", "linux"];
const SCENES = ["code", "docs", "design", "data", "office", "engineering", "tools", "photo", "games", "education", "music", "social"];
const CRACK_WORDS = ["破解", "序列号", "绿色版", "激活码", "注册机", "盗版", "crack", "keygen", "nulled"];
const GIT_HOSTS = new Set(["github.com", "www.github.com", "gitlab.com", "gitee.com", "codeberg.org"]);
const MEDIA_PATTERN = /^\/media\/([a-z0-9][a-z0-9-]{0,99})\/([a-f0-9]{16}\.(?:jpe?g|png|webp|gif))$/;
// 身份词：PRODUCT.md 要求「适合 / 不适合」只谈任务和水平，不谈身份。
const IDENTITY_WORDS = ["学生", "大学生", "中学生", "小学生", "上班族", "职场", "宝妈", "老人", "老年人", "孩子", "退休"];
// body 按空行分段、不解析 Markdown。这些写法会原样显示成文本。
const MARKDOWN_HINTS = [
  [/^#{1,6}\s/m, "标题（# ）"],
  [/\*\*[^*\n]+\*\*/, "加粗（** **）"],
  [/^\s*[-*+]\s/m, "无序列表（- / * ）"],
  [/^\s*\d+\.\s/m, "有序列表（1. ）"],
  [/\[[^\]\n]+\]\([^)\n]+\)/, "链接语法（[]()）"],
];
const MIN_BODY_PARAGRAPHS = 2;
const MIN_TAGS = 3;
const MIN_BODY_LENGTH = 200;

const MAX = {
  name: 100, nameZh: 100, aliases: 2000, tags: 2000, summary: 500, body: 50_000,
  price: 100, tutorial: 10_000, whoFor: 2000, whoNot: 2000, discountNote: 1000,
  diskNote: 1000, alternatives: 2000, simpleIcon: 100, license: 100, version: 50,
};

// 来源 × 类型 的合法组合。与 lib/semantics.ts 的矩阵保持一致：
// GeoGebra 那类「标开源但许可闭源」必须显式写 kind，不能靠推导。
const SOURCE_KIND_MATRIX = {
  official: ["app", "script"],
  opensource: ["opensource", "app"],
  discount: ["app"],
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
// SPDX 标识的常见形态：GPL-3.0-only、MIT、Apache-2.0、MPL-2.0、LicenseRef-…
const LICENSE_SHAPE = /^[A-Za-z0-9.+-]+(\s+AND\s+[A-Za-z0-9.+-]+)*$/;

const USAGE = "用法: node scripts/ingest-item.mjs --file <草稿.json> [--dry-run] [--allow-http] [--patch] [--strict]";

function parseArgs(argv) {
  const args = parseFlags(argv, {
    "--file": "value",
    "--dry-run": "bool",
    "--allow-http": "bool",
    "--patch": "bool",
    "--strict": "bool",
  });
  if (!args.help && !args.file) throw new Error(`必须指定 --file\n${USAGE}`);
  return args;
}

function isHttpUrl(value, allowHttp) {
  if (!value || value.length > 2048) return false;
  try {
    const url = new URL(value);
    return !url.username && !url.password && (url.protocol === "https:" || (allowHttp && url.protocol === "http:"));
  } catch {
    return false;
  }
}

const isBlank = (value) => typeof value !== "string" || !value.trim();

function listLength(value) {
  return Array.isArray(value) ? value.join(",").length : 0;
}

async function validate(item, index, { allowHttp, knownSlugs, strict }) {
  const at = `第 ${index + 1} 条${item?.slug ? `（${item.slug}）` : ""}`;
  const errors = [];
  const warnings = [];
  const fail = (message) => errors.push(`${at}：${message}`);
  // 内容质量类问题：默认提示，--strict 下升级为错误。收录标准不该只靠人自觉遵守。
  const soft = (message) => (strict ? errors : warnings).push(`${at}：${message}`);

  if (!item || typeof item !== "object" || Array.isArray(item)) {
    fail("必须是 JSON 对象");
    return { errors, warnings };
  }
  if (!SLUG_PATTERN.test(item.slug ?? "")) fail("slug 需为 1–100 个小写字母、数字或中划线，且以字母或数字开头");
  if (isBlank(item.name)) fail("name 必填");
  if (isBlank(item.summary)) fail("summary 必填");
  if (!ITEM_KINDS.includes(item.kind)) fail(`kind 必须是 ${ITEM_KINDS.join(" / ")}`);
  if (!PUBLISH_STATUSES.includes(item.status)) fail(`status 必须是 ${PUBLISH_STATUSES.join(" / ")}`);
  if (!SOURCE_KINDS.includes(item.source)) fail(`source 必须是 ${SOURCE_KINDS.join(" / ")}`);
  // 来源与类型的组合必须成立，否则前台会挂出与事实不符的来源徽章。
  if (SOURCE_KINDS.includes(item.source) && ITEM_KINDS.includes(item.kind)) {
    const allowed = SOURCE_KIND_MATRIX[item.source] ?? [];
    if (!allowed.includes(item.kind)) {
      fail(`source「${item.source}」与 kind「${item.kind}」不匹配，该来源下只允许 ${allowed.join(" / ")}`);
    }
  }
  if (!Array.isArray(item.scenes) || !item.scenes.length) fail("scenes 必须是非空数组");
  else if (item.scenes.some((id) => !SCENES.includes(id))) fail(`scenes 只允许 ${SCENES.join(" / ")}`);
  if (!Array.isArray(item.platforms) || !item.platforms.length) fail("platforms 必须是非空数组");
  else if (item.platforms.some((id) => !PLATFORMS.includes(id))) fail(`platforms 只允许 ${PLATFORMS.join(" / ")}`);
  if (!item.icon || typeof item.icon !== "object" || !item.icon.letter) fail("icon.letter 必填");
  else if (item.icon.color && !/^#[0-9a-fA-F]{6}$/.test(item.icon.color)) fail("icon.color 必须是 #rrggbb");

  for (const [field, max] of Object.entries(MAX)) {
    if (field === "simpleIcon") continue;
    const value = item[field];
    const length = Array.isArray(value) ? listLength(value) : typeof value === "string" ? value.length : 0;
    if (length > max) fail(`${field} 过长（${length} > ${max}）`);
  }

  const links = item.links ?? {};
  for (const key of ["official", "homepage", "github", "disk"]) {
    const url = links[key];
    if (!url) continue;
    if (!isHttpUrl(url, allowHttp)) fail(`links.${key} 必须是 HTTPS 地址且不含账户密码（≤2048）`);
    if (key === "github" && isHttpUrl(url, allowHttp) && !GIT_HOSTS.has(new URL(url).host)) {
      fail("links.github 只允许 github.com / gitlab.com / gitee.com / codeberg.org");
    }
  }
  if (links.disk) {
    if (!links.diskNote) fail("填了网盘镜像就必须写 diskNote（镜像说明）");
    if (!links.official && !links.github) fail("网盘镜像只能作补充，必须先填官网或 GitHub");
  }
  // 标为开源项目却没有仓库链接，「开源」这个断言就无处核验。
  if (item.source === "opensource" && item.kind === "opensource" && !links.github) {
    soft("标为开源项目但没有 GitHub 链接，「开源」缺少可核验依据；上游不在白名单主机时可在正文说明并留空");
  }
  if (!isBlank(item.license) && !LICENSE_SHAPE.test(item.license.trim())) {
    soft(`license「${item.license}」不像 SPDX 标识（如 GPL-3.0-only、MIT、Apache-2.0），确认后修正`);
  }
  if (!isBlank(item.linksCheckedAt) && !ISO_DATE.test(item.linksCheckedAt.trim())) {
    fail("linksCheckedAt 必须是 YYYY-MM-DD");
  }

  const haystack = [item.name, item.summary, item.body, item.whoFor, item.whoNot, links.diskNote ?? "",
    ...(item.tags ?? []), ...(item.tutorial ?? [])].filter(Boolean).join(" ").toLowerCase();
  const hit = CRACK_WORDS.find((word) => haystack.includes(word));
  if (hit) fail(`内容包含破解相关词「${hit}」，会被后台拒绝保存`);

  for (const image of [...(item.previews ?? []), item.iconImage].filter(Boolean)) {
    if (!MEDIA_PATTERN.test(image)) fail(`图片路径 ${image} 不符合 /media/<slug>/<16位hex>.<ext>，读出会 404`);
  }
  if ((item.previews ?? []).length > 6) fail("预览图最多 6 张");

  if (item.icon?.simpleIcon) {
    if (!SLUG_PATTERN.test(item.icon.simpleIcon)) fail("icon.simpleIcon 名称格式不正确");
    else if (!await fs.stat(path.join(ROOT, "data", "icons", `${item.icon.simpleIcon}.svg`)).then(() => true, () => false)) {
      soft(`data/icons/${item.icon.simpleIcon}.svg 不存在，前端会回退字母图标`);
    }
  }

  for (const slug of item.alternatives ?? []) {
    if (!knownSlugs.has(slug)) soft(`alternatives 里的 ${slug} 不在目录中，详情页不会显示`);
  }
  // ---- 内容质量：SKILL.md 的「完成标准」在此落地 ----
  const body = item.body?.trim() ?? "";
  const tags = item.tags ?? [];
  if (!body) {
    soft("body 为空，详情页没有「详细介绍」，搜索正文也命中不到");
  } else {
    const paragraphs = body.split(/\n+/).filter((p) => p.trim().length > 0);
    if (paragraphs.length < MIN_BODY_PARAGRAPHS) {
      soft(`body 只有 ${paragraphs.length} 段，完成标准要求至少 ${MIN_BODY_PARAGRAPHS} 段，且要写明代价或风险`);
    }
    if (body.length < MIN_BODY_LENGTH) {
      soft(`body 只有 ${body.length} 字，少于 ${MIN_BODY_LENGTH} 字，说不清「是什么 / 差别 / 坑」`);
    }
    for (const [pattern, label] of MARKDOWN_HINTS) {
      if (pattern.test(body)) soft(`body 含 Markdown ${label}，页面不解析 Markdown，会原样显示成文本`);
    }
    const crackHit = CRACK_WORDS.find((word) => body.toLowerCase().includes(word));
    if (crackHit) soft(`body 命中破解词「${crackHit}」`);
  }
  if (!tags.length) soft("tags 为空，搜索标签命中为零");
  else if (tags.length < MIN_TAGS) soft(`tags 只有 ${tags.length} 个，完成标准要求至少 ${MIN_TAGS} 个`);
  if (!(item.aliases ?? []).length) soft("aliases 为空，搜索别名权重 90/80，会漏掉常见叫法");
  if (item.status === "published" && !item.links?.official && !item.links?.github && !item.links?.homepage) {
    soft("已发布条目没有任何可核验来源链接，详情页没有主 CTA");
  }
  for (const field of ["whoFor", "whoNot"]) {
    const value = item[field];
    if (typeof value !== "string" || !value) continue;
    const hit = IDENTITY_WORDS.find((word) => value.includes(word));
    if (hit) soft(`${field} 出现身份词「${hit}」，PRODUCT.md 要求只谈任务和水平`);
  }

  return { errors, warnings };
}

async function writeAtomic(file, content) {
  const tmp = `${file}.${Date.now()}.tmp`;
  const handle = await fs.open(tmp, "wx", 0o600);
  try {
    await handle.writeFile(content, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
  await fs.rename(tmp, file);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(USAGE);
    return;
  }

  const draftPath = path.resolve(ROOT, args.file);
  const parsed = JSON.parse(await fs.readFile(draftPath, "utf8"));
  const drafts = Array.isArray(parsed) ? parsed : [parsed];

  let catalog;
  try {
    catalog = JSON.parse(await fs.readFile(CATALOG, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") {
      throw new Error("data/store/catalog.json 不存在。先启动一次应用（npm run dev）生成运行库。");
    }
    throw error;
  }
  if (!Array.isArray(catalog)) throw new Error("catalog.json 必须是数组");

  const knownSlugs = new Set(catalog.map((item) => item.slug));
  // --patch 先与库中条目合并再校验，避免局部更新漏掉必填字段或覆盖不想动的数据。
  const planned = [];
  for (const [index, draft] of drafts.entries()) {
    const existing = catalog.find((item) => item.slug === draft.slug);
    if (args.patch) {
      if (!existing) {
        console.error(`错误 第 ${index + 1} 条：--patch 模式下 ${draft.slug ?? "(缺 slug)"} 不在目录中，无法局部更新`);
        process.exitCode = 1;
        return;
      }
      planned.push({ slug: draft.slug, item: { ...existing, ...draft }, mode: "局部更新" });
    } else {
      planned.push({ slug: draft.slug, item: draft, mode: existing ? "整体更新" : "新增" });
    }
  }

  const errors = [];
  const warnings = [];
  for (const [index, plan] of planned.entries()) {
    const result = await validate(plan.item, index, { allowHttp: args.allowHttp, knownSlugs, strict: args.strict });
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  }
  for (const warning of warnings) console.log(`提示 ${warning}`);
  if (warnings.length && !args.strict) {
    console.log(`共 ${warnings.length} 项提示。加 --strict 可把这些内容质量问题升级为错误。`);
  }
  if (errors.length) {
    for (const error of errors) console.error(`错误 ${error}`);
    throw new Error(`${errors.length} 项校验未通过，未写入任何数据。`);
  }

  const changes = [];
  for (const plan of planned) {
    const now = new Date().toISOString();
    const index = catalog.findIndex((item) => item.slug === plan.slug);
    if (index >= 0) {
      catalog[index] = { ...plan.item, createdAt: catalog[index].createdAt ?? now, updatedAt: now };
    } else {
      catalog.unshift({ ...plan.item, createdAt: plan.item.createdAt ?? now, updatedAt: now });
    }
    changes.push(`${plan.mode} ${plan.slug}`);
  }

  const text = JSON.stringify(catalog, null, 2);
  if (args.dryRun) {
    console.log(`试运行：${changes.join("、")}（共 ${catalog.length} 条）`);
    console.log("未写入。确认无误后去掉 --dry-run。");
    return;
  }

  await writeAtomic(CATALOG, text);
  await writeAtomic(CHECKSUM, JSON.stringify(createHash("sha256").update(text).digest("hex")));
  console.log(`已写入 ${changes.join("、")}，目录共 ${catalog.length} 条，SHA-256 已同步。`);
  console.log("下一步：同步种子文件（data/software.ts 或 data/samples.ts，全新部署才生效）→ npm run check（含 tests/seed.test.mjs）→ npm run content:audit → 补 CHANGELOG.md。");
}

main().catch((error) => {
  console.error(`[ingest] ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});
