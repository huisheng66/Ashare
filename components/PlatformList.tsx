import type { Platform } from "@/data/types";
import { platformLabel, platformShort } from "@/lib/items";

/** 平台列表；short 用简写省位置，读屏仍读完整名称。 */
export function PlatformList({
  platforms,
  short = false,
  className = "",
}: {
  platforms: Platform[];
  short?: boolean;
  className?: string;
}) {
  const full = platforms.map((p) => platformLabel[p]).join(" · ");
  if (!short) {
    return <span className={`text-xs text-muted-foreground ${className}`}>{full}</span>;
  }
  return (
    <span className={`text-xs text-muted-foreground ${className}`}>
      <span aria-hidden="true">{platforms.map((p) => platformShort[p]).join(" · ")}</span>
      <span className="sr-only">{full}</span>
    </span>
  );
}
