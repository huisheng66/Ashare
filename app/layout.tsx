import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { getSiteUrl } from "@/lib/site";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader, type SceneNavItem } from "@/components/SiteHeader";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { scenes } from "@/data/scenes";
import { catalogCounts } from "@/lib/catalog";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: "Ashare · 按需找软件",
    template: "%s · Ashare",
  },
  description:
    "按使用场景找软件与工具。收录厂商正式版、脚本和开源项目，不托管安装包，不收破解。",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaf7" },
    { media: "(prefers-color-scheme: dark)", color: "#110f0d" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [requestHeaders, counts] = await Promise.all([headers(), catalogCounts()]);
  const nonce = requestHeaders.get("x-nonce") ?? undefined;
  const sceneNav: SceneNavItem[] = scenes.map((scene) => ({
    id: scene.id,
    name: scene.name,
    count: counts.scenes[scene.id] ?? 0,
  }));

  return (
    <html lang="zh-CN" suppressHydrationWarning className="h-full">
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <ThemeProvider
          nonce={nonce}
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2.5 focus:text-sm focus:font-medium focus:text-primary-foreground"
          >
            跳到主要内容
          </a>
          <SiteHeader scenes={sceneNav} />
          <main id="main" tabIndex={-1} className="min-w-0 flex-1 focus:outline-none">
            {children}
          </main>
          <SiteFooter scenes={sceneNav} />
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
