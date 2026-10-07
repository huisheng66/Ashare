"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ChevronDown, Menu, Plus, Search } from "lucide-react";

import { Logo } from "@/components/Logo";
import { SceneIcon } from "@/components/SceneIcon";
import { ThemeSegmented, ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { SceneId } from "@/data/types";
import { MAX_SEARCH_LENGTH } from "@/lib/catalog-query";

export type SceneNavItem = { id: SceneId; name: string; count: number };

const noopSubscribe = () => () => {};

function useIsApple() {
  return useSyncExternalStore(
    noopSubscribe,
    () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent),
    () => false,
  );
}

function navItemClass(active: boolean) {
  return `relative inline-flex h-10 items-center gap-1 rounded-lg px-3 text-sm font-medium transition-colors ${
    active ? "text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
  }`;
}

/** 当前位置：朱砂短线压在顶栏底部的发丝线上 */
function ActiveBar() {
  return <span aria-hidden="true" className="absolute inset-x-3 -bottom-[13px] h-0.5 rounded-full bg-brand" />;
}

function ScenesMenu({ scenes, pathname }: { scenes: SceneNavItem[]; pathname: string }) {
  const ready = scenes.filter((scene) => scene.count > 0);
  const pending = scenes.filter((scene) => scene.count === 0);
  const active = pathname.startsWith("/scenes/");

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className={`${navItemClass(active)} outline-none focus-visible:outline-2 focus-visible:outline-ring data-[state=open]:bg-muted data-[state=open]:text-foreground`}>
        场景
        <ChevronDown className="size-3.5 opacity-70 transition-transform duration-200 in-data-[state=open]:rotate-180" aria-hidden="true" />
        {active ? <ActiveBar /> : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={12} className="w-[27rem] p-2">
        <div className="grid grid-cols-2 gap-0.5">
          {ready.map((scene) => {
            const current = pathname === `/scenes/${scene.id}`;
            return (
              <DropdownMenuItem key={scene.id} asChild className={`gap-3 px-2.5 py-2 ${current ? "bg-accent" : ""}`}>
                <Link href={`/scenes/${scene.id}`} aria-current={current ? "page" : undefined}>
                  <SceneIcon id={scene.id} size={32} />
                  <span className="flex-1 font-medium">{scene.name}</span>
                  <span className="font-mono text-xs text-muted-foreground tabular-nums">{scene.count}</span>
                </Link>
              </DropdownMenuItem>
            );
          })}
        </div>
        {pending.length ? (
          <>
            <DropdownMenuSeparator className="mx-1 my-2" />
            <div className="px-2.5 pb-1.5">
              <p className="text-xs text-muted-foreground">筹备中，欢迎推荐</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {pending.map((scene) => (
                  <DropdownMenuItem key={scene.id} asChild className="min-h-0 h-7 rounded-full border border-border px-2.5 py-0 text-xs text-muted-foreground">
                    <Link href={`/scenes/${scene.id}`}>{scene.name}</Link>
                  </DropdownMenuItem>
                ))}
              </div>
            </div>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function HeaderSearch({ inputRef }: { inputRef: React.RefObject<HTMLInputElement | null> }) {
  const isApple = useIsApple();
  return (
    <form action="/search" role="search" aria-label="站内搜索" className="relative hidden w-60 lg:block xl:w-72">
      <label htmlFor="header-search" className="sr-only">搜索工具</label>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <input
        ref={inputRef}
        id="header-search"
        type="search"
        name="q"
        maxLength={MAX_SEARCH_LENGTH}
        enterKeyHint="search"
        autoComplete="off"
        placeholder="搜索工具或用途"
        aria-keyshortcuts="Control+K Meta+K"
        className="peer h-10 w-full rounded-xl border border-border bg-card pl-9 pr-14 text-sm text-foreground outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-muted-foreground hover:border-foreground/25 focus:border-foreground focus:ring-4 focus:ring-foreground/8 [&::-webkit-search-cancel-button]:hidden"
      />
      <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md border border-border bg-muted px-1.5 py-px font-mono text-[11px] text-muted-foreground peer-focus:opacity-0">
        {isApple ? "⌘K" : "Ctrl K"}
      </kbd>
    </form>
  );
}

function MobileMenu({ scenes, pathname }: { scenes: SceneNavItem[]; pathname: string }) {
  const [open, setOpen] = useState(false);
  const ready = scenes.filter((scene) => scene.count > 0);
  const pending = scenes.filter((scene) => scene.count === 0);
  const close = () => setOpen(false);
  const links = [
    { href: "/", label: "探索" },
    { href: "/search", label: "搜索" },
    { href: "/about", label: "收录标准" },
    { href: "/submit", label: "推荐工具" },
    { href: "/feedback", label: "反馈" },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="打开菜单">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[min(360px,88vw)] gap-0 p-0">
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle>菜单</SheetTitle>
          <SheetDescription className="sr-only">页面导航、按场景浏览与外观设置。</SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
          <nav aria-label="页面">
            <ul className="flex flex-col">
              {links.map((link) => {
                const active = pathname === link.href;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={close}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-base font-medium transition-colors hover:bg-muted ${active ? "bg-muted" : ""}`}
                    >
                      {active ? <span className="size-1.5 rounded-[2px] bg-brand" aria-hidden="true" /> : null}
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <section aria-labelledby="mobile-scenes" className="mt-6 border-t border-border pt-5">
            <h2 id="mobile-scenes" className="px-1 text-xs font-medium text-muted-foreground">按场景</h2>
            <ul className="mt-3 grid grid-cols-2 gap-2">
              {ready.map((scene) => (
                <li key={scene.id}>
                  <Link
                    href={`/scenes/${scene.id}`}
                    onClick={close}
                    aria-current={pathname === `/scenes/${scene.id}` ? "page" : undefined}
                    className="flex min-h-12 items-center gap-2.5 rounded-xl border border-border bg-card px-2.5 transition-colors hover:border-foreground/25 aria-[current=page]:border-foreground"
                  >
                    <SceneIcon id={scene.id} size={28} />
                    <span className="flex-1 truncate text-sm font-medium">{scene.name}</span>
                    <span className="font-mono text-xs text-muted-foreground tabular-nums">{scene.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
            {pending.length ? (
              <p className="mt-3 px-1 text-xs leading-relaxed text-muted-foreground">
                筹备中：{pending.map((scene) => scene.name).join("、")}
              </p>
            ) : null}
          </section>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4">
          <span className="text-sm text-muted-foreground">外观</span>
          <ThemeSegmented />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function SiteHeader({ scenes }: { scenes: SceneNavItem[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);
  const onSearchPage = pathname === "/search";

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey || event.key.toLowerCase() !== "k") return;
      event.preventDefault();
      // 顶栏搜索框可见时优先用它，其次是页面里的搜索框，都没有就去搜索页
      const header = searchRef.current;
      const target = header && header.offsetParent ? header : document.getElementById("search-page");
      if (target instanceof HTMLInputElement) {
        target.focus();
        target.select();
      } else {
        router.push("/search");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  return (
    <header className="glass sticky top-0 z-40 border-b border-border">
      <div className="shell flex h-16 items-center gap-3 lg:gap-6">
        <Logo className="-ml-1 px-1" />
        <nav aria-label="主导航" className="hidden items-center gap-0.5 md:flex">
          <Link href="/" aria-current={pathname === "/" ? "page" : undefined} className={navItemClass(pathname === "/")}>
            探索
            {pathname === "/" ? <ActiveBar /> : null}
          </Link>
          <ScenesMenu scenes={scenes} pathname={pathname} />
          <Link href="/about" aria-current={pathname === "/about" ? "page" : undefined} className={navItemClass(pathname === "/about")}>
            收录标准
            {pathname === "/about" ? <ActiveBar /> : null}
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          {onSearchPage ? null : (
            <>
              <HeaderSearch inputRef={searchRef} />
              <Button asChild variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground lg:hidden" aria-label="搜索工具">
                <Link href="/search">
                  <Search className="size-[18px]" />
                </Link>
              </Button>
            </>
          )}
          <ThemeToggle />
          <Button asChild variant="outline" size="sm" className="ml-1 hidden h-9 md:inline-flex">
            <Link href="/submit">
              <Plus />
              推荐工具
            </Link>
          </Button>
          <MobileMenu scenes={scenes} pathname={pathname} />
        </div>
      </div>
    </header>
  );
}
