import type { MetadataRoute } from "next";

import { scenes } from "@/data/scenes";
import { allPublished } from "@/lib/catalog";
import { getSiteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  // 域名缺失时不生成指向 localhost 或其他假定主机的索引。
  if (!siteUrl) return [];

  const items = await allPublished();
  const staticPaths = [
    "/",
    "/about",
    "/submit",
    "/feedback",
    ...scenes.map((scene) => "/scenes/" + scene.id),
  ];
  return [
    ...staticPaths.map((path) => ({
      url: new URL(path, siteUrl).href,
      changeFrequency: "weekly" as const,
      priority: path === "/" ? 1 : 0.6,
    })),
    ...items.map((item) => ({
      url: new URL("/software/" + encodeURIComponent(item.slug), siteUrl).href,
      lastModified:
        item.updatedAt && Number.isFinite(Date.parse(item.updatedAt))
          ? item.updatedAt
          : undefined,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
