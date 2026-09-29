import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, Check, MessageSquareWarning, Plus, X } from "lucide-react";

import { Eyebrow } from "@/components/SectionHeading";

export const metadata: Metadata = {
  title: "收录标准",
  description: "Ashare 收什么、不收什么，以及投稿怎么审核。",
};

const accepted = [
  "应用：厂商官网提供的正式版、免费档，或写明的优惠入口",
  "脚本：可以复现的脚本、命令行小工具",
  "开源项目：走官方发行渠道（GitHub Releases 或项目官网）",
  "网盘仅限作者或项目方提供的合法镜像，且必须有官网或 GitHub 兜底",
];

const rejected = [
  "破解、序列号、修改版、非官方汉化包",
  "商业软件的盗版分发",
  "捆绑推广、强制附加软件的第三方封装",
  "说不清来源的网盘和下载站",
];

const steps = [
  { title: "核对来源", text: "确认域名属于厂商或项目方，GitHub 仓库是官方的。" },
  { title: "核对许可与平台", text: "免费到什么程度、商用要不要买、支持哪些系统。" },
  { title: "写清适合与不适合", text: "按任务和水平说明，并补上同类替代。" },
  { title: "发布与复查", text: "审核通过后才进目录；链接失效或信息过期会下架修正。" },
];

function RuleList({ tone, title, items, accept }: { tone: string; title: string; items: string[]; accept: boolean }) {
  const Icon = accept ? Check : X;
  return (
    <section className="rounded-3xl border border-border bg-card p-6 sm:p-7" aria-labelledby={`rules-${accept ? "yes" : "no"}`}>
      <h2 id={`rules-${accept ? "yes" : "no"}`} className="flex items-center gap-2.5 text-lg font-semibold">
        <span className="tint-soft grid size-8 place-items-center rounded-full" style={{ "--tone": tone } as CSSProperties} aria-hidden="true">
          <Icon className="size-4" strokeWidth={2.25} />
        </span>
        {title}
      </h2>
      <ul className="mt-5 space-y-3.5">
        {items.map((text) => (
          <li key={text} className="flex gap-3 text-[15px] leading-relaxed">
            <Icon className="mt-1 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span>{text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function AboutPage() {
  return (
    <div className="shell pb-20 pt-10 sm:pt-14">
      <header className="max-w-2xl">
        <Eyebrow>收录标准</Eyebrow>
        <h1 className="mt-3 text-[32px] font-bold leading-tight tracking-[-0.015em] sm:text-[44px]">
          只收可以放心装的
        </h1>
        <p className="mt-4 text-[17px] leading-[1.75] text-muted-foreground">
          Ashare 帮你按要做的事找软件：适不适合、去哪个官网、装的时候注意什么。我们不托管安装包，只把你带到来源方。
        </p>
      </header>

      <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2">
        <RuleList tone="var(--opensource)" title="收" items={accepted} accept />
        <RuleList tone="var(--destructive)" title="不收" items={rejected} accept={false} />
      </div>

      <section aria-labelledby="review-title" className="mt-16">
        <h2 id="review-title" className="text-[22px] font-bold tracking-[-0.01em] sm:text-2xl">
          投稿怎么审核
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">提交会进入站内审核队列，不会直接公开。</p>
        <ol className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step.title} className="bg-card p-6">
              <span className="font-mono text-[13px] text-muted-foreground tabular-nums" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-3 text-[15px] font-semibold">{step.title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-label="参与" className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Link
          href="/submit"
          className="group flex items-center gap-4 rounded-3xl bg-primary p-6 text-primary-foreground transition-opacity hover:opacity-92 sm:p-7"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary-foreground/12" aria-hidden="true">
            <Plus className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-semibold">推荐一款工具</span>
            <span className="mt-0.5 block text-[13px] opacity-75">你在用、觉得值得长期用的</span>
          </span>
          <ArrowRight className="size-5 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
        <Link
          href="/feedback"
          className="group flex items-center gap-4 rounded-3xl border border-border bg-card p-6 transition-[border-color,box-shadow] hover:border-foreground/20 hover:shadow-lift sm:p-7"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-muted" aria-hidden="true">
            <MessageSquareWarning className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-semibold">反馈问题</span>
            <span className="mt-0.5 block text-[13px] text-muted-foreground">链接失效、介绍不对，或页面有问题</span>
          </span>
          <ArrowRight className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
