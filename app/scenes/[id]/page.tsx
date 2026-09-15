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
  const items = await byScene(scene.id);

  return (
    <div className="w-full px-5 py-8 sm:px-8">
      <p>
        <Link href="/" className="text-[13px] font-medium text-primary">
          <span aria-hidden>‹ </span>探索
        </Link>
      </p>
      <h1 className="mt-4 text-[36px] font-bold tracking-tight">{scene.name}</h1>
      <p className="mt-2 max-w-[60ch] text-[15px] text-muted-foreground">{scene.description}</p>
      <SceneBrowser items={items} />
    </div>
  );
}
