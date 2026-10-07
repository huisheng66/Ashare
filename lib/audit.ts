/**
 * 审计的纯逻辑：字段级 diff 与一句话摘要。
 *
 * 不含任何 IO，便于单测；写入在 lib/store-sql.ts。
 */

export type AuditAction = "create" | "update" | "delete" | "status";

/** 每次保存必然变化的字段，不算内容变更。 */
const VOLATILE_KEYS = new Set(["updatedAt"]);

/**
 * 顶层字段名级 diff。
 * 只比字段名与序列化后的值，不保存前后值 —— 正文可能几万字，存进去这张表会比目录还大。
 */
export function diffFields(before: unknown, after: unknown): string[] {
  const left = (before ?? {}) as Record<string, unknown>;
  const right = (after ?? {}) as Record<string, unknown>;
  const changed: string[] = [];
  for (const key of new Set([...Object.keys(left), ...Object.keys(right)])) {
    if (VOLATILE_KEYS.has(key)) continue;
    if (JSON.stringify(left[key] ?? null) !== JSON.stringify(right[key] ?? null)) changed.push(key);
  }
  return changed.sort();
}

/** 一句话摘要，后台审计列表直接展示。 */
export function auditSummary(action: AuditAction, name: string, fields: string[] = []): string {
  switch (action) {
    case "create":
      return "新增条目「" + name + "」";
    case "delete":
      return "删除条目「" + name + "」";
    case "status":
      return "状态变更：「" + name + "」";
    case "update":
      return fields.length
        ? "修改「" + name + "」的 " + fields.length + " 个字段：" + fields.slice(0, 6).join("、") + (fields.length > 6 ? " 等" : "")
        : "保存「" + name + "」（无字段变化）";
  }
}

/** 一条审计记录。写入在 lib/store-sql.ts（MySQL）与 lib/store-json.ts（回滚路径）。 */
export type AuditRecord = {
  at: string;
  actor: string;
  action: AuditAction;
  slug: string;
  summary: string;
  fields: string[];
  versionBefore?: number;
  versionAfter?: number;
};
