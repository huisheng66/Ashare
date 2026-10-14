"use server";

import { getClientIp, rateLimit } from "@/lib/guard";
import { grantHumanPass, turnstileSiteKey, verifyTurnstile } from "@/lib/turnstile";

/**
 * 首访静默验证通过后签发通行证，由 components/VisitorCheck.tsx 调用。
 *
 * 这个入口可以被任何人反复调用（每次都会替调用方花一次 siteverify），所以先限速：
 * 键按 IP，与 lib/guard.ts 其余入口同一套（TRUST_PROXY 未开时所有请求共享一个键，
 * 等于全局限速）。返回布尔值只为便于排查，前端不依赖它做任何判断——通行证是否存在
 * 一律由服务端读 cookie 决定。
 */
export async function grantPass(token: string): Promise<boolean> {
  if (!turnstileSiteKey()) return false;
  const ip = await getClientIp();
  if (!rateLimit(`pass:${ip}`, 5, 10 * 60 * 1000)) return false;
  if (!(await verifyTurnstile(token, "visitor"))) return false;
  await grantHumanPass();
  return true;
}
