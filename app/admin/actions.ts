"use server";

import { randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { endSession, hasValidSession, startSession, verifyPassword } from "@/lib/auth";
import { getClientIp, guardLogin, isBlocked, recordLoginFailure } from "@/lib/guard";
import { getSubmissions, updateBlocks, updateCatalog, updateFeedback, updateSubmissions } from "@/lib/store";
import { imageExtension, isHttpUrl, ITEM_KINDS, MAX_UPLOAD, mediaParts, PLATFORMS, PUBLISH_STATUSES, SLUG_PATTERN, SOURCE_KINDS } from "@/lib/input-validation";
import { scenes } from "@/data/scenes";
import type { ItemKind, Platform, PublishStatus, SceneId, Software, SourceKind } from "@/data/types";

export async function requireAdmin(): Promise<void> {
  if (!(await hasValidSession())) redirect("/admin/login");
  if (await isBlocked(await getClientIp())) redirect("/admin/login?e=blocked");
}

export async function login(formData: FormData): Promise<void> {
  const ip = await getClientIp();
  if (!(await guardLogin(ip))) redirect("/admin/login?e=rate");
  const password = text(formData, "password");
  if (!(await verifyPassword(password))) {
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

const CRACK_WORDS = ["破解", "序列号", "绿色版", "激活码", "注册机", "盗版", "crack", "keygen", "nulled"];
const GIT_HOSTS = new Set(["github.com", "www.github.com", "gitlab.com", "gitee.com", "codeberg.org"]);
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
    await fs.rm(path.join(process.cwd(), "public", "media", ...parts), { force: true });
  } catch (error) {
    console.error("[media] Could not remove unused image", error);
  }
}

export async function saveItem(fd: FormData): Promise<void> {
  await requireAdmin();
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
  };
  if (links.disk && !links.diskNote) bad("镜像链接必须填写镜像说明");
  if (links.disk && !links.official && !links.github) bad("镜像只能作为补充，必须先填官网或 GitHub");
  const simpleIcon = checked("simpleIcon", 100);
  if (simpleIcon && !SLUG_PATTERN.test(simpleIcon)) bad("Simple Icon 名称格式不正确");
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
    links,
    tutorial: checked("tutorial", 10_000).split("\n").map((value) => value.trim()).filter(Boolean),
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
  const haystack = [draft.name, draft.summary, draft.body, draft.whoFor, draft.whoNot, ...draft.tags, ...draft.tutorial, links.diskNote ?? ""].join(" ").toLowerCase();
  if (CRACK_WORDS.some((word) => haystack.includes(word))) bad("内容包含破解相关词，拒绝保存");

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
  const upload = async (file: File): Promise<string> => {
    const { data, extension } = validatedFiles.get(file)!;
    const name = `${randomBytes(8).toString("hex")}.${extension}`;
    const dir = path.join(process.cwd(), "public", "media", slug);
    await fs.mkdir(dir, { recursive: true });
    const mediaPath = `/media/${slug}/${name}`;
    const handle = await fs.open(path.join(dir, name), "wx", 0o600);
    uploaded.push(mediaPath);
    try {
      await handle.writeFile(data);
      await handle.sync();
    } finally {
      await handle.close();
    }
    return mediaPath;
  };
  try {
    await updateCatalog(async (all) => {
      const existing = original ? all.find((item) => item.slug === original) : undefined;
      if (original && !existing) bad("条目已被删除，请刷新后重试");
      if (all.some((item) => item.slug === slug && item.slug !== original)) bad("slug 已存在");
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
      return existing ? all.map((item) => item.slug === original ? draft : item) : [draft, ...all];
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
  await requireAdmin();
  const slug = str(fd, "slug");
  const status = str(fd, "status") as PublishStatus;
  if (!SLUG_PATTERN.test(slug) || !PUBLISH_STATUSES.includes(status)) redirect("/admin?e=invalid");
  await updateCatalog((all) => all.map((item) => item.slug === slug ? { ...item, status, updatedAt: new Date().toISOString() } : item));
  revalidatePath("/", "layout");
  redirect("/admin?saved=1");
}

export async function deleteItem(fd: FormData): Promise<void> {
  await requireAdmin();
  const slug = str(fd, "slug");
  await updateCatalog((all) => all.filter((item) => item.slug !== slug));
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
