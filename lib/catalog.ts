import "server-only";

import { getCatalogAll } from "./store";
import { kindLabel } from "./items";
import type { CatalogCounts, ItemKind, Platform, SceneId, Software } from "@/data/types";

/** 服务端数据访问：公开页只读 published 条目 */

export async function allPublished(): Promise<Software[]> {
  return (await getCatalogAll()).filter((item) => item.status === "published");
}

export async function getSoftware(slug: string): Promise<Software | undefined> {
  return (await allPublished()).find((item) => item.slug === slug);
}

export async function byScene(id: SceneId): Promise<Software[]> {
  return (await allPublished()).filter((item) => item.scenes.includes(id));
}

export async function alternativesOf(item: Software): Promise<Software[]> {
  const published = await allPublished();
  return item.alternatives
    .map((slug) => published.find((i) => i.slug === slug))
    .filter((value): value is Software => Boolean(value));
}

export async function catalogCounts(): Promise<CatalogCounts> {
  const items = await allPublished();
  const sceneIds: SceneId[] = [
    "code",
    "docs",
    "design",
    "data",
    "office",
    "engineering",
    "tools",
    "photo",
    "games",
    "education",
    "music",
    "social",
  ];
  const platformIds: Platform[] = ["windows", "macos", "linux"];
  return {
    total: items.length,
    discount: items.filter((item) => item.source === "discount").length,
    kinds: Object.fromEntries(
      (Object.keys(kindLabel) as ItemKind[]).map((id) => [
        id,
        items.filter((item) => item.kind === id).length,
      ]),
    ) as CatalogCounts["kinds"],
    scenes: Object.fromEntries(
      sceneIds.map((id) => [
        id,
        items.filter((item) => item.scenes.includes(id)).length,
      ]),
    ) as CatalogCounts["scenes"],
    platforms: Object.fromEntries(
      platformIds.map((id) => [
        id,
        items.filter((item) => item.platforms.includes(id)).length,
      ]),
    ) as CatalogCounts["platforms"],
  };
}
