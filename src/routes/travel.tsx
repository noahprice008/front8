import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { RouteError } from "@/components/RouteError";
import { getTravelData } from "@/lib/alerts.functions";
import type { AlertTier } from "@/lib/alerts.types";
import { formatUtc } from "@/lib/format";
import { getSecurityContact } from "@/lib/security-directory";
import { getTravelZones } from "@/lib/zone.functions";
import { SeverityBadge } from "@/components/SeverityBadge";
import { formatRelative } from "@/lib/format";

const travelZonesQuery = queryOptions({ queryKey: ["travel-zones"], queryFn: () => getTravelZones(), staleTime: 60_000 });

const travelQuery = queryOptions({
  queryKey: ["travel"],
  queryFn: () => getTravelData(),
  staleTime: 60_000,
});

export const Route = createFileRoute("/travel")({
  head,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(travelZonesQuery);
    return context.queryClient.ensureQueryData(travelQuery);
  },
  component: TravelPage,
  errorComponent: RouteError,
});

const CHECKLIST = [
  "Save the local emergency numbers in your phone.",
  "Know where the nearest protected space or shelter is.",
  "Sign up for official local alert apps or mailing lists.",
  "Register with your embassy or consulate if you are abroad.",
  "Keep identity documents and medication easy to reach.",
  "Agree a family check-in plan in case you are separated.",
];

function TierTag({ tier }: { tier: AlertTier | null }) {
  if (tier === "official") {
    return (
      <span className="rounded border border-sev-clear/40 bg-sev-clear/10 px-1.5 py-0.5 text-[0.6875rem] font-medium text-sev-clear">
        Official
      </span>
    );
  }
  if (tier === "community_security") {
    return (
      <span className="rounded border border-sev-moderate/40 bg-sev-moderate/10 px-1.5 py-0.5 text-[0.6875rem] font-medium text-sev-moderate">
        Trusted community security source
      </span>
    );
  }
  if (tier === "verified_news") {
    return (
      <span className="rounded border border-sev-info/40 bg-sev-info/10 px-1.5 py-0.5 text-[0.6875rem] font-medium text-sev-info">
        Verified news
      </span>
    );
  }
  return null;
}

