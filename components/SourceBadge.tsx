import { sourceLabel } from "@/lib/catalog";
import type { SourceKind } from "@/data/types";

const styles: Record<SourceKind, string> = {
  opensource: "bg-primary text-on-primary",
  official: "bg-official text-on-primary",
  discount: "bg-accent text-on-accent",
};

export function SourceBadge({ kind }: { kind: SourceKind }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.75rem] font-medium leading-tight ${styles[kind]}`}
    >
      {sourceLabel[kind]}
    </span>
  );
}
