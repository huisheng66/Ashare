import type { Metadata } from "next";
import Link from "next/link";
import { SearchPanel } from "@/components/SearchPanel";
import { scenes } from "@/data/scenes";
import { software } from "@/data/software";
import { searchSoftware } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "搜索",
};

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const results = searchSoftware(q, software);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
      <h1 className="text-[1.75rem] font-extrabold tracking-tight">搜索</h1>
      <SearchPanel key={q} query={q} results={results} />
      {!q.trim() ? (
        <div className="mt-10">
          <p className="text-[0.875rem] text-muted">可以从场景进，或试这些词</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {["VS Code", "Zotero", "JASP", "Blender", "LibreOffice", "KiCad"].map(
              (term) => (
                <Link
                  key={term}
                  href={`/search?q=${encodeURIComponent(term)}`}
                  className="rounded-full bg-surface px-3 py-1.5 text-[0.8125rem] font-medium hover:bg-[oklch(0.94_0.012_120)]"
                >
                  {term}
                </Link>
              ),
            )}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {scenes.map((scene) => (
              <Link
                key={scene.id}
                href={`/scenes/${scene.id}`}
                className="text-[0.875rem] font-semibold text-primary"
              >
                {scene.name}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
