import Link from "next/link";
import { ExternalButton } from "@/components/ExternalButton";
import { PlatformList } from "@/components/PlatformList";
import { SoftwareIcon } from "@/components/SoftwareIcon";
import { SourceBadge } from "@/components/SourceBadge";
import type { Software } from "@/data/types";

export function SoftwareRow({
  item,
  showAction = true,
}: {
  item: Software;
  showAction?: boolean;
}) {
  return (
    <article className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-2 border-b border-line py-3.5 sm:grid-cols-[auto_1fr_auto] sm:gap-x-4">
      <Link href={`/software/${item.slug}`} className="self-start sm:self-center">
        <SoftwareIcon item={item} size={44} />
      </Link>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link
            href={`/software/${item.slug}`}
            className="text-[0.9875rem] font-semibold text-ink hover:text-primary"
          >
            {item.name}
            {item.nameZh ? (
              <span className="ml-1.5 font-medium text-muted">{item.nameZh}</span>
            ) : null}
          </Link>
          <SourceBadge kind={item.source} />
        </div>
        <p className="mt-0.5 max-w-[62ch] text-[0.875rem] leading-snug text-muted">
          {item.summary}
        </p>
        <div className="mt-1">
          <PlatformList platforms={item.platforms} />
        </div>
      </div>
      {showAction ? (
        <div className="col-span-2 flex justify-end sm:col-span-1 sm:justify-self-end">
          <ExternalButton href={item.officialUrl} className="h-10 px-3 text-[0.8125rem]">
            前往官网
          </ExternalButton>
        </div>
      ) : null}
    </article>
  );
}
