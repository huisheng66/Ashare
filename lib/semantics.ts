import type { ItemKind, Software, SourceKind } from "@/data/types";

/**
 * 条目语义的单一事实源。
 *
 * 此前 `source`（来源可信度）与 `kind`（条目形态）各自独立填写，
 * 后台 `saveItem` 两者都存、前台徽章只认 `source`，于是出现
 * GeoGebra 那类矛盾：种子标 `source: "opensource"` → 被 `seedToItem()`
 * 推导成 `kind: "opensource"`，前台挂出「开源」徽章，
 * 但它仓库 `license` 为 null（源码公开、许可闭源），实际是非商业免费。
 *
 * 这里把两者关系写成可执行的规则，供后台校验、ingest 脚本与测试共用。
 */

/** 合法组合及其中文说明。`null` 表示该组合不存在。 */
const SOURCE_KIND_MATRIX: Record<SourceKind, Partial<Record<ItemKind, string>>> = {
  // 厂商正式版应用（含免费档与官方优惠入口）
  official: { app: "厂商正式版应用", script: "官方分发的脚本工具" },
  // 许可证允许自由再分发的项目
  opensource: { opensource: "开源项目", app: "开源但以应用形态分发的工具" },
  // 官方优惠入口，通常仍是正式版应用
  discount: { app: "官方优惠的正式版应用" },
};

/** 组合是否成立。 */
export function isValidSourceKind(source: SourceKind, kind: ItemKind): boolean {
  return Boolean(SOURCE_KIND_MATRIX[source]?.[kind]);
}

/** 组合的中文说明，用于报错提示。 */
export function describeSourceKind(source: SourceKind, kind: ItemKind): string {
  return SOURCE_KIND_MATRIX[source]?.[kind] ?? `${source} + ${kind}`;
}

/**
 * 未显式指定 `kind` 时按来源推导。
 *
 * 注意：这是「缺省值」而非「校验」。`opensource` 推导为 `opensource`
 * 只是一般情况，像 GeoGebra 那样实为闭源的必须显式写 `kind: "app"`。
 */
export function inferKind(source: SourceKind): ItemKind {
  return source === "opensource" ? "opensource" : "app";
}

/**
 * `source: "opensource"` 且 `kind: "opensource"` 时，
 * 应当有可核验的仓库链接 —— 否则「开源」这个断言无处支撑。
 */
export function needsRepoEvidence(item: Pick<Software, "source" | "kind" | "links">): boolean {
  return item.source === "opensource" && item.kind === "opensource" && !item.links.github;
}

/**
 * 校验一个条目的语义一致性，返回问题列表（空数组表示通过）。
 * 后台保存与 ingest 脚本共用，避免同一套规则写两遍。
 *
 * 只管**跨字段**的一致性。单字段的必填与白名单（slug 格式、场景是否合法、
 * 平台非空）由 `saveItem` 与 ingest 脚本各自已有���校验负责，此处不重复，
 * 免得同一问题在两处以不同措辞报错。
 */
export function validateSemantics(
  item: Pick<Software, "source" | "kind" | "links">,
): string[] {
  const problems: string[] = [];

  if (!isValidSourceKind(item.source, item.kind)) {
    problems.push(`来源「${item.source}」与类型「${item.kind}」不匹配，合法组合：${Object.keys(SOURCE_KIND_MATRIX[item.source] ?? {}).join(" / ")}`);
  }
  if (needsRepoEvidence(item)) {
    problems.push("标为开源项目却没有 GitHub 链接，「开源」这一断言缺少可核验依据");
  }
  // 镜像不能是唯一来源：没有官网与仓库时，镜像就退化成「网盘分发」。
  if (item.links.disk && !item.links.official && !item.links.github) {
    problems.push("镜像链接不能作为唯一来源，必须同时有官网或 GitHub");
  }
  if (item.links.disk && !item.links.diskNote?.trim()) {
    problems.push("镜像链接必须填写镜像说明");
  }

  return problems;
}

/** 校验并返回可安全落库的 kind：显式值优先，缺省按来源推导。 */
export function resolveKind(source: SourceKind, explicit?: ItemKind): ItemKind {
  return explicit ?? inferKind(source);
}
