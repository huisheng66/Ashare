"use server";

import { randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  endSession,
  hasValidSession,
  startSession,
  verifyPassword,
} from "@/lib/auth";
import { getClientIp, guardLogin, isBlocked, recordLoginFailure } from "@/lib/guard";
import {
  getBlocks,
  getCatalogAll,
  getFeedback,
  getSubmissions,
  saveBlocks,
  saveCatalog,
  saveFeedback,
  saveSubmissions,
} from "@/lib/store";
import type {
  ItemKind,
  PublishStatus,
  Software,
  SourceKind,
  Submission,
} from "@/data/types";

/** 每一个 Action 与后台页面都先过这道闸 */
export async function requireAdmin(): Promise<void> {
  if (!(await hasValidSession())) redirect("/admin/login");
  const ip = await getClientIp();
  if (await isBlocked(ip)) redirect("/admin/login?e=blocked");
}

export async function login(formData: FormData): Promise<void> {
  const ip = await getClientIp();
  if (!(await guardLogin(ip))) redirect("/admin/login?e=rate");
  const password = String(formData.get("password") ?? "");
  if (!verifyPassword(password)) {
    await recordLoginFailure(ip);
    redirect("/admin/login?e=wrong");
  }
  await startSession();
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await endSession();
  redirect("/admin/login");
}

const CRACK_WORDS = [
  "破解", "序列号", "绿色版", "激活码", "注册机", "盗版",
  "crack", "keygen", "nulled",
];
const GIT_HOSTS = new Set([
  "github.com", "www.github.com", "gitlab.com", "gitee.com", "codeberg.org",
]);
const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const MAX_UPLOAD = 5 * 1024 * 1024;

/** 校验失败时回跳的表单（new 或原 slug），由 saveItem 设置 */
let errorBack = "new";

function bad(message: string): never {
  redirect(`/admin/items/${errorBack}?e=${encodeURIComponent(message)}`);
}

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

function checkUrl(url: string, opts: { git?: boolean } = {}): string | undefined {
  if (!url) return undefined;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    bad("链接格式不正确");
  }
  if (
    parsed.protocol !== "https:" &&
    !(parsed.protocol === "http:" && process.env.NODE_ENV !== "production")
  ) {
    bad("链接只允许 https");
  }
  if (opts.git && !GIT_HOSTS.has(parsed.host)) {
    bad("Git 链接只允许 github.com / gitlab.com / gitee.com / codeberg.org");
  }
  return url;
}

function rejectCrack(item: Software): void {
  const haystack = [
    item.name, item.summary, item.body, item.whoFor, item.whoNot,
    ...item.tags, ...item.tutorial,
    item.links.diskNote ?? "",
  ]
    .join(" ")
    .toLowerCase();
  if (CRACK_WORDS.some((word) => haystack.includes(word))) {
    bad("内容包含破解相关词，拒绝保存");
  }
}

async function saveUploadFile(file: File, slug: string): Promise<string> {
  if (file.size > MAX_UPLOAD) bad("单张图片超过 5MB 上限");
  const ext = IMAGE_TYPES[file.type];
  if (!ext) bad("图片只支持 JPEG / PNG / WebP / GIF");
  const name = `${randomBytes(8).toString("hex")}.${ext}`;
  const dir = path.join(process.cwd(), "public", "media", slug);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    path.join(dir, name),
    Buffer.from(await file.arrayBuffer()),
    { mode: 0o600 },
  );
  return `/media/${slug}/${name}`;
}

async function removeMedia(slug: string, mediaPath: string): Promise<void> {
  if (!mediaPath.startsWith(`/media/${slug}/`)) return;
  await fs
    .rm(path.join(process.cwd(), "public", mediaPath), { force: true })
    .catch(() => {});
}

