import Link from "next/link";

import { SearchPanel } from "@/components/SearchPanel";
import { Eyebrow } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { taskSuggestions } from "@/lib/navigation";

export default function NotFound() {
  return (
    <div className="shell pb-24 pt-16 sm:pt-24">
      <div className="max-w-xl">
        <Eyebrow>
          <span className="font-mono">404</span>
        </Eyebrow>
        <h1 className="mt-3 text-[32px] font-bold leading-tight tracking-[-0.015em] sm:text-[44px]">没有这个页面</h1>
        <p className="mt-3 text-[15px] leading-[1.75] text-muted-foreground">
          可能是链接写错了，或者这款工具还没收录。直接搜一下试试：
        </p>
        <SearchPanel className="mt-6" />
        <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="搜索建议">
          {taskSuggestions.slice(0, 5).map((term) => (
            <li key={term}>
              <Link
                href={`/search?q=${encodeURIComponent(term)}`}
                className="inline-flex h-8 items-center rounded-full border border-border bg-card px-3 text-[13px] transition-colors hover:border-foreground/30 pointer-coarse:h-11"
              >
                {term}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-10 flex flex-wrap gap-2 border-t border-border pt-6">
          <Button asChild>
            <Link href="/">回到探索</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/submit">推荐一款工具</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
