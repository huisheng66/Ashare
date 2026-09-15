import type { Metadata } from "next";
import { Noto_Sans_SC } from "next/font/google";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const noto = Noto_Sans_SC({
  variable: "--font-noto",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Ashare · 按需找软件",
    template: "%s · Ashare",
  },
  description:
    "按使用场景找软件与工具。收录厂商正式版、脚本和开源项目，不托管安装包，不收破解。",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={`${noto.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
          >
            跳到主要内容
          </a>
          <div className="flex w-full flex-1">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <Header />
              <main id="main" className="flex-1">
                {children}
              </main>
              <div className="border-t border-border px-5 py-6 text-[11px] leading-relaxed text-muted-foreground lg:hidden">
                <p>只连可核验的官方、开源与作者授权渠道，不托管安装包。</p>
                <p className="mt-1">不收录破解、修改版与盗版分发。</p>
              </div>
            </div>
          </div>
          <Toaster position="top-center" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
