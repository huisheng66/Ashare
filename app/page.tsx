import { AppCardRow } from "@/components/AppCard";
import { CatalogBrowser } from "@/components/CatalogBrowser";
import { HotSearchBar } from "@/components/HotSearchBar";
import type { Platform, SceneId } from "@/data/types";
import { allPublished, catalogCounts } from "@/lib/catalog";

export const metadata = {
  title: "探索",
};

type Props = {
  searchParams: Promise<{
    scene?: string;
    platform?: string;
    kind?: string;
    discount?: string;
    sort?: string;
  }>;
};

function parseList(value?: string): string[] {
  return value ? value.split(",").filter(Boolean) : [];
}

export default async function HomePage({ searchParams }: Props) {
  const sp = await searchParams;
  const scenePicked = new Set(parseList(sp.scene)) as Set<SceneId>;
  const platformPicked = new Set(parseList(sp.platform)) as Set<Platform>;
  const kindPicked = new Set(parseList(sp.kind));
  const discountOnly = sp.discount === "1";

  const all = await allPublished();
  let shown = all.filter(
    (item) =>
      (scenePicked.size === 0 ||
        item.scenes.some((s) => scenePicked.has(s))) &&
      (platformPicked.size === 0 ||
        item.platforms.some((p) => platformPicked.has(p))) &&
      (kindPicked.size === 0 || kindPicked.has(item.kind)) &&
      (!discountOnly || item.source === "discount"),
  );
  if (sp.sort === "updated") {
    shown = [...shown].sort((a, b) =>
      (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""),
    );
  } else if (sp.sort === "name") {
    shown = [...shown].sort((a, b) => a.name.localeCompare(b.name));
  }
  const counts = await catalogCounts();
  const featured = all.filter((item) => item.featured);

  return (
    <div className="mx-auto w-full max-w-[1200px] px-5 py-8 sm:px-8">
      <h1 className="sr-only">探索</h1>
      <HotSearchBar />
      {featured.length ? (
        <section className="mt-8">
          <h2 className="text-xl font-bold tracking-tight">编辑精选</h2>
          <AppCardRow className="mt-4" items={featured} />
        </section>
      ) : null}
      <CatalogBrowser items={shown} total={counts.total} counts={counts} />
    </div>
  );
}
