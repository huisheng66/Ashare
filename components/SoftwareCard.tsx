import Link from "next/link";

import { NavIcon } from "@/components/SidebarIcons";
import { SoftwarePreview } from "@/components/SoftwarePreview";
import { PlatformList } from "@/components/PlatformList";
import { SourceBadge } from "@/components/SourceBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { scenes } from "@/data/scenes";
import type { CatalogItem } from "@/data/types";
import { sceneColors } from "@/lib/colors";
import { kindLabel } from "@/lib/items";

/** 网格卡片：首页与类别页共用 */
export function SoftwareCard({ item }: { item: CatalogItem }) {
  return (
    <Card className="group relative gap-0 overflow-hidden py-0 transition-colors duration-200 hover:ring-primary/30">
      <Link
        href={`/software/${item.slug}`}
        aria-label={`查看详情：${item.name}`}
        tabIndex={-1}
        className="relative block aspect-[16/10] overflow-hidden"
      >
        <SoftwarePreview item={{ name: item.name, previews: item.previews, icon: item.icon, iconImage: item.iconImage }} />
      </Link>
      {item.featured ? (
        <Badge className="pointer-events-none absolute left-3 top-3">精选</Badge>
      ) : null}

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

        <h3 className="mt-2 line-clamp-2 text-base font-semibold leading-snug">
          <Link href={`/software/${item.slug}`} className="transition-colors hover:text-primary">{item.name}</Link>
        </h3>
        <p className="mt-1 line-clamp-2 text-[13px] leading-snug text-muted-foreground">
          {item.summary}
        </p>
        {item.tags.length ? (
          <p className="mt-1.5 truncate text-[11px] text-muted-foreground">
            {kindLabel[item.kind]}
            {item.tags.slice(0, 3).map((tag) => ` · ${tag}`)}
          </p>
        ) : null}

        <div className="mt-auto pt-3"><PlatformList platforms={item.platforms} /></div>
        <div className="mt-3 flex items-end justify-between gap-2 border-t border-border pt-3">
          <span
            className="truncate text-base font-bold leading-6"
            title={item.price ?? "免费"}
          >
            {item.price ?? "免费"}
          </span>
          <Button asChild size="sm" variant="secondary">
            <Link href={`/software/${item.slug}`} aria-label={`查看详情：${item.name}`}>查看详情</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}