import { platformLabel } from "@/lib/items";
import type { Platform } from "@/data/types";

export function PlatformList({ platforms }: { platforms: Platform[] }) {
  return (
    <span className="text-[12px] text-muted-foreground">
      {platforms.map((p) => platformLabel[p]).join(" · ")}
    </span>
  );
}
