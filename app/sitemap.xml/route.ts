import { publishedTotal, sitemapChunk } from "@/lib/catalog";
import { getSiteUrl } from "@/lib/site";
import {
  chunkLocations,
  renderSitemapIndex,
  renderUrlset,
  SITEMAP_CHUNK,
  softwareEntries,
  staticEntries,
  xmlResponse,
} from "@/lib/sitemap";

export const dynamic = "force-dynamic";

/**
 * /sitemap.xml
 *
 * 条目少时直接给一张 urlset（与迁移前行为一致）；超过 5 万条改成索引，指向 /sitemaps/[id]。
 * 用 Next 的 generateSitemaps 时不会提供这个地址（见 lib/sitemap.ts 注释），
 * 而 robots.txt 正指向它，所以必须自己实现。
 */
export async function GET(): Promise<Response> {
  const siteUrl = getSiteUrl();
  // 未配置站点 origin 时不生成指向 localhost 之类的假定主机。
  if (!siteUrl) return xmlResponse(renderUrlset([]));

  const total = await publishedTotal();
  const chunks = Math.max(1, Math.ceil(total / SITEMAP_CHUNK));

  if (chunks > 1) return xmlResponse(renderSitemapIndex(chunkLocations(siteUrl, chunks)));

  const items = await sitemapChunk(0, SITEMAP_CHUNK);
  return xmlResponse(renderUrlset([...staticEntries(siteUrl), ...softwareEntries(siteUrl, items)]));
}
