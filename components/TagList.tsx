import Link from "next/link";
import { Hash } from "lucide-react";

/** 标签：点击即按标签搜索。 */
export function TagList({ tags }: { tags: string[] }) {
  if (!tags.length) return null;
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="标签">
      {tags.map((tag) => (
        <li key={tag}>
          <Link
            href={`/search?q=${encodeURIComponent(tag)}`}
            className="inline-flex h-7 items-center gap-0.5 rounded-full border border-border bg-card px-2.5 text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
          >
            <Hash className="size-3" aria-hidden="true" />
            {tag}
          </Link>
        </li>
      ))}
    </ul>
  );
}
