import type { Guide } from "@/data/types";
import { markdownOutline, parseMarkdown } from "./markdown.ts";

/**
 * 教程的目录形态。
 *
 * **为什么不做多页 wiki。** 教程挂在软件条目下，正文中位数 1881 字符、4~6 个 h2
 * （最长的 anydoc 是 7385 字符 / 12 节）。为 5 篇长教程引入拆页机制，
 * 要动数据库结构、后台表单与导入脚本，而 50 篇短教程用不上这套机制。
 * 单页 + 章节树能覆盖 90% 的需求，且零迁移成本。
 *
 * 将来真要拆页，这里是天然的切分点：sections 已经按 h2 切开了。
 */

/** 单个章节。 */
export type GuideSection = {
  /** 锚点，用于目录跳转 */
  id: string;
  title: string;
  level: 2 | 3 | 4;
};

/**
 * 从教程正文抽出目录。
 *
 * 只收 h2/h3：`markdownOutline` 排除了 h1（页面标题本身）与 h4（实现细节）。
 *
 * **这里只有目录，没有「上一节 / 下一节」。** 单页教程里翻页是伪需求：
 * 读者滚到底部时「下一节」无处可去，而顶部的章节树已经覆盖了跳转。
 * 真要跨条目翻页（比如「下一篇教程」），那是数据层的相邻条目问题，
 * 不是单篇教程内部能算出来的。
 */
export function guideToc(guide: Guide | undefined): GuideSection[] {
  const markdown = guide?.markdown?.trim();
  if (!markdown) return [];

  return markdownOutline(parseMarkdown(markdown)).map((entry) => ({
    id: entry.id,
    title: entry.text,
    level: entry.level,
  }));
}

/** 目录里 h3 缩进用：h2 是章，h3 是章内小节。 */
export function isSubSection(section: GuideSection): boolean {
  return section.level === 3;
}

/**
 * 从当前与视口相交的标题里挑出「读者读到的那一节」。
 *
 * **为什么取最靠上的一条，而不是最后一条。** 目录跟随的是「读到哪」，
 * 不是「哪条标题刚进视口」。长章节的标题刚露头时，读者其实还在上一节里，
 * 取最靠上的相交项才是刚翻过去的位置。
 *
 * 放在这里而不是组件里，是为了能测：这段规则写在 IntersectionObserver
 * 回调里时，顺序反了人眼很难发现（页面看起来仍然会高亮，只是不跟手）。
 */
export function pickCurrentSection(
  sections: readonly GuideSection[],
  visible: ReadonlySet<string>,
): string | undefined {
  for (const section of sections) {
    if (visible.has(section.id)) return section.id;
  }
  return undefined;
}