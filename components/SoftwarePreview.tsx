"use client";

import Image from "next/image";
import { useState } from "react";
import { SoftwareIcon } from "@/components/SoftwareIcon";
import type { CatalogItem } from "@/data/types";

export function SoftwarePreview({ item }: { item: Pick<CatalogItem, "name" | "previews" | "iconImage" | "icon"> }) {
  const src = item.previews[0];
  const [failedSource, setFailedSource] = useState<string>();
  return src && src !== failedSource ? (
    <Image src={src} alt={`${item.name} 界面预览`} fill sizes="(max-width: 639px) calc(100vw - 40px), (max-width: 1023px) 50vw, (max-width: 1399px) 35vw, 25vw" className="object-cover transition-transform duration-200 group-hover:scale-[1.02]" onError={() => setFailedSource(src)} />
  ) : (
    <span className="flex h-full items-center justify-center bg-muted/60"><SoftwareIcon item={item} size={64} /></span>
  );
}
