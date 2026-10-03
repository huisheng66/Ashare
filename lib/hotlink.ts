/**
 * 图片防盗链。
 *
 * 目标：阻止第三方站点把 Ashare 的预览图当免费图床用。
 * 约束：绝不误伤自己人。以下场景必须照常返回图片：
 *
 * - 无 Referer（地址栏直开、`curl`、部分 App 内置浏览器、微信打开分享图）
 * - 同站页面（首屏、详情页、`next/image` 优化器回源）
 * - 配置了 `NEXT_PUBLIC_SITE_URL` 时的该域名及其子域名
 * - 配置了 `ASSET_REFERRER_ALLOWLIST` 显式放行的域名
 * - 搜索引擎抓 og:image（部分爬虫带 Referer，部分不带）
 *
 * 因此判定是「白名单放行 + 其余拒绝」，而不是「拉黑已知站点」：
 * 站点自己的图片数量有限、可防盗；爬虫与分享流量不可枚举，不该误伤。
 *
 * 这里不 import 任何 Next 依赖，proxy 路由与测试都能直接用。
 */

/** 防盗链判定结果。 */
export type HotlinkDecision =
  | { allowed: true; reason: "no-referrer" | "same-site" | "allowlisted" | "disabled" }
  | { allowed: false; reason: "cross-site" };

/** 协议与 www 前缀会让同一站点看起来不同，比较前先归一。 */
function normalizeHost(value: string): string {
  const host = value.trim().toLowerCase().replace(/\.$/, "");
  return host.startsWith("www.") ? host.slice(4) : host;
}

/**
 * 从 Referer 取出 host；无法解析时返回 undefined。
 * 只接受 http/https，`file:`、`javascript:` 之类一律视为无 Referer 处理。
 */
export function refererHost(referer: string | null | undefined): string | undefined {
  if (!referer) return undefined;
  try {
    const url = new URL(referer);
    if (url.protocol !== "https:" && url.protocol !== "http:") return undefined;
    // URL 会把 `https://a.com` 的 host 归一为小写；用户名密码不该出现在 Referer 里，出现即视为异常。
    if (url.username || url.password) return undefined;
    return normalizeHost(url.host);
  } catch {
    return undefined;
  }
}

/** own 命中 allowlist 时也算自己人，避免 `img.ashare` 与 `ashare` 互相盗链。 */
function hostMatches(host: string, own: string): boolean {
  return host === own || host.endsWith(`.${own}`);
}

export type HotlinkOptions = {
  /** 站点自身 origin（host）。来自 `NEXT_PUBLIC_SITE_URL`。 */
  siteHost?: string;
  /** 额外放行的域名，逗号分隔。用于微信、搜索引擎等需要显式放行的来源。 */
  allowlist?: string;
  /** 关闭防盗链。设为 `1` 时全部放行。 */
  disabled?: boolean;
};

/**
 * 判断一次图片请求是否放行。
 *
 * 无 Referer 一律放行：这是最重要的一条。地址栏直开、站内部分浏览器
 * 扩展、以及大量爬虫都不带 Referer，拉黑它们等于把分享和索引一起废掉。
 */
export function decideHotlink(
  referer: string | null | undefined,
  options: HotlinkOptions = {},
): HotlinkDecision {
  if (options.disabled) return { allowed: true, reason: "disabled" };

  const host = refererHost(referer);
  if (!host) return { allowed: true, reason: "no-referrer" };

  const own = options.siteHost ? normalizeHost(options.siteHost) : "";
  if (own && hostMatches(host, own)) return { allowed: true, reason: "same-site" };

  for (const entry of (options.allowlist ?? "").split(",")) {
    const allowed = normalizeHost(entry);
    if (allowed && hostMatches(host, allowed)) return { allowed: true, reason: "allowlisted" };
  }

  return { allowed: false, reason: "cross-site" };
}

/** 读防盗链配置。模块内不读 env，方便测试注入。 */
export function hotlinkOptionsFromEnv(env: NodeJS.ProcessEnv = process.env): HotlinkOptions {
  const site = env.NEXT_PUBLIC_SITE_URL?.trim();
  let siteHost = "";
  if (site) {
    try {
      siteHost = normalizeHost(new URL(site).host);
    } catch {
      siteHost = "";
    }
  }
  return {
    siteHost,
    allowlist: env.ASSET_REFERRER_ALLOWLIST ?? "",
    disabled: env.ASSET_HOTLINK_PROTECTION === "0",
  };
}

/**
 * 被拒绝时的响应。
 * 返回 403 而不是 404：图片确实存在，假装不存在只会让排障变难。
 * 附带 CORP 头，浏览器层面同样拒绝跨站读取（无 Referer 直开不受影响）。
 */
export function hotlinkBlockedResponse(): Response {
  return new Response(null, {
    status: 403,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
      "Cross-Origin-Resource-Policy": "same-origin",
    },
  });
}
