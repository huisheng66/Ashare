import Link from "next/link";
import { ArrowUpRight, LogOut } from "lucide-react";

import { AdminTabs } from "@/components/AdminTabs";
import { Button } from "@/components/ui/button";
import { hasValidSession } from "@/lib/auth";
import { getFeedback } from "@/lib/store";
import { logout } from "./actions";

export const metadata = {
  title: "后台",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await hasValidSession();
  const unread = authed ? (await getFeedback()).filter((f) => !f.read).length : 0;

  return (
    <div className="flex-1">
      <div className="border-b border-border bg-card/60">
        <div className="shell flex min-h-14 flex-wrap items-center gap-x-4 gap-y-2 py-2">
          <p className="inline-flex items-center gap-2 text-sm font-semibold">
            <span className="size-1.5 rounded-[2px] bg-brand" aria-hidden="true" />
            管理后台
          </p>
          {authed ? (
            <>
              <AdminTabs unread={unread} />
              <div className="ml-auto flex items-center gap-1">
                <Button asChild variant="ghost" size="sm">
                  <Link href="/">
                    查看前台
                    <ArrowUpRight />
                  </Link>
                </Button>
                <form action={logout}>
                  <Button type="submit" variant="ghost" size="sm" className="text-muted-foreground">
                    <LogOut />
                    退出
                  </Button>
                </form>
              </div>
            </>
          ) : null}
        </div>
      </div>
      <div className="shell py-8">{children}</div>
    </div>
  );
}
