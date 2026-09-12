import { platformLabel } from "@/lib/catalog";
import type { Platform } from "@/data/types";

export function PlatformList({ platforms }: { platforms: Platform[] }) {
  return (
    <span className="text-[0.75rem] font-medium text-muted">
      {platforms.map((p) => platformLabel[p]).join(" · ")}
    </span>
  );
}
