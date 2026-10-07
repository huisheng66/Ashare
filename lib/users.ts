import type { PublishStatus } from "@/data/types";

/**
 * 账号与权限模型。
 *
 * 刻意做成一张集中的纯函数表：权限判断散落在各个 server action 里，最常见的漏洞就是
 * 「新加了入口却忘了加检查」。这里只回答两个问题 —— 这个角色能不能做这件事、
 * 能不能把状态从 A 改到 B。调用方负责取当前用户，判断逻辑不重复。
 */

export type Role = "admin" | "editor";

export const ROLES: Role[] = ["admin", "editor"];

export const ROLE_LABEL: Record<Role, string> = {
  admin: "管理员",
  editor: "编辑",
};

/** 权限点按「能做什么」命名，不按页面 —— 页面会改，能力不会。 */
export type Permission = "edit" | "publish" | "moderate" | "users";

const MATRIX: Record<Role, Permission[]> = {
  // 管理员：全部
  admin: ["edit", "publish", "moderate", "users"],
  // 编辑：只能写草稿与提交审核；发布、删除、封禁、管账号都不行
  // 编辑也要能处理投稿/反馈，但发布与账号管理不行
  editor: ["edit", "moderate"],
};

export function can(role: Role, permission: Permission): boolean {
  return MATRIX[role]?.includes(permission) ?? false;
}

export function permissionsOf(role: Role): Permission[] {
  return [...(MATRIX[role] ?? [])];
}

export function isRole(value: string): value is Role {
  return (ROLES as string[]).includes(value);
}

/**
 * 状态流转。
 *
 * - 改成 published 需要 publish 权限（编辑不能自己把草稿推上线）；
 * - 从 published 改走同样需要 publish（编辑不能把已上线的条目撤下）；
 * - 其余（draft <-> review）编辑就能做，这是他们提交与撤回自己工作的路径。
 */
export function canSetStatus(role: Role, from: PublishStatus, to: PublishStatus): boolean {
  if (to === "published" || from === "published") return can(role, "publish");
  return can(role, "edit");
}

/** 状态的中文标签，后台列表与表单共用。 */
export const STATUS_LABEL: Record<PublishStatus, string> = {
  draft: "草稿",
  review: "待审核",
  published: "已发布",
};

/**
 * 这个状态是否对公众可见。
 * 只有 published 算 —— 待审核绝不能因为「不是 draft」就被放出去。
 */
export function isPublicStatus(status: PublishStatus): boolean {
  return status === "published";
}

/**
 * 账号记录（服务端形态，含口令哈希，不要送到客户端）。
 * 口令只存 scrypt 哈希，格式与 scripts/hash-password.mjs 一致。
 */
export type UserRecord = {
  username: string;
  displayName: string;
  passwordHash: string;
  role: Role;
  disabled: boolean;
  createdAt: string;
  lastLoginAt?: string;
};

/** 可以安全展示的形态：去掉口令哈希。 */
export type PublicUser = Omit<UserRecord, "passwordHash">;

export function toPublicUser(record: UserRecord): PublicUser {
  // 显式列字段而不是解构剔除：既避免未使用变量的 lint 警告，也保证以后新增字段时
  // 必须主动决定它能不能出现在客户端。
  const view: PublicUser = {
    username: record.username,
    displayName: record.displayName,
    role: record.role,
    disabled: record.disabled,
    createdAt: record.createdAt,
  };
  if (record.lastLoginAt) view.lastLoginAt = record.lastLoginAt;
  return view;
}

/** 用户名只允许小写字母、数字与中划线，与 slug 同规则，便于放进 URL。 */
export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9-]{1,63}$/;
