"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";
import type { Software } from "@/data/types";
import { resolveIcon } from "@/lib/derive";

type Props = {
  item: Pick<Software, "name" | "icon" | "iconImage">;
  size?: number;
  className?: string;
};

/** 软件图标：上传图 → 本地 Simple Icons → 字母，逐级回退。底板见 globals.css 的 app-tile。 */
export function SoftwareIcon({ item, size = 48, className = "" }: Props) {
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const source = resolveIcon(item, failedSources);
  const imageSize = Math.round(size * 0.58);

  return (
    <span
      className={`app-tile inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[26%] ${className}`}
      style={{ width: size, height: size, "--icon": item.icon.color } as CSSProperties}
      aria-hidden="true"
    >
      {source.kind === "image" ? (
        <Image
          src={source.src}
          alt=""
          width={imageSize}
          height={imageSize}
          sizes={`${imageSize}px`}
          unoptimized={!source.optimize}
          className="object-contain"
          onError={() =>
            setFailedSources((failed) => (failed.includes(source.src) ? failed : [...failed, source.src]))
          }
        />
      ) : (
        <span className="font-bold leading-none tracking-tight" style={{ fontSize: Math.round(size * 0.42) }}>
          {source.letter}
        </span>
      )}
    </span>
  );
}
