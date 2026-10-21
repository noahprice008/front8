export function BrandMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="mg-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--brand-accent)" />
          <stop offset="1" stopColor="var(--primary)" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="url(#mg-a)" strokeWidth="5.5" strokeLinejoin="round">
        <path d="M32 6 54.5 45H9.5Z" />
        <path d="M32 58 9.5 19h45Z" />
      </g>
    </svg>
  );
}

export function BrandLogo() {
  return (
    <span className="flex items-center gap-2.5">
      <BrandMark />
      <span className="flex flex-col leading-none">
        <span className="font-display text-lg font-bold tracking-[0.14em] text-primary">
          MAGEN
        </span>
        <span className="mt-1 font-display text-[0.625rem] font-semibold tracking-[0.42em] text-brand-accent">
          GLOBAL
        </span>
      </span>
    </span>
  );
}
