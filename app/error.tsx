"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";

import { Eyebrow } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <section aria-labelledby="error-title" className="shell pb-24 pt-16 sm:pt-24">
      <div className="max-w-xl">
        <Eyebrow>出了点问题</Eyebrow>
        <h1 id="error-title" className="mt-3 text-[32px] font-bold leading-tight tracking-[-0.015em] sm:text-[44px]">
          页面没有加载完成
        </h1>
        <p className="mt-3 text-[15px] leading-[1.75] text-muted-foreground">
          多半是暂时的，重试一次通常就好。也可以先回到探索，继续找要用的工具。
        </p>
        <div className="mt-8 flex flex-wrap gap-2">
          <Button type="button" onClick={retry}>
            <RotateCcw />
            重试
          </Button>
          <Button asChild variant="outline">
            <Link href="/">回到探索</Link>
          </Button>
        </div>
        {error.digest ? (
          <p className="mt-10 border-t border-border pt-5 text-xs text-muted-foreground">
            反馈时请附上问题编号：<span className="font-mono text-foreground">{error.digest}</span>
          </p>
        ) : null}
      </div>
    </section>
  );
}
