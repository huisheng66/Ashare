"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { MagnifierIcon } from "@/components/MagnifierIcon";
import { NavIcon } from "@/components/SidebarIcons";
import { SiteFooter } from "@/components/SiteFooter";
import { ThemeToggle } from "@/components/theme-toggle";
import { navigationGroups } from "@/lib/navigation";

export function Sidebar() {
  const pathname = usePathname();
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k" && window.matchMedia("(min-width: 1024px)").matches) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <aside className="sticky top-0 hidden h-dvh w-[240px] shrink-0 flex-col overflow-y-auto border-r border-border bg-sidebar px-3 py-4 lg:flex">
      <div className="mb-3 flex items-center justify-between px-1.5">
        <Link href="/" className="flex h-11 items-center" aria-label="Ashare 首页">
          <span className="text-lg font-bold tracking-tight">Ashare</span>
        </Link>
        <ThemeToggle />
      </div>
      <form action="/search" role="search" aria-label="站内搜索" className="mb-3">
        <label className="sr-only" htmlFor="sidebar-search">搜索软件</label>
        <div className="relative">
          <MagnifierIcon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input ref={searchRef} id="sidebar-search" type="search" name="q" maxLength={120} enterKeyHint="search" placeholder="搜索软件或用途" aria-keyshortcuts="Control+k Meta+k" className="h-10 w-full rounded-lg border border-input bg-background pl-8 pr-3 text-[13px] text-foreground placeholder:text-muted-foreground focus-visible:border-ring" />
        </div>
      </form>
      {navigationGroups.map((group) => (
        <div key={group.label} className="mt-3">
          <p className="mb-1 px-2.5 text-xs font-semibold text-muted-foreground">{group.label}</p>
          <nav aria-label={group.label} className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`flex min-h-10 items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium transition-colors ${active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-accent"}`}>
                  <NavIcon id={item.id} color={item.color} className="size-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      ))}
      <div className="mt-auto px-2.5 pt-6 text-xs leading-relaxed text-muted-foreground">
        <p>只连可核验的官方、开源与作者授权渠道。</p>
        <p>本站不托管安装包，不收录破解。</p>
        <SiteFooter compact />
      </div>
    </aside>
  );
}
