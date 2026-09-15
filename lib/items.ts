import type {
  Platform,
  Software,
  SourceKind,
  ItemKind,
} from "@/data/types";

/** 纯函数与常量（客户端组件可安全引用）；数据访问在 lib/catalog.ts */

export const platformLabel: Record<Platform, string> = {
  windows: "Windows",
  macos: "macOS",
  linux: "Linux",
};

export const sourceLabel: Record<SourceKind, string> = {
  official: "官方",
  opensource: "开源",
  discount: "优惠",
};

export const kindLabel: Record<ItemKind, string> = {
  app: "应用",
  script: "脚本",
  opensource: "开源项目",
};

/** 主下载按钮：官网 → GitHub → 产品主页；镜像永不做主 CTA */
export function primaryLink(item: Software): { url: string; label: string } {
  if (item.links.official) return { url: item.links.official, label: "官网" };
  if (item.links.github) return { url: item.links.github, label: "GitHub" };
  if (item.links.homepage) return { url: item.links.homepage, label: "主页" };
  return { url: "", label: "" };
}

/** 名称/别名/标签命中权重高于简介与正文；同级保持原顺序 */
export function searchSoftware(query: string, items: Software[]): Software[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return items;
  const scored: { item: Software; score: number }[] = [];
  for (const item of items) {
    const name = `${item.name} ${item.nameZh ?? ""}`.toLowerCase();
    const aliases = item.aliases.join(" ").toLowerCase();
    const tags = item.tags.join(" ").toLowerCase();
    const summary = item.summary.toLowerCase();
    const body = `${item.body} ${item.whoFor} ${item.whoNot} ${item.kind}`.toLowerCase();
    let score = 0;
    if (name.startsWith(needle)) score = 120;
    else if (name.includes(needle)) score = 100;
    else if (aliases.includes(needle)) score = 80;
    else if (tags.includes(needle)) score = 50;
    else if (summary.includes(needle)) score = 30;
    else if (body.includes(needle)) score = 10;
    if (score > 0) scored.push({ item, score });
  }
  return scored
    .sort((a, b) => b.score - a.score)
    .map(({ item }) => item);
}

export function filterSoftware(
  items: Software[],
  opts: { platform?: Platform | "all"; source?: SourceKind | "all" },
): Software[] {
  return items.filter((item) => {
    const platformOk =
      !opts.platform || opts.platform === "all"
        ? true
        : item.platforms.includes(opts.platform);
    const sourceOk =
      !opts.source || opts.source === "all" ? true : item.source === opts.source;
    return platformOk && sourceOk;
  });
}
