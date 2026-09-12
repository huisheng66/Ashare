"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function CompactSearch({ defaultValue = "" }: { defaultValue?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const q = value.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  return (
    <form onSubmit={onSubmit} role="search">
      <label className="sr-only" htmlFor="nav-search">
        搜索软件
      </label>
      <input
        id="nav-search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="搜索软件"
        className="h-9 w-48 rounded-lg border border-line bg-bg px-3 text-[0.8125rem] text-ink placeholder:text-muted md:w-56"
      />
    </form>
  );
}
