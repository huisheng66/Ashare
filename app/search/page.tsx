import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { SceneChips } from "@/components/SceneGrid";
import { SearchPanel } from "@/components/SearchPanel";
import { Eyebrow } from "@/components/SectionHeading";
import { SoftwareCard } from "@/components/SoftwareCard";
import { Button } from "@/components/ui/button";
import { catalogCounts, searchCatalog } from "@/lib/catalog";
import { parseCatalogPage, searchQueryParam, type PageSearchParams } from "@/lib/catalog-query";
import { nameSuggestions, taskSuggestions } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "搜索",
  robots: { index: false, follow: true },
};

type Props = {
  searchParams: Promise<PageSearchParams>;
};

function TermList({ label, terms }: { label: string; terms: string[] }) {
  return (
    <div>
      <h3 className="text-xs font-medium text-muted-foreground">{label}</h3>
      <ul className="mt-2.5 flex flex-wrap gap-1.5">
        {terms.map((term) => (
          <li key={term}>
            <Link
              href={`/search?q=${encodeURIComponent(term)}`}
              className="inline-flex h-9 items-center rounded-full border border-border bg-card px-3.5 text-[13px] transition-colors hover:border-foreground/30 pointer-coarse:h-11"
            >
              {term}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = searchQueryParam(params.q);
  // 搜索与分页都下推：不再把整份目录读进内存再打分。
  const [results, counts] = await Promise.all([searchCatalog(query, parseCatalogPage(params)), catalogCounts()]);

  const pageHref = (target: number) => {
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    if (target > 1) next.set("page", String(target));
    const search = next.toString();
    return search ? "/search?" + search : "/search";
  };

  return (
    <div className="shell pb-20 pt-10 sm:pt-14">
      <div className="max-w-2xl">
        <Eyebrow>搜索</Eyebrow>
        <h1 className={`mt-3 break-words text-[28px] font-bold leading-tight tracking-[-0.015em] sm:text-4xl ${query ? "-indent-[0.5em]" : ""}`}>
          {query ? `「${query}」` : "搜索工具"}
        </h1>
        {query ? null : (
          <p className="mt-2 text-[15px] text-muted-foreground">
            输入软件名称、别名，或者你要做的事，比如「论文」「修图」。
          </p>
        )}
        <SearchPanel initialQuery={query} className="mt-6" />
      </div>

      {query ? (
        <section aria-label="搜索结果" className="mt-10">
          <p className="border-b border-border pb-4 text-sm text-muted-foreground" role="status">
            {results.total ? (
              <>
                找到 <span className="font-semibold text-foreground tabular-nums">{results.total}</span> 款，按相关度排列
              </>
            ) : (
              "没有找到匹配的工具"
            )}
          </p>
          {results.total ? (
            <>
              <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {results.items.map((item) => (
                  <li key={item.slug} className="flex *:flex-1">
                    <SoftwareCard item={item} headingLevel={2} />
                  </li>
                ))}
              </ul>
              {results.pageCount > 1 ? (
                <nav aria-label="搜索结果分页" className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  {results.page > 1 ? (
                    <Button asChild variant="outline" size="sm">
                      <Link href={pageHref(results.page - 1)} rel="prev">
                        上一页
                      </Link>
                    </Button>
                  ) : null}
                  <span className="text-sm text-muted-foreground tabular-nums" role="status">
                    第 {results.page} / {results.pageCount} 页
                  </span>
                  {results.page < results.pageCount ? (
                    <Button asChild variant="outline" size="sm">
                      <Link href={pageHref(results.page + 1)} rel="next">
                        下一页
                      </Link>
                    </Button>
                  ) : null}
                </nav>
              ) : null}
            </>
          ) : (
            <div className="mt-6 space-y-10">
              <EmptyState
                icon={SearchX}
                title="换个说法试试"
                actions={
                  <>
                    <Button asChild variant="outline">
                      <Link href="/#catalog">浏览全部工具</Link>
                    </Button>
                    <Button asChild variant="ghost">
                      <Link href="/submit">推荐一款工具</Link>
                    </Button>
                  </>
                }
              >
                用更短的名称或常用别名，或者直接写要做的事。没收录的工具，也欢迎推荐给我们。
              </EmptyState>
              <TermList label="大家常搜" terms={taskSuggestions} />
            </div>
          )}
        </section>
      ) : (
        <div className="mt-12 space-y-12">
          <section aria-labelledby="terms-title" className="space-y-6">
            <h2 id="terms-title" className="sr-only">
              搜索建议
            </h2>
            <TermList label="按要做的事" terms={taskSuggestions} />
            <TermList label="按软件名" terms={nameSuggestions} />
          </section>
          <section aria-labelledby="scene-chips-title">
            <h2 id="scene-chips-title" className="text-lg font-semibold">
              或者从场景开始
            </h2>
            <div className="mt-4">
              <SceneChips counts={counts} />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
