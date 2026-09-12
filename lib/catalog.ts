import { software } from "@/data/software";
import type { Platform, SceneId, Software, SourceKind } from "@/data/types";

export function getSoftware(slug: string): Software | undefined {
  return software.find((item) => item.slug === slug);
}

export function byScene(id: SceneId): Software[] {
  return software.filter((item) => item.scenes.includes(id));
}

export function featuredSoftware(): Software[] {
  return software.filter((item) => item.featured);
}

export function alternativesOf(item: Software): Software[] {
  return item.alternatives
    .map((slug) => getSoftware(slug))
    .filter((value): value is Software => Boolean(value));
}

export function searchSoftware(query: string, items: Software[] = software): Software[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return items;
  return items.filter((item) => {
    const hay = [
      item.name,
      item.nameZh ?? "",
      item.summary,
      item.whoFor,
      ...item.aliases,
      ...item.scenes,
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(needle);
  });
}

export function filterSoftware(
  items: Software[],
  opts: { platform?: Platform | "all"; source?: SourceKind | "all" },
): Software[] {
  return items.filter((item) => {
    const platformOk =
      !opts.platform || opts.platform === "all"
        ? true
        : item.platforms.includes(opts.platform);
    const sourceOk =
      !opts.source || opts.source === "all" ? true : item.source === opts.source;
    return platformOk && sourceOk;
  });
}

export const platformLabel: Record<Platform, string> = {
  windows: "Windows",
  macos: "macOS",
  linux: "Linux",
};

export const sourceLabel: Record<SourceKind, string> = {
  official: "官方",
  opensource: "开源",
  discount: "优惠",
};
