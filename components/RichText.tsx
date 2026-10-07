import { parseInline } from "@/lib/inlineText";

/**
 * 正文里的最小行内 Markdown 渲染。
 *
 * 只负责把 lib/inlineText 解析出的片段变成元素，规则本身都在那边 ——
 * 那边能被 node --test 直接测，这个组件保持得薄。
 *
 * 不用 dangerouslySetInnerHTML：所有内容都作为 React 文本节点输出，
 * 数据里混进 HTML 也只会显示为文字，不会变成标签。
 */
export function RichText({ text }: { text: string }) {
  const parts = parseInline(text);
  if (parts.length === 1 && parts[0].kind === "text") return text;

  return parts.map((part, index) => {
    if (part.kind === "strong") {
      return (
        <strong key={index} className="font-semibold text-foreground">
          {part.value}
        </strong>
      );
    }
    if (part.kind === "code") {
      return (
        <code
          key={index}
          className="rounded bg-muted px-1 py-0.5 font-mono text-[13px] text-foreground"
        >
          {part.value}
        </code>
      );
    }
    return part.value;
  });
}