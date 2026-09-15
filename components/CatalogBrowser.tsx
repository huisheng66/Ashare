"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  ArrowUpDown,
  LayoutGrid,
  List,
  SlidersHorizontal,
} from "lucide-react";

import { FilterPanel } from "@/components/FilterPanel";
import { NavIcon } from "@/components/SidebarIcons";
import { SoftwareIcon } from "@/components/SoftwareIcon";
import { SoftwareRow } from "@/components/SoftwareRow";
import { SourceBadge } from "@/components/SourceBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { scenes } from "@/data/scenes";
import type { CatalogCounts, Software } from "@/data/types";
import { sceneColors } from "@/lib/colors";
import { kindLabel, primaryLink } from "@/lib/items";

function CatalogCard({ item }: { item: Software }) {
  const primary = primaryLink(item);

  return (
    <Card className="group gap-0 overflow-hidden py-0 transition-shadow duration-200 hover:shadow-card-hover">
      <Link
        href={`/software/${item.slug}`}
        className="relative block aspect-[16/10] overflow-hidden"
      >
        {item.previews[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.previews[0]}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
            <SoftwareIcon item={item} size={64} />
          </div>
        )}
        {item.featured ? (
          <Badge className="absolute left-3 top-3">NEW</Badge>
        ) : null}
      </Link>

      <CardContent className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {item.scenes.slice(0, 2).map((sid) => (
            <span
              key={sid}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
            >
              <NavIcon id={sid} color={sceneColors[sid]} className="size-3" />
              {scenes.find((s) => s.id === sid)?.name}
            </span>
          ))}
          <SourceBadge kind={item.source} />
        </div>

        <Link
          href={`/software/${item.slug}`}
          className="mt-2 line-clamp-2 text-base font-semibold leading-snug transition-colors hover:text-primary"
        >
          {item.name}
        </Link>
        <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-muted-foreground">
          {item.summary}
        </p>
        {item.tags.length ? (
          <p className="mt-1.5 truncate text-[11px] text-muted-foreground">
            {kindLabel[item.kind]}
            {item.tags.slice(0, 3).map((tag) => ` · ${tag}`)}
          </p>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <span
            className="truncate text-base font-bold leading-6"
            title={item.price ?? "免费"}
          >
            {item.price ?? "免费"}
          </span>
          {primary.url ? (
            <Button asChild size="sm">
              <a href={primary.url} target="_blank" rel="noopener noreferrer">
                前往
              </a>
            </Button>
          ) : (
            <Button asChild size="sm" variant="secondary">
              <Link href={`/software/${item.slug}`}>详情</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function CatalogBrowser({
  items,
  total,
  counts,
}: {
  items: Software[];
  total: number;
  counts: CatalogCounts;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const view = sp.get("view") === "list" ? "list" : "grid";
  const sort = ["updated", "name"].includes(sp.get("sort") ?? "")
    ? (sp.get("sort") as "updated" | "name")
    : "featured";

  const withParams = (mutate: (p: URLSearchParams) => void) => {
    const p = new URLSearchParams(sp.toString());
    mutate(p);
    const qs = p.toString();
    return qs ? `/?${qs}` : "/";
  };

  return (
    <section className="mt-6">
      <div className="flex flex-wrap items-center gap-2">
        <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="lg:hidden">
              <SlidersHorizontal className="size-4" />
              筛选
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] overflow-y-auto p-5">
            <SheetHeader className="px-0">
              <SheetTitle>筛选</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <FilterPanel
                counts={counts}
                onDone={() => setFiltersOpen(false)}
              />
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-1">
          <Button
            asChild
            variant={view === "grid" ? "default" : "outline"}
            size="icon-sm"
            aria-label="网格视图"
          >
            <Link href={withParams((p) => p.delete("view"))}>
              <LayoutGrid className="size-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant={view === "list" ? "default" : "outline"}
            size="icon-sm"
            aria-label="列表视图"
          >
            <Link href={withParams((p) => p.set("view", "list"))}>
              <List className="size-4" />
            </Link>
          </Button>
        </div>

        <p className="ml-auto text-[13px] text-muted-foreground">
          共 {total} 个软件，当前显示 {items.length} 个
        </p>

        <Select
          value={sort}
          onValueChange={(value) =>
            router.push(
              withParams((p) => {
                if (value === "featured") {
                  p.delete("sort");
                } else {
                  p.set("sort", value);
                }
              }),
            )
          }
        >
          <SelectTrigger size="sm" className="w-[132px]">
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

      {view === "grid" ? (
        <div className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5">
          {items.map((item) => (
            <CatalogCard key={item.slug} item={item} />
          ))}
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {items.map((item) => (
            <SoftwareRow key={item.slug} item={item} />
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <p className="mt-16 text-center text-sm text-muted-foreground">
          没有符合筛选条件的软件，试试放宽选项。
        </p>
      ) : null}
    </section>
  );
}
