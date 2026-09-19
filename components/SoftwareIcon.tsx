"use client";

import Image from "next/image";
import { useState } from "react";
import type { Software } from "@/data/types";

type Props = {
  item: Pick<Software, "name" | "icon" | "iconImage">;
  size?: number;
  className?: string;
};

export function SoftwareIcon({ item, size = 48, className = "" }: Props) {
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const sources = [item.iconImage, item.icon.simpleIcon ? `/icons/${item.icon.simpleIcon}` : undefined];
  const src = sources.find((source): source is string => Boolean(source) && !failedSources.includes(source!));
  const imageSize = Math.round(size * 0.62);

  return (
    <span className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[22.37%] ${className}`} style={{ width: size, height: size, background: `${item.icon.color}14` }} aria-hidden="true">
      {src ? (
        <Image src={src} alt="" width={imageSize} height={imageSize} sizes={`${imageSize}px`} unoptimized={src.startsWith("/icons/")} className="object-contain" onError={() => setFailedSources((failed) => failed.includes(src) ? failed : [...failed, src])} />
      ) : (
        <span className="font-bold leading-none" style={{ color: item.icon.color, fontSize: size * 0.42 }}>{item.icon.letter}</span>
      )}
    </span>
  );
}
