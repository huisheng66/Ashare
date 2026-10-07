import type { SceneId, Software } from "@/data/types";

/** 条目的展示性派生数据。集中放在这里，避免各组件各判一遍。 */

type IconItem = Pick<Software, "icon" | "iconImage">;

/** 图标候选源，按优先级排列：上传图 → 本地 Simple Icons → 字母块。 */
export type IconCandidate =
  | { kind: "image"; src: string; optimize: boolean }
  | { kind: "letter"; letter: string };

/**
 * 图标来源解析。`failed` 里的源视为加载失败，跳过并顺延到下一级。
 * `optimize: false` 用于 /icons/ 下的 svg：交给 next/image 优化收益小，
 * 且 SVG 走优化器要额外一次解码。
 */
export function iconCandidates(
  item: IconItem,
  failed: readonly string[] = [],
): IconCandidate[] {
  const all: IconCandidate[] = [];
  if (item.iconImage) all.push({ kind: "image", src: item.iconImage, optimize: true });
  if (item.icon.simpleIcon) {
    all.push({ kind: "image", src: `/icons/${item.icon.simpleIcon}`, optimize: false });
  }
  all.push({ kind: "letter", letter: item.icon.letter });
  return failed.length ? all.filter((c) => c.kind !== "image" || !failed.includes(c.src)) : all;
}

/** 解析出当前该用的源。全部图片失败时回退字母块，永远不出现空图标。 */
export function resolveIcon(item: IconItem, failed: readonly string[] = []): IconCandidate {
  const candidates = iconCandidates(item, failed);
  return candidates[0] ?? { kind: "letter", letter: item.icon.letter };
}

/**
 * 主场景 = `scenes[0]`。
 *
 * 这个约定此前只散落在 `content-audit.mjs` 的注释与批量归属规则里，
 * 任何新增代码都得重新确认一遍。集中成函数后，「主场景」有了唯一定义。
 */
export function primaryScene(scenes: readonly SceneId[]): SceneId | undefined {
  return scenes[0];
}

/** 正文按空行分段。空段丢弃，段内换行保留。 */
export function bodyParagraphs(body: string): string[] {
  return body
    .split(/\n+/)
    .map((text) => text.trim())
    .filter(Boolean);
}

/** 名字与中文名，用于搜索与标题。 */
export function displayName(item: Pick<Software, "name" | "nameZh">): string {
  return item.nameZh ? `${item.name}（${item.nameZh}）` : item.name;
}
