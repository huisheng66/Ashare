/**
 * 同义词组：扩展召回用，**不是**搜索建议。
 *
 * 为什么需要：站内标签是人工标注的，用词并不统一 —— 同一类工具，有的标「图片编辑」，
 * 有的标「图像处理」，有的标「照片管理」。用户输入「图片」时，MySQL 的 ngram 只能匹配
 * 字面，于是标签写「图像编辑」的 photocraft 会被漏掉。实测：`+图片` 13 条，
 * `+(图片 图像 照片)` 34 条，新召回的 21 条几乎都是真正的图片工具（gimp / photoprism /
 * immich / lychee / piwigo）。
 *
 * 收录标准（刻意收得很紧）：
 *  - **只收语义等价**的词。上位词、下位词、相关词一律不收 ——
 *    「视频」不扩成「剪辑」（剪辑是操作），「图片」不扩成「截图」（截图是获取方式）。
 *  - 每组 2~5 个词，宁可少收，也不要让扩展把精确结果淹掉。
 *  - 英文小写即可：全文索引的排序规则是 utf8mb4_0900_ai_ci，大小写本来就不敏感。
 *  - 中文与英文的**跨语言等价**值得收（终端 / CLI / shell），这是中文站的常见输入差异。
 *
 * 维护方式：加一组之前，先用 SQL 验证两件事 ——
 *  1. `SELECT COUNT(*) ... AGAINST('+原词')` 与分组扩展后的差值里，新召回的是否确实同类；
 *  2. 该词的标签覆盖率（在 item_tags 里有没有对应类目）。
 * 凭感觉加的组会把搜索变成「什么都能搜出来」。
 */
export const SYNONYM_GROUPS: readonly (readonly string[])[] = [
  ["图片", "图像", "照片", "相片"],
  ["音乐", "歌曲", "乐曲"],
  ["视频", "影片", "短片"],
  // 只合并**同一件事的不同说法**：cli / shell 就是命令行，属于跨语言等价。
  // 刻意不把「终端」并进来 —— 终端是模拟器（termux、Windows Terminal），
  // 命令行工具是另一类东西。站内标签本身就把它们分成两个类目（终端 11 / 命令行 26），
  // 硬合并会让搜「终端」的人拿到 76 条 CLI 工具，实测过，明显过量。
  ["命令行", "cli", "shell"],
  ["自托管", "自建", "私有部署"],
  ["下载", "下载器"],
  ["截图", "截屏"],
  ["笔记", "记事"],
];

/** 词 → 组内其它词（不含自身）。没有同义词时返回空数组。 */
const INDEX: Map<string, string[]> = (() => {
  const map = new Map<string, string[]>();
  for (const group of SYNONYM_GROUPS) {
    for (const word of group) {
      const others = group.filter((candidate) => candidate !== word);
      map.set(word, others);
    }
  }
  return map;
})();

/**
 * 取一个词的同义词。
 *
 * 只做**精确匹配**，不做前缀或包含 —— 「图」不该被扩展成「图片」的同义词组，
 * 那会把单字查询放大成一个巨型 OR，噪音不可控。
 */
export function synonymsOf(term: string): string[] {
  return INDEX.get(term.toLowerCase().trim()) ?? [];
}

/** 某组同义词是否存在（含自身）。用于测试与调试。 */
export function synonymGroupOf(term: string): string[] {
  const word = term.toLowerCase().trim();
  const others = INDEX.get(word);
  return others ? [word, ...others] : [];
}
