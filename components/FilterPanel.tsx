"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SoftwareIcon } from "@/components/SoftwareIcon";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { scenes } from "@/data/scenes";
import type { CatalogCounts, Platform } from "@/data/types";
import { kindLabel, platformLabel } from "@/lib/items";

const platformMeta: {
  id: Platform;
  letter: string;
  simpleIcon?: string;
  color: string;
}[] = [
  // simple-icons 已下架 Windows 图标，回退字母 W
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
    <div className="flex h-8 items-center gap-2">
      <Checkbox id={id} checked={checked} onCheckedChange={onToggle} />
      <Label
        htmlFor={id}
        className="flex flex-1 cursor-pointer items-center gap-2 text-[13px] font-normal"
      >
        {icon}
        <span>{label}</span>
        <span
          className={`ml-auto text-[12px] ${
            checked ? "text-foreground" : "text-muted-foreground"
          }`}
        >
          {count}
        </span>
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

  const scenePicked = new Set(
    (sp.get("scene") ?? "").split(",").filter(Boolean),
  );
  const platformPicked = new Set(
    (sp.get("platform") ?? "").split(",").filter(Boolean),
  );
  const kindPicked = new Set(
    (sp.get("kind") ?? "").split(",").filter(Boolean),
  );
  const discountOnly = sp.get("discount") === "1";
  const dirty =
    scenePicked.size > 0 ||
    platformPicked.size > 0 ||
    kindPicked.size > 0 ||
    discountOnly;

  const push = (mutate: (p: URLSearchParams) => void) => {
    const p = new URLSearchParams(sp.toString());
    mutate(p);
    const qs = p.toString();
    router.push(qs ? `/?${qs}` : "/");
    onDone?.();
  };

  const toggleListParam = (key: string, picked: Set<string>, id: string) =>
    push((p) => {
      const next = new Set(picked);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      if (next.size) {
        p.set(key, [...next].join(","));
      } else {
        p.delete(key);
      }
    });

  return (
    <div>
      <div className="flex items-center justify-between border-b border-border pb-2">
        <h2 className="text-base font-semibold tracking-tight">分类</h2>
        {dirty ? (
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="-mr-2 h-7 px-2 text-[13px] text-muted-foreground"
          >
            <Link href="/">清除</Link>
          </Button>
        ) : (
          <span className="px-2 text-[13px] text-muted-foreground opacity-40">
            清除
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <Label
          htmlFor="filter-discount"
          className="cursor-pointer text-[13px] font-medium text-discount"
        >
          折扣（{counts.discount}）
        </Label>
        <Switch
          id="filter-discount"
          checked={discountOnly}
          onCheckedChange={() =>
            push((p) => {
              if (discountOnly) {
                p.delete("discount");
              } else {
                p.set("discount", "1");
              }
            })
          }
          aria-label="只看有优惠的软件"
        />
      </div>

      <h3 className="mb-1 mt-4 text-[13px] font-semibold text-muted-foreground">
        类型
      </h3>
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

      <h3 className="mb-1 mt-4 text-[13px] font-semibold text-muted-foreground">
        场景功能
      </h3>
      <FilterRow
        id="scene-all"
        label="全部"
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

      <h3 className="mb-1 mt-4 text-[13px] font-semibold text-muted-foreground">
        平台
      </h3>
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
                icon: {
                  letter: p.letter,
                  color: p.color,
                  simpleIcon: p.simpleIcon,
                },
              }}
              size={16}
            />
          }
        />
      ))}
    </div>
  );
}