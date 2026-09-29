import { ArrowUpRight, GitBranch, Globe, HardDrive, House, type LucideIcon } from "lucide-react";

import type { ItemLinks as ItemLinksData } from "@/data/types";

export function hostOf(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

type Row = { label: string; url: string; icon: LucideIcon };

function LinkRow({ row }: { row: Row }) {
  const Icon = row.icon;
  return (
    <a
      href={row.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex min-h-11 items-center gap-3 rounded-xl px-3 transition-colors hover:bg-muted"
    >
      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span className="shrink-0 text-sm">{row.label}</span>
      <span className="ml-auto min-w-0 truncate font-mono text-xs text-muted-foreground">
        {hostOf(row.url)}
      </span>
      <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:-translate-y-px group-hover:translate-x-px group-hover:text-foreground" aria-hidden="true" />
      <span className="sr-only">（在新标签页打开）</span>
    </a>
  );
}

function linkRows(links: ItemLinksData, exclude?: string): Row[] {
  return [
    links.official && { label: "官网", url: links.official, icon: Globe },
    links.homepage && { label: "产品主页", url: links.homepage, icon: House },
    links.github && { label: "GitHub", url: links.github, icon: GitBranch },
    links.disk && { label: "已核验镜像", url: links.disk, icon: HardDrive },
  ].filter((row): row is Row => Boolean(row) && (row as Row).url !== exclude);
}

/** 除主渠道外还有几条可列的渠道。 */
export function otherLinkCount(links: ItemLinksData, primaryUrl: string) {
  return linkRows(links, primaryUrl).length;
}

/** 获取渠道：官网 → 产品主页 → GitHub → 已核验镜像。镜像必须附说明。exclude 用来去掉已做成主按钮的那条。 */
export function ItemLinks({ links, exclude }: { links: ItemLinksData; exclude?: string }) {
  const rows = linkRows(links, exclude);

  if (!rows.length) {
    return <p className="px-3 text-sm text-muted-foreground">暂未填写链接。</p>;
  }

  return (
    <div>
      <ul className="-mx-3 flex flex-col">
        {rows.map((row) => (
          <li key={row.label}>
            <LinkRow row={row} />
          </li>
        ))}
      </ul>
      {links.disk ? (
        <p className="mt-2 rounded-xl bg-muted px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">镜像说明：</span>
          {links.diskNote || "作者或项目方提供的合法镜像。请优先使用官网或 GitHub。"}
        </p>
      ) : null}
    </div>
  );
}
