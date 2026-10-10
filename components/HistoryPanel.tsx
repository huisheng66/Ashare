"use client";

import { useState } from "react";
import { ChevronDown, History, RotateCcw, UserRound } from "lucide-react";

import { rollbackItem } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/items";
import { STATUS_LABEL } from "@/lib/users";
import type { PublishStatus } from "@/data/types";

/** 传给客户端组件的一版历史：摘要字段直接给，重放后的完整内容也带上。 */
export type RevisionRow = {
  rowVersion: number;
  action: "create" | "update" | "delete" | "status";
  summary: string;
  actor: string;
  at: string;
  fields: string[];
  item: {
    name: string;
    summary: string;
    status: PublishStatus;
    tags: string[];
    scenes: string[];
    platforms: string[];
    whoFor: string;
    whoNot: string;
    body: string;
  };
};

/**
 * 条目改动历史面板（客户端）。
 *
 * 做成客户端而不是纯服务端：点「查看」要展开某一版的完整内容，不该每次都往返服务器
 * —— 历史最多 20 版，一次全传也不大，但展开交互需要即时反馈。
 *
 * **回滚表单在本文件里直接 import server action**（见 RollbackForm 的说明）。
 */
export function HistoryPanel({
  slug,
  revisions,
  canRollback,
  currentVersion,
}: {
  slug: string;
  revisions: RevisionRow[];
  canRollback: boolean;
  currentVersion?: number;
}) {
  if (!revisions.length) {
    return (
      <section aria-labelledby="history-title" className="mt-8">
        <h2 id="history-title" className="flex items-center gap-2 text-sm font-semibold">
          <History className="size-4" aria-hidden="true" />
          改动历史
        </h2>
        <p className="mt-2 rounded-xl border border-border bg-card px-4 py-3 text-[13px] text-muted-foreground">
          还没有记录。条目第一次保存后，之后每次改动都会在这里留下一版。
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="history-title" className="mt-8">
      <h2 id="history-title" className="flex items-center gap-2 text-sm font-semibold">
        <History className="size-4" aria-hidden="true" />
        改动历史
        <span className="font-mono text-xs font-normal text-muted-foreground tabular-nums">
          {revisions.length} 版
        </span>
      </h2>

      <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-card">
        <ul className="divide-y divide-border">
          {revisions.map((revision) => (
            <RevisionItem
              key={revision.rowVersion}
              slug={slug}
              revision={revision}
              canRollback={canRollback}
              isCurrent={revision.rowVersion === currentVersion}
            />
          ))}
        </ul>
      </div>

      <p className="mt-2 text-[12px] text-muted-foreground">
        回滚会<strong className="font-medium text-foreground">作为一次新编辑</strong>保存，
        中间的版本仍然留着 —— 历史只增不减，丢掉的那几版本身也是信息。发布状态不随回滚改变。
      </p>
    </section>
  );
}

function RevisionItem({
  slug,
  revision,
  canRollback,
  isCurrent,
}: {
  slug: string;
  revision: RevisionRow;
  canRollback: boolean;
  isCurrent: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <li>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-3">
        <span className="font-mono text-[13px] tabular-nums">v{revision.rowVersion}</span>
        <span className="text-[13px]">{ACTION_LABEL[revision.action] ?? revision.action}</span>
        {revision.summary ? (
          <span className="min-w-0 flex-1 truncate text-[13px] text-muted-foreground">
            {revision.summary}
          </span>
        ) : (
          <span className="flex-1" />
        )}
        {isCurrent ? (
          <span className="rounded-full bg-opensource/10 px-2 py-0.5 text-[11px] font-medium text-opensource">
            当前
          </span>
        ) : null}
        <span className="inline-flex items-center gap-1 text-[12px] text-muted-foreground">
          <UserRound className="size-3.5" aria-hidden="true" />
          {revision.actor}
        </span>
        <span className="font-mono text-[12px] text-muted-foreground tabular-nums">
          {formatDate(revision.at)}
        </span>
      </div>

      {revision.fields.length ? (
        <p className="px-4 pb-2 text-[12px] text-muted-foreground">
          改动：
          {revision.fields.map((field) => (
            <span key={field} className="ml-1 rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
              {FIELD_LABEL[field] ?? field}
            </span>
          ))}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-1.5 px-4 pb-3">
        <Button type="button" size="sm" variant="ghost" onClick={() => setExpanded((value) => !value)}>
          <ChevronDown className={expanded ? "rotate-180" : undefined} />
          {expanded ? "收起" : "查看这一版"}
        </Button>
        {canRollback && !isCurrent ? (
          <RollbackForm slug={slug} rowVersion={revision.rowVersion} />
        ) : null}
      </div>

      {expanded ? (
        <div className="border-t border-border bg-muted/30 px-4 py-3">
          <RevisionDiff revision={revision} />
        </div>
      ) : null}
    </li>
  );
}

/**
 * 回滚表单。
 *
 * **直接 import server action**，不靠服务端传函数进来。
 *
 * 早先的方案是让服务端渲染好表单、把 renderRollback 当 prop 传给客户端组件 ——
 * 类型检查、lint、`npm run build` **全都通过**，但真实渲染时 React 直接抛
 * 「Functions cannot be passed directly to Client Components」，条目编辑页打不开。
 *
 * 教训值得留着：**跨服务端/客户端边界时，构建通过不代表渲染能过。**
 * 函数是不可序列化的 prop，编译期查不出来，只有真跑一次才暴露。
 *
 * 客户端组件 import server action 是 Next.js 的既定能力，
 * 本项目的 FeedbackForm / SubmitForm 就是这么做的。
 */
function RollbackForm({ slug, rowVersion }: { slug: string; rowVersion: number }) {
  return (
    <form action={rollbackItem} className="contents">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="version" value={rowVersion} />
      <Button
        type="submit"
        size="sm"
        variant="ghost"
        className="text-muted-foreground hover:text-destructive"
      >
        <RotateCcw />
        回滚到这一版
      </Button>
    </form>
  );
}

/**
 * 某一版的完整内容。
 *
 * **只读，且刻意不做「与上一版的差异」计算** —— 那要重放整条链才能得到，
 * 在服务端做才对。这里给出整版内容让人自己比对，够用且不会算错。
 */
function RevisionDiff({ revision }: { revision: RevisionRow }) {
  const item = revision.item;
  return (
    <div className="space-y-3 text-[13px]">
      <Row label="名称">{item.name}</Row>
      <Row label="摘要">{item.summary}</Row>
      <Row label="状态">{STATUS_LABEL[item.status]}</Row>
      <Row label="标签">{item.tags.join("、") || "—"}</Row>
      <Row label="场景">{item.scenes.join("、") || "—"}</Row>
      <Row label="平台">{item.platforms.join("、") || "—"}</Row>
      <Row label="适合">{item.whoFor || "—"}</Row>
      <Row label="不适合">{item.whoNot || "—"}</Row>
      <div>
        <p className="mb-1 text-[11px] font-medium text-muted-foreground">正文</p>
        <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-lg bg-card p-3 text-[12px] leading-relaxed">
          {item.body || "（空）"}
        </pre>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="w-12 shrink-0 text-[11px] font-medium text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1">{children}</span>
    </div>
  );
}

const ACTION_LABEL: Record<string, string> = {
  create: "创建",
  update: "修改",
  delete: "删除",
  status: "改状态",
};

/** 库列名 / 子表名 → 中文标签。认不出的原样显示，不隐藏信息。 */
const FIELD_LABEL: Record<string, string> = {
  name: "名称",
  name_zh: "中文名",
  summary: "摘要",
  body: "正文",
  who_for: "适合",
  who_not: "不适合",
  price: "价格",
  license: "许可证",
  version: "版本",
  status: "状态",
  kind: "类型",
  source: "来源",
  featured: "精选",
  icon_letter: "图标字母",
  icon_color: "图标颜色",
  icon_image: "图标图片",
  tutorial: "教程",
  guide_intro: "指南简介",
  guide_markdown: "指南正文",
  tags: "标签",
  scenes: "场景",
  platforms: "平台",
  alternatives: "同类替代",
  links: "链接",
  previews: "预览图",
  guideResources: "指南资源",
};