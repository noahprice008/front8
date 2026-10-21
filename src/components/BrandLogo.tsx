import logo from "@/assets/magen-logo.png";

export function BrandMark({ className = "h-10 w-10" }: { className?: string }) {
  return <img src={logo} alt="" aria-hidden="true" className={`${className} object-contain`} />;
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
