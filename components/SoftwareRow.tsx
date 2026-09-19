import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PlatformList } from "@/components/PlatformList";
import { SoftwareIcon } from "@/components/SoftwareIcon";
import { SourceBadge } from "@/components/SourceBadge";
import { Card } from "@/components/ui/card";
import type { CatalogItem } from "@/data/types";

export function SoftwareRow({ item }: { item: CatalogItem }) {
  return (
    <Card className="flex-row items-center gap-4 px-4 py-3 transition-colors duration-200 hover:ring-primary/30">
      <Link
        href={`/software/${item.slug}`}
        className="shrink-0"
        aria-label={`查看详情：${item.name}`}
        tabIndex={-1}
      >
        <SoftwareIcon item={{ name: item.name, icon: item.icon, iconImage: item.iconImage }} size={56} />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link
            href={`/software/${item.slug}`}
            className="text-[15px] font-semibold tracking-tight transition-colors hover:text-primary"
          >
            {item.name}
          </Link>
          <SourceBadge kind={item.source} />
        </div>
        <p className="mt-0.5 line-clamp-1 max-w-[62ch] text-[13px] leading-snug text-muted-foreground">
          {item.summary}
        </p>
        <div className="mt-1">
          <PlatformList platforms={item.platforms} />
        </div>
      </div>
      <Button asChild size="sm" variant="secondary" className="shrink-0">
        <Link href={`/software/${item.slug}`} aria-label={`查看详情：${item.name}`}>详情</Link>
      </Button>
    </Card>
  );
}
