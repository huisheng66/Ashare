import Link from "next/link";
import { Ban, Link2, PackageX, Scale } from "lucide-react";

import { CatalogBrowser } from "@/components/CatalogBrowser";
import { FeaturedIndex } from "@/components/FeaturedIndex";
import { SceneGrid } from "@/components/SceneGrid";
import { SearchPanel } from "@/components/SearchPanel";
import { SectionHeading } from "@/components/SectionHeading";
import { catalogCounts, featuredCatalog, queryCatalog } from "@/lib/catalog";
import { parseCatalogFilters, parseCatalogPage, type PageSearchParams } from "@/lib/catalog-query";
import { taskSuggestions } from "@/lib/navigation";
import { absoluteSiteUrl } from "@/lib/site";

export const metadata = {
  title: "探索 · Ashare",
  alternates: { canonical: absoluteSiteUrl("/") },
};

type Props = {
  searchParams: Promise<PageSearchParams>;
};

const promises = [
  { icon: Link2, title: "只连来源方", text: "官网、开源仓库与作者授权的镜像" },
  { icon: PackageX, title: "不托管安装包", text: "下载都在来源方完成" },
  { icon: Ban, title: "不收破解", text: "也不收修改版、序列号与盗版" },
  { icon: Scale, title: "写明不适合谁", text: "每一款都说清局限和替代" },
];

export default async function HomePage({ searchParams }: Props) {
  const params = await searchParams;
  const filters = parseCatalogFilters(params);
  // 筛选、排序、分页全部下推到数据库；这里不再把整份目录读进内存。
  const [catalog, featured, counts] = await Promise.all([
    queryCatalog(filters, parseCatalogPage(params)),
    featuredCatalog(5),
    catalogCounts(),
  ]);
  const sceneCount = Object.values(counts.scenes).filter(Boolean).length;

  return (
    <>
      <section aria-labelledby="home-hero" className="relative overflow-hidden border-b border-border">
        <div aria-hidden="true" className="graph-paper pointer-events-none absolute inset-0" />
        <div className="shell relative grid grid-cols-1 gap-12 pb-14 pt-12 sm:pt-16 lg:grid-cols-12 lg:gap-10 lg:pb-20 lg:pt-20">
          <div className="lg:col-span-7 lg:pt-4">
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="size-1.5 rounded-[2px] bg-brand" aria-hidden="true" />
              已收录 <span className="font-mono text-foreground tabular-nums">{counts.total}</span> 款 · 覆盖{" "}
              <span className="font-mono text-foreground tabular-nums">{sceneCount}</span> 个场景
            </p>
            <h1 id="home-hero" className="mt-6 text-[40px] font-bold leading-[1.08] tracking-[-0.02em] sm:text-[56px] lg:text-[64px]">
              找到<span className="marker">趁手</span>的工具
            </h1>
            <p className="mt-5 max-w-xl text-[17px] leading-[1.75] text-muted-foreground">
              按你要做的事找软件：写代码、改文档、做图、算数据。每一款都说清适合谁、不适合谁，只链接到官网和开源仓库。
            </p>
            <SearchPanel variant="hero" className="mt-8 max-w-xl" />
            <div className="mt-4 flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs text-muted-foreground">试试</span>
              {taskSuggestions.map((term) => (
                <Link
                  key={term}
                  href={`/search?q=${encodeURIComponent(term)}`}
                  className="inline-flex h-8 items-center rounded-full border border-border bg-card px-3 text-[13px] transition-colors hover:border-foreground/30 pointer-coarse:h-11"
                >
                  {term}
                </Link>
              ))}
            </div>
          </div>
          <div className="lg:col-span-5">
            <FeaturedIndex items={featured.items} total={featured.total} />
          </div>
        </div>
      </section>

      <section aria-label="收录承诺" className="border-b border-border bg-card/60">
        <ul className="shell grid grid-cols-2 gap-x-6 gap-y-6 py-8 lg:grid-cols-4">
          {promises.map(({ icon: Icon, title, text }) => (
            <li key={title} className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-border bg-background" aria-hidden="true">
                <Icon className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{title}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">{text}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="scenes-title" className="shell mt-16 sm:mt-20">
        <SectionHeading id="scenes-title" title="按场景找" description="从你要做的事出发，每个场景都挑了可以长期用的选项。" />
        <div className="mt-6">
          <SceneGrid counts={counts} />
        </div>
      </section>

      <section id="catalog" aria-labelledby="catalog-title" className="shell mt-16 scroll-mt-20 sm:mt-20">
        <SectionHeading
          id="catalog-title"
          title="全部工具"
          description="按类型、场景和平台筛选，精选的排在前面。"
          className="border-b border-border pb-5"
        />
        <div className="mt-6">
          <CatalogBrowser
            items={catalog.items}
            total={catalog.total}
            counts={counts}
            page={catalog.page}
            pageCount={catalog.pageCount}
          />
        </div>
      </section>
    </>
  );
}
