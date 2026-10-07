"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { LayoutGrid, List, SearchX, SlidersHorizontal, X } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { FilterPanel } from "@/components/FilterPanel";
import { SoftwareCard } from "@/components/SoftwareCard";
import { SoftwareRow } from "@/components/SoftwareRow";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { sceneById } from "@/data/scenes";
import type { CatalogCounts, CatalogItem } from "@/data/types";
import { activeFilterCount, catalogFiltersFromURL, catalogHref, clearCatalogFilters } from "@/lib/catalog-query";
import { kindLabel, platformLabel } from "@/lib/items";

/** 网格 / 列表切换：分段控件，状态写在 URL 里。 */
export function ViewSwitch({
  view,
  gridHref,
  listHref,
}: {
  view: "grid" | "list";
  gridHref: string;
  listHref: string;
}) {
  const item = (active: boolean) =>
    `inline-flex size-9 items-center justify-center rounded-lg transition-colors pointer-coarse:size-11 ${active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`;
  return (
    <div role="group" aria-label="目录视图" className="inline-flex rounded-xl bg-muted p-1">
      <Link href={gridHref} scroll={false} aria-label="网格视图" aria-current={view === "grid" ? "true" : undefined} className={item(view === "grid")}>
        <LayoutGrid className="size-4" />
      </Link>
      <Link href={listHref} scroll={false} aria-label="列表视图" aria-current={view === "list" ? "true" : undefined} className={item(view === "list")}>
        <List className="size-4" />
      </Link>
    </div>
  );
}

