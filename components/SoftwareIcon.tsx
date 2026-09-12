"use client";

import { useState } from "react";
import type { Software } from "@/data/types";

type Props = {
  item: Pick<Software, "name" | "icon">;
  size?: number;
  className?: string;
};

export function SoftwareIcon({ item, size = 48, className = "" }: Props) {
  const [failed, setFailed] = useState(!item.icon.simpleIcon);
  const src = item.icon.simpleIcon
    ? `https://cdn.simpleicons.org/${item.icon.simpleIcon}`
    : "";

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[10px] ${className}`}
      style={{
        width: size,
        height: size,
        background: `${item.icon.color}14`,
      }}
      aria-hidden
    >
      {!failed && src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          width={Math.round(size * 0.56)}
          height={Math.round(size * 0.56)}
          className="object-contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <span
          className="font-extrabold leading-none"
          style={{
            color: item.icon.color,
            fontSize: size * 0.42,
          }}
        >
          {item.icon.letter}
        </span>
      )}
    </span>
  );
}
