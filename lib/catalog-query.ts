import type { ItemKind, Platform, SceneId, Software } from "@/data/types";

export type SearchParamValue = string | string[] | undefined;
export type PageSearchParams = Record<string, SearchParamValue>;

export const sceneIds: SceneId[] = [
  "code", "docs", "design", "data", "office", "engineering",
  "tools", "photo", "games", "education", "music", "social",
];
export const platformIds: Platform[] = ["windows", "macos", "linux"];
export const kindIds: ItemKind[] = ["app", "script", "opensource"];
export const MAX_SEARCH_LENGTH = 200;

/** 标量参数与 URLSearchParams.get 保持一致：重复参数取第一个值。 */
export function firstSearchParam(value: SearchParamValue): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export function searchQueryParam(value: SearchParamValue): string {
  return firstSearchParam(value)
    .normalize("NFKC")
    .replace(/\s+/gu, " ")
    .trim()
    .slice(0, MAX_SEARCH_LENGTH);
}

/** 同时兼容逗号分隔与重复参数，只接受已知值并去重。 */
function listParam<T extends string>(
  value: SearchParamValue,
  allowed: readonly T[],
): Set<T> {
  const values = Array.isArray(value) ? value : [value ?? ""];
  const candidates = values.flatMap((part) => part.split(",").map((v) => v.trim()));
  return new Set(candidates.filter((v): v is T => allowed.includes(v as T)));
}

export function isSceneId(value: string): value is SceneId {
  return sceneIds.includes(value as SceneId);
}

export type CatalogFilters = {
  scenes: Set<SceneId>;
  platforms: Set<Platform>;
  kinds: Set<ItemKind>;
  discountOnly: boolean;
  sort: "featured" | "updated" | "name";
};

export function parseCatalogFilters(params: PageSearchParams): CatalogFilters {
  const sort = firstSearchParam(params.sort);
  return {
    scenes: listParam(params.scene, sceneIds),
    platforms: listParam(params.platform, platformIds),
    kinds: listParam(params.kind, kindIds),
    discountOnly: firstSearchParam(params.discount) === "1",
    sort: sort === "updated" || sort === "name" ? sort : "featured",
  };
}

/** 将只读 URLSearchParams 转成与服务端一致的输入，保留所有重复值。 */
export function catalogFiltersFromURL(
  params: Pick<URLSearchParams, "getAll">,
): CatalogFilters {
  return parseCatalogFilters({
    scene: params.getAll("scene"),
    platform: params.getAll("platform"),
    kind: params.getAll("kind"),
    discount: params.getAll("discount"),
    sort: params.getAll("sort"),
  });
}

export function activeFilterCount(filters: CatalogFilters): number {
  return filters.scenes.size + filters.platforms.size + filters.kinds.size +
    Number(filters.discountOnly);
}

/** 清除筛选不改变用户选好的视图、排序或其他查询参数。 */
export function clearCatalogFilters(params: URLSearchParams): void {
  for (const key of ["scene", "platform", "kind", "discount"]) params.delete(key);
}

export function catalogHref(params: URLSearchParams): string {
  const query = params.toString();
  return query ? `/?${query}` : "/";
}

const nameCollator = new Intl.Collator("zh-CN", { numeric: true, sensitivity: "base" });

type FilterableItem = Pick<Software,
  "scenes" | "platforms" | "kind" | "source" | "name" | "featured" | "updatedAt"
>;

export function selectCatalogItems<T extends FilterableItem>(
  items: readonly T[],
  filters: CatalogFilters,
): T[] {
  const shown = items.filter((item) =>
    (!filters.scenes.size || item.scenes.some((id) => filters.scenes.has(id))) &&
    (!filters.platforms.size || item.platforms.some((id) => filters.platforms.has(id))) &&
    (!filters.kinds.size || filters.kinds.has(item.kind)) &&
    (!filters.discountOnly || item.source === "discount"),
  );
  if (filters.sort === "name") {
    shown.sort((a, b) => nameCollator.compare(a.name, b.name));
  } else if (filters.sort === "updated") {
    shown.sort((a, b) =>
      (Date.parse(b.updatedAt ?? "") || 0) - (Date.parse(a.updatedAt ?? "") || 0),
    );
  } else {
    shown.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
  }
  return shown;
}
