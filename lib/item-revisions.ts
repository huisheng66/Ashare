import { fromBundle, searchTextOf, type ItemBundle, type ItemRow } from "./catalog-rows.ts";

/**
 * 内容级历史：基线快照 + 字段级差异，可重放还原任意版本。
 *
 * 为什么不做「每次都存全量」：实测单条完整内容平均 8.2 KB，全量每次都存会让这张表
 * 按「编辑次数 × 8 KB」增长；而一次真实的编辑通常只碰一两个字段，差异只有几百字节。
 * 首版必须完整 —— 否则后面没有重放的起点。
 *
 * 为什么不做 JSON Patch（RFC 6902）：那套要算 JSON Pointer 路径。这里的字段是扁平的
 * ItemBundle（列名 → 值），直接按列名记更短也更可读。
 *
 * **这个模块的全部价值在于「重放必须与实际写入一致」。** 差异算错了，重放出来的就是
 * 一个看起来合理但内容错误的历史版本 —— 那比没有历史更糟：人会拿它当依据做判断。
 * 所以差异的判定口径写死在这里，并由 tests/item-revisions.test.mjs 做往返比对钉住。
 */

/**
 * 不参与差异比较的列（但**仍然写进快照**）。
 *
 * - search_text：派生自 body / tutorial / guide 等。改动会连带变化，每次都记它是噪音。
 * - updated_at：写入时自动更新，不是内容。
 * - row_version：并发计数，不是内容。
 * - created_at：**不可变**，所以每次都相同、差异比较永远为 false。但它必须存 ——
 *   丢掉它，重放出来的条目就没有创建时间了。
 *
 * 这两条要求是分开的：**存不存**看「还原后是否缺东西」，**比不比**看「会不会每次都变」。
 * 把 created_at 一开始就归到「不存」那一类，是这版实现里最容易被忽略的错误。
 */
export const DERIVED_COLUMNS: ReadonlySet<string> = new Set([
  "search_text",
  "updated_at",
  "row_version",
]);

/** 写入快照时必须排除的列：派生字段不存，重放时重算即可。 */
const SNAPSHOT_EXCLUDED: ReadonlySet<string> = new Set([...DERIVED_COLUMNS, "slug"]);

/**
 * slug 也不进 payload：它是 key 本身，而且改名走「新建 + 删除」而不是原地改，
 * 跨 slug 重放本就不该发生。
 */

/** 子表整体替换时在 payload 里的键。子表用 DELETE+INSERT 整体写入，不做行级差异。 */
const CHILD_KEYS = ["tags", "scenes", "platforms", "alternatives", "links", "previews", "guideResources"] as const;

/**
 * 一个版本的存储形态。
 *
 * snapshot.payload 是完整 ItemBundle；delta.payload 只带变化的列 + 变化的子表。
 */
export type RevisionPayload = {
  kind: "snapshot" | "delta";
  /** 变化的列名 → 新值。snapshot 时是全部列。 */
  columns: Record<string, unknown>;
  /** 子表名 → 新的完整子表内容。子表是整体替换，不做行级差异。 */
  children?: Partial<Record<(typeof CHILD_KEYS)[number], unknown>>;
};

export type Revision = {
  rowVersion: number;
  kind: "snapshot" | "delta";
  actor: string;
  action: "create" | "update" | "delete" | "status";
  summary: string;
  fields: string[];
  at: string;
  payload: RevisionPayload;
};

/** 值相等判定：按 JSON 序列化后比字符串，够用且不需要引入深比较依赖。 */
function same(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

function snapshotColumns(item: ItemRow): Record<string, unknown> {
  const columns: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(item)) {
    // created_at 在这里被写入：它不可变，重放时需要它还原出完整的条目。
    if (SNAPSHOT_EXCLUDED.has(key)) continue;
    columns[key] = value;
  }
  // 重放结果没有 slug 可依，所以基线里必须带着它 —— 每个版本都带着，
  // 重放时才认得出这条历史属于谁。
  columns.slug = item.slug;
  return columns;
}

/** 完整快照。首版、或基线缺失时用。 */
export function snapshotOf(bundle: ItemBundle): RevisionPayload {
  return {
    kind: "snapshot",
    columns: snapshotColumns(bundle.item),
    children: {
      tags: [...bundle.tags],
      scenes: [...bundle.scenes],
      platforms: [...bundle.platforms],
      alternatives: [...bundle.alternatives],
      links: bundle.links.map((link) => ({ ...link })),
      previews: [...bundle.previews],
      guideResources: bundle.guideResources.map((resource) => ({ ...resource })),
    },
  };
}

