import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      // 图片不运行应用脚本；直接打开上传文件或 SVG 时同样限制主动内容。
      // CORP 是防盗链的浏览器侧兜底：Referer 缺失时仍拒绝跨站 <img> 读取。
      ...["/media/:path*", "/icons/:path*"].map((source) => ({
        source,
        headers: [
          {
            key: "Content-Security-Policy",
            value: "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; sandbox",
          },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
          // 预览图是条目的一部分，不应被单独索引出去。
          { key: "X-Robots-Tag", value: "noindex" },
        ],
      })),
    ];
  },
  experimental: {
    // Proxy must buffer the same complete multipart body as the action.
    proxyClientMaxBodySize: "36mb",
    serverActions: {
      // 最多 6 张预览 + 1 个图标，每张 5MiB，再留出 multipart 开销。
      bodySizeLimit: "36mb",
    },
  },
  // mysql2 是 CJS 且依赖 Node 原生能力，交给 Node 直接 require，不走 Next 的服务端打包。
  // 放在对象末尾：改动只追加行，不会让 docs/优化改进报告.md 的行号引用漂移。
  serverExternalPackages: ["mysql2"],
};

export default nextConfig;
