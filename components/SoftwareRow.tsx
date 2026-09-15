import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlatformList } from "@/components/PlatformList";
import { SoftwareIcon } from "@/components/SoftwareIcon";
import { SourceBadge } from "@/components/SourceBadge";
import { Card } from "@/components/ui/card";
import type { Software } from "@/data/types";
import { primaryLink } from "@/lib/items";

export function SoftwareRow({ item }: { item: Software }) {
  const primary = primaryLink(item);
  return (
    <Card className="flex-row items-center gap-4 px-4 py-3 transition-shadow duration-200 hover:shadow-card-hover">
      <Link
        href={`/software/${item.slug}`}
        className="shrink-0"
        aria-label={item.name}
      >
        <SoftwareIcon item={item} size={56} />
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
      {primary.url ? (
        <Button asChild size="sm" className="shrink-0">
          <a href={primary.url} target="_blank" rel="noopener noreferrer">
            前往
          </a>
        </Button>
      ) : null}
    </Card>
  );
}