/**
 * 上一个状态与下一个状态之间的差异。
 *
 * @param before 上一个版本的还原结果；没有基线时传 undefined，此时产出完整快照。
 * @param after  本次要记录的状态。
 */
export function deltaBetween(before: ItemBundle | undefined, after: ItemBundle): RevisionPayload {
  // 没有基线就没有重放起点，只能存全量。
  if (!before) return snapshotOf(after);

  const changed: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(after.item)) {
    if (DERIVED_COLUMNS.has(key)) continue;
    if (!same(before.item[key as keyof ItemRow], value)) changed[key] = value;
  }

  const children: Partial<Record<(typeof CHILD_KEYS)[number], unknown>> = {};
  for (const key of CHILD_KEYS) {
    const now = after[key] as unknown[];
    const then = before[key] as unknown[] | undefined;
    if (!same(then ?? [], now)) children[key] = now;
  }

  // 一个字段都没变时不产出空差异 —— 那是「保存了但什么都没改」，
  // 记进历史只会让人以为改过。
  if (!Object.keys(changed).length && !Object.keys(children).length) {
    return { kind: "delta", columns: {} };
  }
  // 子表没变时不给 children 键：读方不必判 undefined，写方也不必存 "{}"。
  return Object.keys(children).length
    ? { kind: "delta", columns: changed, children }
    : { kind: "delta", columns: changed };
}

/** 把差异套在基线上，得到某个完整版本的内容。payload 是 delta 时才需要 before。 */
export function applyDelta(before: ItemBundle | undefined, payload: RevisionPayload): ItemBundle {
  if (payload.kind === "snapshot") return bundleOf(payload);
  if (!before) {
    // delta 却没有基线：无法还原。这是不该发生的状态，宁可显式失败也不要静默给一份残缺内容。
    throw new Error("[revisions] 缺少基线快照，无法重放差异");
  }
  const next: ItemBundle = {
    item: { ...before.item },
    tags: [...before.tags],
    scenes: [...before.scenes],
    platforms: [...before.platforms],
    alternatives: [...before.alternatives],
    links: before.links.map((link) => ({ ...link })),
    previews: [...before.previews],
    guideResources: before.guideResources.map((resource) => ({ ...resource })),
  };
  for (const [key, value] of Object.entries(payload.columns)) {
    (next.item as unknown as Record<string, unknown>)[key] = value;
  }
  for (const key of CHILD_KEYS) {
    const value = payload.children?.[key];
    if (value !== undefined) {
      (next as unknown as Record<string, unknown>)[key] = value;
    }
  }
  return next;
}

function bundleOf(payload: RevisionPayload): ItemBundle {
  const children = payload.children ?? {};
  return {
    item: { ...(payload.columns as unknown as ItemRow) },
    tags: [...((children.tags as string[]) ?? [])],
    scenes: [...((children.scenes as string[]) ?? [])],
    platforms: [...((children.platforms as string[]) ?? [])],
    alternatives: [...((children.alternatives as string[]) ?? [])],
    links: ((children.links as ItemBundle["links"]) ?? []).map((link) => ({ ...link })),
    previews: [...((children.previews as string[]) ?? [])],
    guideResources: ((children.guideResources as ItemBundle["guideResources"]) ?? []).map((r) => ({ ...r })),
  };
}

/** 差异涉及哪些列名（子表用 "子表.列名" 的形式并入）。用于写进 fields 与审计摘要。 */
export function changedFields(payload: RevisionPayload): string[] {
  const names = Object.keys(payload.columns);
  for (const key of Object.keys(payload.children ?? {})) names.push(key);
  return names.sort();
}

/**
 * 依次重放到第 targetVersion 版。
 *
 * @param revisions 该slug 的全部版本，按 row_version 升序。
 * @param targetVersion 目标版本号；超出范围时返回最后一版。
 */
export function replay(revisions: Revision[], targetVersion?: number): ItemBundle | undefined {
  const ordered = [...revisions].sort((a, b) => a.rowVersion - b.rowVersion);
  const limited =
    targetVersion === undefined
      ? ordered
      : ordered.filter((revision) => revision.rowVersion <= targetVersion);
  if (!limited.length) return undefined;

  let current: ItemBundle | undefined;
  for (const revision of limited) {
    current = applyDelta(current, revision.payload);
    /**
     * updated_at 与 search_text 不进 payload（派生字段，每次都变），但还原出来的条目
     * 必须有它们，否则前端「最近更新」会拿到空值、搜索也会失效。
     * updated_at 用**该版本的写入时刻** —— 这正是它当时的值；search_text 重算，
     * 口径与 lib/catalog-rows.ts 的 searchTextOf 完全一致。
     */
    current.item.updated_at = revision.at;
    current.item.search_text = searchTextOf(fromBundle(current));
  }
  return current;
}