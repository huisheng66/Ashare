"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { TicketPercent } from "lucide-react";

import { SceneIcon } from "@/components/SceneIcon";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { scenes } from "@/data/scenes";
import type { CatalogCounts } from "@/data/types";
import { activeFilterCount, catalogFiltersFromURL, catalogHref, clearCatalogFilters, kindIds, platformIds } from "@/lib/catalog-query";
import { kindLabel, platformLabel } from "@/lib/items";

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
    <div className="-mx-2 flex min-h-10 items-center gap-3 rounded-lg px-2 transition-colors hover:bg-muted pointer-coarse:min-h-11">
      <Checkbox id={id} checked={checked} onCheckedChange={onToggle} />
      <Label htmlFor={id} className="flex min-h-10 flex-1 cursor-pointer items-center gap-2.5 text-sm font-normal leading-none">
        {icon}
        <span className={checked ? "font-medium" : undefined}>{label}</span>
        <span className="ml-auto font-mono text-xs text-muted-foreground tabular-nums">{count}</span>
      </Label>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border pt-4">
      <h3 className="mb-1.5 text-xs font-medium text-muted-foreground">{title}</h3>
      {children}
    </div>
  );
}

export function FilterPanel({
  counts,
  resultCount,
  onDone,
}: {
  counts: CatalogCounts;
  resultCount?: number;
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
      <div className="flex min-h-8 items-center justify-between">
        <h2 className="text-sm font-semibold">筛选</h2>
        <button
          type="button"
          className="-mr-1 rounded-md px-1 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40 pointer-coarse:min-h-11"
          disabled={!dirty || isPending}
          onClick={() => push(clearCatalogFilters)}
        >
          清除全部
        </button>
      </div>

      <div className="mt-3 mb-4 flex min-h-11 items-center justify-between gap-3 rounded-xl border border-border bg-card px-3">
        <Label htmlFor="filter-discount" className="flex min-h-11 flex-1 cursor-pointer items-center gap-2 text-sm font-normal">
          <TicketPercent className="size-4 text-discount" aria-hidden="true" />
          只看优惠
          <span className="font-mono text-xs text-muted-foreground tabular-nums">{counts.discount}</span>
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

      <div className="space-y-4">
        <FilterGroup title="类型">
          {kindIds.map((id) => (
            <FilterRow
              key={id}
              id={`kind-${id}`}
              label={kindLabel[id]}
              count={counts.kinds[id]}
              checked={kindPicked.has(id)}
              onToggle={() => toggleListParam("kind", kindPicked, id)}
            />
          ))}
        </FilterGroup>

        <FilterGroup title="场景">
          {scenes
            .filter((s) => counts.scenes[s.id] > 0 || scenePicked.has(s.id))
            .map((s) => (
              <FilterRow
                key={s.id}
                id={`scene-${s.id}`}
                label={s.name}
                count={counts.scenes[s.id]}
                checked={scenePicked.has(s.id)}
                onToggle={() => toggleListParam("scene", scenePicked, s.id)}
                icon={<SceneIcon id={s.id} size={22} />}
              />
            ))}
        </FilterGroup>

        <FilterGroup title="平台">
          {platformIds.map((id) => (
            <FilterRow
              key={id}
              id={`platform-${id}`}
              label={platformLabel[id]}
              count={counts.platforms[id]}
              checked={platformPicked.has(id)}
              onToggle={() => toggleListParam("platform", platformPicked, id)}
            />
          ))}
        </FilterGroup>
      </div>

      {onDone ? (
        <div className="sticky bottom-0 -mx-5 mt-6 border-t border-border bg-popover px-5 pb-5 pt-4">
          <Button onClick={onDone} size="lg" className="w-full" disabled={isPending}>
            {isPending ? "正在更新…" : resultCount === undefined ? "查看结果" : `查看 ${resultCount} 个结果`}
          </Button>
        </div>
      ) : null}
    </fieldset>
  );
}
