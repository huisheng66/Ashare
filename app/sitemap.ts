import type { MetadataRoute } from "next";

import { scenes } from "@/data/scenes";
import { allPublished } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
  const items = await allPublished();
  const staticPaths = ["", "/about", "/submit", "/feedback", ...scenes.map((s) => `/scenes/${s.id}`)];
  return [
    ...staticPaths.map((path) => ({
      url: `${base}${path}`,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.6,
    })),
    ...items.map((item) => ({
      url: `${base}/software/${item.slug}`,
      lastModified: item.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
