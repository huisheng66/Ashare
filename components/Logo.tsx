import Link from "next/link";

/** 朱砂印章：几何粗体「A」镂空在圆角方块里，不依赖字体。 */
export function SealMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <rect width="32" height="32" rx="8" className="fill-brand" />
      <path
        className="fill-brand-foreground"
        fillRule="evenodd"
        d="M13.6 7h4.8L25 25h-4.3l-1.28-3.5h-6.84L11.3 25H7L13.6 7Zm.16 11.3h4.48L16 12.2l-2.24 6.1Z"
      />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Ashare 首页"
      className={`group inline-flex h-11 shrink-0 items-center gap-2.5 rounded-lg ${className}`}
    >
      <SealMark className="size-8 transition-transform duration-200 ease-(--ease-soft) group-hover:-rotate-6" />
      <span className="text-[17px] font-bold tracking-[-0.01em]">Ashare</span>
    </Link>
  );
}
