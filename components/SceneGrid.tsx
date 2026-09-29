import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";

import { SceneIcon } from "@/components/SceneIcon";
import { scenes } from "@/data/scenes";
import type { CatalogCounts } from "@/data/types";

/** 首页「按场景找」：有内容的场景用贴纸卡，筹备中的场景合成一张虚线卡。 */
export function SceneGrid({ counts }: { counts: CatalogCounts }) {
  const ready = scenes.filter((scene) => counts.scenes[scene.id] > 0);
  const pending = scenes.filter((scene) => !counts.scenes[scene.id]);

  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {ready.map((scene) => (
        <li key={scene.id}>
          <Link
            href={`/scenes/${scene.id}`}
            className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 transition-[translate,box-shadow,border-color] duration-200 ease-(--ease-soft) hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-lift"
          >
            <span className="flex items-start justify-between gap-3">
              <SceneIcon id={scene.id} size={40} />
              <span className="font-mono text-xs text-muted-foreground tabular-nums">{counts.scenes[scene.id]} 款</span>
            </span>
            <span className="mt-4 flex items-center gap-1.5 text-base font-semibold">
              {scene.name}
              <ArrowRight className="size-3.5 text-muted-foreground opacity-0 transition-[opacity,translate] duration-200 group-hover:translate-x-0.5 group-hover:opacity-100" aria-hidden="true" />
            </span>
            <span className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">{scene.description}</span>
          </Link>
        </li>
      ))}
      {pending.length ? (
        <li>
          <div className="flex h-full flex-col rounded-2xl border border-dashed border-border p-5">
            <span className="text-xs font-medium text-muted-foreground">筹备中</span>
            <span className="mt-3 flex flex-wrap gap-1.5">
              {pending.map((scene) => (
                <Link
                  key={scene.id}
                  href={`/scenes/${scene.id}`}
                  className="inline-flex h-7 items-center rounded-full bg-muted px-2.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  {scene.name}
                </Link>
              ))}
            </span>
            <Link href="/submit" className="mt-auto inline-flex items-center gap-1 pt-4 text-[13px] font-medium ink-link">
              <Plus className="size-3.5" aria-hidden="true" />
              推荐一款工具
            </Link>
          </div>
        </li>
      ) : null}
    </ul>
  );
}

/** 搜索页等处的紧凑版：只列有内容的场景。 */
export function SceneChips({ counts }: { counts: CatalogCounts }) {
  const ready = scenes.filter((scene) => counts.scenes[scene.id] > 0);
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {ready.map((scene) => (
        <li key={scene.id}>
          <Link
            href={`/scenes/${scene.id}`}
            className="flex min-h-14 items-center gap-3 rounded-2xl border border-border bg-card px-3 transition-colors hover:border-foreground/25"
          >
            <SceneIcon id={scene.id} size={32} />
            <span className="flex-1 truncate text-sm font-medium">{scene.name}</span>
            <span className="font-mono text-xs text-muted-foreground tabular-nums">{counts.scenes[scene.id]}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
