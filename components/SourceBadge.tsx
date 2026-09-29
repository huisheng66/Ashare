import type { CSSProperties } from "react";
import { GitBranch, ShieldCheck, TicketPercent, type LucideIcon } from "lucide-react";

import type { SourceKind } from "@/data/types";
import { sourceLabel } from "@/lib/items";

const meta: Record<SourceKind, { icon: LucideIcon; tone: string }> = {
  official: { icon: ShieldCheck, tone: "var(--official)" },
  opensource: { icon: GitBranch, tone: "var(--opensource)" },
  discount: { icon: TicketPercent, tone: "var(--discount)" },
};

/** 来源徽章：图标 + 文字 + 颜色，任何一项都不单独表达含义。plain 用于密集行。 */
export function SourceBadge({
  kind,
  plain = false,
  className = "",
}: {
  kind: SourceKind;
  plain?: boolean;
  className?: string;
}) {
  const { icon: Icon, tone } = meta[kind];
  return (
    <span
      className={`inline-flex h-6 shrink-0 items-center gap-1 rounded-full text-xs font-medium whitespace-nowrap ${plain ? "tone-text" : "tint-soft px-2"} ${className}`}
      style={{ "--tone": tone } as CSSProperties}
    >
      <Icon className="size-3.5" strokeWidth={2} aria-hidden="true" />
      {sourceLabel[kind]}
    </span>
  );
}
