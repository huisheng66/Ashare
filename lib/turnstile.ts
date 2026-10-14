import "server-only";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

import { SlidingWindowLimiter } from "./rate-limiter";
import { getSiteUrl } from "./site";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * 已核销令牌的去重表（进程内内存）。
 *
 * 本来只靠 Cloudflare 判重就够——官方文档明确说同一令牌第二次核验必回
 * timeout-or-duplicate。但实测并非如此：直连（绕开本地代理）、加 remoteip 与
 * idempotency_key 变体、间隔数分钟，本组件的令牌连核验五次全部 success；
 * 而同一条链路上用官方测试密钥 3x… 能正常拿到 timeout-or-duplicate。
 * 也就是说「单次有效」在当前组件上不可依赖，本地必须有兜底。
 *
 * 令牌 300 秒过期，记满这个窗口即可（limit=1 即单次使用）。键只存 SHA-256 摘要，
 * 不把令牌原文留在内存里。多副本部署时各副本各记一份——与 lib/guard.ts 的进程内
 * 限流是同一取舍。
 */
const redeemed = new SlidingWindowLimiter(20_000);
const TOKEN_TTL_MS = 300_000;

/**
 * 允许的前端主机名白名单（逗号分隔）。
 *
 * 生产环境**必须**只写正式域名，不能含 localhost / 127.0.0.1 —— 同一个组件同时挂
 * 本地与生产域名是安全的，前提正是这里逐部署精确匹配 siteverify 回传的 hostname。
 */
function expectedHostnames(): Set<string> {
  return new Set(
    (process.env.TURNSTILE_HOSTNAMES ?? "")
      .split(",")
      .map((hostname) => hostname.trim().toLowerCase())
      .filter(Boolean),
  );
}

/**
 * Turnstile 的站点密钥（公开部分，可以进前端）。
 *
 * 三项配置（站点密钥 / 密钥 / 主机名白名单）齐备才算启用：只配站点密钥时，用户会去
 * 解一个没人校验的验证码；只配密钥时，表单会因为拿不到令牌而被全部拒绝；缺白名单时
 * 无法确认令牌来自本站前端。任一缺失都按「未启用」处理，行为与没配一致。
 */
export function turnstileSiteKey(): string | undefined {
  const siteKey = process.env.TURNSTILE_SITE_KEY?.trim();
  const enabled = siteKey && process.env.TURNSTILE_SECRET_KEY?.trim() && expectedHostnames().size > 0;
  return enabled ? siteKey : undefined;
}

/**
 * 服务端校验 Turnstile 令牌。
 *
 * 未启用时恒真（本地开发与未配置部署不受影响）。启用后四项都要过：success、
 * action 与调用面一致（挡住把 A 表单的令牌重放到 B 表单）、hostname 命中白名单
 * （挡住令牌来自别的域名）、令牌未被本进程核销过。网络异常同样拒绝：
 * 宁可让真人再点一次，也不放机器过。
 */
export async function verifyTurnstile(token: string | undefined, action: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  const allowed = expectedHostnames();
  if (!secret || !process.env.TURNSTILE_SITE_KEY?.trim() || allowed.size === 0) return true;
  const response = token?.trim();
  if (!response) return false;
  try {
    const result = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response }),
      cache: "no-store",
    });
    if (!result.ok) return false;
    const data = (await result.json()) as { success?: unknown; action?: unknown; hostname?: unknown };
    const verified =
      data.success === true &&
      data.action === action &&
      typeof data.hostname === "string" &&
      allowed.has(data.hostname.toLowerCase());
    // 通过 Cloudflare 校验后才登记核销：被拒的令牌不占名额。
    return verified && redeemed.allow(createHash("sha256").update(response).digest("hex"), 1, TOKEN_TTL_MS);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// 首访通行证（P 软检测）
//
// 首访时静默验一次，通过后下发签名 cookie，5 小时内不再要求验证——表单里那块
// 验证框也随之消失。它不是凭据：只证明「最近有真人访问过本站」，所以后台登录
// 刻意不吃这枚 cookie（见 app/admin/login/page.tsx）。
// ---------------------------------------------------------------------------

const PASS_COOKIE = "ashare_human";
/** 通行证有效期：5 小时。 */
const PASS_TTL_MS = 5 * 60 * 60 * 1000;

/**
 * 签名密钥复用 SESSION_SECRET，但签名域分开（见 signPass）。
 * 未配置或过短时返回 undefined —— 此时通行证功能整体关闭，表单退回逐次验证，
 * 不因为少一个环境变量就放行或报错。
 */
function passSecret(): string | undefined {
  const value = process.env.SESSION_SECRET;
  return value && value.length >= 32 ? value : undefined;
}

function signPass(expiresAt: number, secret: string): string {
  return createHmac("sha256", secret).update(`human-pass:v1.${expiresAt}`).digest("hex");
}

/** 通行证形态：过期时间.签名。签名覆盖过期时间，改一个字节都会失效。 */
export function createPassToken(secret: string, now = Date.now()): string {
  const expiresAt = now + PASS_TTL_MS;
  return `${expiresAt}.${signPass(expiresAt, secret)}`;
}

/** 只判真伪与时序，输入完全来自 cookie，任何畸形值一律 false 而不抛。 */
export function parsePassToken(token: string | undefined, secret: string, now = Date.now()): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [expRaw, signature] = parts;
  if (!/^\d{13}$/.test(expRaw) || !/^[a-f\d]{64}$/.test(signature)) return false;
  const expiresAt = Number(expRaw);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= now || expiresAt > now + PASS_TTL_MS) return false;
  const expected = Buffer.from(signPass(expiresAt, secret), "hex");
  const actual = Buffer.from(signature, "hex");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

const passCookieOptions = {
  httpOnly: true,
  // 与登录会话同一套判断：未配置 https 站点时（如内网 HTTP 部署）不能下发 secure。
  secure: process.env.NODE_ENV === "production" && getSiteUrl()?.protocol === "https:",
  // 用 lax 而不是 strict：从搜索结果或外链点进来的首次导航必须带上它。
  sameSite: "lax" as const,
  path: "/",
};

export async function hasHumanPass(): Promise<boolean> {
  const secret = passSecret();
  if (!secret) return false;
  return parsePassToken((await cookies()).get(PASS_COOKIE)?.value, secret);
}

export async function grantHumanPass(): Promise<void> {
  const secret = passSecret();
  if (!secret) return;
  (await cookies()).set(PASS_COOKIE, createPassToken(secret), { ...passCookieOptions, maxAge: PASS_TTL_MS / 1000 });
}

/**
 * 是否需要现场验证：已配置 Turnstile 且访问者手里没有有效通行证。
 * 页面（决定要不要渲染验证框）与表单 action（决定要不要核验令牌）共用同一判断，
 * 两边用不同规则就会出现「页面不显示验证框、服务端却要求令牌」的死局。
 */
export async function turnstileRequired(): Promise<boolean> {
  if (!turnstileSiteKey()) return false;
  return !(await hasHumanPass());
}
