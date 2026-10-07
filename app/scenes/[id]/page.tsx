import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Compass, Plus } from "lucide-react";

import { Breadcrumb } from "@/components/Breadcrumb";
import { EmptyState } from "@/components/EmptyState";
import { SceneBrowser } from "@/components/SceneBrowser";
import { SceneIcon } from "@/components/SceneIcon";
import { SourceBadge } from "@/components/SourceBadge";
import { Button } from "@/components/ui/button";
import { scenes, sceneById } from "@/data/scenes";
import type { SourceKind } from "@/data/types";
import { byScene, catalogCounts } from "@/lib/catalog";
import { isSceneId } from "@/lib/catalog-query";
import { sceneTone } from "@/lib/colors";
import { toCatalogItem } from "@/lib/items";
import { absoluteSiteUrl } from "@/lib/site";

type Props = {
  params: Promise<{ id: string }>;
};

const sourceOrder: SourceKind[] = ["official", "opensource", "discount"];

export function generateStaticParams() {
  return scenes.map((scene) => ({ id: scene.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const scene = isSceneId(id) ? sceneById[id] : undefined;
  if (!scene) return { title: "场景" };
  return {
    title: scene.name,
    description: scene.description,
    alternates: { canonical: absoluteSiteUrl(`/scenes/${scene.id}`) },
  };
}

export default async function ScenePage({ params }: Props) {
  const { id } = await params;
  const scene = isSceneId(id) ? sceneById[id] : undefined;
  if (!scene) notFound();
  const [items, counts] = await Promise.all([byScene(scene.id), catalogCounts()]);
  const bySource = sourceOrder
    .map((kind) => ({ kind, count: items.filter((item) => item.source === kind).length }))
    .filter(({ count }) => count > 0);
  const switchable = scenes.filter((s) => counts.scenes[s.id] > 0 || s.id === scene.id);

  return (
    <div className="shell pb-20 pt-6 sm:pt-8">
      <Breadcrumb items={[{ href: "/", label: "探索" }, { label: scene.name }]} />

      <header
        className="tone-wash mt-6 flex flex-col gap-6 rounded-3xl border p-6 sm:flex-row sm:items-end sm:p-8"
        style={sceneTone(scene.id)}
      >
        <div className="min-w-0 flex-1">
          <SceneIcon id={scene.id} size={56} />
          <h1 className="mt-5 text-[32px] font-bold leading-tight tracking-[-0.015em] sm:text-[40px]">{scene.name}</h1>
          <p className="mt-2 max-w-[36em] text-[15px] leading-[1.75] text-muted-foreground">{scene.description}</p>
        </div>
        {items.length ? (
          <div className="flex shrink-0 flex-col gap-3 sm:items-end">
            <p className="text-sm text-muted-foreground">
              收录 <span className="font-mono text-2xl font-semibold text-foreground tabular-nums">{items.length}</span> 款
            </p>
            <ul className="flex flex-wrap gap-x-3 gap-y-1" aria-label="来源构成">
              {bySource.map(({ kind, count }) => (
                <li key={kind} className="inline-flex items-center gap-1">
                  <SourceBadge kind={kind} plain />
                  <span className="font-mono text-xs text-muted-foreground tabular-nums">{count}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </header>

      <nav aria-label="切换场景" className="mt-5">
        <ul className="scroll-row fade-right -mx-1 gap-1.5 px-1 py-1 pr-10">
          {switchable.map((s) => {
            const active = s.id === scene.id;
            return (
              <li key={s.id} className="shrink-0">
                <Link
                  href={`/scenes/${s.id}`}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition-colors pointer-coarse:h-11 ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  }`}
                >
                  {s.name}
                  <span className={`font-mono text-[11px] tabular-nums ${active ? "opacity-70" : ""}`}>{counts.scenes[s.id]}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {items.length ? (
        <SceneBrowser items={items.map(toCatalogItem)} />
      ) : (
        <EmptyState
          icon={Compass}
          title="这个场景还在筹备"
          className="mt-8"
          actions={
            <>
              <Button asChild>
                <Link href="/submit">
                  <Plus />
                  推荐一款工具
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/#catalog">看全部工具</Link>
              </Button>
            </>
          }
        >
          「{scene.name}」下还没挑出能长期用的软件。如果你有在用的，欢迎推荐。
        </EmptyState>
      )}
    </div>
  );
}
