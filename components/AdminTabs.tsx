"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { can, type Role } from "@/lib/users";

const tabs = [
  { href: "/admin", label: "条目", permission: null, match: (path: string) => path === "/admin" || path.startsWith("/admin/items") },
  { href: "/admin/inbox", label: "投稿与反馈", permission: null, match: (path: string) => path.startsWith("/admin/inbox") },
  { href: "/admin/clicks", label: "点击数据", permission: null, match: (path: string) => path.startsWith("/admin/clicks") },
  { href: "/admin/users", label: "账号", permission: "users", match: (path: string) => path.startsWith("/admin/users") },
] as const;

/**
 * 后台分段式标签；未读反馈数挂在「投稿与反馈」上。
 *
 * **按权限过滤标签**：「账号」只对管理员出现。给编辑显示一个点进去会被重定向的
 * 标签，比不显示更糟 —— 它看起来是个能用的入口。
 */
export function AdminTabs({ unread, role }: { unread: number; role: Role }) {
  const pathname = usePathname();
  const visible = tabs.filter((tab) => !tab.permission || can(role, tab.permission));
  return (
    <nav aria-label="后台导航" className="inline-flex flex-wrap gap-1 rounded-xl bg-muted p-1">
      {visible.map((tab) => {
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
