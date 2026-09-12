"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SoftwareIcon } from "@/components/SoftwareIcon";
import { SoftwareRow } from "@/components/SoftwareRow";
import type { Scene, Software } from "@/data/types";
import { searchSoftware } from "@/lib/catalog";

export function HomeCatalog({
  scenes,
  catalog,
  featured,
}: {
  scenes: Scene[];
  catalog: Software[];
  featured: Software[];
}) {
  const [query, setQuery] = useState("");
  const results = useMemo(
    () => searchSoftware(query, catalog),
    [query, catalog],
  );
  const searching = query.trim().length > 0;

  return (
    <div>
      <form
        role="search"
        className="relative"
        onSubmit={(e) => e.preventDefault()}
      >
        <label htmlFor="home-search" className="sr-only">
          搜索软件名称、别名或用途
        </label>
        <input
          id="home-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜 VS Code、Zotero、JASP…"
          autoComplete="off"
          className="h-14 w-full rounded-xl border border-line bg-bg px-4 text-[1.0625rem] text-ink shadow-[0_4px_8px_oklch(0.22_0.028_120_/_0.08)] placeholder:text-muted sm:px-5"
        />
      </form>

      {searching ? (
        <section className="mt-10">
          <h2 className="text-lg font-semibold">
            {results.length
              ? `「${query.trim()}」有 ${results.length} 个结果`
              : `没有「${query.trim()}」`}
          </h2>
          {results.length ? (
            <div className="mt-2">
              {results.map((item) => (
                <SoftwareRow key={item.slug} item={item} />
              ))}
            </div>
          ) : (
            <p className="mt-3 max-w-[55ch] text-muted">
              可以换个名字试试，或去
              <Link href="/submit" className="mx-1 font-semibold text-primary">
                提交推荐
              </Link>
              ，写清它解决什么需求。
            </p>
          )}
        </section>
      ) : (
        <>
          <section className="mt-12" aria-labelledby="scenes-heading">
            <h2 id="scenes-heading" className="text-lg font-semibold">
              按要做的事进
            </h2>
            <SceneBento scenes={scenes} catalog={catalog} />
          </section>

          <section className="mt-14" aria-labelledby="featured-heading">
            <h2 id="featured-heading" className="text-lg font-semibold">
              先看这几个
            </h2>
            <p className="mt-1 text-[0.875rem] text-muted">
              覆盖写代码、写材料、做图、算数和制图里最常被问到的入口。
            </p>
            <div className="mt-2">
              {featured.map((item) => (
                <SoftwareRow key={item.slug} item={item} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function SceneBento({
  scenes,
  catalog,
}: {
  scenes: Scene[];
  catalog: Software[];
}) {
  const [first, ...rest] = scenes;
  const preview = (id: Scene["id"]) =>
    catalog.filter((item) => item.scenes.includes(id)).slice(0, 3);

  return (
    <div className="mt-5 grid gap-3 md:grid-cols-6">
      <SceneTile scene={first} previews={preview(first.id)} featured />
      {rest.map((scene) => (
        <SceneTile
          key={scene.id}
          scene={scene}
          previews={preview(scene.id)}
        />
      ))}
    </div>
  );
}

function SceneTile({
  scene,
  previews,
  featured = false,
}: {
  scene: Scene;
  previews: Software[];
  featured?: boolean;
}) {
  return (
    <Link
      href={`/scenes/${scene.id}`}
      className={`group flex flex-col justify-between rounded-xl bg-surface p-4 transition-colors duration-200 hover:bg-[oklch(0.94_0.012_120)] ${
        featured ? "min-h-[11rem] md:col-span-3 md:row-span-2 md:p-6" : "min-h-[7.5rem] md:col-span-3"
      }`}
    >
      <div>
        <h3
          className={`font-extrabold tracking-tight ${
            featured ? "text-2xl" : "text-lg"
          }`}
        >
          {scene.name}
        </h3>
        <p className={`mt-1 text-muted ${featured ? "max-w-[36ch] text-[0.9375rem]" : "text-[0.8125rem]"}`}>
          {featured ? scene.description : scene.tagline}
        </p>
      </div>
      <div className="mt-4 flex items-center">
        {previews.map((item, index) => (
          <span
            key={item.slug}
            className="rounded-[10px] ring-2 ring-surface"
            style={{ marginLeft: index === 0 ? 0 : -8 }}
          >
            <SoftwareIcon item={item} size={featured ? 36 : 28} />
          </span>
        ))}
        <span className="ml-3 text-[0.75rem] font-medium text-muted group-hover:text-ink">
          查看
        </span>
      </div>
    </Link>
  );
}
