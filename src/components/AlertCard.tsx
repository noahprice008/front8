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
