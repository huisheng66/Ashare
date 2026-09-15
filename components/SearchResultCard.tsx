import Link from "next/link";
import { scenes } from "@/data/scenes";
import type { Software } from "@/data/types";
import { kindLabel } from "@/lib/items";
import { SoftwareIcon } from "@/components/SoftwareIcon";

export function SearchResultCard({ item }: { item: Software }) {
  const subtitle = [
    kindLabel[item.kind],
    ...item.scenes
      .map((sid) => scenes.find((s) => s.id === sid)?.name)
      .filter(Boolean),
    ...item.tags.slice(0, 3),
  ].join(" · ");
  const color = item.icon.color;

  return (
    <article className="group overflow-hidden rounded-xl border border-border bg-background shadow-card transition-shadow duration-200 hover:shadow-card-hover">
      <div className="flex items-center gap-3 p-3.5">
        <Link href={`/software/${item.slug}`} className="shrink-0">
          <SoftwareIcon item={item} size={40} />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            href={`/software/${item.slug}`}
            className="block truncate text-[15px] font-semibold tracking-tight text-foreground hover:text-primary"
          >
            {item.name}
          </Link>
          <p className="mt-0.5 truncate text-[12px] text-muted-foreground">{subtitle}</p>
        </div>
        <Link
          href={`/software/${item.slug}`}
          className="inline-flex h-7 shrink-0 items-center rounded-md border border-border px-3 text-[13px] font-medium text-primary transition-colors hover:bg-primary/[0.06]"
        >
          查看
        </Link>
      </div>
      <Link
        href={`/software/${item.slug}`}
        aria-label={item.name}
        className="block aspect-[3/2] w-full"
        style={{
          background: `linear-gradient(135deg, ${color}40 0%, ${color}14 55%, #ffffff 100%)`,
        }}
      >
        {item.previews[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.previews[0]}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <span className="flex h-full items-center justify-center">
            <SoftwareIcon
              item={item}
              size={72}
              className="bg-white/70 shadow-sm ring-1 ring-black/5"
            />
          </span>
        )}
      </Link>
    </article>
  );
}
