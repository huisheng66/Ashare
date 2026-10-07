import Image from "next/image";
import { FileText, Globe, ImageIcon, Link2, NotebookText } from "lucide-react";

import { SectionHeading } from "@/components/SectionHeading";
import type { Guide, GuideResourceKind } from "@/data/types";
import { markdownOutline, parseInline, parseMarkdown, type BlockNode, type InlineNode } from "@/lib/markdown";

/**
 * 详细教程区块：目录 + Markdown 正文 + 配套资源。
 *
 * Markdown 一律经 `parseMarkdown` 解析成 AST 后用 React 节点渲染，
 * 全程不碰 `dangerouslySetInnerHTML`（原因见 lib/markdown.ts）。
 */

/** 资源图标。区分形态是为了让读者一眼看出「点开是新标签的 PDF」还是「站内的插图」。 */
const KIND_ICON: Record<GuideResourceKind, typeof FileText> = {
  markdown: NotebookText,
  pdf: FileText,
  html: Globe,
  image: ImageIcon,
  link: Link2,
};

const KIND_TONE: Record<GuideResourceKind, string> = {
  markdown: "text-official",
  pdf: "text-destructive",
  html: "text-opensource",
  image: "text-brand",
  link: "text-muted-foreground",
};

/** 站内锚点跳转。教程页可能很长，目录要能精确落到小节。 */
function AnchorLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="rounded transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      {children}
    </a>
  );
}

/** 站外链接一律新标签 + noopener noreferrer nofollow，与 OutboundLink 同一口径。 */
function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  const internal = href.startsWith("/");
  if (internal) return <AnchorLink href={href}>{children}</AnchorLink>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer nofollow" className="underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground">
      {children}
      <span className="sr-only">（在新标签页打开）</span>
    </a>
  );
}

function Inline({ nodes }: { nodes: readonly InlineNode[] }) {
  return (
    <>
      {nodes.map((node, index) => {
        switch (node.type) {
          case "text":
            return <span key={index}>{node.value}</span>;
          case "code":
            return (
              <code key={index} className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[13px]">
                {node.value}
              </code>
            );
          case "strong":
            return (
              <strong key={index} className="font-semibold">
                <Inline nodes={node.children} />
              </strong>
            );
          case "em":
            return (
              <em key={index}>
                <Inline nodes={node.children} />
              </em>
            );
          case "link":
            return (
              <ExternalLink key={index} href={node.href}>
                <Inline nodes={node.children} />
              </ExternalLink>
            );
          case "image":
            // 只渲染站内上传图（外链图在解析阶段就被丢弃了）。
            return (
              <Image
                key={index}
                src={node.src}
                alt={node.alt}
                width={1200}
                height={800}
                sizes="(max-width: 1024px) 90vw, 640px"
                className="my-4 h-auto w-full rounded-2xl border border-border"
              />
            );
          default:
            return null;
        }
      })}
    </>
  );
}

const HEADING_CLASS = {
  2: "mt-8 text-[19px] font-bold",
  3: "mt-6 text-[17px] font-semibold",
  4: "mt-5 text-[15px] font-semibold",
} as const;

