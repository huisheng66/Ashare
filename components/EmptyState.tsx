import type { LucideIcon } from "lucide-react";

/** 空状态：说清原因，并给出下一步。 */
export function EmptyState({
  icon: Icon,
  title,
  children,
  actions,
  className = "",
  headingLevel = 2,
}: {
  icon: LucideIcon;
  title: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <div className={`flex flex-col items-center rounded-3xl border border-dashed border-border px-6 py-14 text-center ${className}`}>
      <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground" aria-hidden="true">
        <Icon className="size-5" />
      </span>
      <Heading className="mt-5 text-lg font-semibold">{title}</Heading>
      {children ? <div className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{children}</div> : null}
      {actions ? <div className="mt-6 flex flex-wrap justify-center gap-2">{actions}</div> : null}
    </div>
  );
}
