import { Link } from "@tanstack/react-router";
import { BrandLogo } from "./BrandLogo";

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-md">
            <BrandLogo />
            <p className="mt-3 font-display text-[0.6875rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              Awareness. Truth. Preparation.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              This service complements, and does not replace, official emergency
              guidance. In an emergency contact local emergency services.
            </p>
          </div>
          <nav aria-label="Footer" className="flex flex-col gap-1.5 text-sm">
            <Link to="/alerts" className="text-muted-foreground hover:text-foreground">
              Alerts
            </Link>
            <Link to="/travel" className="text-muted-foreground hover:text-foreground">
              Travel
            </Link>
            <Link to="/about" className="text-muted-foreground hover:text-foreground">
              About
            </Link>
            <Link to="/privacy" className="text-muted-foreground hover:text-foreground">
              Privacy
            </Link>
          </nav>
        </div>
        <p className="mt-6 border-t border-border pt-4 text-[0.6875rem] leading-relaxed text-muted-foreground">
          Map basemap{" "}
          <a
            href="https://www.esri.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground"
          >
            © Esri
          </a>
          . Alert data and grading are Magen Global's own.
        </p>
      </div>
    </footer>
  );
}