function TravelPage() {
  const { data } = useSuspenseQuery(travelQuery);
  const { data: zones } = useSuspenseQuery(travelZonesQuery);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
        Travel Advice
      </h1>
      <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
        Links to official government travel advisories for every monitored
        region, plus a short practical checklist.
      </p>

      <section className="mt-8">
        <h2 className="font-display text-sm font-bold uppercase tracking-[0.18em]">Israeli travel destinations</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Alerts here cover antisemitism and attacks or threats against Israeli and Jewish travellers. For official travel warnings, check your own government's advice.
        </p>
        {zones.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No reports in this area yet.</p>
        ) : (
          <>
          <details className="mt-3 border border-border bg-card sm:hidden">
            <summary className="flex cursor-pointer items-center justify-between px-3 py-2.5 text-sm font-medium text-foreground">
              <span>{zones.length} destinations</span>
              <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-muted-foreground">
                {zones.filter((z) => z.activeAlerts > 0).length} with alerts
              </span>
            </summary>
            <ul className="max-h-80 divide-y divide-border overflow-auto border-t border-border">
              {zones.map((z) => (
                <li key={z.slug}>
                  <Link to="/region/$slug" params={{ slug: z.slug }} className="flex items-center justify-between gap-2 px-3 py-2 text-sm text-foreground hover:bg-accent/40">
                    <span>{z.name}</span>
                    {z.activeAlerts > 0 && z.topSeverity ? <SeverityBadge severity={z.topSeverity} size="sm" /> : <span className="text-xs text-muted-foreground">No incidents</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </details>
          <div className="mt-3 hidden gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-3">
            {zones.map((z) => (
              <Link key={z.slug} to="/region/$slug" params={{ slug: z.slug }} className="flex flex-col gap-2 border border-border bg-card p-4 hover:bg-accent/40">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-base font-semibold text-foreground">{z.name}</span>
                  {z.activeAlerts > 0 && z.topSeverity ? <SeverityBadge severity={z.topSeverity} size="sm" /> : <span className="text-xs text-muted-foreground">No incidents</span>}
                </div>
                <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-muted-foreground">{z.activeAlerts} active alert{z.activeAlerts === 1 ? "" : "s"}</span>
                {z.latestHeadline ? (
                  <span className="line-clamp-2 text-sm text-foreground">{z.latestHeadline.title} <span className="text-xs text-muted-foreground">· {formatRelative(z.latestHeadline.publishedAt)}</span></span>
                ) : (
                  <span className="text-sm text-muted-foreground">No recent headlines.</span>
                )}
              </Link>
            ))}
          </div>
          </>
        )}
      </section>

      <h2 className="mt-10 font-display text-sm font-bold uppercase tracking-[0.18em]">Official advisories and contacts</h2>
      <div className="mt-4 space-y-4">
        {data.regions.map((region) => {
          const sources = data.sourcesByRegion[region.id] ?? [];
          const advisories = data.advisoriesByRegion[region.id] ?? [];
          return (
            <section
              key={region.id}
              className={`rounded-lg border border-border bg-card p-5${region.parentId ? " ml-6" : ""}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-lg font-semibold text-foreground">
                  {region.name}
                </h2>
                <Link
                  to="/alerts"
                  search={{ region: region.slug }}
                  className="text-sm font-medium text-primary underline underline-offset-2 hover:opacity-80"
                >
                  Alerts for {region.name}
                </Link>
              </div>

              {(() => {
                const sec = getSecurityContact(region.slug);
                if (!sec) return null;
                return (
                  <div className="mt-3 border-l-2 border-destructive bg-destructive/5 px-3 py-2 text-sm">
                    <p className="font-mono text-[0.6875rem] uppercase tracking-wider text-muted-foreground">
                      // Emergency &amp; community security
                    </p>
                    <p className="mt-1 text-foreground">
                      Emergency: <a href={`tel:${sec.emergency.split(" ")[0]}`} className="font-mono font-semibold text-destructive">{sec.emergency}</a>
                    </p>
                    {sec.orgs.map((o) => (
                      <p key={o.name} className="text-foreground">
                        {o.url ? (
                          <a href={o.url} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:opacity-80">{o.name}</a>
                        ) : o.name}
                      </p>
                    ))}
                  </div>
                );
              })()}


              <h3 className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Active travel advisories
              </h3>
              {advisories.length === 0 ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  No active government travel advisories recorded.
                </p>
              ) : (
                <ul className="mt-2 space-y-3">
                  {advisories.map((a) => (
                    <li key={a.id} className="text-sm">
                      <p className="font-medium text-foreground">{a.title}</p>
                      <p className="text-muted-foreground">
                        {a.issuingAuthority ?? "Issuing authority not stated"} · {a.levelText}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Last updated {formatUtc(a.updatedAt)} ·{" "}
                        <a
                          href={a.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline underline-offset-2 hover:opacity-80"
                        >
                          Official source
                        </a>
                      </p>
                    </li>
                  ))}
                </ul>
              )}

              <h3 className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Official advisory links
              </h3>
              {sources.length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  No official advisory links recorded for this region yet.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {sources.map((source) => (
                    <li key={source.url} className="flex items-start gap-2 text-sm">
                      <TierTag tier={source.tier} />
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all text-primary underline underline-offset-2 hover:opacity-80"
                      >
                        {source.name || source.url}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      <section className="mt-10 rounded-xl border border-border bg-card p-6">
        <h2 className="font-display text-lg font-semibold text-foreground">
          Practical checklist, anywhere
        </h2>
        <ul className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          {CHECKLIST.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span
                aria-hidden="true"
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sev-clear"
              />
              {item}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export function head() { return {
  meta: [
    { title: "Travel Advice — Magen Global" },
    {
      name: "description",
      content:
        "Official government travel advisories for every monitored region, plus a practical safety checklist.",
    },
    { property: "og:title", content: "Travel Advice — Magen Global" },
    {
      property: "og:description",
      content:
        "Official government travel advisories for every monitored region, plus a practical safety checklist.",
    },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ],
}; }
