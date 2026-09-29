"use client";

import { useMemo, useState } from "react";
import { LayoutGrid, List, MonitorX } from "lucide-react";

import { EmptyState } from "@/components/EmptyState";
import { SoftwareCard } from "@/components/SoftwareCard";
import { SoftwareRow } from "@/components/SoftwareRow";
import { Button } from "@/components/ui/button";
import type { CatalogItem, Platform } from "@/data/types";
import { filterSoftware } from "@/lib/items";

const platforms: { id: Platform | "all"; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "windows", label: "Windows" },
  { id: "macos", label: "macOS" },
  { id: "linux", label: "Linux" },
];

const segment = (active: boolean) =>
  `inline-flex h-8 items-center justify-center rounded-lg px-3 text-[13px] font-medium transition-colors pointer-coarse:h-11 ${
    active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
  }`;

/** 场景页列表：平台分段 + 视图切换，默认列表视图。 */
export function SceneBrowser({ items }: { items: CatalogItem[] }) {
  const [platform, setPlatform] = useState<Platform | "all">("all");
  const [view, setView] = useState<"grid" | "list">("list");
  const visible = useMemo(() => filterSoftware(items, { platform }), [items, platform]);

  return (
    <section aria-label="工具列表" className="mt-8">
      <div className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="按系统筛选" className="inline-flex rounded-xl bg-muted p-1">
          {platforms.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={option.id === platform}
              onClick={() => setPlatform(option.id)}
              className={segment(option.id === platform)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <p className="text-sm text-muted-foreground" role="status">
          <span className="font-semibold text-foreground tabular-nums">{visible.length}</span> 款
        </p>

        <div role="group" aria-label="视图" className="ml-auto inline-flex rounded-xl bg-muted p-1">
          <button
            type="button"
            aria-label="网格视图"
            aria-pressed={view === "grid"}
            onClick={() => setView("grid")}
            className={`${segment(view === "grid")} w-9 px-0 pointer-coarse:w-11`}
          >
            <LayoutGrid className="size-4" />
          </button>
          <button
            type="button"
            aria-label="列表视图"
            aria-pressed={view === "list"}
            onClick={() => setView("list")}
            className={`${segment(view === "list")} w-9 px-0 pointer-coarse:w-11`}
          >
            <List className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-5">
        {visible.length ? (
          view === "grid" ? (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((item) => (
                <li key={item.slug} className="flex *:flex-1">
                  <SoftwareCard item={item} />
                </li>
              ))}
            </ul>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {visible.map((item) => (
                <li key={item.slug}>
                  <SoftwareRow item={item} />
                </li>
              ))}
            </ul>
          )
        ) : (
          <EmptyState
            icon={MonitorX}
            title="这个系统上暂时没有"
            actions={
              <Button variant="outline" onClick={() => setPlatform("all")}>
                看全部系统
              </Button>
            }
          >
            这个场景里还没有支持该系统的工具，可以先看看其他系统的选项。
          </EmptyState>
        )}
      </div>
    </section>
  );
}
