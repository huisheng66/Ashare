import type { Metadata } from "next";
import Link from "next/link";
import { SearchPanel } from "@/components/SearchPanel";
import { SearchResultCard } from "@/components/SearchResultCard";
import { Button } from "@/components/ui/button";
import { scenes } from "@/data/scenes";
import { allPublished } from "@/lib/catalog";
import { searchQueryParam, type PageSearchParams } from "@/lib/catalog-query";
import { searchSoftware } from "@/lib/items";

export const metadata: Metadata = {
  title: "搜索",
  robots: { index: false, follow: true },
};

type Props = {
  searchParams: Promise<PageSearchParams>;
};

export default async function SearchPage({ searchParams }: Props) {
  const query = searchQueryParam((await searchParams).q);
  const results = query ? searchSoftware(query, await allPublished()) : [];

  return (
    <div className="w-full px-5 py-8 sm:px-8">
      <h1 className="text-3xl font-bold tracking-tight">搜索</h1>
      <SearchPanel initialQuery={query} />
      {query ? (
        <section className="mt-8" aria-labelledby="search-results-title">
          <h2 id="search-results-title" className="break-words text-lg font-semibold tracking-tight">
            「{query}」的搜索结果
          </h2>
          <p className="mt-2 text-sm text-muted-foreground" role="status">
            找到 {results.length} 个工具
          </p>
          {results.length ? (
            <div className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-5">
              {results.map((item) => (
                <SearchResultCard key={item.slug} item={item} />
              ))}
            </div>
          ) : (
            <div className="mt-6 max-w-prose rounded-xl bg-muted p-6">
              <p className="text-sm leading-6 text-muted-foreground">
                暂时没有匹配的工具。试试更短的名称、常用别名，或描述你想完成的事。
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild variant="outline" className="min-h-11">
                  <Link href="/">浏览全部工具</Link>
                </Button>
                <Button asChild variant="ghost" className="min-h-11">
                  <Link href="/submit">提交工具推荐</Link>
                </Button>
              </div>
            </div>
          )}
        </section>
      ) : (
        <div className="mt-10">
          <p className="text-sm text-muted-foreground">按名称搜索，或从使用场景开始</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {["VS Code", "Zotero", "JASP", "Blender", "LibreOffice", "KiCad"].map(
              (term) => (
                <Link
                  key={term}
                  href={`/search?q=${encodeURIComponent(term)}`}
                  className="inline-flex min-h-11 items-center rounded-lg bg-muted px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                  {term}
                </Link>
              ),
            )}
          </div>
          <div className="mt-6 flex flex-wrap gap-x-4 gap-y-1">
            {scenes.map((scene) => (
              <Link
                key={scene.id}
                href={`/scenes/${scene.id}`}
                className="inline-flex min-h-11 items-center text-sm font-medium text-primary"
              >
                {scene.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
