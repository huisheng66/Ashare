type Props = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "ghost";
  className?: string;
};

export function ExternalButton({
  href,
  children,
  variant = "primary",
  className = "",
}: Props) {
  const base =
    "inline-flex h-11 items-center justify-center gap-1.5 rounded-lg px-4 text-[0.9375rem] font-semibold transition-colors duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]";
  const look =
    variant === "primary"
      ? "bg-primary text-on-primary hover:bg-primary-hover"
      : "text-ink hover:bg-surface";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${base} ${look} ${className}`}
    >
      {children}
      <span aria-hidden className="text-[0.85em] opacity-80">
        ↗
      </span>
    </a>
  );
}
