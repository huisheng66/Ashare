import "server-only";

import { cookies } from "next/headers";

import {
  createSessionToken,
  parseSessionToken,
  SESSION_MS,
  verifyPasswordHash,
} from "./auth-crypto";
import { getSiteUrl } from "./site";
import { getUser, touchUserLogin } from "./store";
import { can, isRole, type Permission, type Role } from "./users";

export { hashPassword } from "./auth-crypto";

const COOKIE = "ashare_admin";
const cookieOptions = {
  httpOnly: true,
  // 未配置 https 站点时（如内网 HTTP 部署）不能下发 secure cookie，否则登录后立刻失效
  secure: process.env.NODE_ENV === "production" && getSiteUrl()?.protocol === "https:",
  sameSite: "strict" as const,
  path: "/admin",
};

/** 还没建任何账号时，环境变量里的单口令仍然可用 —— 升级不该把人锁在门外。 */
const BOOTSTRAP_USERNAME = "env-admin";

export type CurrentUser = { username: string; displayName: string; role: Role };

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error("SESSION_SECRET 未配置或短于 32 字符");
  return value;
}

/**
 * 当前登录者。
 *
 * **每次请求都回查账号表**，而不是只信 cookie 里的角色：停用或改角色要立即生效，
 * 而不是等 8 小时会话自然过期。「被停用的人还能用 8 小时」是安全问题，主键查询很便宜。
 * 账号被删、被停用、角色被改，一律视为未登录（需重新登录拿新会话）。
 */
export async function currentUser(): Promise<CurrentUser | undefined> {
  const subject = parseSessionToken((await cookies()).get(COOKIE)?.value, secret());
  if (!subject || !isRole(subject.role)) return undefined;

  const record = await getUser(subject.username);
  if (record) {
    if (record.disabled) return undefined;
    // 角色被改过：以库里的为准，但当前会话里还是旧角色 —— 要求重新登录。
    if (record.role !== subject.role) return undefined;
    return { username: record.username, displayName: record.displayName, role: record.role };
  }

  // 引导路径：账号表里没有这个人，但会话是 authenticate 的回落签发的。
  if (subject.username === BOOTSTRAP_USERNAME && subject.role === "admin") {
    return { username: BOOTSTRAP_USERNAME, displayName: "环境变量管理员", role: "admin" };
  }
  return undefined;
}

export async function hasValidSession(): Promise<boolean> {
  return (await currentUser()) !== undefined;
}

export async function userCan(permission: Permission): Promise<boolean> {
  const user = await currentUser();
  return user ? can(user.role, permission) : false;
}

export async function startSession(username: string, role: Role): Promise<void> {
  (await cookies()).set(COOKIE, createSessionToken(secret(), { username, role }), {
    ...cookieOptions,
    maxAge: SESSION_MS / 1000,
  });
}

export async function endSession(): Promise<void> {
  // Cookie removal must use the same path as creation, not delete()'s default '/'.
  (await cookies()).set(COOKIE, "", { ...cookieOptions, maxAge: 0, expires: new Date(0) });
}

/**
 * 校验用户名与口令，返回可签发会话的身份。
 *
 * 账号表里有这个人就以表为准（含停用判断）；表里没有时回落到 ADMIN_PASSWORD_HASH，
 * 签发引导管理员 —— 否则新部署在建第一个账号之前根本进不去后台。
 * 登录成功会回写 last_login_at。
 */
export async function authenticate(
  username: string,
  password: string,
): Promise<{ username: string; role: Role } | undefined> {
  const normalized = username.trim().toLowerCase();
  const record = normalized ? await getUser(normalized) : undefined;

  if (record) {
    if (record.disabled) return undefined;
    if (!(await verifyPasswordHash(password, record.passwordHash))) return undefined;
    await touchUserLogin(record.username).catch(() => {});
    return { username: record.username, role: record.role };
  }

  const envHash = process.env.ADMIN_PASSWORD_HASH ?? "";
  if (envHash && (await verifyPasswordHash(password, envHash))) {
    return { username: BOOTSTRAP_USERNAME, role: "admin" };
  }
  return undefined;
}
