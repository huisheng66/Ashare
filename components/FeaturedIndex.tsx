import Link from "next/link";
import { ArrowDown, Sparkle } from "lucide-react";

import { SoftwareIcon } from "@/components/SoftwareIcon";
import { SourceBadge } from "@/components/SourceBadge";
import type { CatalogItem } from "@/data/types";

/** 首页右栏：编辑精选索引卡，编号 + 图标 + 一句话。 */
export function FeaturedIndex({ items, total }: { items: CatalogItem[]; total: number }) {
  if (!items.length) return null;
  return (
    <section aria-labelledby="featured-title" className="rounded-3xl border border-border bg-card p-2 shadow-lift">
      <div className="flex items-center justify-between gap-3 px-4 pb-2 pt-3">
        <h2 id="featured-title" className="inline-flex items-center gap-2 text-sm font-semibold">
          <Sparkle className="size-3.5 fill-brand text-brand" aria-hidden="true" />
          编辑精选
        </h2>
        {total > items.length ? (
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            {items.length} / {total}
          </span>
        ) : null}
      </div>
      <ol>
        {items.map((item, index) => (
          <li key={item.slug} className="border-t border-border first:border-t-0">
            <Link
              href={`/software/${item.slug}`}
              className="group flex items-center gap-3.5 rounded-2xl px-3 py-3 transition-colors hover:bg-muted"
            >
              <span className="w-5 shrink-0 font-mono text-xs text-muted-foreground tabular-nums" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <SoftwareIcon item={{ name: item.name, icon: item.icon, iconImage: item.iconImage }} size={36} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{item.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{item.summary}</span>
              </span>
              <SourceBadge kind={item.source} plain className="hidden sm:inline-flex" />
            </Link>
          </li>
        ))}
      </ol>
      <Link
        href="#catalog"
        className="mt-1 flex min-h-11 items-center justify-center gap-1.5 rounded-2xl text-[13px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        看全部工具
        <ArrowDown className="size-3.5" aria-hidden="true" />
      </Link>
    </section>
  );
}
