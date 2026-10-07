/**
 * 正文分栏：把段落分成若干栏，并保证各栏高度尽量接近。
 *
 * 为什么需要它：详情页在宽屏下是「主栏 + 右栏」两列，主栏若只有一栏文字，
 * 右边会空出一大片。分成两栏能把空间填满，又让每栏维持在中文的舒适行宽内。
 *
 * 为什么不用 CSS 的 columns-2：
 * 它按「行数」平衡，遇到段落长短悬殊时失衡明显 —— 3 段 73/147/69 字
 * 会排成 1 段 / 2 段，两栏高度差 63%，右边一栏孤零零拖到底。
 * 而 columns 没法表达「这一栏该放哪些段」，只能交给浏览器猜。
 *
 * 两条设计约束，都是从实际内容里学到的：
 * 1. 穷举所有切分点取最优，而不是贪心。贪心只看当前栏有没有过半，
 *    不比较「放进去」和「换栏」哪个更均衡，段落悬殊时照样摆反。
 *    段落数是个位数，穷举代价可忽略，换来「必然挑到最好的那刀」。
 * 2. 最优解仍不均衡时整段退回单栏。3 段 73/147/69 无论在哪个段间切，
 *    最好的也只有 218 vs 74（差 66%）—— 这种内容天生不适合分栏，
 *    这时左边一栏通到底、右边空着，远好过两栏一高一矮。
 *
 * 字数是估算而非精确高度：中文在给定字号下换行接近平方率，
 * 按字数估足够判断量级，真差几行肉眼看不出来。
 */

/** 两栏字数差超过最高栏的这个比例就放弃分栏。 */
const MAX_IMBALANCE = 0.35;

/** 少于这么多段不分栏：两三段各占一栏，右边空着反而更难看。 */
const MIN_PARAGRAPHS = 4;

/** 总字数下限：内容太少撑不起一栏，摊开只有稀疏几行。 */
const MIN_TOTAL_CHARS = 300;

export function splitBodyColumns(items: string[], columns: number): string[][] {
  const single = [items];
  const total = items.reduce((s, t) => s + t.length, 0);
  if (columns < 2 || items.length < MIN_PARAGRAPHS || total < MIN_TOTAL_CHARS) return single;

  const target = total / columns;
  let best = single;
  let bestScore = Infinity;

  const scoreOf = (cols: string[][]): number => {
    const sizes = cols.map((c) => c.reduce((s, t) => s + t.length, 0));
    // 平方而非绝对值：让大偏差被重罚，差 100 字的坏切法比差 10 的更该淘汰。
    const sizeScore = sizes.reduce((s, n) => s + (n - target) ** 2, 0);
    // 栏内段落数也参与评分：宁可 2+2 也不要 1+3，
    // 视觉均匀比字数精确更重要，所以给一个大权重。
    const counts = cols.map((c) => c.length);
    const countScore = counts.reduce((s, n) => s + (n - items.length / columns) ** 2, 0) * 400;
    return sizeScore + countScore;
  };

  const assign = (col: number, start: number, acc: string[][]): void => {
    const remaining = columns - col;
    if (remaining === 1) {
      const last = items.slice(start);
      if (!last.length) return;
      const candidate = [...acc, last];
      const score = scoreOf(candidate);
      if (score < bestScore) {
        bestScore = score;
        best = candidate;
      }
      return;
    }
    // 每栏至少留 1 段，避免出现空栏。
    const maxEnd = items.length - (remaining - 1);
    for (let end = start + 1; end <= maxEnd; end++) {
      acc.push(items.slice(start, end));
      assign(col + 1, end, acc);
      acc.pop();
    }
  };
  assign(0, 0, []);

  const sizes = best.map((c) => c.reduce((s, t) => s + t.length, 0));
  const imbalance = sizes.length > 1 ? (Math.max(...sizes) - Math.min(...sizes)) / Math.max(...sizes) : 0;
  return best.length > 1 && imbalance <= MAX_IMBALANCE ? best : single;
}