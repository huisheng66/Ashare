"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin", label: "条目", match: (path: string) => path === "/admin" || path.startsWith("/admin/items") },
  { href: "/admin/inbox", label: "投稿与反馈", match: (path: string) => path.startsWith("/admin/inbox") },
];

/** 后台分段式标签；未读反馈数挂在「投稿与反馈」上。 */
export function AdminTabs({ unread }: { unread: number }) {
  const pathname = usePathname();
  return (
    <nav aria-label="后台导航" className="inline-flex rounded-xl bg-muted p-1">
      {tabs.map((tab) => {
        const active = tab.match(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition-colors pointer-coarse:h-11 ${
              active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            {tab.href === "/admin/inbox" && unread > 0 ? (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1.5 font-mono text-[11px] text-brand-foreground tabular-nums">
                {unread}
                <span className="sr-only">条未读</span>
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
