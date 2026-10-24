import type { MetadataRoute } from "next";

import { absoluteSiteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /api/mcp 是给 agent 的公开只读端点，不是网页；爬虫抓它没意义，还占限流额度。
      disallow: ["/admin", "/search", "/api/"],
    },
    sitemap: absoluteSiteUrl("/sitemap.xml"),
  };
}
