import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * 页面 CSP（nonce 交给 Next 注入自身脚本，根布局须动态渲染）。
 * 图片与静态资源的基础安全头由 next.config.ts 统一提供。
 * 限速与 IP 封禁在 lib/guard.ts（Node 运行时）执行，这里不依赖共享内存状态。
 */
export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!["GET", "HEAD", "POST"].includes(request.method)) {
      return new NextResponse(null, {
        status: 405,
        headers: { Allow: "GET, HEAD, POST" },
      });
    }
  }

  const isProd = process.env.NODE_ENV === "production";
  const nonce = btoa(crypto.randomUUID());
  // Turnstile 的验证窗口是 challenges.cloudflare.com 的 iframe，脚本也从那里加载。
  // 这里不放行的话，default-src 'self' 会把 iframe 拦掉（Cloudflare 报 300030，控件
  // 只剩一片空白）。**不做条件放行**：中间件在 Edge 运行时里读到的 env 是构建期
  // 内联的，运维构建后再配 Turnstile 会静默失效——宁可放行一个固定主机。
  const turnstile = "https://challenges.cloudflare.com";
  const csp = [
    "default-src 'self'",
    // 开发模式 React/Turbopack 依赖 eval 做调试；生产不开 unsafe-eval
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${turnstile}${isProd ? "" : " 'unsafe-eval'"}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    `connect-src 'self' ${turnstile}${isProd ? "" : " ws: wss:"}`,
    `frame-src ${turnstile}`,
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    // 仅 https 站点才强制升级请求，避免内网 HTTP 部署被浏览器改写后无法访问
    ...(isProd && (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://")
      ? ["upgrade-insecure-requests"]
      : []),
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico$|icon$|media/|icons/|robots\\.txt$|sitemap\\.xml$).*)",
  ],
};
