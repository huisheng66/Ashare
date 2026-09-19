"use server";

import { randomBytes } from "node:crypto";

import { addFeedback } from "@/lib/store";
import { getClientIp, guardPublicWrite } from "@/lib/guard";

export type FeedbackState = { ok: boolean; message?: string };
const TYPES = new Set(["correction", "issue", "other"]);

export async function submitFeedback(_prev: FeedbackState, fd: FormData): Promise<FeedbackState> {
  const ip = await getClientIp();
  if (!(await guardPublicWrite(ip, "feedback"))) {
    return { ok: false, message: "提交太频繁，请 10 分钟后再试。" };
  }
  const text = (key: string) => {
    const value = fd.get(key);
    return typeof value === "string" ? value.trim() : "";
  };
  const type = text("type") || "other";
  const slug = text("slug");
  const contact = text("contact");
  const content = text("content");
  if (!TYPES.has(type) || content.length < 8 || content.length > 2000) {
    return { ok: false, message: "请选择类型，内容需在 8–2000 字之间。" };
  }
  if (slug.length > 100 || contact.length > 200) {
    return { ok: false, message: "关联条目最多 100 字，联系方式最多 200 字。" };
  }
  await addFeedback({
    id: randomBytes(8).toString("hex"),
    at: new Date().toISOString(),
    type: type as "correction" | "issue" | "other",
    slug: slug || undefined,
    contact: contact || undefined,
    content,
  });
  return { ok: true };
}
