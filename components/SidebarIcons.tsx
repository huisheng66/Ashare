const paths: Record<string, React.ReactNode> = {
  explore: (
    <path d="M8 1.6l1.85 3.9 4.25.55-3.15 2.95.85 4.3L8 11.2l-3.8 2.1.85-4.3L1.9 6.05l4.25-.55L8 1.6z" />
  ),
  code: (
    <>
      <path d="M5.2 4.6L2 8l3.2 3.4" />
      <path d="M10.8 4.6L14 8l-3.2 3.4" />
    </>
  ),
  docs: (
    <>
      <path d="M4.2 1.8h5.2l2.9 2.9v9.5H4.2V1.8z" />
      <path d="M6.2 7h4M6.2 9.4h4M6.2 11.8h2.6" />
    </>
  ),
  design: (
    <path d="M3.2 12.9c2.4.5 3.9-.8 3.9-2.3l4.4-4.6-1.5-1.5-4.4 4.6c-1.5.4-2.9 1.8-2.4 3.8zM10.6 3.9l1.5 1.5 1-1a1.06 1.06 0 0 0 0-1.5 1.06 1.06 0 0 0-1.5 0l-1 1z" />
  ),
  data: (
    <path d="M2.8 13.2h10.4M4.2 13V8.6M8 13V4.4M11.8 13V6.4" />
  ),
  office: (
    <>
      <rect x="2.4" y="5.2" width="11.2" height="7.4" rx="1.2" />
      <path d="M5.8 5V4a1.6 1.6 0 0 1 1.6-1.6h1.2A1.6 1.6 0 0 1 10.2 4v1" />
    </>
  ),
  engineering: (
    <>
      <path d="M8 1.8v3" />
      <path d="M8 4.8L4.2 14M8 4.8L11.8 14" />
      <path d="M5.4 11a5.4 5.4 0 0 0 5.2 0" />
    </>
  ),
  tools: (
    <>
      <path d="M2.6 5.4h10.8M2.6 10.6h10.8" />
      <circle cx="5.6" cy="5.4" r="1.5" />
      <circle cx="10.4" cy="10.6" r="1.5" />
    </>
  ),
  photo: (
    <>
      <path d="M2.2 5.2h2.3l.9-1.6h5.2l.9 1.6h2.3v7.2H2.2z" />
      <circle cx="8" cy="8.6" r="2.4" />
    </>
  ),
  games: (
    <>
      <rect x="1.8" y="4.8" width="12.4" height="6.4" rx="3.2" />
      <path d="M5.2 8h2M6.2 7v2" />
      <circle cx="10.4" cy="7.8" r="0.5" />
      <circle cx="11.6" cy="9" r="0.5" />
    </>
  ),
  education: (
    <>
      <path d="M8 2.8L1.8 5.8 8 8.8l6.2-3-6.2-3z" />
      <path d="M4.4 7.2v3.2c0 1.1 1.6 1.9 3.6 1.9s3.6-.8 3.6-1.9V7.2" />
    </>
  ),
  music: (
    <>
      <path d="M6.2 11V3.8l6-1.4v7.1" />
      <circle cx="4.6" cy="11.4" r="1.7" />
      <circle cx="10.6" cy="10.2" r="1.7" />
    </>
  ),
  social: (
    <>
      <path d="M2.6 3.2h10.8v7H8.2l-3 2.6v-2.6H2.6z" />
      <circle cx="6" cy="6.7" r="0.6" />
      <circle cx="8" cy="6.7" r="0.6" />
      <circle cx="10" cy="6.7" r="0.6" />
    </>
  ),
  about: (
    <>
      <path d="M8 1.6l5.2 2v4.1c0 3.4-2.4 5.4-5.2 6.5-2.8-1.1-5.2-3.1-5.2-6.5V3.6l5.2-2z" />
      <path d="M5.8 7.8l1.5 1.5 2.9-3" />
    </>
  ),
  submit: (
    <>
      <circle cx="8" cy="8" r="6.4" />
      <path d="M8 5.2v5.6M5.2 8h5.6" />
    </>
  ),
  feedback: (
    <>
      <path d="M2.6 3.2h10.8v7.2H8.2L5.2 13.2v-2.8H2.6z" />
      <path d="M5.4 6h5.2M5.4 8.2h3.4" />
    </>
  ),
};

const filled = new Set(["explore", "design"]);

export function NavIcon({
  id,
  color,
  className = "",
}: {
  id: string;
  color: string;
  className?: string;
}) {
  const isFilled = filled.has(id);
  return (
    <svg
      viewBox="0 0 16 16"
      fill={isFilled ? "currentColor" : "none"}
      stroke={isFilled ? "none" : "currentColor"}
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={`shrink-0 ${className}`}
      style={{ color }}
    >
      {paths[id] ?? null}
    </svg>
  );
}
