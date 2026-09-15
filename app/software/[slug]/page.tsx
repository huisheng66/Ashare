import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ExternalLink } from "lucide-react";

import { AppCardRow } from "@/components/AppCard";
import { ItemLinks } from "@/components/ItemLinks";
import { SoftwareIcon } from "@/components/SoftwareIcon";
import { SourceBadge } from "@/components/SourceBadge";
import { TagList } from "@/components/TagList";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { scenes } from "@/data/scenes";
import { alternativesOf, getSoftware } from "@/lib/catalog";
import { kindLabel, platformLabel, primaryLink, sourceLabel } from "@/lib/items";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await getSoftware(slug);
  if (!item) return { title: "条目" };
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
  return {
    title: item.name,
    description: item.summary,
    openGraph: {
      title: `${item.name} · Ashare`,
      description: item.summary,
      type: "article",
      url: `${base}/software/${item.slug}`,
      images: item.previews[0]
        ? [{ url: `${base}${item.previews[0]}` }]
        : undefined,
    },
  };
}

export default async function SoftwarePage({ params }: Props) {
  const { slug } = await params;
  const item = await getSoftware(slug);
  if (!item) notFound();
  const alts = await alternativesOf(item);
  const primary = primaryLink(item);
  let primaryHost = primary.url;
  try {
    primaryHost = primary.url ? new URL(primary.url).host : "";
  } catch {
    primaryHost = primary.url;
  }
  const sceneLinks = scenes.filter((scene) => item.scenes.includes(scene.id));
  const paragraphs = item.body
    .split(/\n+/)
    .map((text) => text.trim())
    .filter(Boolean);

  const infoCells = [
    {
      label: "平台",
      value: item.platforms.map((p) => platformLabel[p]).join(" · "),
    },
    { label: "类型", value: kindLabel[item.kind] },
    { label: "场景", value: sceneLinks.map((s) => s.name).join(" · ") },
    { label: "同类替代", value: alts.length ? `${alts.length} 款` : "—" },
  ];

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: item.name,
    description: item.summary,
    operatingSystem: item.platforms.map((p) => platformLabel[p]).join(", "),
    applicationCategory: kindLabel[item.kind],
    dateModified: item.updatedAt,
    ...(item.price
      ? {}
      : { offers: { "@type": "Offer", price: "0", priceCurrency: "CNY" } }),
  }).replace(/</g, "\\u003c");

  return (
    <div className="mx-auto w-full max-w-[1000px] px-5 py-8 sm:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />

      <Link
        href="/"
        className="inline-flex items-center gap-0.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="size-3.5" />
        探索
      </Link>

      <header className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-start">
        <SoftwareIcon item={item} size={112} className="shadow-card" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {item.name}
            </h1>
            {item.nameZh ? (
              <span className="text-sm text-muted-foreground">
                {item.nameZh}
              </span>
            ) : null}
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{kindLabel[item.kind]}</Badge>
            <SourceBadge kind={item.source} />
            <span className="text-sm font-semibold">
              {item.price ?? "免费"}
            </span>
          </div>

          <p className="mt-3 max-w-[62ch] text-[15px] leading-relaxed text-muted-foreground">
            {item.summary}
          </p>

          {item.tags.length ? (
            <div className="mt-3">
              <TagList tags={item.tags} />
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {primary.url ? (
              <Button asChild size="lg">
                <a href={primary.url} target="_blank" rel="noopener noreferrer">
                  前往{primary.label}
                  <ExternalLink className="size-4" />
                </a>
              </Button>
            ) : null}
            <p className="text-[12px] text-muted-foreground">
              {primaryHost ? <>将打开 {primaryHost}。</> : null}
              本站不提供安装包。
              {item.updatedAt
                ? ` 更新于 ${new Date(item.updatedAt).toLocaleDateString("zh-CN")}。`
                : null}
            </p>
          </div>
        </div>
      </header>

      {item.previews.length ? (
        <div className="scroll-row mt-8 gap-4">
          {item.previews.map((src) => (
            <div
              key={src}
              className="w-[85%] shrink-0 overflow-hidden rounded-xl border border-border bg-muted sm:w-[70%]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`${item.name} 预览`} className="w-full" />
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-border sm:grid-cols-4">
        {infoCells.map((cell) => (
          <div key={cell.label} className="bg-card px-3 py-4 text-center">
            <p className="text-[15px] font-semibold">{cell.value}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {cell.label}
            </p>
          </div>
        ))}
      </div>

      {paragraphs.length ? (
        <section className="mt-10">
          <h2 className="text-xl font-bold tracking-tight">详细介绍</h2>
          <div className="mt-3 max-w-[68ch] space-y-3">
            {paragraphs.map((text) => (
              <p key={text.slice(0, 24)} className="text-[15px] leading-relaxed">
                {text}
              </p>
            ))}
          </div>
        </section>
      ) : null}

      <Separator className="my-10" />

      <section>
        <h2 className="text-xl font-bold tracking-tight">概览</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-opensource/5 p-4">
            <h3 className="text-[13px] font-semibold text-opensource">适合</h3>
            <p className="mt-1.5 text-[15px] leading-relaxed">{item.whoFor}</p>
          </div>
          <div className="rounded-xl bg-discount/5 p-4">
            <h3 className="text-[13px] font-semibold text-discount">不适合</h3>
            <p className="mt-1.5 text-[15px] leading-relaxed">{item.whoNot}</p>
          </div>
        </div>
      </section>

      {item.tutorial.length ? (
        <>
          <Separator className="my-10" />
          <section>
            <h2 className="text-xl font-bold tracking-tight">使用教程</h2>
            <ol className="mt-4 max-w-[68ch] space-y-3">
              {item.tutorial.map((step, index) => (
                <li
                  key={step}
                  className="flex gap-3 text-[15px] leading-relaxed"
                >
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>
        </>
      ) : null}

      <Separator className="my-10" />

      <section>
        <h2 className="text-xl font-bold tracking-tight">下载渠道</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          只列可核验的渠道。镜像指作者或项目方提供的合法分发，请优先官网。
        </p>
        <div className="mt-4">
          <ItemLinks links={item.links} />
        </div>
      </section>

      <Separator className="my-10" />

      <section>
        <h2 className="text-xl font-bold tracking-tight">信息与安全</h2>
        <Card className="mt-4 gap-0 overflow-hidden py-0">
          <div className="divide-y divide-border">
            <div className="flex gap-6 px-4 py-3.5">
              <p className="w-20 shrink-0 text-[13px] text-muted-foreground">
                价格
              </p>
              <p className="text-sm">{item.price ?? "免费"}</p>
            </div>
            <div className="flex gap-6 px-4 py-3.5">
              <p className="w-20 shrink-0 text-[13px] text-muted-foreground">
                来源类型
              </p>
              <p className="text-sm">
                {kindLabel[item.kind]} · {sourceLabel[item.source]}
              </p>
            </div>
            <div className="flex gap-6 px-4 py-3.5">
              <p className="w-20 shrink-0 text-[13px] text-muted-foreground">
                优惠渠道
              </p>
              <p className="text-sm leading-relaxed">
                {item.discountNote
                  ? item.discountNote
                  : item.source !== "discount"
                    ? "无单独优惠渠道。若为付费产品，请看下方同类替代。"
                    : "—"}
              </p>
            </div>
          </div>
        </Card>
        <p className="mt-3 text-[13px] text-muted-foreground">
          请只使用上面列出的渠道，不要下载「绿色版」或修改包。
        </p>
      </section>

      {alts.length ? (
        <>
          <Separator className="my-10" />
          <section>
            <h2 className="text-xl font-bold tracking-tight">同类替代</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              同一需求下可以先试这些，尤其是不想订商业许可的时候。
            </p>
            <AppCardRow className="mt-4" items={alts} />
          </section>
        </>
      ) : null}
    </div>
  );
}
