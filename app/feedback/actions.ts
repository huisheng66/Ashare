"use server";

import { randomBytes } from "node:crypto";

import { addFeedback } from "@/lib/store";
import { getClientIp, guardPublicWrite } from "@/lib/guard";
import { turnstileRequired, verifyTurnstile } from "@/lib/turnstile";

/** code=captcha 时前端会刷新页面：通行证可能刚好在填表期间过期，得让验证框重新出现。 */
export type FeedbackState = { ok: boolean; message?: string; code?: "captcha" };
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
  // 内容校验通过后再消费 Turnstile 令牌：格式错误不该烧掉用户刚解的验证。
  // 持有效通行证则免验——通行证是首访时拿的，同一判断与 feedback/page.tsx 一致。
  if ((await turnstileRequired()) && !(await verifyTurnstile(text("cf-turnstile-response"), "contact"))) {
    return { ok: false, message: "人机验证未通过，请等验证框刷新后再试。", code: "captcha" };
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
