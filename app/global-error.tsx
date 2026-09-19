"use client";

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
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <main style={{ maxWidth: 560, margin: "15vh auto", padding: 24 }}>
          <p style={{ fontSize: 14 }}>Ashare</p>
          <h1 style={{ fontSize: 28 }}>暂时无法打开页面</h1>
          <p style={{ lineHeight: 1.7 }}>请重新加载页面，稍后再试。</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "center", marginTop: 24 }}>
            <button
              type="button"
              onClick={retry}
              style={{
                padding: "10px 16px",
                border: 0,
                borderRadius: 8,
                background: "#0071e3",
                color: "white",
                font: "inherit",
                cursor: "pointer",
              }}
            >
              重新加载
            </button>
            {/* 根布局失败时使用完整导航，重新请求整份文档。 */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" style={{ color: "inherit" }}>回到探索</a>
          </div>
        </main>
      </body>
    </html>
  );
}
