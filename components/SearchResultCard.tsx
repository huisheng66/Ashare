import { SoftwareCard } from "@/components/SoftwareCard";
import type { CatalogItem } from "@/data/types";

/** 搜索结果和目录共享信息层级、平台和来源。 */
export function SearchResultCard({ item }: { item: CatalogItem }) {
  return <SoftwareCard item={item} />;
}
