"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { FilterPanel } from "@/components/FilterPanel";
import { MagnifierIcon } from "@/components/MagnifierIcon";
import { NavIcon } from "@/components/SidebarIcons";
import { ThemeToggle } from "@/components/theme-toggle";
import { scenes } from "@/data/scenes";
import type { CatalogCounts } from "@/data/types";

const sceneIconColors: Record<string, string> = {
  code: "#0A84FF",
  docs: "#AF52DE",
  design: "#FF2D55",
  data: "#34C759",
  office: "#A2845E",
  engineering: "#FF9500",
};

export function Sidebar({ counts }: { counts: CatalogCounts }) {
  const pathname = usePathname();

  const row = (href: string, label: string, icon: React.ReactNode) => {
    const active = pathname === href;
    return (
      <Link
        key={href}
        href={href}
        aria-current={active ? "page" : undefined}
        className={`flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium transition-colors ${
          active
            ? "bg-accent text-accent-foreground"
            : "text-foreground hover:bg-accent/60"
        }`}
      >
        {icon}
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <aside className="sticky top-0 hidden h-dvh w-[240px] shrink-0 flex-col overflow-y-auto border-r border-border bg-sidebar px-3 py-4 lg:flex">
      <div className="mb-3 flex items-center justify-between px-1.5">
        <Link href="/" className="flex h-9 items-center">
          <span className="text-[15px] font-bold tracking-tight">Ashare</span>
        </Link>
        <ThemeToggle />
      </div>

      <form action="/search" role="search" className="mb-3">
        <label className="sr-only" htmlFor="sidebar-search">
          搜索软件
        </label>
        <div className="relative">
          <MagnifierIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            id="sidebar-search"
            name="q"
            placeholder="搜索"
            className="h-9 w-full rounded-lg border border-input bg-background pl-8 pr-3 text-[13px] text-foreground transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none"
          />
        </div>
      </form>

      {pathname === "/" ? (
        <div className="mb-3 border-t border-border pt-3">
          <FilterPanel counts={counts} />
        </div>
      ) : null}

      <nav aria-label="主导航" className="flex flex-col gap-0.5">
        {row("/", "探索", <NavIcon id="explore" color="#007AFF" className="size-4" />)}
        {scenes.map((scene) =>
          row(
            `/scenes/${scene.id}`,
            scene.name,
            <NavIcon
              id={scene.id}
              color={sceneIconColors[scene.id]}
              className="size-4"
            />,
          ),
        )}
      </nav>

      <p className="mb-1 mt-5 px-2.5 text-[11px] font-semibold text-muted-foreground">
        更多
      </p>
      <nav aria-label="更多" className="flex flex-col gap-0.5">
        {row("/about", "收录标准", <NavIcon id="about" color="#30B0C7" className="size-4" />)}
        {row("/feedback", "反馈", <NavIcon id="feedback" color="#FF9500" className="size-4" />)}
        {row("/submit", "提交推荐", <NavIcon id="submit" color="#5856D6" className="size-4" />)}
      </nav>

      <div className="mt-auto px-2.5 pt-6 text-[11px] leading-relaxed text-muted-foreground">
        <p>只连可核验的官方、开源与作者授权渠道。</p>
        <p>本站不托管安装包，不收录破解。</p>
      </div>
    </aside>
  );
}
