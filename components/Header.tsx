"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { scenes } from "@/data/scenes";
import { CompactSearch } from "@/components/CompactSearch";

export function Header() {
  return (
    <Suspense fallback={<HeaderBar query="" />}>
      <HeaderWithSearch />
    </Suspense>
  );
}

function HeaderWithSearch() {
  const params = useSearchParams();
  return <HeaderBar query={params.get("q") ?? ""} />;
}

function HeaderBar({ query }: { query: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const showCompactSearch = pathname !== "/";

  return (
    <header className="sticky top-0 z-[30] border-b border-line bg-bg">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:h-16 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary text-[0.8rem] font-extrabold text-on-primary">
            A
          </span>
          <span className="text-[1.05rem] font-extrabold tracking-tight">
            Ashare
          </span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label="场景">
          {scenes.map((scene) => (
            <Link
              key={scene.id}
              href={`/scenes/${scene.id}`}
              className={`rounded-md px-2 py-1 text-[0.8125rem] font-medium transition-colors ${
                pathname === `/scenes/${scene.id}`
                  ? "bg-surface text-ink"
                  : "text-muted hover:text-ink"
              }`}
            >
              {scene.name}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {showCompactSearch ? (
            <div className="hidden sm:block">
              <CompactSearch defaultValue={query} />
            </div>
          ) : null}
          <Link
            href="/submit"
            className="hidden h-9 items-center rounded-lg bg-primary px-3 text-[0.8125rem] font-semibold text-on-primary hover:bg-primary-hover sm:inline-flex"
          >
            提交推荐
          </Link>
          <Link
            href="/about"
            className="hidden text-[0.8125rem] font-medium text-muted hover:text-ink sm:inline"
          >
            收录标准
          </Link>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">{open ? "关闭菜单" : "打开菜单"}</span>
            <span aria-hidden className="text-lg leading-none">
              {open ? "×" : "☰"}
            </span>
          </button>
        </div>
      </div>

      {open ? (
        <div
          id="mobile-nav"
          className="border-t border-line bg-bg px-4 py-3 lg:hidden"
        >
          <nav className="flex flex-col gap-1" aria-label="移动导航">
            {scenes.map((scene) => (
              <Link
                key={scene.id}
                href={`/scenes/${scene.id}`}
                className="rounded-md px-2 py-2 text-[0.9375rem] font-medium"
                onClick={() => setOpen(false)}
              >
                {scene.name}
              </Link>
            ))}
            <Link
              href="/submit"
              className="rounded-md px-2 py-2 font-semibold text-primary"
              onClick={() => setOpen(false)}
            >
              提交推荐
            </Link>
            <Link
              href="/about"
              className="rounded-md px-2 py-2 text-muted"
              onClick={() => setOpen(false)}
            >
              收录标准
            </Link>
          </nav>
          {showCompactSearch ? (
            <div className="mt-3 sm:hidden">
              <CompactSearch defaultValue={query} />
            </div>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
