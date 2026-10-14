"use server";

import { randomBytes } from "node:crypto";

import type { ItemKind } from "@/data/types";
import { addSubmission } from "@/lib/store";
import { getClientIp, guardPublicWrite } from "@/lib/guard";
import { turnstileRequired, verifyTurnstile } from "@/lib/turnstile";
import { isHttpUrl, ITEM_KINDS } from "@/lib/input-validation";

/** code=captcha 时前端会刷新页面：通行证可能刚好在填表期间过期，得让验证框重新出现。 */
export type SubmissionState = { ok: boolean; message?: string; code?: "captcha" };

export async function submitSubmission(_prev: SubmissionState, fd: FormData): Promise<SubmissionState> {
  const ip = await getClientIp();
  if (!(await guardPublicWrite(ip, "submission"))) {
    return { ok: false, message: "提交太频繁，请 10 分钟后再试。" };
  }
  const text = (key: string) => {
    const value = fd.get(key);
    return typeof value === "string" ? value.trim() : "";
  };
  const kind = (text("kind") || "app") as ItemKind;
  const name = text("name");
  const url = text("url");
  const need = text("need");
  if (!ITEM_KINDS.includes(kind)) return { ok: false, message: "请选择有效的分享类型。" };
  if (!name || name.length > 100 || !url || need.length < 8 || need.length > 1000) {
    return { ok: false, message: "名称需在 1–100 字之间、链接必填，需求说明需在 8–1000 字之间。" };
  }
  if (!isHttpUrl(url, process.env.NODE_ENV !== "production")) {
    return { ok: false, message: "请填写不含账户密码的 HTTPS 地址，最多 2048 字。" };
  }
  // 内容校验通过后再消费 Turnstile 令牌：格式错误不该烧掉用户刚解的验证。
  // 持有效通行证则免验——通行证是首访时拿的，同一判断与 submit/page.tsx 一致。
  if ((await turnstileRequired()) && !(await verifyTurnstile(text("cf-turnstile-response"), "submit"))) {
    return { ok: false, message: "人机验证未通过，请等验证框刷新后再试。", code: "captcha" };
  }
  await addSubmission({ id: randomBytes(8).toString("hex"), at: new Date().toISOString(), kind, name, url, need });
  return { ok: true };
}
