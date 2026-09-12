import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalButton } from "@/components/ExternalButton";
import { PlatformList } from "@/components/PlatformList";
import { SoftwareIcon } from "@/components/SoftwareIcon";
import { SoftwareRow } from "@/components/SoftwareRow";
import { SourceBadge } from "@/components/SourceBadge";
import { scenes } from "@/data/scenes";
import { software } from "@/data/software";
import { alternativesOf, getSoftware, sourceLabel } from "@/lib/catalog";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return software.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = getSoftware(slug);
  if (!item) return { title: "软件" };
  return { title: item.name, description: item.summary };
}

export default async function SoftwarePage({ params }: Props) {
  const { slug } = await params;
  const item = getSoftware(slug);
  if (!item) notFound();
  const alts = alternativesOf(item);
  const sceneLinks = scenes.filter((scene) => item.scenes.includes(scene.id));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
      <p className="text-[0.8125rem] text-muted">
        <Link href="/" className="hover:text-ink">
          首页
        </Link>
        {sceneLinks.map((scene) => (
          <span key={scene.id}>
            <span aria-hidden> / </span>
            <Link href={`/scenes/${scene.id}`} className="hover:text-ink">
              {scene.name}
            </Link>
          </span>
        ))}
      </p>

      <header className="mt-6 flex flex-col gap-5 border-b border-line pb-8 sm:flex-row sm:items-start">
        <SoftwareIcon item={item} size={72} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[1.75rem] font-extrabold tracking-tight">
              {item.name}
            </h1>
            {item.nameZh ? (
              <span className="text-lg font-medium text-muted">{item.nameZh}</span>
            ) : null}
            <SourceBadge kind={item.source} />
          </div>
          <p className="mt-2 max-w-[62ch] text-[1.05rem]">{item.summary}</p>
          <div className="mt-3">
            <PlatformList platforms={item.platforms} />
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <ExternalButton href={item.officialUrl}>前往官网下载</ExternalButton>
            <p className="text-[0.8125rem] text-muted">
              将打开 {item.officialLabel}，本站不提供安装包。
            </p>
          </div>
        </div>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-10">
          <section>
            <h2 className="text-lg font-semibold">适不适合你的需求</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-surface p-4">
                <h3 className="text-[0.8125rem] font-semibold text-primary">
                  适合
                </h3>
                <p className="mt-2 text-[0.9375rem]">{item.whoFor}</p>
              </div>
              <div className="rounded-xl bg-surface p-4">
                <h3 className="text-[0.8125rem] font-semibold text-accent">
                  不适合
                </h3>
                <p className="mt-2 text-[0.9375rem]">{item.whoNot}</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold">安装要点</h2>
            <ol className="mt-4 max-w-[65ch] space-y-3">
              {item.installTips.map((tip, index) => (
                <li key={tip} className="flex gap-3 text-[0.9375rem]">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-[0.75rem] font-bold text-on-primary">
                    {index + 1}
                  </span>
                  <span>{tip}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="space-y-8">
          <section className="rounded-xl bg-surface p-5">
            <h2 className="text-lg font-semibold">来源与安全</h2>
            <p className="mt-2 text-[0.9375rem]">
              来源类型：{sourceLabel[item.source]}。请只使用下面这个官方域名，不要下「绿色版」或修改包。
            </p>
            <a
              href={item.officialUrl}
              className="mt-3 inline-block break-all text-[0.875rem] font-medium text-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              {item.officialUrl}
            </a>
            {item.discountNote ? (
              <p className="mt-3 text-[0.875rem]">{item.discountNote}</p>
            ) : item.source !== "discount" ? (
              <p className="mt-3 text-[0.875rem] text-muted">
                无单独优惠渠道。若它是付费产品，请看本页的同类替代。
              </p>
            ) : null}
          </section>
        </aside>
      </div>

      {alts.length ? (
        <section className="mt-12">
          <h2 className="text-lg font-semibold">同类替代</h2>
          <p className="mt-1 text-[0.875rem] text-muted">
            同一需求下可以先试这些，尤其是不想订商业许可的时候。
          </p>
          <div className="mt-2">
            {alts.map((alt) => (
              <SoftwareRow key={alt.slug} item={alt} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
