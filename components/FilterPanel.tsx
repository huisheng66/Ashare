"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
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

/**
 * 外壳：把内部组件按 URL 签名重挂。
 *
 * 这样「乐观勾选」不用手动清理 —— URL 一变（无论来自push 还是浏览器前进/后退）
 * key 就变，组件整个重挂，本地暂存随之丢弃，天然回到以 URL 为唯一事实源。
 * 比在 effect 里 setState({}) 干净：那个写法会多渲染一轮，lint 也会拦。
 */
export function FilterPanel(props: {
  counts: CatalogCounts;
  resultCount?: number;
  onDone?: () => void;
}) {
  const signature = useSearchParams().toString();
  return <FilterPanelBody key={signature} {...props} />;
}

function FilterPanelBody({
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
    // 改了筛选，原来的页码可能已越界（第 3 页只剩 1 页），统一回到第 1 页。
    p.delete("page");
    startTransition(() => router.push(catalogHref(p), { scroll: false }));
  };

  /**
   * 勾选的乐观值：**只在 URL 追上之前有效**，随后由外层重挂丢弃。
   *
   * 为什么需要：受控 checkbox 的 checked 来自 URL，而服务端重算要几百毫秒 ——
   * 等它回来才变化，用户点了之后界面纹丝不动，像没点上。
   *
   * 为什么必须丢弃而不留着：留着会和真实状态不一致。特别地，浏览器前进/后退
   * 会改 URL 而不经过本组件的 push，那之后勾选会显示错的。所以本组件以 URL 签名
   * 为 key（见上面的外壳），URL 一变就整个重挂，本地暂存随之消失。
   */
  const [optimistic, setOptimistic] = useState<Record<string, boolean>>({});

  const isChecked = (key: string, id: string, fromUrl: boolean) =>
    optimistic[`${key}:${id}`] ?? fromUrl;

  const toggleListParam = (key: string, picked: ReadonlySet<string>, id: string) => {
    const next = new Set(picked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    // 立刻打勾：不等这次请求回来。
    setOptimistic((prev) => ({ ...prev, [`${key}:${id}`]: next.has(id) }));
    push((p) => {
      if (next.size) p.set(key, [...next].join(","));
      else p.delete(key);
    });
  };

  return (
    // **不要在 pending 时禁用整个 fieldset**：服务端重算要几百毫秒（2 万条时聚合约 318ms），
    // 禁掉的话用户在这段时间里连点第二个条件都点不动 —— 而且界面不给任何解释，
    // 看起来像卡住了。这里只做视觉提示，不阻塞交互：
    // 连点产生多次导航由 React 的 transition 自动合并，startTransition 也支持打断重排。
    <fieldset aria-busy={isPending} className="min-w-0">
      <legend className="sr-only">目录筛选条件</legend>
      <div className="flex min-h-8 items-center justify-between">
        <h2 className="text-sm font-semibold">筛选</h2>
        <button
          type="button"
          className="-mr-1 rounded-md px-1 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40 pointer-coarse:min-h-11"
          disabled={!dirty}
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
          checked={isChecked("discount", "only", discountOnly)}
          onCheckedChange={(next) => {
            setOptimistic((prev) => ({ ...prev, "discount:only": next }));
            push((p) => {
              if (next) p.set("discount", "1");
              else p.delete("discount");
            });
          }}
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
              checked={isChecked("kind", id, kindPicked.has(id))}
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
                checked={isChecked("scene", s.id, scenePicked.has(s.id))}
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
              checked={isChecked("platform", id, platformPicked.has(id))}
              onToggle={() => toggleListParam("platform", platformPicked, id)}
            />
          ))}
        </FilterGroup>
      </div>

      {onDone ? (
        <div className="sticky bottom-0 -mx-5 mt-6 border-t border-border bg-popover px-5 pb-5 pt-4">
          {/* 不禁用：抽屉里等结果的几百毫秒，用户想直接收起就走，不该被拦。
              按钮文案给出「在算」的反馈，而不是让人对着一个点不动的按钮猜。 */}
          <Button onClick={onDone} size="lg" className="w-full">
            {isPending ? "正在更新…" : resultCount === undefined ? "查看结果" : `查看 ${resultCount} 个结果`}
          </Button>
        </div>
      ) : null}
    </fieldset>
  );
}
