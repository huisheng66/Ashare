import type { LucideIcon } from "lucide-react";

import { Eyebrow } from "@/components/SectionHeading";

type Point = { icon: LucideIcon; title: string; text: React.ReactNode };

/** 推荐 / 反馈共用：≥lg 左侧说明，右侧表单卡。 */
export function FormPage({
  eyebrow,
  title,
  lead,
  points,
  footnote,
  children,
}: {
  eyebrow: string;
  title: string;
  lead: React.ReactNode;
  points: Point[];
  footnote?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="shell grid grid-cols-1 gap-10 pb-20 pt-10 sm:pt-14 lg:grid-cols-12 lg:gap-12">
      <div className="lg:col-span-5 lg:pt-2">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="mt-3 text-[32px] font-bold leading-tight tracking-[-0.015em] sm:text-[40px]">{title}</h1>
        <p className="mt-4 max-w-[30em] text-[15px] leading-[1.75] text-muted-foreground">{lead}</p>
        <ul className="mt-8 space-y-5">
          {points.map(({ icon: Icon, title: pointTitle, text }) => (
            <li key={pointTitle} className="flex gap-3.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-border bg-card" aria-hidden="true">
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 pt-0.5">
                <span className="block text-sm font-semibold">{pointTitle}</span>
                <span className="mt-1 block text-[13px] leading-relaxed text-muted-foreground">{text}</span>
              </span>
            </li>
          ))}
        </ul>
        {footnote ? <p className="mt-8 text-[13px] text-muted-foreground">{footnote}</p> : null}
      </div>
      <div className="lg:col-span-7">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-lift sm:p-8">{children}</div>
      </div>
    </div>
  );
}
