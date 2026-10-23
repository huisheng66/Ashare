/**
 * 拼写纠正（typo tolerance）的纯函数部分。
 *
 * 为什么需要它：MySQL 的 ngram parser 把「单个词的 ngram」当作**短语**处理 ——
 * 输入 obisidan 会被拆成 `+"ob" +"bi" +"is" ...` 的与关系，要求这些片段在原文里
 * 连续出现。所以拼错一个字就必然 0 结果，而且**降级成 OR 也救不回来**
 * （实测 `MATCH ... AGAINST('obisidan')` 非布尔同样是 0）。
 *
 * 也就是说，靠 SQL 层调不到 typo tolerance，只能在应用层补：
 * 严格查询空手时，拿查询词去和目录里的名称做编辑距离比对。
 *
 * 边界刻意收紧 —— 错误纠正比不纠正更糟（用户搜 kubernetes 却被纠正成别的）：
 *  - 只纠正 ASCII 词。中文没有「拼错」，只有打错字，编辑距离 1 就能命中大量无关词。
 *  - 短词不纠正：3~4 字母允许 1 处，5 字母以上允许 2 处，更短的直接放弃。
 *  - 候选只取名称/中文名/别名，不取简介 —— 简介里的词不是「用户想找的东西的名字」。
 */

/** Levenshtein 距离，两行滚动数组，O(min(m,n)) 空间。 */
export function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1, // 删除
        curr[j - 1] + 1, // 插入
        prev[j - 1] + cost, // 替换
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

/** 允许的编辑距离：随词长放宽，短词一律不纠正。 */
export function maxDistanceFor(term: string): number {
  if (term.length >= 7) return 2;
  if (term.length >= 5) return 1;
  return 0;
}

const ASCII_WORD = /^[a-z0-9][a-z0-9 ._+-]*$/i;

/**
 * 在词表里找一个最接近的候选。
 *
 * 平局规则：距离相同取**更短**的候选 —— 「obsidian」与「obsidian-skills」距离相同时，
 * 前者才是用户真正想找的东西。
 */
export function pickCorrection(term: string, vocabulary: Iterable<string>): string | null {
  const raw = term.trim();
  if (!raw || !ASCII_WORD.test(raw)) return null;

  const target = raw.toLowerCase();
  const limit = maxDistanceFor(target);
  if (!limit) return null;

  let best: string | null = null;
  let bestDistance = limit + 1;

  for (const candidate of vocabulary) {
    const value = candidate.toLowerCase().trim();
    if (value === target) return candidate; // 已经存在，不需要纠正
    // 长度差超过上限时距离必然超限，先剪枝（省掉绝大多数计算）
    if (Math.abs(value.length - target.length) > limit) continue;
    const distance = editDistance(target, value);
    if (distance > limit) continue;
    if (distance < bestDistance || (distance === bestDistance && best !== null && value.length < best.length)) {
      best = candidate;
      bestDistance = distance;
    }
  }
  return best;
}
