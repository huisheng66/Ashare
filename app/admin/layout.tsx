import Link from "next/link";

import { Badge } from "@/components/ui/badge";
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
    <div className="mx-auto w-full max-w-[960px] px-5 py-8 sm:px-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-bold tracking-tight">Ashare 后台</h1>
        {authed ? (
          <div className="flex items-center gap-1">
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin">条目</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/inbox">
                投稿与反馈
                {unread > 0 ? (
                  <Badge className="ml-0.5 bg-discount text-white">
                    {unread}
                  </Badge>
                ) : null}
              </Link>
            </Button>
            <form action={logout}>
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
              >
                退出登录
              </Button>
            </form>
          </div>
        ) : null}
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}
