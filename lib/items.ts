import type {
  CatalogItem,
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

/** 列表无需下载正文、安装步骤、替代品和站外链接等详情数据。 */
export function toCatalogItem(item: Software): CatalogItem {
  return {
    slug: item.slug,
    name: item.name,
    nameZh: item.nameZh,
    kind: item.kind,
    tags: item.tags,
    summary: item.summary,
    scenes: item.scenes,
    platforms: item.platforms,
    source: item.source,
    price: item.price,
    featured: item.featured,
    previews: item.previews.slice(0, 1),
    iconImage: item.iconImage,
    icon: item.icon,
  };
}

function normalizeSearchText(value: string): string {
  return value.normalize("NFKC").toLowerCase().replace(/\s+/gu, " ").trim();
}

/** 支持全角输入、连续空白与跨字段多关键词；每个词都必须命中。 */
export function searchSoftware(query: string, items: Software[]): Software[] {
  const needle = normalizeSearchText(query);
  if (!needle) return items;
  const terms = [...new Set(needle.split(" "))];
  const scored: { item: Software; score: number }[] = [];
  for (const item of items) {
    const names = [item.name, item.nameZh ?? ""].map(normalizeSearchText);
    const aliases = item.aliases.map(normalizeSearchText);
    const tags = item.tags.map(normalizeSearchText);
    const summary = normalizeSearchText(item.summary);
    const body = normalizeSearchText(`${item.body} ${item.whoFor} ${item.whoNot} ${kindLabel[item.kind]}`);
    const scoreTerm = (term: string): number => {
      if (names.some((name) => name === term)) return 200;
      if (names.some((name) => name.startsWith(term))) return 120;
      if (names.some((name) => name.includes(term))) return 100;
      if (aliases.some((alias) => alias === term)) return 90;
      if (aliases.some((alias) => alias.includes(term))) return 80;
      if (tags.some((tag) => tag.includes(term))) return 50;
      if (summary.includes(term)) return 30;
      if (body.includes(term)) return 10;
      return 0;
    };
    const termScores = terms.map(scoreTerm);
    if (termScores.some((score) => score === 0)) continue;
    const phraseBonus = terms.length > 1 ? scoreTerm(needle) : 0;
    scored.push({ item, score: termScores.reduce((total, score) => total + score, phraseBonus) });
  }
  // 稳定排序让同分条目继续遵循编辑维护的目录顺序。
  return scored.sort((a, b) => b.score - a.score).map(({ item }) => item);
}

export function filterSoftware<T extends Pick<Software, "platforms" | "source">>(
  items: T[],
  opts: { platform?: Platform | "all"; source?: SourceKind | "all" },
): T[] {
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
