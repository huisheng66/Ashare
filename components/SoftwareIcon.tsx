"use client";

import { useState } from "react";
import type { Software } from "@/data/types";

type Props = {
  item: Pick<Software, "name" | "icon" | "iconImage">;
  size?: number;
  className?: string;
};

export function SoftwareIcon({ item, size = 48, className = "" }: Props) {
  // 优先级：本地图标图 → Simple Icons → 字母
  const [stage, setStage] = useState(
    item.iconImage ? 0 : item.icon.simpleIcon ? 1 : 2,
  );
  const advance = () => setStage((s) => s + 1);
  const src =
    stage === 0 && item.iconImage
      ? item.iconImage
      : stage <= 1 && item.icon.simpleIcon
        ? `/icons/${item.icon.simpleIcon}`
        : "";

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[22.37%] ${className}`}
      style={{
        width: size,
        height: size,
        background: `${item.icon.color}14`,
      }}
      aria-hidden
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          width={Math.round(size * 0.56)}
          height={Math.round(size * 0.56)}
          className="object-contain"
          onError={advance}
        />
      ) : (
        <span
          className="font-bold leading-none"
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
