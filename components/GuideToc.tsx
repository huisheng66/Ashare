"use client";

import { useEffect, useState } from "react";

import { pickCurrentSection, type GuideSection } from "@/lib/guide-toc";

/**
 * 教程目录：常驻侧栏 + 滚动高亮。
 *
 * **为什么用 IntersectionObserver 而不是 scroll 事件。** scroll 高亮要在监听函数里
 * 反复读 `getBoundingClientRect()`，每次滚动都强制同步布局；IntersectionObserver
 * 由浏览器在合成阶段异步回调，不占主线程。
 *
 * 选哪一条算「当前」由`pickCurrentSection` 决定，理由见 lib/guide-toc.ts。
 */

type Props = {
  sections: readonly GuideSection[];
  /** 目录本身的 aria-label */
  label?: string;
};

export function GuideToc({ sections, label = "教程目录" }: Props) {
  const [activeId, setActiveId] = useState<string | undefined>(sections[0]?.id);

  useEffect(() => {
    if (sections.length === 0) return;

    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        if (visible.size === 0) return;
        const current = pickCurrentSection(sections, visible);
        if (current) setActiveId(current);
      },
      // 顶部 88px 让给吸顶头部，底部 70% 只认已经读过一半的标题 ——
      // 刚露头的那条还没被读到，不该立刻把它标成当前节。
      { rootMargin: "-88px 0px -70% 0px", threshold: 0 },
    );

    for (const section of sections) {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [sections]);

  if (sections.length === 0) return null;

  return (
    <nav aria-label={label} className="text-[13px]">
      <p className="mb-2.5 text-xs font-medium text-muted-foreground">目录</p>
      <ol className="space-y-0.5">
        {sections.map((section) => {
          const active = section.id === activeId;
          return (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                aria-current={active ? "location" : undefined}
                className={[
                  "block rounded-r-md border-l-2 py-1.5 pr-2 transition-colors",
                  section.level === 3 ? "pl-6" : "pl-3",
                  active
                    ? "border-brand font-medium text-brand"
                    : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
                ].join(" ")}
              >
                {section.title}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}