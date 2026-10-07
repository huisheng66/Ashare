import { mediaParts } from "./input-validation.ts";

/**
 * 教程正文的 Markdown 子集解析。
 *
 * **为什么不引三方库、也不拼 HTML 字符串：**
 * 教程内容由后台表单录入，等于半可控输入。引库会拖进一整套 HTML 清洗，
 * 而 `dangerouslySetInnerHTML` 拼字符串则把清洗责任全交给正则 ——
 * 嵌套标签、属性里的引号、转义边界，正则都覆盖不全。
 * 这里改为**解析成 AST，由 React 渲染**：不解析的字符一律当纯文本，
 * 根本没有注入面。代价是只支持一个明确的子集，不支持任意 HTML。
 *
 * 支持：ATX 标题（自动生成锚点）、段落、无序/有序列表、围栏代码块、
 * 引用块、水平线、表格，以及行内的代码 / 粗体 / 斜体 / 链接。
 *
 * 链接与图片都过 URL 白名单（https 或站内 /media/），
 * 这一点比 Markdown 语法本身更重要 —— `javascript:` 伪协议是这类输入最常见的入口。
 */

export type InlineNode =
  | { type: "text"; value: string }
  | { type: "code"; value: string }
  | { type: "strong"; children: InlineNode[] }
  | { type: "em"; children: InlineNode[] }
  | { type: "link"; href: string; children: InlineNode[] }
  | { type: "image"; src: string; alt: string };

export type BlockNode =
  | { type: "heading"; level: 2 | 3 | 4; children: InlineNode[]; id: string }
  | { type: "paragraph"; children: InlineNode[] }
  | { type: "list"; ordered: boolean; items: InlineNode[][] }
  | { type: "code"; lang?: string; value: string }
  | { type: "quote"; children: BlockNode[] }
  | { type: "table"; head: InlineNode[][]; rows: InlineNode[][][] }
  | { type: "rule" };

/** 标题锚点：目录与链接跳转都靠它。中文保留，其余非字母数字折成连字符。 */
export function anchorSlug(text: string, fallback: string): string {
  const slug = text
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
  return slug || fallback;
}

/** 目录条目。只取 h2/h3 —— h4 以下是实现细节，不该占目录。 */
export type Outline = { id: string; text: string; level: 2 | 3 };

/**
 * 允许的链接目标。
 *
 * 站内 `/media/` 是上传流程生成的图片路径（见 `mediaParts`）；
 * 站外只收 https，且拒掉带账户密码的地址 —— 与 `isHttpUrl` 同一套口径。
 * 其余（`javascript:`、`data:`、协议相对 `//evil.com`、相对路径）一律落空，
 * 调用方据此把整段当纯文本渲染，而不是渲染成一个坏链接。
 */
export function safeHref(href: string): string | undefined {
  const value = href.trim();
  if (!value) return undefined;
  if (mediaParts(value)) return value;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return undefined;
    if (url.username || url.password) return undefined;
    return url.toString();
  } catch {
    return undefined;
  }
}

/** 图片只允许站内上传路径：外链图既过不了 CSP 的 img-src，也无从防盗链与审核。 */
export function safeImageSrc(src: string): string | undefined {
  return mediaParts(src.trim()) ? src.trim() : undefined;
}

/**
 * 行内标记按此顺序切分，长标记在前，`**` 不会被 `*` 抢走。
 *
 * 链接部分只捕获到 `](`，目标文本交由 `linkTarget` 按括号配平截取 ——
 * 正则里的 `[^)]+` 会在 `javascript:alert(1)` 这类含括号目标上提前截断，
 * 残留的 `)` 漏进正文；同时它也无法表达 URL 里合法的成对括号（维基类链接很常见）。
 */
