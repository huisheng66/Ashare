"use client";

import { useEffect, useRef } from "react";
import { ArrowUpRight, GitBranch, Globe, HardDrive, House, ShieldCheck, type LucideIcon } from "lucide-react";

import { recordOutboundClick } from "@/app/track/actions";
import type { LinkChannel } from "@/lib/links";

/**
 * 站内统一的出站链接。
 *
 * 收口了三件以前散在各处的事：
 * 1. `target` / `rel`：外链一律新标签打开 + noopener noreferrer。
 * 2. 域名可见：视觉规范要求「会跳到哪一眼可见」，镜像还会标出「非官方域名」。
 * 3. 点击上报：fire-and-forget，绝不阻塞跳转、也绝不影响可用性。
 */

const ROLE_ICON: Record<LinkChannel["role"], LucideIcon> = {
  primary: Globe,
  product: House,
  repo: GitBranch,
  mirror: HardDrive,
};

type Props = {
  channel: LinkChannel;
  /** 条目 slug，用于统计归因 */
  slug: string;
  /** 视觉变体：row 用于渠道列表，cta 用于详情页主按钮 */
  variant?: "row" | "cta";
  children?: React.ReactNode;
  className?: string;
};

export function OutboundLink({ channel, slug, variant = "row", children, className }: Props) {
  const Icon = ROLE_ICON[channel.role];
  const reported = useRef(false);

  // 用 mousedown 而不是 click：用户按住拖走不会触发 click，
  // 但会触发 mousedown，这时候跳转其实已经发生了。
  useEffect(() => {
    return () => {
      // 组件卸载时若还没上报过（键盘激活等），补一次。
      if (!reported.current) {
        reported.current = true;
        void recordOutboundClick(slug, channel.id);
      }
    };
  }, [slug, channel.id]);

  const report = () => {
    if (reported.current) return;
    reported.current = true;
    void recordOutboundClick(slug, channel.id);
  };

  const isMirror = channel.role === "mirror";
  const external = isMirror ? "（第三方镜像域名，非官方，请核对）" : "（在新标签页打开）";

  if (variant === "cta") {
    return (
      <a
        href={channel.url}
        target="_blank"
        rel="noopener noreferrer nofollow sponsored"
        onMouseDown={report}
        onClick={report}
        className={className}
      >
        {children ?? (
          <>
            前往{channel.label}
            <ArrowUpRight aria-hidden="true" />
          </>
        )}
        <span className="sr-only">{external}</span>
      </a>
    );
  }

  return (
    <a
      href={channel.url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      onMouseDown={report}
      onClick={report}
      className={
        className ??
        "group flex min-h-11 items-center gap-3 rounded-xl px-3 transition-colors hover:bg-muted"
      }
    >
      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span className="shrink-0 text-sm">{channel.label}</span>
      {/* 域名等宽：这是「会跳到哪」的唯一凭据，不能用会省略得只剩后缀的普通文本。 */}
      <span className="ml-auto min-w-0 truncate font-mono text-xs text-muted-foreground">
        {channel.host}
      </span>
      {isMirror ? (
        <span className="tint-soft shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-medium" style={{ "--tone": "var(--discount)" } as React.CSSProperties}>
          镜像
        </span>
      ) : null}
      <ArrowUpRight
        className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:-translate-y-px group-hover:translate-x-px group-hover:text-foreground"
        aria-hidden="true"
      />
      <span className="sr-only">{external}</span>
    </a>
  );
}

/** 镜像说明块，与渠道行一起渲染。 */
export function MirrorNote({ note }: { note?: string }) {
  return (
    <p className="mt-2 flex gap-2.5 rounded-xl bg-muted px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
      <ShieldCheck className="mt-px size-4 shrink-0" aria-hidden="true" />
      <span>
        <span className="font-medium text-foreground">镜像说明：</span>
        {note || "作者或项目方提供的合法镜像。请优先使用官网或 GitHub。"}
      </span>
    </p>
  );
}
