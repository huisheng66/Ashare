"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { authenticate, currentUser, endSession, startSession } from "@/lib/auth";
import { getClientIp, guardLogin, isBlocked, recordLoginFailure } from "@/lib/guard";
import { isValidSha256 } from "@/lib/links";
import { auditSummary, diffFields } from "@/lib/audit";
import {
  deleteItem as deleteCatalogItem,
  getItem as getCatalogItem,
  getSubmissions,
  recordAudit,
  saveItem as saveCatalogItem,
  setItemStatus as setCatalogItemStatus,
  updateBlocks,
  updateFeedback,
  updateSubmissions,
} from "@/lib/store";
import { imageExtension, isHttpUrl, ITEM_KINDS, MAX_UPLOAD, mediaParts, PLATFORMS, PUBLISH_STATUSES, SLUG_PATTERN, SOURCE_KINDS } from "@/lib/input-validation";
import { scenes } from "@/data/scenes";
import type { ItemKind, Platform, PublishStatus, SceneId, Software, SourceKind } from "@/data/types";
import { GUIDE_LIMITS, normalizeGuide, parseGuideLines, validateGuide } from "@/lib/guide";
import { putMedia as putMediaObject, removeMedia as removeMediaKey } from "@/lib/media-storage";
import { validateSemantics } from "@/lib/semantics";
import { can, canSetStatus, STATUS_LABEL, type Role } from "@/lib/users";

/** 已登录且未被封禁即可。页面级守卫用它；写操作请用 requirePermission。 */
export async function requireAdmin(): Promise<void> {
  if (!(await currentUser())) redirect("/admin/login");
  if (await isBlocked(await getClientIp())) redirect("/admin/login?e=blocked");
}

/**
 * 需要具体权限才放行。
 *
 * 权限矩阵集中在 lib/users.ts —— 散在各个入口里最容易出现「新加了入口忘了加检查」。
 * 这里只负责取当前用户、判断、重定向。
 */
export async function requirePermission(
  permission: "edit" | "publish" | "moderate" | "users",
): Promise<{ username: string; displayName: string; role: Role }> {
  const user = await currentUser();
  if (!user) redirect("/admin/login");
  if (await isBlocked(await getClientIp())) redirect("/admin/login?e=blocked");
  if (!can(user.role, permission)) redirect("/admin?e=forbidden");
  return user;
}

export async function login(formData: FormData): Promise<void> {
  const ip = await getClientIp();
  if (!(await guardLogin(ip))) redirect("/admin/login?e=rate");
  const username = text(formData, "username");
  const password = text(formData, "password");
  const identity = await authenticate(username, password);
  if (!identity) {
    await recordLoginFailure(ip);
    redirect("/admin/login?e=wrong");
  }
  await startSession(identity.username, identity.role);
  redirect("/admin");
}

export async function logout(): Promise<void> {
  await endSession();
  redirect("/admin/login");
}

const CRACK_WORDS = ["破解", "序列号", "绿色版", "激活码", "注册机", "盗版", "crack", "keygen", "nulled"];
const GIT_HOSTS = new Set(["github.com", "www.github.com", "gitlab.com", "gitee.com", "codeberg.org"]);
/** 上传时写给对象存储的 Content-Type；本地驱动不看它，但对象存储要看。 */
const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif",
};
const SCENES = new Set<string>(scenes.map((scene) => scene.id));

function text(fd: FormData, key: string): string {
  const value = fd.get(key);
  return typeof value === "string" ? value : "";
}

function str(fd: FormData, key: string): string {
  return text(fd, key).trim();
}

async function removeMedia(mediaPath: string): Promise<void> {
  const parts = mediaParts(mediaPath);
  if (!parts) return;
  try {
    await removeMediaKey(parts.join("/"));
  } catch (error) {
    console.error("[media] Could not remove unused image", error);
  }
}

