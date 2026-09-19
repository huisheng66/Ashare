import "server-only";

import { cache } from "react";
import { getCatalogAll } from "./store";
import { kindIds, platformIds, sceneIds } from "./catalog-query";
import type { CatalogCounts, SceneId, Software } from "@/data/types";

/** 同一次服务端渲染共享目录快照；新请求仍读取最新发布数据。 */
export const allPublished = cache(async (): Promise<Software[]> =>
  (await getCatalogAll()).filter((item) => item.status === "published"),
);

const publishedBySlug = cache(async () =>
  new Map((await allPublished()).map((item) => [item.slug, item])),
);

export async function getSoftware(slug: string): Promise<Software | undefined> {
  return (await publishedBySlug()).get(slug);
}

export async function byScene(id: SceneId): Promise<Software[]> {
  return (await allPublished()).filter((item) => item.scenes.includes(id));
}

export async function alternativesOf(item: Software): Promise<Software[]> {
  const published = await publishedBySlug();
  return item.alternatives
    .map((slug) => published.get(slug))
    .filter((value): value is Software => Boolean(value));
}

export const catalogCounts = cache(async (): Promise<CatalogCounts> => {
  const items = await allPublished();
  const counts: CatalogCounts = {
    total: items.length,
    discount: 0,
    kinds: Object.fromEntries(kindIds.map((id) => [id, 0])) as CatalogCounts["kinds"],
    scenes: Object.fromEntries(sceneIds.map((id) => [id, 0])) as CatalogCounts["scenes"],
    platforms: Object.fromEntries(platformIds.map((id) => [id, 0])) as CatalogCounts["platforms"],
  };
  for (const item of items) {
    if (item.source === "discount") counts.discount += 1;
    if (Object.hasOwn(counts.kinds, item.kind)) counts.kinds[item.kind] += 1;
    for (const id of new Set(item.scenes)) {
      if (Object.hasOwn(counts.scenes, id)) counts.scenes[id] += 1;
    }
    for (const id of new Set(item.platforms)) {
      if (Object.hasOwn(counts.platforms, id)) counts.platforms[id] += 1;
    }
  }
  return counts;
});
