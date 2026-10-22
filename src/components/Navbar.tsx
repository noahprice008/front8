import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BrandLogo } from "./BrandLogo";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/alerts", label: "Alerts" },
  { to: "/news", label: "News" },
  { to: "/travel", label: "Travel" },
  { to: "/about", label: "About" },
] as const;

function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  if (!mounted) return <span className="inline-block w-9" aria-hidden="true" />;

  return (
    <button
      type="button"
      onClick={() => {
        const next = !dark;
        setDark(next);
        document.documentElement.classList.toggle("dark", next);
        try {
          localStorage.setItem("theme", next ? "dark" : "light");
        } catch {
          // storage unavailable — theme resets next visit
        }
      }}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:bg-accent"
    >
      {dark ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
        </svg>
      )}
    </button>
  );
}

export function Navbar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [menuOpen, setMenuOpen] = useState(false);

  const linkClass = (active: boolean) =>
    "rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors sm:px-3 " +
    (active
      ? "bg-accent text-accent-foreground"
      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground");

  return (
    <header className="sticky top-0 z-[1000] border-b-2 border-primary bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" aria-label="Magen Global home" className="shrink-0">
          <BrandLogo />
        </Link>
        {/* Desktop navigation */}
        <nav aria-label="Main navigation" className="hidden items-center gap-2 sm:flex">
          {NAV_LINKS.map((link) => {
            const active =
              link.to === "/" ? pathname === "/" : pathname.startsWith(link.to);
            return (
              <Link
                key={link.to}
                to={link.to}
                aria-current={active ? "page" : undefined}
                className={linkClass(active)}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            to="/contact"
            className="ml-1 inline-flex h-8 items-center rounded-sm border border-brand-accent px-3 font-display text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-brand-accent transition-colors hover:bg-brand-accent hover:text-brand-accent-foreground"
          >
            Contact
          </Link>
          <ThemeToggle />
        </nav>
        {/* Mobile: theme toggle + menu button */}
        <div className="flex items-center gap-2 sm:hidden">
          <Link
            to="/contact"
            className="inline-flex h-9 items-center rounded-sm border border-brand-accent px-2.5 font-display text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-brand-accent"
          >
            Contact
          </Link>
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:bg-accent"
          >
            {menuOpen ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </div>
      {/* Mobile menu panel */}
      {menuOpen ? (
        <nav
          aria-label="Mobile navigation"
          className="border-t border-border bg-background px-4 py-2 sm:hidden"
        >
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => {
              const active =
                link.to === "/" ? pathname === "/" : pathname.startsWith(link.to);
              return (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setMenuOpen(false)}
                    className={"block " + linkClass(active)}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