const INLINE_PATTERN =
  /(!?\[)([^\]]*)(\]\()|`([^`]+)`|\*\*([^*]+)\*\*|\*([^*]+)\*|__([^_]+)__|_([^_]+)_/g;

/**
 * 从 `](` 之后截取链接目标：`)` 收尾，但允许一层成对括号
 * （如维基的 `...Foo_(bar)`）。找不到收尾的 `)` 时返回 undefined，按纯文本处理。
 */
function linkTarget(source: string, start: number): { target: string; end: number } | undefined {
  let depth = 0;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (char === "(") depth += 1;
    else if (char === ")") {
      // 深度归零时的第一个 ) 才是真正的收尾。
      if (depth === 0) return { target: source.slice(start, index), end: index + 1 };
      depth -= 1;
    }
  }
  return undefined;
}

/** 行内节点里的纯文本，用于生成标题锚点与目录文字。 */
export function inlineText(nodes: readonly InlineNode[]): string {
  return nodes
    .map((node) => {
      switch (node.type) {
        case "text":
        case "code":
          return node.value;
        case "image":
          return node.alt;
        default:
          return inlineText(node.children);
      }
    })
    .join("");
}

export function parseInline(source: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  let cursor = 0;

  const pushText = (value: string) => {
    if (!value) return;
    const last = nodes[nodes.length - 1];
    if (last?.type === "text") last.value += value;
    else nodes.push({ type: "text", value });
  };

  for (const match of source.matchAll(INLINE_PATTERN)) {
    const [raw, open, label, linkOpen, code, strongStar, emStar, strongUnderscore, emUnderscore] = match;
    // `(!?\[)` 整个捕获的是开头标记，用它的首字符判断是不是图片语法。
    // 这里不能再靠单独的 `!` 捕获组 —— 它并不存在，误按位置取值会整体错位。
    // 只匹配到代码 / 强调时该组为 undefined，先判空再取首字符。
    const isImage = Boolean(open?.startsWith("!"));
    pushText(source.slice(cursor, match.index));
    cursor = match.index + raw.length;

    // 行内代码优先级最高：内容里的 * _ [] 都不是标记。
    if (code !== undefined) {
      nodes.push({ type: "code", value: code });
      continue;
    }

    if (linkOpen) {
      // 目标从 `](` 之后开始按括号配平截取，失败就整体当纯文本。
      const parsed = linkTarget(source, match.index + raw.length);
      if (!parsed) {
        pushText(raw);
        continue;
      }
      cursor = parsed.end;
      if (isImage) {
        const src = safeImageSrc(parsed.target);
        // 非法图片退回 alt 文本，绝不渲染成 <img src="javascript:...">。
        if (src) nodes.push({ type: "image", src, alt: label });
        else pushText(label);
      } else {
        const href = safeHref(parsed.target);
        // 目标非法时只保留标签文字。用 pushText 与相邻文字合并，
        // 否则一次降级会在正文里切出一条多余的文本边界。
        if (href) nodes.push({ type: "link", href, children: parseInline(label) });
        else pushText(label);
      }
      continue;
    }

    if (strongStar !== undefined || strongUnderscore !== undefined) {
      nodes.push({ type: "strong", children: parseInline(strongStar ?? strongUnderscore) });
    } else {
      nodes.push({ type: "em", children: parseInline(emStar ?? emUnderscore) });
    }
  }

  pushText(source.slice(cursor));
  return nodes;
}

const HEADING = /^(#{2,4})\s+(.*)$/;
const UNORDERED = /^[-*]\s+(.*)$/;
const ORDERED = /^\d+[.)]\s+(.*)$/;
const QUOTE = /^>\s?(.*)$/;
const RULE = /^(-{3,}|\*{3,}|_{3,})$/;
/** 表格分隔行，如 `| --- | :--- |`。至少要有一列，才算表格而不是普通段落。 */
const TABLE_DIVIDER = /^\|?[\s:|-]*-[\s:|-]*\|?$/;

function tableCells(line: string): string[] {
  return line.replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
}


/**
 * 没找到闭合标记时的围栏收尾位置：从 from 开始一直读到第一个空行为止。
 *
 * 只在「确实没有闭合标记」时调用 —— 那种情况下空行之后的正文本就该是段落，
 * 一路读到文末会把整篇剩余内容吞进代码块。
 */
function findLooseEnd(lines: string[], from: number): number {
  let i = from;
  while (i < lines.length && lines[i].trim()) i += 1;
  return i;
}
/** 从空行分隔的源码块里认出块级结构；未知的一律当段落，不丢内容。 */
function parseBlocks(source: string): BlockNode[] {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  const blocks: BlockNode[] = [];
  /** 标题序号，供锚点去重：两节同名「说明」要拿到不同 id。 */
  const seen = new Map<string, number>();
  let index = 0;

  const uniqueId = (text: string, level: number) => {
    const base = anchorSlug(text, `section-${level}`);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count ? `${base}-${count + 1}` : base;
  };

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (RULE.test(line.trim())) {
      blocks.push({ type: "rule" });
      index += 1;
      continue;
    }

    const heading = HEADING.exec(line);
    if (heading) {
      // 一级标题留给页面本身的标题层级，教程内从 h2 起。
      const level = Math.min(heading[1].length, 4) as 2 | 3 | 4;
      const children = parseInline(heading[2].trim());
      blocks.push({ type: "heading", level, children, id: uniqueId(inlineText(children), level) });
      index += 1;
      continue;
    }

    // 围栏代码块：内容整体原样，不解析行内标记。
    const fence = /^(`{3,}|~{3,})\s*(\S+)?\s*$/.exec(line);
    if (fence) {
      const marker = fence[1][0].repeat(3);
      const lang = fence[2];
      // 先找闭合标记。代码块**内部**允许空行（bash 分段、Python 多段都常见），
      // 所以只有确认后面没有闭合标记时，才用「遇空行收尾」兜底。
      // 反过来做（遇空行就 break）会让闭合围栏里空行之后的内容全部丢失，
      // 代码块凭空少一大截 —— 这是真实踩过的坑。
      let close = -1;
      for (let i = index + 1; i < lines.length; i += 1) {
        if (lines[i].trim().startsWith(marker)) {
          close = i;
          break;
        }
      }
      const end = close === -1 ? findLooseEnd(lines, index + 1) : close;
      const body = lines.slice(index + 1, end);
      index = close === -1 ? end : close + 1;
      blocks.push({ type: "code", value: body.join("\n"), ...(lang ? { lang } : {}) });
      continue;
    }

    if (QUOTE.test(line)) {
      const body: string[] = [];
      while (index < lines.length) {
        const quoted = QUOTE.exec(lines[index]);
        if (!quoted) break;
        body.push(quoted[1]);
        index += 1;
      }
      blocks.push({ type: "quote", children: parseBlocks(body.join("\n")) });
      continue;
    }

    const unordered = UNORDERED.exec(line);
    const ordered = ORDERED.exec(line);
    if (unordered || ordered) {
      const isOrdered = Boolean(ordered);
      const pattern = isOrdered ? ORDERED : UNORDERED;
      const items: InlineNode[][] = [];
      // 同型列表才算一项；列表里夹一段普通文字说明它结束了。
      while (index < lines.length) {
        const item = pattern.exec(lines[index]);
        if (!item) break;
        items.push(parseInline(item[1]));
        index += 1;
      }
      blocks.push({ type: "list", ordered: isOrdered, items });
      continue;
    }

    // 表格：当前行含 |，且下一行是分隔行，两者都成立才算。
    if (line.includes("|") && index + 1 < lines.length && TABLE_DIVIDER.test(lines[index + 1]) && lines[index + 1].includes("-")) {
      const head: InlineNode[][] = tableCells(line).map(parseInline);
      const rows: InlineNode[][][] = [];
      index += 2;
      while (index < lines.length && lines[index].includes("|") && lines[index].trim()) {
        rows.push(tableCells(lines[index]).map(parseInline));
        index += 1;
      }
      blocks.push({ type: "table", head, rows });
      continue;
    }

    // 段落吃到空行或下一个块级标记为止。
    const paragraph: string[] = [];
    while (index < lines.length && lines[index].trim()) {
      const current = lines[index];
      if (paragraph.length && (HEADING.test(current) || RULE.test(current.trim()) || QUOTE.test(current) || UNORDERED.test(current) || ORDERED.test(current) || current.includes("|"))) {
        break;
      }
      paragraph.push(current.trim());
      index += 1;
    }
    if (paragraph.length) blocks.push({ type: "paragraph", children: parseInline(paragraph.join("\n")) });
  }

  return blocks;
}

export function parseMarkdown(source: string): BlockNode[] {
  if (!source.trim()) return [];
  return parseBlocks(source);
}

export function markdownOutline(blocks: readonly BlockNode[]): Outline[] {
  const outline: Outline[] = [];
  for (const block of blocks) {
    // h4 是实现细节，不进目录。
    if (block.type !== "heading" || block.level === 4) continue;
    outline.push({ id: block.id, text: inlineText(block.children), level: block.level });
  }
  return outline;
}