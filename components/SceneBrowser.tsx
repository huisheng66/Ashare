"use client";

import { useMemo, useState } from "react";
import { LayoutGrid, List } from "lucide-react";

import { SoftwareCard } from "@/components/SoftwareCard";
import { SoftwareRow } from "@/components/SoftwareRow";
import { Button } from "@/components/ui/button";
import type { Platform, Software } from "@/data/types";
import { filterSoftware } from "@/lib/items";

const platforms: { id: Platform | "all"; label: string }[] = [
  { id: "all", label: "全部系统" },
  { id: "windows", label: "Windows" },
  { id: "macos", label: "macOS" },
  { id: "linux", label: "Linux" },
];

export function SceneBrowser({ items }: { items: Software[] }) {
  const [platform, setPlatform] = useState<Platform | "all">("all");
  const [view, setView] = useState<"grid" | "row">("row");
  const visible = useMemo(
    () => filterSoftware(items, { platform }),
    [items, platform],
  );

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant={view === "grid" ? "default" : "outline"}
            size="icon-sm"
            aria-label="九宫格"
            aria-pressed={view === "grid"}
            onClick={() => setView("grid")}
          >
            <LayoutGrid className="size-4" />
          </Button>
          <Button
            type="button"
            variant={view === "row" ? "default" : "outline"}
            size="icon-sm"
            aria-label="行排列"
            aria-pressed={view === "row"}
            onClick={() => setView("row")}
          >
            <List className="size-4" />
          </Button>
        </div>
        <FilterGroup
          legend="系统"
          value={platform}
          options={platforms}
          onChange={setPlatform}
        />
      </div>

      <p className="mt-4 text-[12px] text-muted-foreground">
        {visible.length} 个软件
      </p>

      {visible.length ? (
        view === "grid" ? (
          <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-5">
            {visible.map((item) => (
              <SoftwareCard key={item.slug} item={item} />
            ))}
          </div>
        ) : (
          <div className="mt-1 space-y-2">
            {visible.map((item) => (
              <SoftwareRow key={item.slug} item={item} />
            ))}
          </div>
        )
      ) : (
        <p className="mt-6 text-[15px] text-muted-foreground">
          这个组合下没有条目。试试放宽系统和来源。
        </p>
      )}
    </div>
  );
}

function FilterGroup<T extends string>({
  legend,
  value,
  options,
  onChange,
}: {
  legend: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="min-w-0">
      <legend className="sr-only">{legend}</legend>
      <div className="inline-flex rounded-full bg-muted p-1">
        {options.map((option) => {
          const active = option.id === value;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
              className={`h-7 rounded-full px-3.5 text-[13px] font-medium transition-colors ${
                active
                  ? "bg-background text-foreground shadow-card"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}