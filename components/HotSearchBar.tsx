import Link from "next/link";
import { TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";

const terms = [
  "VS Code",
  "Python",
  "Git",
  "Blender",
  "Obsidian",
  "CAD",
  "笔记",
];

export function HotSearchBar() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground">
        <TrendingUp className="size-3.5" />
        热门
      </span>
      {terms.map((term) => (
        <Link key={term} href={`/search?q=${encodeURIComponent(term)}`}>
          <Badge
            variant="secondary"
            className="h-7 rounded-full px-3 text-[13px] transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            {term}
          </Badge>
        </Link>
      ))}
    </div>
  );
}
