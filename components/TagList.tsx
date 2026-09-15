import { Badge } from "@/components/ui/badge";

export function TagList({ tags }: { tags: string[] }) {
  if (!tags.length) return null;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <li key={tag}>
          <Badge variant="secondary">{tag}</Badge>
        </li>
      ))}
    </ul>
  );
}
