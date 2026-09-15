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
import { SoftwareCard } from "@/components/SoftwareCard";
import { SoftwareRow } from "@/components/SoftwareRow";
import { Button } from "@/components/ui/button";
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
import type { CatalogCounts, Software } from "@/data/types";

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
            <Button variant="outline" size="sm">
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
            <SoftwareCard key={item.slug} item={item} />
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