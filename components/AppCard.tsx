import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlatformList } from "@/components/PlatformList";
import { SoftwareIcon } from "@/components/SoftwareIcon";
import { SourceBadge } from "@/components/SourceBadge";
import type { Software } from "@/data/types";

export function AppCard({ item }: { item: Software }) {
  return (
    <Card className="w-[240px] shrink-0 transition-shadow duration-200 hover:shadow-card-hover">
      <CardContent className="flex h-full flex-col">
        <div className="flex items-center gap-3">
          <SoftwareIcon item={item} size={44} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{item.name}</p>
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
            <Link href={`/software/${item.slug}`}>查看</Link>
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
  items: Software[];
  className?: string;
}) {
  return (
    <div className={`scroll-row gap-3 pb-2 ${className}`}>
      {items.map((item) => (
        <AppCard key={item.slug} item={item} />
      ))}
    </div>
  );
}