export async function saveItem(fd: FormData): Promise<void> {
  const actor = await requirePermission("edit");
  const original = str(fd, "originalSlug");
  const errorBack = SLUG_PATTERN.test(original) ? original : "new";
  // Each request owns its validation target; concurrent actions cannot overwrite it.
  const bad: (message: string) => never = (message) => redirect(`/admin/items/${errorBack}?e=${encodeURIComponent(message)}`);
  const slug = str(fd, "slug").toLowerCase();
  if (!SLUG_PATTERN.test(slug) || (original && !SLUG_PATTERN.test(original))) bad("slug 需为 1–100 个小写字母、数字或中划线，且以字母或数字开头");

  const kind = (str(fd, "kind") || "app") as ItemKind;
  const status = (str(fd, "status") || "draft") as PublishStatus;
  const source = (str(fd, "source") || "official") as SourceKind;
  const selectedScenes = [...new Set(fd.getAll("scenes").map(String))] as SceneId[];
  const platforms = [...new Set(fd.getAll("platforms").map(String))] as Platform[];
  if (!ITEM_KINDS.includes(kind) || !PUBLISH_STATUSES.includes(status) || !SOURCE_KINDS.includes(source)) bad("条目类型、状态或来源无效");
  if (selectedScenes.some((scene) => !SCENES.has(scene)) || platforms.some((platform) => !PLATFORMS.includes(platform))) bad("场景或平台无效");

  const checked = (key: string, max: number): string => {
    const value = str(fd, key);
    if (value.length > max) bad(`${key} 内容过长（最多 ${max} 字）`);
    return value;
  };
  const list = (key: string): string[] => [...new Set(checked(key, 2000).split(/[,，]/).map((value) => value.trim()).filter(Boolean))];
  const checkUrl = (key: string, git = false): string | undefined => {
    const url = str(fd, key);
    if (!url) return undefined;
    if (!isHttpUrl(url, process.env.NODE_ENV !== "production")) bad("链接格式不正确，请使用不含账户密码的 HTTPS 地址");
    if (git && !GIT_HOSTS.has(new URL(url).host)) bad("Git 链接只允许 github.com / gitlab.com / gitee.com / codeberg.org");
    return url;
  };
  const links = {
    official: checkUrl("official"),
    homepage: checkUrl("homepage"),
    github: checkUrl("github", true),
    disk: checkUrl("disk"),
    diskNote: checked("diskNote", 1000) || undefined,
    diskSha256: checked("diskSha256", 64) || undefined,
    diskFile: checked("diskFile", 200) || undefined,
  };
  if (links.disk && !links.diskNote) bad("镜像链接必须填写镜像说明");
  // 哈希与文件名必须成对：单给哈希，读者不知道该校验哪个文件；
  // 单给文件名，等于没提供校验。两条都有、但格式不对，都要拦住。
  if (links.diskSha256 && !isValidSha256(links.diskSha256)) {
    bad("SHA-256 必须是 64 位十六进制字符");
  }
  if (Boolean(links.diskSha256) !== Boolean(links.diskFile)) {
    bad("校验值与对应文件名必须同时填写");
  }
  if (links.disk && !links.official && !links.github) bad("镜像只能作为补充，必须先填官网或 GitHub");
  const simpleIcon = checked("simpleIcon", 100);
  if (simpleIcon && !SLUG_PATTERN.test(simpleIcon)) bad("Simple Icon 名称格式不正确");

  // 教程：行式资源先解析再校验，格式错与内容错分开报错 —— 「第 3 行类型无效」
  // 比笼统的「教程有问题」更能让人直接改对。
  const { resources: guideResources, invalid: guideLinesInvalid } = parseGuideLines(str(fd, "guideResources"));
  if (guideLinesInvalid.length) bad(`配套资料格式有误：${guideLinesInvalid[0]}`);
  const guide = normalizeGuide({
    intro: checked("guideIntro", GUIDE_LIMITS.intro),
    markdown: checked("guideMarkdown", GUIDE_LIMITS.markdown),
    resources: guideResources,
  });
  const guideProblems = validateGuide(guide, { allowHttp: process.env.NODE_ENV !== "production" });
  if (guideProblems.length) bad(guideProblems[0]);

  const now = new Date().toISOString();
  const draft: Software = {
    slug,
    name: checked("name", 100),
    nameZh: checked("nameZh", 100) || undefined,
    aliases: list("aliases"),
    kind, status, source,
    tags: list("tags"),
    summary: checked("summary", 500),
    body: checked("body", 50_000),
    scenes: selectedScenes,
    platforms,
    price: checked("price", 100) || undefined,
    license: checked("license", 100) || undefined,
    version: checked("version", 50) || undefined,
    linksCheckedAt: checked("linksCheckedAt", 10) || undefined,
    links,
    tutorial: checked("tutorial", 10_000).split("\n").map((value) => value.trim()).filter(Boolean),
    ...(guide ? { guide } : {}),
    whoFor: checked("whoFor", 2000),
    whoNot: checked("whoNot", 2000),
    discountNote: checked("discountNote", 1000) || undefined,
    alternatives: list("alternatives"),
    featured: fd.get("featured") === "on",
    previews: [],
    createdAt: now,
    updatedAt: now,
    icon: {
      letter: (str(fd, "letter") || slug[0].toUpperCase()).slice(0, 2),
      color: /^#[0-9a-fA-F]{6}$/.test(str(fd, "color")) ? str(fd, "color") : "#0071e3",
      simpleIcon: simpleIcon || undefined,
    },
  };
  if (!draft.name || !draft.summary) bad("名称与简介必填");
  if (draft.linksCheckedAt && !/^\d{4}-\d{2}-\d{2}$/.test(draft.linksCheckedAt)) {
    bad("链接核验日期格式应为 YYYY-MM-DD");
  }
  const haystack = [draft.name, draft.summary, draft.body, draft.whoFor, draft.whoNot, ...draft.tags, ...draft.tutorial, links.diskNote ?? ""].join(" ").toLowerCase();
  if (CRACK_WORDS.some((word) => haystack.includes(word))) bad("内容包含破解相关词，拒绝保存");
  // 语义一致性：来源徽章、类型与镜像规则必须自洽，规则与 ingest 脚本共用同一份定义。
  const semantic = validateSemantics(draft);
  if (semantic.length) bad(semantic[0]);

  const previews = fd.getAll("previews").filter((entry): entry is File => entry instanceof File && entry.size > 0);
  const icon = fd.get("iconImage");
  const iconFile = icon instanceof File && icon.size > 0 ? icon : undefined;
  if (previews.length > 6) bad("预览图最多 6 张");
  const validatedFiles = new Map<File, { data: Buffer; extension: string }>();
  for (const file of [...previews, ...(iconFile ? [iconFile] : [])]) {
    if (file.size > MAX_UPLOAD) bad("单张图片超过 5MB 上限");
    const data = Buffer.from(await file.arrayBuffer());
    const extension = imageExtension(file.type, data);
    if (!extension) bad("图片内容与格式不符，只支持 JPEG / PNG / WebP / GIF");
    validatedFiles.set(file, { data, extension });
  }

  const uploaded: string[] = [];
  const obsolete: string[] = [];
  // 上传走存储抽象：本地磁盘或对象存储。多副本时只有后者能让每台机器都拿到图。
  const upload = async (file: File): Promise<string> => {
    const { data, extension } = validatedFiles.get(file)!;
    const key = `${slug}/${randomBytes(8).toString("hex")}.${extension}`;
    const mediaPath = `/media/${key}`;
    // 先登记再写：写入失败时它仍在 uploaded 里，会被统一清理。
    uploaded.push(mediaPath);
    await putMediaObject(key, data, MIME_BY_EXTENSION[extension] ?? "application/octet-stream");
    return mediaPath;
  };
  // 读现有条目与 slug 冲突检查放在上传之前：上传是不可回滚的副作用，越晚做越好。
  const existing = original ? await getCatalogItem(original, { publishedOnly: false }) : undefined;
  if (original && !existing) bad("条目已被删除，请刷新后重试");
  if (slug !== original && (await getCatalogItem(slug, { publishedOnly: false }))) bad("slug 已存在");
  const submittedVersion = Number.parseInt(str(fd, "version"), 10);
  const expectedVersion = Number.isInteger(submittedVersion) ? submittedVersion : undefined;
  // 状态流转走集中规则：编辑不能把草稿推上线，也不能把已发布的撤下来。
  const previousStatus = existing?.status ?? "draft";
  if (!canSetStatus(actor.role, previousStatus, draft.status)) {
    bad("没有把条目改成「" + STATUS_LABEL[draft.status] + "」的权限");
  }

  try {
    {
      const remove = new Set(fd.getAll("removePreview").map(String));
      const kept = (existing?.previews ?? []).filter((image, index) => {
        if (!remove.has(String(index))) return true;
        obsolete.push(image);
        return false;
      });
      if (kept.length + previews.length > 6) bad("预览图最多 6 张");
      draft.previews = [...kept];
      for (const file of previews) draft.previews.push(await upload(file));
      draft.iconImage = existing?.iconImage;
      if (iconFile) {
        draft.iconImage = await upload(iconFile);
        if (existing?.iconImage) obsolete.push(existing.iconImage);
      }
      draft.createdAt = existing?.createdAt ?? now;
    }

    // 单条原子写 + row_version 乐观锁：不再「读全量、改一条、写全量」。
    // 改名走 renameFrom，在同一个事务里完成，避免「先删后插」中途失败丢条目。
    const outcome = await saveCatalogItem(draft, {
      renameFrom: original || undefined,
      expectedVersion,
    });
    if (outcome === "conflict") bad("这个条目刚被别人改过，请刷新页面后重试");

    const action = outcome === "created" ? "create" : "update";
    const fields = diffFields(existing, draft);
    await recordAudit({
      at: now,
      actor: actor.username,
      action,
      slug: draft.slug,
      summary: auditSummary(action, draft.name, fields),
      fields,
      versionBefore: existing ? expectedVersion : undefined,
      versionAfter: existing ? (expectedVersion === undefined ? undefined : expectedVersion + 1) : 1,
    });
  } catch (error) {
    await Promise.all(uploaded.map(removeMedia));
    throw error;
  }
  // Only remove the replaced files once the new catalog has been committed.
  await Promise.all(obsolete.filter((image) => !draft.previews.includes(image) && draft.iconImage !== image).map(removeMedia));
  revalidatePath("/", "layout");
  redirect("/admin?saved=1");
}

