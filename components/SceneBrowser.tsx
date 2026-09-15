"use client";

import { useMemo, useState } from "react";
import { SoftwareRow } from "@/components/SoftwareRow";
import type { Platform, Software, SourceKind } from "@/data/types";
import { filterSoftware } from "@/lib/items";

const platforms: { id: Platform | "all"; label: string }[] = [
  { id: "all", label: "全部系统" },
  { id: "windows", label: "Windows" },
  { id: "macos", label: "macOS" },
  { id: "linux", label: "Linux" },
];

const sources: { id: SourceKind | "all"; label: string }[] = [
  { id: "all", label: "全部来源" },
  { id: "opensource", label: "开源" },
  { id: "official", label: "官方" },
  { id: "discount", label: "优惠" },
];

export function SceneBrowser({ items }: { items: Software[] }) {
  const [platform, setPlatform] = useState<Platform | "all">("all");
  const [source, setSource] = useState<SourceKind | "all">("all");
  const visible = useMemo(
    () => filterSoftware(items, { platform, source }),
    [items, platform, source],
  );

  return (
    <div className="mt-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <FilterGroup
          legend="系统"
          value={platform}
          options={platforms}
          onChange={setPlatform}
        />
        <FilterGroup
          legend="来源"
          value={source}
          options={sources}
          onChange={setSource}
        />
      </div>
      <p className="mt-4 text-[12px] text-muted-foreground">{visible.length} 个软件</p>
      {visible.length ? (
        <div className="mt-1 space-y-2">
          {visible.map((item) => (
            <SoftwareRow key={item.slug} item={item} />
          ))}
        </div>
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
