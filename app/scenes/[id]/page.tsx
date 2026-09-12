import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SceneBrowser } from "@/components/SceneBrowser";
import { scenes, sceneById } from "@/data/scenes";
import type { SceneId } from "@/data/types";
import { byScene } from "@/lib/catalog";

type Props = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return scenes.map((scene) => ({ id: scene.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const scene = sceneById[id as SceneId];
  if (!scene) return { title: "场景" };
  return { title: scene.name, description: scene.description };
}

export default async function ScenePage({ params }: Props) {
  const { id } = await params;
  const scene = sceneById[id as SceneId];
  if (!scene) notFound();
  const items = byScene(scene.id);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
      <p className="text-[0.8125rem] text-muted">
        <Link href="/" className="hover:text-ink">
          首页
        </Link>
        <span aria-hidden> / </span>
        {scene.name}
      </p>
      <h1 className="mt-3 text-[1.75rem] font-extrabold tracking-tight">
        {scene.name}
      </h1>
      <p className="mt-2 max-w-[60ch] text-muted">{scene.description}</p>
      <SceneBrowser items={items} />
    </div>
  );
}
