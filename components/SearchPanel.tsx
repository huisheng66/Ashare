"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { MagnifierIcon } from "@/components/MagnifierIcon";

export function SearchPanel() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const q = value.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  return (
    <form onSubmit={onSubmit} role="search" className="mt-6">
      <label htmlFor="search-page" className="sr-only">
        搜索软件
      </label>
      <div className="relative max-w-xl">
        <MagnifierIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          id="search-page"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="名称、别名或用途"
          className="h-10 w-full rounded-[9px] border border-black/10 bg-muted pl-9 pr-4 text-[15px] text-foreground transition-colors placeholder:text-muted-foreground focus:border-primary focus:bg-background"
        />
      </div>
    </form>
  );
}
