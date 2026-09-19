/** 只有显式配置的 HTTP(S) 站点地址才能进入公开元数据。 */
export function getSiteUrl(): URL | undefined {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) return undefined;

  try {
    const url = new URL(configured);
    if (
      !["https:", "http:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== "/"
    ) {
      return undefined;
    }
    return url;
  } catch {
    return undefined;
  }
}

/** 未配置正式域名时省略绝对链接，避免把 localhost 写入搜索索引。 */
export function absoluteSiteUrl(path: string): string | undefined {
  const siteUrl = getSiteUrl();
  return siteUrl ? new URL(path, siteUrl).href : undefined;
}
