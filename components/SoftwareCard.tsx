import Link from "next/link";

import { NavIcon } from "@/components/SidebarIcons";
import { SoftwareIcon } from "@/components/SoftwareIcon";
import { SourceBadge } from "@/components/SourceBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { scenes } from "@/data/scenes";
import type { Software } from "@/data/types";
import { sceneColors } from "@/lib/colors";
import { kindLabel } from "@/lib/items";

/** 网格卡片：首页与类别页共用 */
export function SoftwareCard({ item }: { item: Software }) {
  return (
    <Card className="group gap-0 overflow-hidden py-0 transition-shadow duration-200 hover:shadow-card-hover">
      <Link
        href={`/software/${item.slug}`}
        className="relative block aspect-[16/10] overflow-hidden"
      >
        {item.previews[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.previews[0]}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
            <SoftwareIcon item={item} size={64} />
          </div>
        )}
        {item.featured ? (
          <Badge className="absolute left-3 top-3">NEW</Badge>
        ) : null}
      </Link>

      <CardContent className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {item.scenes.slice(0, 2).map((sid) => (
            <span
              key={sid}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
            >
              <NavIcon id={sid} color={sceneColors[sid]} className="size-3" />
              {scenes.find((s) => s.id === sid)?.name}
            </span>
          ))}
          <SourceBadge kind={item.source} />
        </div>

        <Link
          href={`/software/${item.slug}`}
          className="mt-2 line-clamp-2 text-base font-semibold leading-snug transition-colors hover:text-primary"
        >
          {item.name}
        </Link>
        <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-muted-foreground">
          {item.summary}
        </p>
        {item.tags.length ? (
          <p className="mt-1.5 truncate text-[11px] text-muted-foreground">
            {kindLabel[item.kind]}
            {item.tags.slice(0, 3).map((tag) => ` · ${tag}`)}
          </p>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <span
            className="truncate text-base font-bold leading-6"
            title={item.price ?? "免费"}
          >
            {item.price ?? "免费"}
          </span>
          <Button asChild size="sm" variant="secondary">
            <Link href={`/software/${item.slug}`}>查看</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}