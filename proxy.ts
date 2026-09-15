import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * 安全响应头 + CSP（nonce 交给 Next 注入自身脚本）。
 * 限速与 IP 封禁在 lib/guard.ts（Node 运行时）执行，这里不依赖共享内存状态。
 */
export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!["GET", "HEAD", "POST"].includes(request.method)) {
      return new NextResponse(null, { status: 405 });
    }
  }

  const isProd = process.env.NODE_ENV === "production";
  const nonce = btoa(crypto.randomUUID());
  const csp = [
    "default-src 'self'",
    // 开发模式 React/Turbopack 依赖 eval 做调试；生产不开 unsafe-eval
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isProd ? "" : " 'unsafe-eval'"}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    ...(isProd ? ["upgrade-insecure-requests"] : []),
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|media).*)"],
};
