import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { SceneChips } from "@/components/SceneGrid";
import { SearchPanel } from "@/components/SearchPanel";
import { Eyebrow } from "@/components/SectionHeading";
import { SoftwareCard } from "@/components/SoftwareCard";
import { Button } from "@/components/ui/button";
import { sceneById } from "@/data/scenes";
import type { SceneId } from "@/data/types";
import { catalogCounts, searchCatalog, searchFacets } from "@/lib/catalog";
import { parseCatalogFilters, parseCatalogPage, searchQueryParam, type PageSearchParams } from "@/lib/catalog-query";
import { highlightTermsOf } from "@/lib/highlight";
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

/**
 * 场景筛选条。只做场景，不做平台 ——
 * 实测平台分布几乎没有区分度（图片：linux 33 / macos 27 / windows 27），
 * 加一排「Windows 27」的按钮只会占地方。场景的差异才是真实的（photo 20 / code 7）。
 *
 * 计数来自筛选前的全量（searchFacets 不带 filters），所以切换场景时每个 chip 的数字不变，
 * 用户能看见「其他场景还有多少」，也就能切回去。
 */
function SceneFilterBar({
  query,
  scenes,
  active,
  total,
}: {
  query: string;
  scenes: { id: SceneId; count: number }[];
  active: SceneId[];
  total: number;
}) {
  const href = (sceneId?: SceneId) => {
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    if (sceneId) next.set("scene", sceneId);
    const search = next.toString();
    return search ? "/search?" + search : "/search";
  };

  const chip = (on: boolean) =>
    "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] transition-colors pointer-coarse:h-10 " +
    (on
      ? "border-foreground bg-foreground text-background"
      : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground");

  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5" role="group" aria-label="按场景筛选">
      <Link href={href()} className={chip(active.length === 0)} aria-current={active.length === 0 ? "true" : undefined}>
        全部
        <span className="tabular-nums opacity-70">{total}</span>
      </Link>
      {scenes.map((scene) => {
        const on = active.includes(scene.id);
        return (
          <Link
            key={scene.id}
            href={href(scene.id)}
            className={chip(on)}
            aria-current={on ? "true" : undefined}
          >
            {sceneById[scene.id]?.name ?? scene.id}
            <span className="tabular-nums opacity-70">{scene.count}</span>
          </Link>
        );
      })}
    </div>
  );
}

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = searchQueryParam(params.q);
  // 只取场景：搜索页不做平台/类型筛选（那属于目录浏览的语义）。
  const activeScenes = [...parseCatalogFilters(params).scenes];
  // 三次查询并发：结果、筛选分布、目录总量。facets 刻意不带 filters（见 searchFacets 注释）。
  const [results, facets, counts] = await Promise.all([
    searchCatalog(query, parseCatalogPage(params), { scenes: activeScenes }),
    searchFacets(query),
    catalogCounts(),
  ]);
  // 拼写纠正后，结果里出现的是纠正词本身，用原词高亮一个也标不中。
  const terms = highlightTermsOf(results.corrected ?? query);

  const pageHref = (target: number) => {
    const next = new URLSearchParams();
    if (query) next.set("q", query);
    if (activeScenes.length === 1) next.set("scene", activeScenes[0]);
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
                {results.corrected ? (
                  <span className="ml-1">
                    （没有「{query}」的结果，已按「{results.corrected}」搜索 ——{" "}
                    <Link href={`/search?q=${encodeURIComponent(query)}`} className="underline underline-offset-2">
                      仍搜原词
                    </Link>
                    ）
                  </span>
                ) : results.fuzzy ? (
                  <span className="ml-1">（严格匹配没有结果，以下是放宽后的相近项）</span>
                ) : null}
              </>
            ) : (
              "没有找到匹配的工具"
            )}
          </p>
          {/*
            筛选条只在「有结果且确实能分流」时出现：facets.scenes.length > 1 意味着
            结果至少落在两个场景里，只有一个场景时整条筛选没有意义，白白多一行。
          */}
          {facets.scenes.length > 1 ? (
            <SceneFilterBar query={query} scenes={facets.scenes} active={activeScenes} total={facets.total} />
          ) : null}
          {results.total ? (
            <>
              <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {results.items.map((item) => (
                  <li key={item.slug} className="flex *:flex-1">
                    <SoftwareCard item={item} headingLevel={2} highlightTerms={terms} />
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
                用更短的名称或常用别名，或者直接写要做的事。也支持拼音和首字母——比如输入{" "}
                <span className="font-medium text-foreground">tupian</span> 或{" "}
                <span className="font-medium text-foreground">tp</span> 找「图片」类工具。没收录的工具，也欢迎推荐给我们。
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
