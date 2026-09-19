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
      <h1 className="text-3xl font-bold tracking-tight">找到趁手的工具</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        按用途、平台和来源，找到适合你的软件。
      </p>
      <SearchPanel />
      <div className="mt-4"><HotSearchBar /></div>
      {featured.length ? (
        <section className="mt-8">
          <h2 className="text-xl font-bold tracking-tight">编辑精选</h2>
          <AppCardRow className="mt-4" items={featured} />
        </section>
      ) : null}
      <CatalogBrowser items={shown} total={counts.total} counts={counts} />
    </div>
  );
}
