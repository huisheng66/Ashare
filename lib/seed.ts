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
