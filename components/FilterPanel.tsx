"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { SoftwareIcon } from "@/components/SoftwareIcon";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { scenes } from "@/data/scenes";
import type { CatalogCounts, Platform } from "@/data/types";
import { activeFilterCount, catalogFiltersFromURL, catalogHref, clearCatalogFilters } from "@/lib/catalog-query";
import { kindLabel, platformLabel } from "@/lib/items";

const platformMeta: {
  id: Platform;
  letter: string;
  simpleIcon?: string;
  color: string;
}[] = [
  { id: "windows", letter: "W", color: "#0078D4" },
  { id: "macos", letter: "M", simpleIcon: "apple", color: "#111111" },
  { id: "linux", letter: "L", simpleIcon: "linux", color: "#FCC624" },
];

function FilterRow({
  id,
  label,
  count,
  checked,
  onToggle,
  icon,
}: {
  id: string;
  label: string;
  count: number;
  checked: boolean;
  onToggle: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-11 items-center gap-2">
      <Checkbox id={id} checked={checked} onCheckedChange={onToggle} />
      <Label
        htmlFor={id}
        className="flex min-h-11 flex-1 cursor-pointer items-center gap-2 text-sm font-normal"
      >
        {icon}
        <span>{label}</span>
        <span className="ml-auto text-xs tabular-nums text-muted-foreground">{count}</span>
      </Label>
    </div>
  );
}

export function FilterPanel({
  counts,
  onDone,
}: {
  counts: CatalogCounts;
  onDone?: () => void;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const filters = catalogFiltersFromURL(sp);
  const { scenes: scenePicked, platforms: platformPicked, kinds: kindPicked, discountOnly } = filters;
  const dirty = activeFilterCount(filters) > 0;

  const push = (mutate: (p: URLSearchParams) => void) => {
    const p = new URLSearchParams(sp.toString());
    mutate(p);
    startTransition(() => router.push(catalogHref(p), { scroll: false }));
  };

  const toggleListParam = (key: string, picked: ReadonlySet<string>, id: string) =>
    push((p) => {
      const next = new Set(picked);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      if (next.size) p.set(key, [...next].join(","));
      else p.delete(key);
    });

  return (
    <fieldset disabled={isPending} aria-busy={isPending} className="min-w-0">
      <legend className="sr-only">目录筛选条件</legend>
      <div className="flex items-center justify-between border-b border-border pb-2">
        <h2 className="text-base font-semibold tracking-tight">分类</h2>
        <Button
          variant="ghost"
          size="sm"
          className="-mr-2 min-h-11 px-2 text-sm text-muted-foreground"
          disabled={!dirty || isPending}
          onClick={() => push(clearCatalogFilters)}
        >
          清除筛选
        </Button>
      </div>

      <div className="mt-3 flex min-h-11 items-center justify-between gap-2">
        <Label
          htmlFor="filter-discount"
          className="flex min-h-11 flex-1 cursor-pointer items-center text-sm font-medium text-discount"
        >
          只看优惠（{counts.discount}）
        </Label>
        <Switch
          id="filter-discount"
          checked={discountOnly}
          onCheckedChange={() =>
            push((p) => {
              if (discountOnly) p.delete("discount");
              else p.set("discount", "1");
            })
          }
        />
      </div>

      <h3 className="mb-1 mt-4 text-sm font-semibold text-muted-foreground">类型</h3>
      {(Object.keys(kindLabel) as (keyof typeof kindLabel)[]).map((id) => (
        <FilterRow
          key={id}
          id={`kind-${id}`}
          label={kindLabel[id]}
          count={counts.kinds[id]}
          checked={kindPicked.has(id)}
          onToggle={() => toggleListParam("kind", kindPicked, id)}
        />
      ))}

      <h3 className="mb-1 mt-4 text-sm font-semibold text-muted-foreground">使用场景</h3>
      <FilterRow
        id="scene-all"
        label="全部场景"
        count={counts.total}
        checked={scenePicked.size === 0}
        onToggle={() => push((p) => p.delete("scene"))}
      />
      {scenes.map((s) => (
        <FilterRow
          key={s.id}
          id={`scene-${s.id}`}
          label={s.name}
          count={counts.scenes[s.id]}
          checked={scenePicked.has(s.id)}
          onToggle={() => toggleListParam("scene", scenePicked, s.id)}
        />
      ))}

      <h3 className="mb-1 mt-4 text-sm font-semibold text-muted-foreground">平台</h3>
      {platformMeta.map((p) => (
        <FilterRow
          key={p.id}
          id={`platform-${p.id}`}
          label={platformLabel[p.id]}
          count={counts.platforms[p.id]}
          checked={platformPicked.has(p.id)}
          onToggle={() => toggleListParam("platform", platformPicked, p.id)}
          icon={
            <SoftwareIcon
              item={{
                name: platformLabel[p.id],
                icon: { letter: p.letter, color: p.color, simpleIcon: p.simpleIcon },
              }}
              size={16}
            />
          }
        />
      ))}
      {onDone ? (
        <div className="sticky bottom-0 mt-4 border-t border-border bg-popover pb-1 pt-4">
          <Button onClick={onDone} className="min-h-11 w-full" disabled={isPending}>
            {isPending ? "正在更新…" : "查看结果"}
          </Button>
        </div>
      ) : null}
    </fieldset>
  );
}
