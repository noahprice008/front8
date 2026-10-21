import { Link } from "@tanstack/react-router";
import { SeverityBadge } from "./SeverityBadge";
import { StatusLabel } from "./StatusLabel";
import { categoryLabel, formatUtc } from "@/lib/format";
import type { AlertListItem } from "@/lib/alerts.types";

export function AlertCard({ alert }: { alert: AlertListItem }) {
  return (
    <article className="rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <SeverityBadge severity={alert.severity} size="sm" />
        <StatusLabel expired={new Date(alert.expiresAt).getTime() <= Date.now()} />
        <span className="text-xs text-muted-foreground">{categoryLabel(alert.category)}</span>
        {alert.verification === "developing" ? (
          <span className="rounded-sm border border-amber-600/60 bg-amber-500/10 px-1.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
            Developing: single source, unconfirmed
          </span>
        ) : (
          <span className="text-[0.6875rem] font-medium text-muted-foreground">
            Confirmed by multiple independent sources
          </span>
        )}
      </div>
      <h3 className="mt-2 text-base font-semibold leading-snug text-foreground">
        <Link
          to="/alerts/$id"
          params={{ id: alert.id }}
          className="hover:underline"
        >
          {alert.title}
        </Link>
      </h3>
      <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
        {alert.summary}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <Link
          to="/alerts"
          search={{ region: alert.regionSlug }}
          className="font-medium text-foreground hover:underline"
        >
          {alert.regionName}
        </Link>
        <span>Issued / updated {formatUtc(alert.publishedAt)}</span>
        <span>Expires {formatUtc(alert.expiresAt)}</span>
      </div>
    </article>
  );
}
