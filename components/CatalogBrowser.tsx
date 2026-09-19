"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowUpDown, LayoutGrid, List, SlidersHorizontal, X } from "lucide-react";

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

export function CatalogBrowser({
  items,
  total,
  counts,
}: {
  items: CatalogItem[];
  total: number;
  counts: CatalogCounts;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const filters = catalogFiltersFromURL(sp);
  const filterCount = activeFilterCount(filters);
  const view = sp.get("view") === "list" ? "list" : "grid";

  const withParams = (mutate: (p: URLSearchParams) => void) => {
    const p = new URLSearchParams(sp.toString());
    mutate(p);
    return catalogHref(p);
  };
  const resetHref = withParams(clearCatalogFilters);
  const selected = [
    ...[...filters.scenes].map((id) => ({ key: "scene", id, label: sceneById[id].name, picked: filters.scenes })),
    ...[...filters.platforms].map((id) => ({ key: "platform", id, label: platformLabel[id], picked: filters.platforms })),
    ...[...filters.kinds].map((id) => ({ key: "kind", id, label: kindLabel[id], picked: filters.kinds })),
  ];

  return (
    <section className="mt-6" aria-label="工具目录" aria-busy={isPending}>
      <div className="flex flex-wrap items-center gap-2">
        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="min-h-11">
              <SlidersHorizontal className="size-4" />
              筛选{filterCount ? ` (${filterCount})` : ""}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[min(340px,100%)] overflow-y-auto p-5">
            <SheetHeader className="px-0">
              <SheetTitle>筛选工具</SheetTitle>
              <SheetDescription>可组合选择类型、场景和平台。</SheetDescription>
            </SheetHeader>
            <div className="mt-4">
              <FilterPanel counts={counts} onDone={() => setFiltersOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-1" role="group" aria-label="目录视图">
          <Button asChild variant={view === "grid" ? "default" : "outline"} size="icon" className="size-11">
            <Link href={withParams((p) => p.delete("view"))} scroll={false} aria-label="网格视图" aria-current={view === "grid" ? "true" : undefined}>
              <LayoutGrid className="size-4" />
            </Link>
          </Button>
          <Button asChild variant={view === "list" ? "default" : "outline"} size="icon" className="size-11">
            <Link href={withParams((p) => p.set("view", "list"))} scroll={false} aria-label="列表视图" aria-current={view === "list" ? "true" : undefined}>
              <List className="size-4" />
            </Link>
          </Button>
        </div>

        <p className="order-last w-full text-sm text-muted-foreground sm:order-none sm:ml-auto sm:w-auto" role="status">
          {filterCount ? `找到 ${items.length} 个工具，共 ${total} 个` : `共 ${total} 个工具`}
        </p>

        <Select
          value={filters.sort}
          disabled={isPending}
          onValueChange={(value) =>
            startTransition(() => router.push(withParams((p) => {
              if (value === "featured") p.delete("sort");
              else p.set("sort", value);
            }), { scroll: false }))
          }
        >
          <SelectTrigger className="ml-auto min-h-11 w-[140px] sm:ml-0" aria-label="工具排序">
            <ArrowUpDown className="size-3.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="featured">推荐</SelectItem>
            <SelectItem value="updated">最近更新</SelectItem>
            <SelectItem value="name">按名称</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filterCount ? (
        <div className="mt-3 flex flex-wrap items-center gap-2" aria-label="已选筛选条件">
          {selected.map(({ key, id, label, picked }) => (
            <Button key={`${key}-${id}`} asChild variant="secondary" size="sm" className="min-h-11">
              <Link href={withParams((p) => {
                const remaining = [...picked].filter((value) => value !== id);
                if (remaining.length) p.set(key, remaining.join(","));
                else p.delete(key);
              })} scroll={false} aria-label={`移除筛选：${label}`}>
                {label}<X className="size-3" aria-hidden="true" />
              </Link>
            </Button>
          ))}
          {filters.discountOnly ? (
            <Button asChild variant="secondary" size="sm" className="min-h-11">
              <Link href={withParams((p) => p.delete("discount"))} scroll={false} aria-label="移除筛选：只看优惠">
                只看优惠<X className="size-3" aria-hidden="true" />
              </Link>
            </Button>
          ) : null}
          <Button asChild variant="ghost" size="sm" className="min-h-11 text-muted-foreground">
            <Link href={resetHref} scroll={false}>清除筛选</Link>
          </Button>
        </div>
      ) : null}

      {items.length ? (
        view === "grid" ? (
          <div className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-5">
            {items.map((item) => <SoftwareCard key={item.slug} item={item} />)}
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {items.map((item) => <SoftwareRow key={item.slug} item={item} />)}
          </div>
        )
      ) : (
        <div className="my-12 rounded-xl bg-muted px-5 py-10 text-center">
          <h2 className="font-semibold">{filterCount ? "没有符合这些条件的工具" : "工具目录正在整理"}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {filterCount ? "移除部分条件，或清除筛选重新浏览。" : "可以提交你正在使用的工具，帮助完善目录。"}
          </p>
          <Button asChild variant="outline" className="mt-5 min-h-11">
            <Link href={filterCount ? resetHref : "/submit"} scroll={false}>
              {filterCount ? "清除筛选" : "提交工具推荐"}
            </Link>
          </Button>
        </div>
      )}
    </section>
  );
}
