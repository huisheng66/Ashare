"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <section
      aria-labelledby="error-title"
      className="mx-auto w-full max-w-[980px] px-5 py-20 sm:px-8"
    >
      <p className="text-sm font-medium text-muted-foreground">暂时遇到一点问题</p>
      <h1 id="error-title" className="mt-2 text-[28px] font-bold tracking-tight">
        页面没有加载完成
      </h1>
      <p className="mt-3 max-w-[48ch] text-[15px] leading-relaxed text-muted-foreground">
        请重试一次。也可以回到探索，继续找需要的软件。
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Button type="button" onClick={retry}>重新加载</Button>
        <Button asChild variant="outline">
          <Link href="/">回到探索</Link>
        </Button>
      </div>
      {error.digest ? (
        <p className="mt-6 text-xs text-muted-foreground">
          如需反馈，请附上问题编号：{error.digest}
        </p>
      ) : null}
    </section>
  );
}
