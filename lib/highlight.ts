/**
 * 搜索关键词高亮：把文本按命中词切成交替片段。
 *
 * 为什么返回**结构化片段**而不是拼好的 HTML 字符串：
 * 调用方若用 dangerouslySetInnerHTML 渲染，条目文本里的尖括号就会变成注入面 ——
 * 而条目内容来自后台录入与投稿，不是可信 HTML。片段数组让渲染层永远只创建文本节点。
 *
 * 纯函数，服务端与客户端都能用（搜索页是 Server Component）。
 */

export type HighlightSegment = { text: string; hit: boolean };

/**
 * 大小写不敏感地切分文本。重叠或相邻的命中会合并，
 * 避免产出 `<mark>a</mark><mark>ab</mark>` 这种碎片，读起来像坏了。
 */
export function highlight(text: string, terms: string[]): HighlightSegment[] {
  const needles = [...new Set(terms.map((term) => term.trim()).filter(Boolean))]
    // 长词优先匹配，否则短词会先吃掉长词的一部分（如 "py" 先于 "python" 命中）
    .sort((a, b) => b.length - a.length);
  if (!needles.length || !text) return [{ text, hit: false }];

  const lower = text.toLowerCase();
  const ranges: Array<[number, number]> = [];
  for (const needle of needles) {
    const target = needle.toLowerCase();
    let cursor = 0;
    while (cursor <= lower.length - target.length) {
      const at = lower.indexOf(target, cursor);
      if (at === -1) break;
      ranges.push([at, at + target.length]);
      cursor = at + target.length;
    }
  }
  if (!ranges.length) return [{ text, hit: false }];

  ranges.sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [];
  for (const range of ranges) {
    const last = merged[merged.length - 1];
    if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
    else merged.push([range[0], range[1]]);
  }

  const segments: HighlightSegment[] = [];
  let cursor = 0;
  for (const [start, end] of merged) {
    if (start > cursor) segments.push({ text: text.slice(cursor, start), hit: false });
    segments.push({ text: text.slice(start, end), hit: true });
    cursor = end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), hit: false });
  return segments;
}

/** 从原始查询里取高亮词（与检索同一套空白切分口径）。 */
export function highlightTermsOf(query: string): string[] {
  return [...new Set(query.split(/\s+/u).map((term) => term.trim()).filter(Boolean))];
}