export async function saveItem(fd: FormData): Promise<void> {
  await requireAdmin();

  const original = str(fd, "originalSlug");
  errorBack = original || "new";

  const slug = str(fd, "slug").toLowerCase();
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) bad("slug 只允许小写字母、数字和中划线");

  const all = await getCatalogAll();
  const existing = original ? all.find((i) => i.slug === original) : undefined;
  if (!existing && all.some((i) => i.slug === slug)) bad("slug 已存在");

  const kind = (str(fd, "kind") || "app") as ItemKind;
  const status = (str(fd, "status") || "draft") as PublishStatus;
  const source = (str(fd, "source") || "official") as SourceKind;

  const links = {
    official: checkUrl(str(fd, "official")),
    homepage: checkUrl(str(fd, "homepage")),
    github: checkUrl(str(fd, "github"), { git: true }),
    disk: checkUrl(str(fd, "disk")),
    diskNote: str(fd, "diskNote") || undefined,
  };
  if (links.disk && !links.diskNote) bad("镜像链接必须填写镜像说明");
  if (links.disk && !links.official && !links.github) {
    bad("镜像只能作为补充，必须先填官网或 GitHub");
  }

  const now = new Date().toISOString();
  const draft: Software = {
    slug,
    name: str(fd, "name"),
    nameZh: str(fd, "nameZh") || undefined,
    aliases: str(fd, "aliases")
      .split(/[,，]/)
      .map((s) => s.trim())
      .filter(Boolean),
    kind,
    status,
    tags: str(fd, "tags")
      .split(/[,，]/)
      .map((s) => s.trim())
      .filter(Boolean),
    summary: str(fd, "summary"),
    body: str(fd, "body"),
    scenes: fd.getAll("scenes").map(String) as Software["scenes"],
    platforms: fd.getAll("platforms").map(String) as Software["platforms"],
    source,
    price: str(fd, "price") || undefined,
    links,
    tutorial: str(fd, "tutorial")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
    whoFor: str(fd, "whoFor"),
    whoNot: str(fd, "whoNot"),
    discountNote: str(fd, "discountNote") || undefined,
    alternatives: str(fd, "alternatives")
      .split(/[,，]/)
      .map((s) => s.trim())
      .filter(Boolean),
    featured: fd.get("featured") === "on",
    previews: [],
    iconImage: undefined,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    icon: {
      letter: (str(fd, "letter") || slug[0]?.toUpperCase() || "?").slice(0, 2),
      color: /^#[0-9a-fA-F]{6}$/.test(str(fd, "color"))
        ? str(fd, "color")
        : "#0071e3",
      simpleIcon: str(fd, "simpleIcon") || undefined,
    },
  };

  // 预览图：保留未勾选移除的旧图，追加新上传，上限 6 张
  const removeIdx = new Set(fd.getAll("removePreview").map(String));
  const keptPreviews = (existing?.previews ?? []).filter(
    (_, idx) => !removeIdx.has(String(idx)),
  );
  for (let idx = 0; idx < (existing?.previews.length ?? 0); idx++) {
    if (removeIdx.has(String(idx))) {
      await removeMedia(slug, existing!.previews[idx]);
    }
  }
  const uploads: string[] = [];
  for (const entry of fd.getAll("previews")) {
    if (entry instanceof File && entry.size > 0) {
      uploads.push(await saveUploadFile(entry, slug));
    }
  }
  draft.previews = [...keptPreviews, ...uploads];
  if (draft.previews.length > 6) bad("预览图最多 6 张");

  // 图标图：单张，新传则替换旧文件
  const iconFile = fd.get("iconImage");
  if (iconFile instanceof File && iconFile.size > 0) {
    draft.iconImage = await saveUploadFile(iconFile, slug);
    if (existing?.iconImage) await removeMedia(slug, existing.iconImage);
  } else if (slug === original) {
    draft.iconImage = existing?.iconImage;
  }

  if (!draft.name || !draft.summary) bad("名称与简介必填");
  rejectCrack(draft);

  const next = existing
    ? all.map((i) => (i.slug === original ? draft : i))
    : [draft, ...all];
  await saveCatalog(next);
  revalidatePath("/", "layout");
  redirect("/admin?saved=1");
}

export async function setItemStatus(fd: FormData): Promise<void> {
  await requireAdmin();
  const slug = str(fd, "slug");
  const status = str(fd, "status") as PublishStatus;
  const all = await getCatalogAll();
  await saveCatalog(
    all.map((i) =>
      i.slug === slug ? { ...i, status, updatedAt: new Date().toISOString() } : i,
    ),
  );
  revalidatePath("/", "layout");
  redirect("/admin?saved=1");
}

export async function deleteItem(fd: FormData): Promise<void> {
  await requireAdmin();
  const slug = str(fd, "slug");
  await saveCatalog((await getCatalogAll()).filter((i) => i.slug !== slug));
  revalidatePath("/", "layout");
  redirect("/admin");
}

export async function markFeedbackRead(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = str(fd, "id");
  await saveFeedback(
    (await getFeedback()).map((f) => (f.id === id ? { ...f, read: true } : f)),
  );
  redirect("/admin/inbox");
}

export async function deleteFeedback(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = str(fd, "id");
  await saveFeedback((await getFeedback()).filter((f) => f.id !== id));
  redirect("/admin/inbox");
}

export async function deleteSubmission(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = str(fd, "id");
  await saveSubmissions((await getSubmissions()).filter((s) => s.id !== id));
  redirect("/admin/inbox");
}

export async function unblockIp(fd: FormData): Promise<void> {
  await requireAdmin();
  const ip = str(fd, "ip");
  const blocks = await getBlocks();
  delete blocks[ip];
  await saveBlocks(blocks);
  redirect("/admin/inbox");
}

/** 投稿一键转条目：删除投稿并带着预填参数跳到新建表单 */
export async function convertSubmission(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = str(fd, "id");
  const list = await getSubmissions();
  const submission: Submission | undefined = list.find((s) => s.id === id);
  if (!submission) redirect("/admin/inbox");
  await saveSubmissions(list.filter((s) => s.id !== id));

  const params = new URLSearchParams({
    name: submission.name,
    kind: submission.kind,
    url: submission.url,
    note: submission.need,
  });
  redirect(`/admin/items/new?${params}`);
}
