"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search } from "lucide-react";
import { useState } from "react";

import { NavIcon } from "@/components/SidebarIcons";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { navigationGroups } from "@/lib/navigation";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="nav-blur sticky top-0 z-30 border-b border-border/60 lg:hidden">
      <div className="flex h-14 items-center gap-2 px-4">
        <Link href="/" className="flex h-11 items-center" aria-label="Ashare 首页"><span className="text-base font-bold tracking-tight">Ashare</span></Link>
        <div className="ml-auto flex items-center gap-0.5">
          <ThemeToggle />
          <Button asChild variant="ghost" size="icon" className="size-11" aria-label="搜索软件"><Link href="/search"><Search className="size-4" /></Link></Button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild><Button variant="ghost" size="icon" className="size-11" aria-label="打开菜单"><Menu className="size-5" /></Button></SheetTrigger>
            <SheetContent side="right" className="w-[min(320px,90vw)] gap-0 p-0">
              <SheetHeader className="shrink-0 border-b border-border px-5 py-4">
                <SheetTitle className="text-base">导航</SheetTitle>
                <SheetDescription className="sr-only">按使用场景浏览工具，或提交推荐与反馈。</SheetDescription>
              </SheetHeader>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
                {navigationGroups.map((group) => (
                  <nav key={group.label} aria-label={`移动导航：${group.label}`} className="mb-4 flex flex-col gap-1">
                    <p className="px-3 py-1 text-xs font-medium text-muted-foreground">{group.label}</p>
                    {group.items.map((item) => {
                      const active = pathname === item.href;
                      return <Link key={item.href} href={item.href} onClick={() => setOpen(false)} aria-current={active ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-[15px] font-medium transition-colors ${active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-accent"}`}><NavIcon id={item.id} color={item.color} className="size-[18px]" />{item.label}</Link>;
                    })}
                  </nav>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