function Block({ block }: { block: BlockNode }) {
  switch (block.type) {
    case "heading": {
      const Tag = `h${block.level}` as "h2" | "h3" | "h4";
      return (
        <Tag id={block.id} className={`scroll-mt-24 leading-snug ${HEADING_CLASS[block.level]}`}>
          <Inline nodes={block.children} />
        </Tag>
      );
    }
    case "paragraph":
      return (
        <p className="mt-4 leading-[1.85] first:mt-0">
          <Inline nodes={block.children} />
        </p>
      );
    case "list":
      return block.ordered ? (
        <ol className="mt-4 space-y-2 pl-5 [counter-reset:item]">
          {block.items.map((item, index) => (
            // 序号用 CSS counter 自动生成，避免手写数字与列表内容错位。
            <li key={index} className="relative leading-[1.75] before:absolute before:-left-5 before:font-mono before:text-[13px] before:text-muted-foreground before:content-[counter(item)]">
              <Inline nodes={item} />
            </li>
          ))}
        </ol>
      ) : (
        <ul className="mt-4 space-y-2">
          {block.items.map((item, index) => (
            <li key={index} className="flex gap-2.5 leading-[1.75]">
              <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-border" aria-hidden="true" />
              <span className="min-w-0">
                <Inline nodes={item} />
              </span>
            </li>
          ))}
        </ul>
      );
    case "code":
      return (
        <pre className="mt-4 overflow-x-auto rounded-2xl border border-border bg-muted p-4 text-[13px] leading-relaxed">
          {block.lang ? <span className="mb-2 block font-mono text-[11px] text-muted-foreground">{block.lang}</span> : null}
          <code className="font-mono">{block.value}</code>
        </pre>
      );
    case "quote":
      return (
        <blockquote className="mt-4 border-l-2 border-border pl-4 text-muted-foreground">
          {block.children.map((child, index) => (
            <Block key={index} block={child} />
          ))}
        </blockquote>
      );
    case "table":
      return (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full border-collapse text-[14px]">
            <thead>
              <tr className="border-b border-border bg-muted/60">
                {block.head.map((cell, index) => (
                  <th key={index} className="px-3.5 py-2.5 text-left font-semibold whitespace-nowrap">
                    <Inline nodes={cell} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, index) => (
                <tr key={index} className="border-b border-border last:border-0">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-3.5 py-2.5 align-top leading-relaxed">
                      <Inline nodes={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "rule":
      return <hr className="mt-6 border-border" />;
    default:
      return null;
  }
}

/** 资源行内的一句说明，用行内解析以支持强调与链接。 */
function Note({ note }: { note: string }) {
  return (
    <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
      <Inline nodes={parseInline(note)} />
    </p>
  );
}

export function GuideSection({ guide }: { guide: Guide }) {
  const blocks = guide.markdown?.trim() ? parseMarkdown(guide.markdown) : [];
  const outline = markdownOutline(blocks);
  const resources = guide.resources ?? [];

  return (
    <section aria-labelledby="guide-title">
      <SectionHeading
        id="guide-title"
        title="详细教程"
        description="上手步骤之外的具体做法：常见场景怎么配、命令怎么写、报错怎么处理。"
      />

      {/* 目录在宽屏下与导语并排：两者都是短文本，
          上下堆叠会在左侧留出一条空白带，而这块空白换成目录刚好互补。 */}
      {guide.intro || (outline.length > 2) ? (
        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_260px] xl:gap-x-12">
          {guide.intro ? (
            <p className="text-[15px] leading-[1.85] text-muted-foreground xl:max-w-[42em]">{guide.intro}</p>
          ) : null}

          {/* 两节以下不占版面做目录，读者滑过去比点目录快。 */}
          {outline.length > 2 ? (
            <nav aria-label="教程目录" className="rounded-2xl border border-border bg-card p-4 xl:order-2">
              <p className="text-xs font-medium text-muted-foreground">目录</p>
              <ol className="mt-2.5 space-y-1.5">
                {outline.map((entry) => (
                  <li key={entry.id} className={entry.level === 3 ? "pl-4" : ""}>
                    <AnchorLink href={`#${entry.id}`}>
                      <span className="text-[14px] leading-relaxed">{entry.text}</span>
                    </AnchorLink>
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}
        </div>
      ) : null}

      {/* 教程正文保持单栏：里面有代码块、表格与步骤清单，
          拆成两栏会让代码和它对应的说明文字分到不同栏，比窄栏更难读。
          行宽 46em（约 46 个汉字）略高于正文上限，换来的是代码不折行、
          表格列不被挤——这里选择保结构完整，让出的空间给上面的目录区。 */}
      {blocks.length ? (
        <div className="mt-6 max-w-[52em]">
          {blocks.map((block, index) => (
            <Block key={index} block={block} />
          ))}
        </div>
      ) : null}

      {resources.length ? (
        <>
          <h3 className="mt-9 text-sm font-semibold">配套资料</h3>
          <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {resources.map((resource) => {
              const Icon = KIND_ICON[resource.kind];
              const internal = resource.url.startsWith("/");
              const body = (
                <>
                  <span
                    className={`grid size-8 shrink-0 place-items-center rounded-xl bg-muted ${KIND_TONE[resource.kind]}`}
                    aria-hidden="true"
                  >
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">
                      <span className="mr-1.5 text-xs text-muted-foreground">{GUIDE_KIND_TEXT[resource.kind]}</span>
                      {resource.title}
                    </span>
                    {resource.note ? <Note note={resource.note} /> : null}
                    {/* 域名等宽显示：读者要能一眼看出会跳到哪，与详情页获取卡的约定一致。 */}
                    <span className="mt-1.5 block truncate font-mono text-xs text-muted-foreground">
                      {hostOfGuideUrl(resource.url)}
                    </span>
                  </span>
                </>
              );
              return (
                <li key={`${resource.kind}-${resource.url}`} className="flex *:flex-1">
                  {internal ? (
                    <a
                      href={resource.url}
                      className="flex w-full gap-3.5 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-foreground/30 hover:bg-muted/40"
                    >
                      {body}
                    </a>
                  ) : (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="flex w-full gap-3.5 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-foreground/30 hover:bg-muted/40"
                    >
                      {body}
                      <span className="sr-only">（在新标签页打开）</span>
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      ) : null}
    </section>
  );
}

/** 资源类型的中文短标签，卡片上直接显示。 */
const GUIDE_KIND_TEXT: Record<GuideResourceKind, string> = {
  markdown: "Markdown",
  pdf: "PDF",
  html: "网页",
  image: "插图",
  link: "链接",
};

function hostOfGuideUrl(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}