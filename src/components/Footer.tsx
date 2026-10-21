import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-md">
            <p className="font-display text-base font-semibold text-foreground">
              Magen Global
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
              Travel advice
            </Link>
            <Link to="/about" className="text-muted-foreground hover:text-foreground">
              About
            </Link>
            <Link to="/privacy" className="text-muted-foreground hover:text-foreground">
              Privacy
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
