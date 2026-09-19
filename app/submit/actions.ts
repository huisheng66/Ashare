"use server";

import { randomBytes } from "node:crypto";

import type { ItemKind } from "@/data/types";
import { addSubmission } from "@/lib/store";
import { getClientIp, guardPublicWrite } from "@/lib/guard";
import { isHttpUrl, ITEM_KINDS } from "@/lib/input-validation";

export type SubmissionState = { ok: boolean; message?: string };

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
  await addSubmission({ id: randomBytes(8).toString("hex"), at: new Date().toISOString(), kind, name, url, need });
  return { ok: true };
}
