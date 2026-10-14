"use client";

import { usePathname } from "next/navigation";
import { useRef, useState } from "react";

import { grantPass } from "@/app/actions";
import { Turnstile } from "@/components/Turnstile";

/**
 * 首次访问的静默人机检测。
 *
 * 手里没有有效通行证时，在右下角挂一个 appearance=interaction-only 的控件：真人
 * 无需交互，控件完全不可见、不打断阅读；只有在 Cloudflare 要求交互时才会显形。
 * 拿到令牌后交给服务端核验并签发 5 小时通行证，此后表单不再重复验证。
 *
 * 这层检测**不拦内容**：它挡的是「写」，不是「读」。所以搜索引擎抓取、分享预览、
 * 无 JS 环境一概不受影响——内容站的第一价值是被搜到，首访墙会把这件事毁掉。
 *
 * 右侧容器用 pointer-events-none：控件不可见时不占点击热区（否则右下角的页脚链接
 * 会被一块透明区域吃掉）。代价是万一需要交互，那个角落的控件点不到——此时用户直接
 * 去表单提交即可，表单里那枚始终可见的验证框会照常放行。
 */
export function VisitorCheck({ siteKey }: { siteKey: string }) {
  const pathname = usePathname();
  const sentRef = useRef(false);
  const [settled, setSettled] = useState(false);

  // 后台不做首访检测：那里有口令 + 限流，且通行证只证明「最近有真人访问过本站」，
  // 不足以替代凭据校验（登录表单因此始终要现场验证，见 app/admin/login/page.tsx）。
  if (pathname?.startsWith("/admin") || settled) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50">
      <Turnstile
        siteKey={siteKey}
        action="visitor"
        appearance="interaction-only"
        onToken={(token) => {
          if (!token || sentRef.current) return;
          sentRef.current = true;
          setSettled(true);
          void grantPass(token);
        }}
      />
    </div>
  );
}
