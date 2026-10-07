import Link from "next/link";
import { ChevronRight } from "lucide-react";

type Crumb = { href?: string; label: string };

/** 面包屑：最后一项是当前页，不可点。 */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="当前位置">
      <ol className="flex flex-wrap items-center gap-1 text-[13px] text-muted-foreground">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1">
            {index > 0 ? <ChevronRight className="size-3.5 shrink-0 opacity-60" aria-hidden="true" /> : null}
            {item.href ? (
              <Link href={item.href} className="rounded-sm transition-colors hover:text-foreground">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="truncate font-medium text-foreground">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
