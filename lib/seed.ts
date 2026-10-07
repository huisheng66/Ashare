import type { ItemKind, ItemLinks, SeedSoftware, Software } from "@/data/types";

/**
 * 静态种子 → 目录条目。
 *
 * 种子可以自带 body / tags / kind / links；缺省时保持历史推导，
 * 这样已有的种子条目行为不变，而补过内容的条目在全新部署时也能带上正文。
 * 新增可透传字段时必须同步补 tests/seed.test.mjs，否则会静默丢字段。
 *
 * 这里刻意不 import 任何数据模块：lib/store.ts 带 `server-only`，
 * 测试无法直接导入它，映射逻辑必须单独可测。
 */
export function seedToItem(s: SeedSoftware): Software {
  const { installTips, officialUrl, ...rest } = s;
  const now = new Date().toISOString();
  const links: ItemLinks = s.links ?? { official: officialUrl };
  const kind: ItemKind = s.kind ?? (s.source === "opensource" ? "opensource" : "app");
  return {
    ...rest,
    kind,
    status: "published",
    tags: s.tags ?? [],
    body: s.body ?? "",
    tutorial: installTips,
    links,
    previews: [],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * 种子能带到运行库的字段登记表。
 *
 * 为什么需要这张表：漂移检查（scripts/seed-drift.mjs）与同步脚本（scripts/seed-sync.mjs）
 * 各有一份**手写**的字段清单。新增一个可透传字段时，只改 seedToItem 而忘了改清单，
 * 检查就会对该字段**失明** —— 而且失明是静默的，不报错、不警告。
 * 这个坑本项目已经踩过两次：linksCheckedAt 与 guide（后者直到 P10b 才发现，
 * 表现是「漂移检查说 0 不一致，同步脚本却每轮重写 55 条」）。
 *
 * 关于「从数据库导出种子」：**做不到无损**，所以本文件不做。
 * SeedSoftware 有 officialLabel 与 officialUrl，运行库（Software）里没有对应字段 ——
 * 反向生成会把它们静默丢掉，那比现在更糟。种子的定位因此是
 * 「人手维护的内容源 + 全新部署的引导数据」，与数据库并存，而不是它的投影。
 *
 * 契约（由 tests/seed-contract.test.mjs 钉住）：
 *   1. 每个名字都必须真的是 Software 的键 —— 写错名字会让该字段永远「相等」，等于关闭检查；
 *   2. CARRIED − DRIFT 必须全部登记在 EXCLUDED 里并写明理由；
 *   3. SYNC 必须是 DRIFT 的子集 —— 同步会写的字段，漂移检查不能看不见（guide 就是反例）。
 */
export const SEED_CARRIED_FIELDS = [
  "slug", "name", "nameZh", "aliases", "summary", "body", "tags",
  "scenes", "platforms", "source", "price", "discountNote",
  "whoFor", "whoNot", "alternatives", "guide", "featured", "icon",
  "license", "version", "linksCheckedAt", "links", "tutorial", "kind",
] as const;

/** 刻意不比对的字段，必须写明理由。 */
export const SEED_DRIFT_EXCLUDED: Record<string, string> = {
  price: "价格可能由后台按商业谈判结果维护，合法偏离种子",
};

/** 漂移检查的比对字段 = 登记表减去有理由的例外。 */
export const SEED_DRIFT_FIELDS: string[] = SEED_CARRIED_FIELDS.filter(
  (field) => !(field in SEED_DRIFT_EXCLUDED),
);

/**
 * 种子是**唯一事实源**的字段 —— 同步脚本据此覆盖运行库。
 * 比 SEED_DRIFT_FIELDS 窄：有些字段（如谁适合用）后台改得更准，不该被种子盖回去。
 */
export const SEED_SYNC_FIELDS: string[] = [
  "summary", "body", "tags", "aliases", "links", "source",
  "scenes", "platforms", "license", "kind", "version", "linksCheckedAt", "guide",
];
