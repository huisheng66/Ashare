"use server";

import { randomBytes } from "node:crypto";

import { getFeedback, saveFeedback } from "@/lib/store";
import { getClientIp, guardPublicWrite } from "@/lib/guard";

export type FeedbackState = { ok: boolean; message?: string };

const TYPES = new Set(["correction", "issue", "other"]);

export async function submitFeedback(
  _prev: FeedbackState,
  fd: FormData,
): Promise<FeedbackState> {
  const ip = await getClientIp();
  if (!(await guardPublicWrite(ip, "feedback"))) {
    return { ok: false, message: "提交太频繁，请 10 分钟后再试。" };
  }

  const type = String(fd.get("type") ?? "other");
  const slug = String(fd.get("slug") ?? "").trim();
  const contact = String(fd.get("contact") ?? "").trim();
  const content = String(fd.get("content") ?? "").trim();

  if (!TYPES.has(type) || content.length < 8 || content.length > 2000) {
    return { ok: false, message: "请选择类型，内容需在 8–2000 字之间。" };
  }

  await saveFeedback([
    {
      id: randomBytes(8).toString("hex"),
      at: new Date().toISOString(),
      type: type as "correction" | "issue" | "other",
      slug: slug || undefined,
      contact: contact || undefined,
      content,
    },
    ...(await getFeedback()),
  ]);
  return { ok: true };
}
