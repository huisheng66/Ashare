import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import Image from "next/image";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Check, MessageSquareWarning, ShieldCheck, TicketPercent, X } from "lucide-react";

import { Breadcrumb } from "@/components/Breadcrumb";
import { hostOf, ItemLinks, otherLinkCount } from "@/components/ItemLinks";
import { OutboundLink } from "@/components/OutboundLink";
import { SectionHeading } from "@/components/SectionHeading";
import { FeaturedMark, SoftwareCard } from "@/components/SoftwareCard";
import { SoftwareIcon } from "@/components/SoftwareIcon";
import { SourceBadge } from "@/components/SourceBadge";
import { TagList } from "@/components/TagList";
import { Button } from "@/components/ui/button";
import { scenes } from "@/data/scenes";
import { alternativesOf, getSoftware } from "@/lib/catalog";
import { formatDate, kindLabel, platformLabel, toCatalogItem } from "@/lib/items";
import { primaryChannel } from "@/lib/links";
import { absoluteSiteUrl } from "@/lib/site";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await getSoftware(slug);
  if (!item) notFound();
  const url = absoluteSiteUrl(`/software/${encodeURIComponent(item.slug)}`);
  const preview = item.previews[0]
    ? absoluteSiteUrl(item.previews[0])
    : undefined;
  return {
    title: item.name,
    description: item.summary,
    alternates: url ? { canonical: url } : undefined,
    openGraph: {
      title: `${item.name} · Ashare`,
      description: item.summary,
      type: "article",
      siteName: "Ashare",
      locale: "zh_CN",
      url,
      modifiedTime: item.updatedAt,
      images: preview ? [{ url: preview, alt: `${item.name} 预览` }] : [],
    },
    twitter: {
      card: preview ? "summary_large_image" : "summary",
      title: `${item.name} · Ashare`,
      description: item.summary,
      images: preview ? [{ url: preview, alt: `${item.name} 预览` }] : [],
    },
  };
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-[13px] text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right text-[13px] font-medium">{children}</dd>
    </div>
  );
}

function FitCard({ fit, text }: { fit: boolean; text: string }) {
  const Icon = fit ? Check : X;
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="flex items-center gap-2.5 text-sm font-semibold">
        <span
          className="tint-soft grid size-7 place-items-center rounded-full"
          style={{ "--tone": fit ? "var(--opensource)" : "var(--destructive)" } as CSSProperties}
          aria-hidden="true"
        >
          <Icon className="size-4" strokeWidth={2.25} />
        </span>
        {fit ? "适合" : "不适合"}
      </h3>
      <p className="mt-3 text-[15px] leading-[1.75]">{text}</p>
    </div>
  );
}

