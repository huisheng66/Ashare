"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { SoftwareRow } from "@/components/SoftwareRow";
import type { Software } from "@/data/types";
import Link from "next/link";

export function SearchPanel({
  query,
  results,
}: {
  query: string;
  results: Software[];
}) {
  const router = useRouter();
  const [value, setValue] = useState(query);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const q = value.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  const searching = query.trim().length > 0;

  return (
    <div className="mt-6">
      <form onSubmit={onSubmit} role="search">
        <label htmlFor="search-page" className="sr-only">
          搜索软件
        </label>
        <input
          id="search-page"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="名称、别名或用途"
          className="h-12 w-full max-w-xl rounded-xl border border-line px-4 text-[1.0625rem] placeholder:text-muted"
        />
      </form>

      {searching ? (
        results.length ? (
          <div className="mt-8">
            <p className="text-[0.8125rem] text-muted">{results.length} 个结果</p>
            {results.map((item) => (
              <SoftwareRow key={item.slug} item={item} />
            ))}
          </div>
        ) : (
          <p className="mt-8 max-w-[50ch] text-muted">
            没有「{query.trim()}」。可以换词，或
            <Link href="/submit" className="mx-1 font-semibold text-primary">
              提交推荐
            </Link>
            。
          </p>
        )
      ) : null}
    </div>
  );
}
