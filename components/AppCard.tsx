import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlatformList } from "@/components/PlatformList";
import { SoftwareIcon } from "@/components/SoftwareIcon";
import { SourceBadge } from "@/components/SourceBadge";
import type { CatalogItem } from "@/data/types";

export function AppCard({ item }: { item: CatalogItem }) {
  return (
    <Card className="w-[240px] shrink-0 transition-colors duration-200 hover:ring-primary/30">
      <CardContent className="flex h-full flex-col">
        <div className="flex items-center gap-3">
          <SoftwareIcon item={{ name: item.name, icon: item.icon, iconImage: item.iconImage }} size={44} />
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold"><Link href={`/software/${item.slug}`} className="hover:text-primary">{item.name}</Link></h3>
            <div className="mt-1">
              <SourceBadge kind={item.source} />
            </div>
          </div>
        </div>
        <p className="mt-3 line-clamp-2 min-h-[2.6em] text-[13px] leading-snug text-muted-foreground">
          {item.summary}
        </p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <div className="min-w-0 truncate">
            <PlatformList platforms={item.platforms} />
          </div>
          <Button asChild size="sm" variant="secondary">
            <Link href={`/software/${item.slug}`} aria-label={`查看详情：${item.name}`}>详情</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function AppCardRow({
  items,
  className = "",
}: {
  items: CatalogItem[];
  className?: string;
}) {
  return (
    <div role="list" aria-label="精选工具" className={`scroll-row gap-3 px-px py-1 ${className}`}>
      {items.map((item) => (
        <div key={item.slug} role="listitem" className="shrink-0"><AppCard item={item} /></div>
      ))}
    </div>
  );
}
