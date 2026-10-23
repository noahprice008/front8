import { Link } from "@tanstack/react-router";
import { BrandLogo } from "./BrandLogo";
import { FreshnessStamp } from "./FreshnessStamp";
import { Button } from "./ui/button";
import { ArrowUpRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t-2 border-primary bg-secondary/40">
      <div className="mx-auto max-w-[1440px] px-4 pt-8 sm:px-6 sm:pt-10 lg:px-8">
        <div className="grid gap-8 pb-8 lg:grid-cols-3 lg:gap-12 lg:pb-10">
          <div className="min-w-0 text-center lg:text-left">
            <Link to="/" aria-label="Magen Global home" className="inline-flex rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <BrandLogo />
            </Link>
            <p className="mt-3 font-display text-[0.6875rem] font-semibold uppercase text-muted-foreground">
              Awareness. Truth. Preparation.
            </p>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground lg:mx-0">
              An independent safety service for Jews living outside Israel,
              tracking the antisemitic climate country by country. We do not
              cover Israel.
            </p>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-6 border-y border-border py-6 lg:border-y-0 lg:border-x lg:px-8 lg:py-0">
            <div>
              <h2 className="mb-3 font-display text-xs font-semibold uppercase text-foreground">Monitor</h2>
              <ul className="space-y-1">
                {([{ to: "/", label: "Current climate" }, { to: "/alerts", label: "Alerts" }, { to: "/news", label: "News" }, { to: "/travel", label: "Travel" }] as const).map((link) => (
                  <li key={link.to}><Button asChild variant="link" className="h-auto justify-start whitespace-normal p-0 py-1.5 text-sm font-normal text-muted-foreground hover:text-foreground"><Link to={link.to}>{link.label}</Link></Button></li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="mb-3 font-display text-xs font-semibold uppercase text-foreground">Magen Global</h2>
              <ul className="space-y-1">
                {([{ to: "/about", label: "About" }, { to: "/how-it-works", label: "How it works" }, { to: "/privacy", label: "Privacy" }, { to: "/contact", label: "Contact" }] as const).map((link) => (
                  <li key={link.to}><Button asChild variant="link" className="h-auto justify-start whitespace-normal p-0 py-1.5 text-sm font-normal text-muted-foreground hover:text-foreground"><Link to={link.to}>{link.label}</Link></Button></li>
                ))}
              </ul>
            </div>
          </nav>
          <div className="min-w-0 text-center lg:text-left">
            <h2 className="font-display text-xs font-semibold uppercase text-foreground">Independent. Community-supported.</h2>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground lg:mx-0">
              Help keep safety intelligence free and accessible to Jewish communities worldwide.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4 border-primary/30 bg-transparent text-primary">
              <Link to="/support">Support Magen <ArrowUpRight aria-hidden="true" /></Link>
            </Button>
          </div>
        </div>
        <div className="border-t border-border py-5">
          <p className="mx-auto max-w-3xl text-center text-xs leading-relaxed text-muted-foreground">
            This service complements, and does not replace, official emergency guidance. In an emergency contact local emergency services.
          </p>
          <div className="mt-4 flex flex-col items-center justify-between gap-3 text-center lg:flex-row lg:text-left">
            <FreshnessStamp />
            <p className="text-[0.6875rem] leading-relaxed text-muted-foreground">
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
        </div>
      </div>
    </footer>
  );
}
