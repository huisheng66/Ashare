import { ExternalLink, GitBranch, Globe, HardDrive } from "lucide-react";

import { Card } from "@/components/ui/card";
import type { ItemLinks as ItemLinksData } from "@/data/types";

function hostOf(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

type Row = { label: string; url: string; icon: typeof Globe };

function LinkRow({ row }: { row: Row }) {
  const Icon = row.icon;
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className="w-16 shrink-0 text-[13px] text-muted-foreground">
        {row.label}
      </span>
      <a
        href={row.url}
        target="_blank"
        rel="noopener noreferrer"
        className="min-w-0 flex-1 truncate text-sm font-medium text-primary hover:underline"
      >
        {hostOf(row.url)}
      </a>
      <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
    </div>
  );
}

export function ItemLinks({ links }: { links: ItemLinksData }) {
  const rows = [
    links.official && { label: "官网", url: links.official, icon: Globe },
    links.homepage && {
      label: "产品主页",
      url: links.homepage,
      icon: ExternalLink,
    },
    links.github && { label: "GitHub", url: links.github, icon: GitBranch },
  ].filter((row): row is Row => Boolean(row));

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="divide-y divide-border">
        {rows.map((row) => (
          <LinkRow key={row.label} row={row} />
        ))}
        {links.disk ? (
          <>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <HardDrive className="size-4 shrink-0 text-muted-foreground" />
              <span className="w-16 shrink-0 text-[13px] text-muted-foreground">
                镜像
              </span>
              <a
                href={links.disk}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 flex-1 truncate text-sm font-medium text-primary hover:underline"
              >
                {hostOf(links.disk)}
              </a>
              <ExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
            </div>
            <div className="px-4 py-3.5">
              <p className="text-[13px] text-muted-foreground">镜像说明</p>
              <p className="mt-1 text-sm leading-relaxed">
                {links.diskNote ||
                  "作者或项目方提供的合法镜像。请优先使用官网或 GitHub。"}
              </p>
            </div>
          </>
        ) : null}
        {!rows.length && !links.disk ? (
          <p className="px-4 py-3.5 text-sm text-muted-foreground">
            暂未填写链接。
          </p>
        ) : null}
      </div>
    </Card>
  );
}
