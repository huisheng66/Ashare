import type { Metadata } from "next";
import Link from "next/link";
import { SearchPanel } from "@/components/SearchPanel";
import { SearchResultCard } from "@/components/SearchResultCard";
import { scenes } from "@/data/scenes";
import { allPublished } from "@/lib/catalog";
import { searchSoftware } from "@/lib/items";

export const metadata: Metadata = {
  title: "搜索",
};

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const results = searchSoftware(query, await allPublished());

  return (
    <div className="w-full px-5 py-6 sm:px-8">
      {query ? (
        <>
          <h1 className="text-[20px] font-bold tracking-tight">
            「{query}」的搜索结果
          </h1>
          {results.length ? (
            <div className="mt-5 grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-5">
              {results.map((item) => (
                <SearchResultCard key={item.slug} item={item} />
              ))}
            </div>
          ) : (
            <p className="mt-8 max-w-[50ch] text-[15px] text-muted-foreground">
              没有「{query}」。可以换个词，或
              <Link href="/submit" className="mx-1 font-medium text-primary">
                提交推荐
              </Link>
              。
            </p>
          )}
        </>
      ) : (
        <>
          <h1 className="text-[36px] font-bold tracking-tight">搜索</h1>
          <SearchPanel />
          <div className="mt-10">
            <p className="text-[12px] text-muted-foreground">可以从场景进，或试这些词</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["VS Code", "Zotero", "JASP", "Blender", "LibreOffice", "KiCad"].map(
                (term) => (
                  <Link
                    key={term}
                    href={`/search?q=${encodeURIComponent(term)}`}
                    className="rounded-lg bg-muted px-3 py-1.5 text-[13px] font-medium text-foreground transition-colors hover:bg-black/[0.08]"
                  >
                    {term}
                  </Link>
                ),
              )}
            </div>
            <div className="mt-6 flex flex-wrap gap-4">
              {scenes.map((scene) => (
                <Link
                  key={scene.id}
                  href={`/scenes/${scene.id}`}
                  className="text-[15px] font-medium text-primary"
                >
                  {scene.name}
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
