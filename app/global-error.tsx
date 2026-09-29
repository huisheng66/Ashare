"use client";

/** 根布局失败时样式表可能没加载：只用内联样式和系统色，深浅自适应。 */
export default function GlobalError({ retry }: { retry: () => void }) {
  return (
    <html lang="zh-CN">
      <head>
        <title>暂时无法打开 · Ashare</title>
        <meta name="robots" content="noindex, nofollow" />
      </head>
      <body
        style={{
          margin: 0,
          background: "Canvas",
          color: "CanvasText",
          colorScheme: "light dark",
          fontFamily: "system-ui, -apple-system, \"PingFang SC\", \"Microsoft YaHei\", sans-serif",
        }}
      >
        <main style={{ maxWidth: 560, margin: "15vh auto 0", padding: "0 24px" }}>
          <p style={{ display: "flex", alignItems: "center", gap: 10, margin: 0, fontSize: 15, fontWeight: 700 }}>
            <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
              <rect width="32" height="32" rx="8" fill="#cc2c05" />
              <path
                fill="#fffaf5"
                fillRule="evenodd"
                d="M13.6 7h4.8L25 25h-4.3l-1.28-3.5h-6.84L11.3 25H7L13.6 7Zm.16 11.3h4.48L16 12.2l-2.24 6.1Z"
              />
            </svg>
            Ashare
          </p>
          <h1 style={{ margin: "32px 0 0", fontSize: 32, lineHeight: 1.2 }}>暂时无法打开页面</h1>
          <p style={{ margin: "12px 0 0", lineHeight: 1.75, opacity: 0.8 }}>多半是暂时的，重新加载一次，或稍后再试。</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginTop: 32 }}>
            <button
              type="button"
              onClick={retry}
              style={{
                minHeight: 44,
                padding: "0 20px",
                border: 0,
                borderRadius: 10,
                background: "CanvasText",
                color: "Canvas",
                font: "inherit",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              重新加载
            </button>
            {/* 根布局失败时使用完整导航，重新请求整份文档。 */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                minHeight: 44,
                padding: "0 20px",
                borderRadius: 10,
                border: "1px solid color-mix(in srgb, CanvasText 25%, transparent)",
                color: "inherit",
                textDecoration: "none",
              }}
            >
              回到探索
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
