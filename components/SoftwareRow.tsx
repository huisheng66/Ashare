import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { FeaturedMark } from "@/components/SoftwareCard";
import { PlatformList } from "@/components/PlatformList";
import { SoftwareIcon } from "@/components/SoftwareIcon";
import { SourceBadge } from "@/components/SourceBadge";
import type { CatalogItem } from "@/data/types";

/** 列表行：一行一个工具，适合快速扫读。 */
export function SoftwareRow({ item }: { item: CatalogItem }) {
  const price = item.price ?? "免费";
  return (
    <article className="group relative flex items-center gap-4 rounded-2xl border border-border bg-card px-4 py-3.5 transition-[border-color,box-shadow] duration-200 ease-(--ease-soft) hover:border-foreground/20 hover:shadow-lift has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-ring sm:px-5">
      <SoftwareIcon item={{ name: item.name, icon: item.icon, iconImage: item.iconImage }} size={44} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <h3 className="text-[15px] font-semibold leading-snug">
            <Link href={`/software/${item.slug}`} className="outline-none after:absolute after:inset-0 after:rounded-2xl">
              {item.name}
            </Link>
          </h3>
          <SourceBadge kind={item.source} />
          {item.featured ? <FeaturedMark /> : null}
        </div>
        <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{item.summary}</p>
        <p className="mt-1 text-xs text-muted-foreground sm:hidden">
          <PlatformList platforms={item.platforms} short /> · {price}
        </p>
      </div>
      <div className="hidden shrink-0 flex-col items-end gap-0.5 text-right sm:flex">
        <span className="text-[13px] font-medium">{price}</span>
        <PlatformList platforms={item.platforms} short />
      </div>
      <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-[translate,color] duration-200 group-hover:translate-x-0.5 group-hover:text-foreground" aria-hidden="true" />
    </article>
  );
}
