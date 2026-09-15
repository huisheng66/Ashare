"use server";

import { randomBytes } from "node:crypto";

import type { ItemKind } from "@/data/types";
import { addSubmission } from "@/lib/store";
import { getClientIp, guardPublicWrite } from "@/lib/guard";

export type SubmissionState = { ok: boolean; message?: string };

export async function submitSubmission(
  _prev: SubmissionState,
  fd: FormData,
): Promise<SubmissionState> {
  const ip = await getClientIp();
  if (!(await guardPublicWrite(ip, "submission"))) {
    return { ok: false, message: "提交太频繁，请 10 分钟后再试。" };
  }

  const kind = (String(fd.get("kind") ?? "app")) as ItemKind;
  const name = String(fd.get("name") ?? "").trim();
  const url = String(fd.get("url") ?? "").trim();
  const need = String(fd.get("need") ?? "").trim();

  if (!name || name.length > 100 || !url || need.length < 8 || need.length > 1000) {
    return { ok: false, message: "名称、链接必填，需求说明需在 8–1000 字之间。" };
  }
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, message: "链接格式不正确。" };
  }
  if (
    parsed.protocol !== "https:" &&
    !(parsed.protocol === "http:" && process.env.NODE_ENV !== "production")
  ) {
    return { ok: false, message: "链接只允许 http/https 外部地址。" };
  }

  await addSubmission({
    id: randomBytes(8).toString("hex"),
    at: new Date().toISOString(),
    kind,
    name,
    url,
    need,
  });
  return { ok: true };
}
