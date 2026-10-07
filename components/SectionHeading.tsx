/** 区块标题：H2 + 一句说明，右侧可放操作。 */
export function SectionHeading({
  id,
  title,
  description,
  action,
  className = "",
}: {
  id?: string;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-x-6 gap-y-3 ${className}`}>
      <div className="min-w-0">
        <h2 id={id} className="text-[22px] font-bold leading-tight tracking-[-0.01em] sm:text-2xl">
          {title}
        </h2>
        {description ? <p className="mt-1.5 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

/** 页面小标：朱砂小印 + 文字，用在页面标题上方。 */
export function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`inline-flex items-center gap-2 text-[13px] font-medium text-muted-foreground ${className}`}>
      <span className="size-1.5 rounded-[2px] bg-brand" aria-hidden="true" />
      {children}
    </p>
  );
}
