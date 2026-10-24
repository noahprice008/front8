import { Link } from "@tanstack/react-router";
import { SeverityBadge } from "./SeverityBadge";
import { StatusLabel } from "./StatusLabel";
import { categoryLabel, formatExpiresIn, formatRelative, formatUtc, verificationText } from "@/lib/format";
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
            {verificationText("developing", 1)}
          </span>
        ) : (
          <span className="text-[0.6875rem] font-medium text-muted-foreground">
            {verificationText("confirmed", alert.sources?.length ?? 0)}
          </span>
        )}
      </div>
      {(alert.reportCount ?? 1) > 1 && <p className="mt-1 text-[0.6875rem] text-muted-foreground">{alert.reportCount} reports combined</p>}
      {alert.socialAccounts ? (
        <p className="mt-1 text-[0.6875rem] text-muted-foreground">
          Also being discussed by {alert.socialAccounts} {alert.socialAccounts === 1 ? "account" : "accounts"} on social media (unverified)
        </p>
      ) : null}
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
        <span title={formatUtc(alert.publishedAt)}>{formatRelative(alert.publishedAt)}</span>
        <span title={formatUtc(alert.expiresAt)}>{formatExpiresIn(alert.expiresAt)}</span>
      </div>
      {alert.sources && alert.sources.length > 0 && (
        <details className="mt-2 text-xs">
          <summary className="cursor-pointer font-medium text-foreground">
            Sources ({alert.sources.length})
          </summary>
          <ul className="mt-1 space-y-0.5 pl-3">
            {alert.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
                  {s.publisher ?? new URL(s.url).hostname}
                </a>
              </li>
            ))}
          </ul>
        </details>
      )}
      {alert.tier !== "official" && (
        <p className="mt-2 text-[0.6875rem] text-muted-foreground">Automated summary of media reporting.</p>
      )}
    </article>
  );
}
