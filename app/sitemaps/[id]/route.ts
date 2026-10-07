import { sitemapChunk } from "@/lib/catalog";
import { getSiteUrl } from "@/lib/site";
import { renderUrlset, SITEMAP_CHUNK, softwareEntries, staticEntries, xmlResponse } from "@/lib/sitemap";

export const dynamic = "force-dynamic";

/** 站点地图分片。只在条目超过 5 万、根地址改成索引后才会被引用。 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const siteUrl = getSiteUrl();
  if (!siteUrl) return xmlResponse(renderUrlset([]));

  const id = Number.parseInt((await params).id, 10);
  if (!Number.isInteger(id) || id < 0) return xmlResponse(renderUrlset([]));

  const items = await sitemapChunk(id * SITEMAP_CHUNK, SITEMAP_CHUNK);
  // 固定页面跟着第 0 片走，否则根地址改成索引后它们会整批消失。
  const statics = id === 0 ? staticEntries(siteUrl) : [];
  return xmlResponse(renderUrlset([...statics, ...softwareEntries(siteUrl, items)]));
}
