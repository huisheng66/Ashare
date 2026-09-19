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
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="hover:text-foreground"
    >
      {text}
    </a>
  );
}

export function SiteFooter({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={
        compact
          ? "text-[11px] leading-relaxed text-muted-foreground"
          : "border-t border-border px-5 py-6 text-[11px] leading-relaxed text-muted-foreground"
      }
    >
      {compact ? null : (
        <>
          <p className="lg:hidden">
            只连可核验的官方、开源与作者授权渠道，不托管安装包。
          </p>
          <p className="mt-1 lg:hidden">不收录破解、修改版与盗版分发。</p>
        </>
      )}
      <p
        className={
          compact ? "mt-2 flex flex-col gap-0.5" : "mt-2 flex flex-wrap gap-x-3 gap-y-1"
        }
      >
        <BeianLink {...MPS} />
        <BeianLink {...ICP} />
      </p>
    </div>
  );
}
