import Link from "next/link";

import { SealMark } from "@/components/Logo";
import type { SceneNavItem } from "@/components/SiteHeader";

const ICP = {
  href: "https://beian.miit.gov.cn/",
  text: "鲁ICP备2026008648号-1",
};

const MPS = {
  href: "https://beian.mps.gov.cn/#/query/webSearch?code=37011602000384",
  text: "鲁公网安备37011602000384号",
};

function BeianLink({ href, text }: { href: string; text: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-foreground">
      {text}
    </a>
  );
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <nav aria-label={title}>
      <h2 className="text-xs font-medium text-muted-foreground">{title}</h2>
      <ul className="mt-3 flex flex-col gap-1">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="inline-flex min-h-8 items-center text-sm transition-colors hover:text-brand">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function SiteFooter({ scenes }: { scenes: SceneNavItem[] }) {
  const ready = scenes.filter((scene) => scene.count > 0);
  return (
    <footer className="mt-24 border-t border-border bg-card/60">
      <div className="shell grid grid-cols-1 gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div className="sm:col-span-2 lg:col-span-1">
          <Link href="/" className="inline-flex items-center gap-2.5" aria-label="Ashare 首页">
            <SealMark className="size-7" />
            <span className="text-base font-bold">Ashare</span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            按使用场景找软件。只链接官网、开源仓库与作者授权的渠道，不托管安装包，不收录破解。
          </p>
        </div>
        <FooterColumn
          title="浏览"
          links={[
            { href: "/", label: "探索" },
            { href: "/search", label: "搜索" },
            { href: "/about", label: "收录标准" },
          ]}
        />
        <FooterColumn title="场景" links={ready.slice(0, 5).map((scene) => ({ href: `/scenes/${scene.id}`, label: scene.name }))} />
        <FooterColumn
          title="参与"
          links={[
            { href: "/submit", label: "推荐工具" },
            { href: "/feedback", label: "反馈问题" },
          ]}
        />
      </div>
      <div className="border-t border-border">
        <div className="shell flex flex-col gap-2 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:gap-5">
          <BeianLink {...MPS} />
          <BeianLink {...ICP} />
          <span className="sm:ml-auto">不托管安装包 · 不收录破解与修改版</span>
        </div>
      </div>
    </footer>
  );
}
