import Link from "next/link";
import { Sparkle } from "lucide-react";

import { PlatformList } from "@/components/PlatformList";
import { SoftwareIcon } from "@/components/SoftwareIcon";
import { SourceBadge } from "@/components/SourceBadge";
import { sceneById } from "@/data/scenes";
import { highlight } from "@/lib/highlight";
import type { CatalogItem } from "@/data/types";

/**
 * 把命中词包成 <mark>。用结构化片段渲染，**不用 dangerouslySetInnerHTML** ——
 * 条目文本来自后台录入与投稿，不是可信 HTML。不传 terms 时原样输出。
 */
function Marked({ text, terms }: { text: string; terms?: string[] }) {
  if (!terms?.length) return <>{text}</>;
  return (
    <>
      {highlight(text, terms).map((segment, index) =>
        segment.hit ? (
          <mark key={index} className="rounded-sm bg-brand/15 text-foreground">
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        ),
      )}
    </>
  );
}

/** 标签优先，没有标签时用场景名，给卡片一行「它是干什么的」。 */
export function cardSubtitle(item: CatalogItem): string {
  const words = item.tags.length ? item.tags.slice(0, 3) : item.scenes.map((id) => sceneById[id]?.name).filter(Boolean);
  return words.join(" · ");
}

export function FeaturedMark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 text-xs font-medium text-brand ${className}`}>
      <Sparkle className="size-3 fill-current" aria-hidden="true" />
      精选
    </span>
  );
}

/**
 * 网格卡片：目录、搜索、同类替代共用。整卡可点，标题链接铺满卡片。
 *
 * `highlightTerms` 只有搜索页传 —— 目录页与同类替代没有查询词，传了就只是多点开销。
 */
export function SoftwareCard({
  item,
  headingLevel = 3,
  highlightTerms,
}: {
  item: CatalogItem;
  headingLevel?: 2 | 3;
  highlightTerms?: string[];
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <article className="group relative flex min-w-0 flex-col rounded-2xl border border-border bg-card p-5 transition-[translate,box-shadow,border-color] duration-200 ease-(--ease-soft) hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-lift has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-ring">
      <div className="flex items-start gap-3.5">
        <SoftwareIcon item={{ name: item.name, icon: item.icon, iconImage: item.iconImage }} size={48} />
        <div className="min-w-0 flex-1 pt-0.5">
          <Heading className="text-base font-semibold leading-snug">
            <Link href={`/software/${item.slug}`} className="outline-none after:absolute after:inset-0 after:rounded-2xl">
              <Marked text={item.name} terms={highlightTerms} />
            </Link>
          </Heading>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{cardSubtitle(item)}</p>
        </div>
        {item.featured ? <FeaturedMark className="mt-1" /> : null}
      </div>
      <p className="mt-4 mb-5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
        <Marked text={item.summary} terms={highlightTerms} />
      </p>
      <div className="mt-auto flex items-center gap-2.5 border-t border-border pt-4">
        <SourceBadge kind={item.source} />
        <PlatformList platforms={item.platforms} short className="min-w-0 truncate" />
        <span className="ml-auto max-w-[45%] truncate text-[13px] font-medium" title={item.price ?? "免费"}>
          {item.price ?? "免费"}
        </span>
      </div>
    </article>
  );
}
