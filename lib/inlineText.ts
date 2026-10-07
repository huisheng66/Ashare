/**
 * 正文里的最小行内 Markdown：**粗体** 与 `行内代码`。
 *
 * 单独拆出来而不是留在组件里，原因有两个：
 * 1. 项目测试跑在 `node --test` 上，它不做 JSX 转译，
 *    直接 import .tsx 会报 ERR_UNKNOWN_FILE_EXTENSION。逻辑放这里就能被测。
 * 2. 解析规则需要被断言（尤其是「落单标记不吞半截」这种边界），
 *    混在 JSX 里就只能靠肉眼看。
 *
 * 为什么需要这套规则：body 在数据层是**纯文本**
 * （tests/seed.test.mjs 明确禁止 `##` 标题），不经Markdown 解析器。
 * 但实际内容里有 17 个条目按写作习惯写了 `**强调**`，
 * 页面上会原样吐出两个星号 —— 强调意图是真实内容，不该靠删掉来修。
 *
 * 为什么不上完整Markdown 渲染器：那等于把 body 变成受信任 HTML 的入口 ——
 * 链接、列表、代码块全进来，就得配套处理转义、嵌套、危险协议。
 * 收益远小于风险。实际用到的只有加粗和行内代码两种，就只实现这两种。
 */

export type InlinePart =
  | { kind: "text"; value: string }
  | { kind: "strong"; value: string }
  | { kind: "code"; value: string };

/** 只认成对的 ** 与 `，且不跨行 —— 跨行匹配会吞掉整段正文。 */
const INLINE_PATTERN = /(\*\*[^*\n]+\*\*|`[^`\n]+`)/g;

/**
 * 把一行文本拆成「纯文本 / 粗体 / 行内代码」三类片段。
 *
 * 关键是用带捕获组的 split 而不是连续replace：
 * split 一次遍历就切好，片段之间互不干扰。
 * 若先替换再匹配，被替换出来的字符会被下一条规则二次处理（串扰）。
 *
 * 落单的标记走「不匹配」这条路，原样留在 text 片段里 ——
 * 作者少写一个星号时，不能把后面的正文一起吞掉。
 */
export function parseInline(text: string): InlinePart[] {
  const parts = text.split(INLINE_PATTERN).filter((p) => p !== "");
  return parts.map((part): InlinePart => {
    if (part.length > 4 && part.startsWith("**") && part.endsWith("**")) {
      return { kind: "strong", value: part.slice(2, -2) };
    }
    if (part.length > 2 && part.startsWith("`") && part.endsWith("`")) {
      return { kind: "code", value: part.slice(1, -1) };
    }
    return { kind: "text", value: part };
  });
}

/** 把片段拼回纯文本，用于 JSON-LD 等需要字符串的场合。 */
export function inlineToPlainText(text: string): string {
  return parseInline(text)
    .map((p) => p.value)
    .join("");
}