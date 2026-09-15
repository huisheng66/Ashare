import { Badge } from "@/components/ui/badge";
import { sourceLabel } from "@/lib/items";
import type { SourceKind } from "@/data/types";

const styles: Record<SourceKind, string> = {
  official: "bg-official/10 text-official",
  opensource: "bg-opensource/10 text-opensource",
  discount: "bg-discount/10 text-discount",
};

export function SourceBadge({ kind }: { kind: SourceKind }) {
  return (
    <Badge className={`border-transparent ${styles[kind]}`}>
      {sourceLabel[kind]}
    </Badge>
  );
}
