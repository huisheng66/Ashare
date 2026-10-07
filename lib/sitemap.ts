import { scenes } from "../data/scenes.ts";

/**
 * 站点地图的纯构造逻辑。
 *
 * 为什么不用 Next 的 generateSitemaps：**它只生成 /sitemap/[id].xml，不提供 /sitemap.xml**
 * （实测：生产构建的路由表里只有 /sitemap/[__metadata_id__]，而 robots.txt 指向的 /sitemap.xml 返回 404）。
 * 而 /sitemap.xml 是搜索引擎默认去找的地址，不能缺，所以这里自己出索引与分片。
 *
 * 纯字符串拼装，不依赖 Response/next 运行时，便于单测。
 */

/** Google 的上限是每个 sitemap 5 万条 URL。 */
export const SITEMAP_CHUNK = 50_000;

export type SitemapEntry = {
  loc: string;
  lastmod?: string;
  changefreq?: "weekly" | "monthly";
  priority?: number;
};

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function renderUrlset(entries: SitemapEntry[]): string {
  const rows = entries.map((entry) => {
    const parts = ["    <loc>" + escapeXml(entry.loc) + "</loc>"];
    if (entry.lastmod) parts.push("    <lastmod>" + escapeXml(entry.lastmod) + "</lastmod>");
    if (entry.changefreq) parts.push("    <changefreq>" + entry.changefreq + "</changefreq>");
    if (entry.priority !== undefined) parts.push("    <priority>" + entry.priority.toFixed(1) + "</priority>");
    return "  <url>\n" + parts.join("\n") + "\n  </url>";
  });
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    (rows.length ? "\n" + rows.join("\n") + "\n" : "") +
    "</urlset>"
  );
}

export function renderSitemapIndex(locations: string[]): string {
  const rows = locations.map((loc) => "  <sitemap>\n    <loc>" + escapeXml(loc) + "</loc>\n  </sitemap>");
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' +
    (rows.length ? "\n" + rows.join("\n") + "\n" : "") +
    "</sitemapindex>"
  );
}

export function xmlResponse(xml: string): Response {
  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

/** 固定页面 + 场景页。只放在第 0 片，避免每片重复。 */
export function staticEntries(siteUrl: URL): SitemapEntry[] {
  const paths = ["/", "/about", "/submit", "/feedback", ...scenes.map((scene) => "/scenes/" + scene.id)];
  return paths.map((path) => ({
    loc: new URL(path, siteUrl).href,
    changefreq: "weekly" as const,
    priority: path === "/" ? 1 : 0.6,
  }));
}

export function softwareEntries(siteUrl: URL, items: { slug: string; updatedAt?: string }[]): SitemapEntry[] {
  return items.map((item) => ({
    loc: new URL("/software/" + encodeURIComponent(item.slug), siteUrl).href,
    lastmod: item.updatedAt,
    changefreq: "monthly" as const,
    priority: 0.8,
  }));
}

/** 分片地址。超过一片时索引用得到。 */
export function chunkLocations(siteUrl: URL, chunks: number): string[] {
  return Array.from({ length: chunks }, (_, id) => new URL("/sitemaps/" + id, siteUrl).href);
}