export function CatalogBrowser({
  items,
  total,
  counts,
  page = 1,
  pageCount = 1,
}: {
  items: CatalogItem[];
  total: number;
  counts: CatalogCounts;
  page?: number;
  pageCount?: number;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const filters = catalogFiltersFromURL(sp);
  const filterCount = activeFilterCount(filters);
  const view = sp.get("view") === "list" ? "list" : "grid";

  // 分页链接要保住 page；其余改动（筛选、排序、视图）都应回到第 1 页。
  const withParams = (mutate: (p: URLSearchParams) => void, keepPage = false) => {
    const p = new URLSearchParams(sp.toString());
    mutate(p);
    if (!keepPage) p.delete("page");
    return catalogHref(p);
  };
  const pageHref = (target: number) =>
    withParams((p) => {
      if (target <= 1) p.delete("page");
      else p.set("page", String(target));
    }, true);
  const resetHref = withParams(clearCatalogFilters);
  const selected = [
    ...[...filters.scenes].map((id) => ({ key: "scene", id, label: sceneById[id].name, picked: filters.scenes })),
    ...[...filters.platforms].map((id) => ({ key: "platform", id, label: platformLabel[id], picked: filters.platforms })),
    ...[...filters.kinds].map((id) => ({ key: "kind", id, label: kindLabel[id], picked: filters.kinds })),
  ];

  const chip = "inline-flex h-8 items-center gap-1 rounded-full bg-primary pl-3 pr-2 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-85 pointer-coarse:h-11";

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[14.5rem_minmax(0,1fr)] lg:gap-10">
      <aside aria-label="筛选" className="hidden lg:block">
        <div className="sticky top-24 max-h-[calc(100dvh-7rem)] overflow-y-auto overscroll-contain pb-6 pr-1">
          <FilterPanel counts={counts} />
        </div>
      </aside>

      <section aria-label="工具列表" aria-busy={isPending} className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="lg:hidden">
                <SlidersHorizontal />
                筛选
                {filterCount ? (
                  <span className="grid size-5 place-items-center rounded-full bg-primary font-mono text-[11px] text-primary-foreground">{filterCount}</span>
                ) : null}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[min(340px,100%)] gap-0 overflow-y-auto p-5 pb-0">
              <SheetHeader className="px-0 pt-1 pb-4">
                <SheetTitle>筛选工具</SheetTitle>
                <SheetDescription>类型、场景和平台可以组合选择。</SheetDescription>
              </SheetHeader>
              <FilterPanel counts={counts} resultCount={total} onDone={() => setFiltersOpen(false)} />
            </SheetContent>
          </Sheet>

          <p className="text-sm text-muted-foreground" role="status">
            {filterCount ? (
              <>
                找到 <span className="font-semibold text-foreground tabular-nums">{items.length}</span> 款，共 {total} 款
              </>
            ) : (
              <>
                共 <span className="font-semibold text-foreground tabular-nums">{total}</span> 款
              </>
            )}
          </p>

          <div className="ml-auto flex items-center gap-2">
            <Select
              value={filters.sort}
              disabled={isPending}
              onValueChange={(value) =>
                startTransition(() =>
                  router.push(
                    withParams((p) => {
                      if (value === "featured") p.delete("sort");
                      else p.set("sort", value);
                    }),
                    { scroll: false },
                  ),
                )
              }
            >
              <SelectTrigger size="sm" className="w-[7.5rem] border-border" aria-label="排序方式">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="end">
                <SelectItem value="featured">精选优先</SelectItem>
                <SelectItem value="updated">最近更新</SelectItem>
                <SelectItem value="name">按名称</SelectItem>
              </SelectContent>
            </Select>
            <ViewSwitch
              view={view}
              gridHref={withParams((p) => p.delete("view"))}
              listHref={withParams((p) => p.set("view", "list"))}
            />
          </div>
        </div>

        {filterCount ? (
          <ul className="mt-4 flex flex-wrap items-center gap-2" aria-label="已选条件">
            {selected.map(({ key, id, label, picked }) => (
              <li key={`${key}-${id}`}>
                <Link
                  href={withParams((p) => {
                    const remaining = [...picked].filter((value) => value !== id);
                    if (remaining.length) p.set(key, remaining.join(","));
                    else p.delete(key);
                  })}
                  scroll={false}
                  aria-label={`移除条件：${label}`}
                  className={chip}
                >
                  {label}
                  <X className="size-3.5 opacity-70" aria-hidden="true" />
                </Link>
              </li>
            ))}
            {filters.discountOnly ? (
              <li>
                <Link href={withParams((p) => p.delete("discount"))} scroll={false} aria-label="移除条件：只看优惠" className={chip}>
                  只看优惠
                  <X className="size-3.5 opacity-70" aria-hidden="true" />
                </Link>
              </li>
            ) : null}
            <li>
              <Link href={resetHref} scroll={false} className="inline-flex h-8 items-center px-2 text-xs text-muted-foreground ink-link pointer-coarse:h-11">
                清除全部
              </Link>
            </li>
          </ul>
        ) : null}

        <div className={`mt-5 transition-opacity duration-150 ${isPending ? "opacity-60" : ""}`}>
          {items.length ? (
            view === "grid" ? (
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => (
                  <li key={item.slug} className="flex *:flex-1">
                    <SoftwareCard item={item} />
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {items.map((item) => (
                  <li key={item.slug}>
                    <SoftwareRow item={item} />
                  </li>
                ))}
              </ul>
            )
          ) : (
            <EmptyState
              icon={SearchX}
              title={filterCount ? "没有符合这些条件的工具" : "目录正在整理"}
              actions={
                <Button asChild variant="outline">
                  <Link href={filterCount ? resetHref : "/submit"} scroll={false}>
                    {filterCount ? "清除筛选" : "推荐一款工具"}
                  </Link>
                </Button>
              }
            >
              {filterCount ? "去掉一两个条件试试，或清除筛选重新浏览。" : "可以推荐你正在用的工具，帮我们把目录补全。"}
            </EmptyState>
          )}
        </div>

        {pageCount > 1 ? (
          <nav aria-label="分页" className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {page > 1 ? (
              <Button asChild variant="outline" size="sm">
                <Link href={pageHref(page - 1)} scroll={false} rel="prev">
                  上一页
                </Link>
              </Button>
            ) : null}
            <span className="text-sm text-muted-foreground tabular-nums" role="status">
              第 {page} / {pageCount} 页
            </span>
            {page < pageCount ? (
              <Button asChild variant="outline" size="sm">
                <Link href={pageHref(page + 1)} scroll={false} rel="next">
                  下一页
                </Link>
              </Button>
            ) : null}
          </nav>
        ) : null}
      </section>
    </div>
  );
}
