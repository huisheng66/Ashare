import { Sparkles } from "lucide-react";

import { AppCardRow } from "@/components/AppCard";
import { CatalogBrowser } from "@/components/CatalogBrowser";
import { HotSearchBar } from "@/components/HotSearchBar";
import { SearchPanel } from "@/components/SearchPanel";
import { allPublished, catalogCounts } from "@/lib/catalog";
import { parseCatalogFilters, selectCatalogItems, type PageSearchParams } from "@/lib/catalog-query";
import { toCatalogItem } from "@/lib/items";
import { absoluteSiteUrl } from "@/lib/site";

export const metadata = {
  title: "探索 · Ashare",
  alternates: { canonical: absoluteSiteUrl("/") },
};

type Props = {
  searchParams: Promise<PageSearchParams>;
};

export default async function HomePage({ searchParams }: Props) {
  const filters = parseCatalogFilters(await searchParams);
  const [all, counts] = await Promise.all([allPublished(), catalogCounts()]);
  const shown = selectCatalogItems(all, filters).map(toCatalogItem);
  const featured = all.filter((item) => item.featured).map(toCatalogItem);

  return (
    <div className="w-full px-5 py-8 sm:px-8">
      <section aria-labelledby="home-hero" className="hero-glow -mx-5 -mt-8 px-5 pb-10 pt-12 sm:-mx-8 sm:px-8 sm:pt-16">
        <p className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-[13px] font-medium text-primary">
          已收录 {counts.total} 款工具
        </p>
        <h1 id="home-hero" className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
          找到<span className="text-primary">趁手</span>的工具
        </h1>
        <p className="mt-4 max-w-lg text-[15px] leading-7 text-muted-foreground">
          按用途、平台和来源，找到适合你的软件。
        </p>
        <SearchPanel />
        <div className="mt-5"><HotSearchBar /></div>
      </section>
      {featured.length ? (
        <section className="mt-10">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" aria-hidden="true" />
            <h2 className="text-xl font-bold tracking-tight">编辑精选</h2>
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">值得优先试试的几款</p>
          <AppCardRow className="scroll-row-fade mt-4" items={featured} />
        </section>
      ) : null}
      <CatalogBrowser items={shown} total={counts.total} counts={counts} />
    </div>
  );
}