export default async function SoftwarePage({ params }: Props) {
  const { slug } = await params;
  const item = await getSoftware(slug);
  if (!item) notFound();
  const [alts, requestHeaders] = await Promise.all([alternativesOf(item), headers()]);
  const nonce = requestHeaders.get("x-nonce") ?? undefined;
  const primary = primaryChannel(item.links);
  const others = otherLinkCount(item.links, primary?.url ?? "");
  const sceneLinks = scenes.filter((scene) => item.scenes.includes(scene.id));
  const firstScene = sceneLinks[0];
  const updated = formatDate(item.updatedAt);
  const paragraphs = item.body
    .split(/\n+/)
    .map((text) => text.trim())
    .filter(Boolean);

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: item.name,
    url: absoluteSiteUrl(`/software/${encodeURIComponent(item.slug)}`),
    description: item.summary,
    operatingSystem: item.platforms.map((p) => platformLabel[p]).join(", "),
    applicationCategory: kindLabel[item.kind],
    dateModified: item.updatedAt,
    ...(item.price
      ? {}
      : { offers: { "@type": "Offer", price: "0", priceCurrency: "CNY" } }),
  }).replace(/</g, "\\u003c");

  return (
    <div className="shell pb-20 pt-6 sm:pt-8">
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />

      <Breadcrumb
        items={[
          { href: "/", label: "探索" },
          ...(firstScene ? [{ href: `/scenes/${firstScene.id}`, label: firstScene.name }] : []),
          { label: item.name },
        ]}
      />

      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_340px] lg:grid-rows-[auto_1fr] lg:gap-x-14">
        <header className="min-w-0 lg:col-start-1 lg:row-start-1">
          <div className="flex items-start gap-5">
            <SoftwareIcon item={{ name: item.name, icon: item.icon, iconImage: item.iconImage }} size={80} />
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h1 className="text-[28px] font-bold leading-tight tracking-[-0.015em] sm:text-4xl">{item.name}</h1>
                {item.nameZh ? <span className="text-sm text-muted-foreground">{item.nameZh}</span> : null}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                <SourceBadge kind={item.source} />
                <span className="text-[13px] text-muted-foreground">{kindLabel[item.kind]}</span>
                <span className="text-[13px] text-muted-foreground" aria-hidden="true">·</span>
                <span className="text-[13px] text-muted-foreground">
                  {item.platforms.map((p) => platformLabel[p]).join(" · ")}
                </span>
                {item.featured ? <FeaturedMark /> : null}
              </div>
            </div>
          </div>
          <p className="mt-6 max-w-[40em] text-[17px] leading-[1.75] text-muted-foreground">{item.summary}</p>
          {item.tags.length ? (
            <div className="mt-5">
              <TagList tags={item.tags} />
            </div>
          ) : null}
        </header>

        <aside aria-labelledby="get-title" className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-lift lg:sticky lg:top-24">
            <div className="flex items-baseline justify-between gap-3">
              <h2 id="get-title" className="text-sm font-semibold">
                获取
              </h2>
              <span className="text-[15px] font-semibold">{item.price ?? "免费"}</span>
            </div>

            {primary ? (
              <>
                <Button asChild size="lg" className="mt-4 w-full">
                  <OutboundLink
                    channel={primary}
                    slug={item.slug}
                    variant="cta"
                    className="inline-flex h-full w-full items-center justify-center gap-2"
                  />
                </Button>
                <p className="mt-2 truncate text-center font-mono text-xs text-muted-foreground">
                  {hostOf(primary.url)}
                </p>
              </>
            ) : (
              <p className="mt-4 rounded-xl bg-muted px-3 py-3 text-sm text-muted-foreground">暂未填写可用渠道。</p>
            )}

            {others ? (
              <div className="mt-5 border-t border-border pt-4">
                <h3 className="mb-1 text-xs font-medium text-muted-foreground">其他渠道</h3>
                <ItemLinks links={item.links} exclude={primary?.url} slug={item.slug} />
              </div>
            ) : null}

            <dl className="mt-4 divide-y divide-border border-t border-border">
              <Fact label="平台">{item.platforms.map((p) => platformLabel[p]).join(" · ")}</Fact>
              <Fact label="类型">{kindLabel[item.kind]}</Fact>
              {updated ? <Fact label="更新">{updated}</Fact> : null}
            </dl>

            {item.discountNote ? (
              <p
                className="tint-soft mt-3 flex gap-2.5 rounded-xl px-3 py-2.5 text-xs leading-relaxed"
                style={{ "--tone": "var(--discount)" } as CSSProperties}
              >
                <TicketPercent className="mt-px size-4 shrink-0" aria-hidden="true" />
                <span className="text-foreground">{item.discountNote}</span>
              </p>
            ) : null}

            <p className="mt-3 flex gap-2.5 rounded-xl bg-muted px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
              <ShieldCheck className="mt-px size-4 shrink-0" aria-hidden="true" />
              <span>本站不托管安装包。请只用上面列出的渠道，不要下载「绿色版」或修改包。</span>
            </p>

            <Link
              href={`/feedback?item=${encodeURIComponent(item.slug)}`}
              className="mt-4 flex min-h-10 items-center justify-center gap-1.5 rounded-xl text-[13px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <MessageSquareWarning className="size-3.5" aria-hidden="true" />
              信息有误？反馈
            </Link>
          </div>
        </aside>

        <div className="min-w-0 space-y-14 lg:col-start-1 lg:row-start-2">
          <section aria-labelledby="fit-title">
            <h2 id="fit-title" className="sr-only">
              适合谁
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FitCard fit text={item.whoFor} />
              <FitCard fit={false} text={item.whoNot} />
            </div>
          </section>

          {item.previews.length ? (
            <section aria-labelledby="preview-title">
              <SectionHeading id="preview-title" title="截图" />
              <div className="scroll-row mt-5 gap-4">
                {item.previews.map((src, index) => (
                  <div
                    key={src}
                    className="relative aspect-[16/10] w-[85%] shrink-0 overflow-hidden rounded-2xl border border-border bg-muted sm:w-[70%]"
                  >
                    <Image
                      src={src}
                      alt={`${item.name} 预览 ${index + 1}`}
                      fill
                      sizes="(max-width: 640px) 85vw, (max-width: 1024px) 70vw, 560px"
                      className="object-contain"
                    />
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {paragraphs.length ? (
            <section aria-labelledby="about-title">
              <SectionHeading id="about-title" title="详细介绍" />
              <div className="mt-5 max-w-[40em] space-y-4">
                {paragraphs.map((text, index) => (
                  <p key={index} className="text-[15px] leading-[1.85]">
                    {text}
                  </p>
                ))}
              </div>
            </section>
          ) : null}

          {item.tutorial.length ? (
            <section aria-labelledby="steps-title">
              <SectionHeading id="steps-title" title="上手步骤" />
              <ol className="mt-5 max-w-[40em] border-t border-border">
                {item.tutorial.map((step, index) => (
                  <li key={step} className="flex gap-4 border-b border-border py-4 text-[15px] leading-[1.75]">
                    <span className="w-6 shrink-0 pt-0.5 font-mono text-[13px] text-muted-foreground tabular-nums" aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {alts.length ? (
            <section aria-labelledby="alts-title">
              <SectionHeading
                id="alts-title"
                title="同类替代"
                description="同一需求下可以先试这些，尤其是不想买商业许可的时候。"
              />
              <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {alts.map((alt) => (
                  <li key={alt.slug} className="flex *:flex-1">
                    <SoftwareCard item={toCatalogItem(alt)} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
