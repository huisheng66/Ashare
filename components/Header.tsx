"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search } from "lucide-react";
import { useState } from "react";

import { NavIcon } from "@/components/SidebarIcons";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { scenes } from "@/data/scenes";

const sceneIconColors: Record<string, string> = {
  code: "#0A84FF",
  docs: "#AF52DE",
  design: "#FF2D55",
  data: "#34C759",
  office: "#A2845E",
  engineering: "#FF9500",
};

const iconColor = (id: string) =>
  id === "explore"
    ? "#007AFF"
    : id === "about"
      ? "#30B0C7"
      : id === "feedback"
        ? "#FF9500"
        : id === "submit"
          ? "#5856D6"
          : sceneIconColors[id];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const rows: { href: string; label: string; id: string }[] = [
    { href: "/", label: "探索", id: "explore" },
    ...scenes.map((s) => ({ href: `/scenes/${s.id}`, label: s.name, id: s.id })),
    { href: "/about", label: "收录标准", id: "about" },
    { href: "/feedback", label: "反馈", id: "feedback" },
    { href: "/submit", label: "提交推荐", id: "submit" },
  ];

  return (
    <header className="nav-blur sticky top-0 z-30 border-b border-border/60 lg:hidden">
      <div className="flex h-14 items-center gap-2 px-4">
        <Link href="/" className="flex items-center">
          <span className="text-base font-bold tracking-tight">Ashare</span>
        </Link>
        <div className="ml-auto flex items-center gap-0.5">
          <ThemeToggle />
          <Button asChild variant="ghost" size="icon" aria-label="搜索">
            <Link href="/search">
              <Search className="size-4" />
            </Link>
          </Button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="打开菜单">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] p-0">
              <SheetHeader className="border-b border-border px-5 py-4">
                <SheetTitle className="text-base">导航</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 p-3" aria-label="移动导航">
                {rows.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`flex h-11 items-center gap-3 rounded-lg px-3 text-[15px] font-medium transition-colors ${
                        active
                          ? "bg-accent text-accent-foreground"
                          : "text-foreground hover:bg-accent/60"
                      }`}
                    >
                      <NavIcon
                        id={item.id}
                        color={iconColor(item.id)}
                        className="size-[18px]"
                      />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