export async function setItemStatus(fd: FormData): Promise<void> {
  const actor = await requirePermission("edit");
  const slug = str(fd, "slug");
  const status = str(fd, "status") as PublishStatus;
  if (!SLUG_PATTERN.test(slug) || !PUBLISH_STATUSES.includes(status)) redirect("/admin?e=invalid");
  const before = await getCatalogItem(slug, { publishedOnly: false });
  if (!before) redirect("/admin?e=missing");
  if (!canSetStatus(actor.role, before.status, status)) redirect("/admin?e=forbidden");
  const outcome = await setCatalogItemStatus(slug, status);
  if (outcome === "conflict") redirect("/admin?e=missing");
  await recordAudit({
    at: new Date().toISOString(),
    actor: actor.username,
    action: "status",
    slug,
    summary: auditSummary("status", before?.name ?? slug) + " → " + status,
    fields: ["status"],
  });
  revalidatePath("/", "layout");
  redirect("/admin?saved=1");
}

export async function deleteItem(fd: FormData): Promise<void> {
  const actor = await requirePermission("publish");
  const slug = str(fd, "slug");
  const before = await getCatalogItem(slug, { publishedOnly: false });
  const removed = await deleteCatalogItem(slug);
  if (removed) {
    await recordAudit({
      at: new Date().toISOString(),
      actor: actor.username,
      action: "delete",
      slug,
      summary: auditSummary("delete", before?.name ?? slug),
      fields: [],
    });
  }
  revalidatePath("/", "layout");
  redirect("/admin");
}

export async function markFeedbackRead(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = str(fd, "id");
  await updateFeedback((entries) => entries.map((entry) => entry.id === id ? { ...entry, read: true } : entry));
  redirect("/admin/inbox");
}

export async function deleteFeedback(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = str(fd, "id");
  await updateFeedback((entries) => entries.filter((entry) => entry.id !== id));
  redirect("/admin/inbox");
}

export async function deleteSubmission(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = str(fd, "id");
  await updateSubmissions((entries) => entries.filter((entry) => entry.id !== id));
  redirect("/admin/inbox");
}

export async function unblockIp(fd: FormData): Promise<void> {
  await requireAdmin();
  const ip = str(fd, "ip");
  await updateBlocks((blocks) => { delete blocks[ip]; return blocks; });
  redirect("/admin/inbox");
}

/** Prefill the editor while preserving the submission if editing is abandoned. */
export async function convertSubmission(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = str(fd, "id");
  const submission = (await getSubmissions()).find((entry) => entry.id === id);
  if (!submission) redirect("/admin/inbox");
  const params = new URLSearchParams({ name: submission.name, kind: submission.kind, url: submission.url, note: submission.need });
  redirect(`/admin/items/new?${params}`);
}
