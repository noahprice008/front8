import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { RouteError } from "@/components/RouteError";
import { ActivityRow, PostureBadge, TrendLabel, WindowSelector } from "@/components/ClimateBriefing";
import { getClimate } from "@/lib/climate.functions";
import { getTravelData } from "@/lib/alerts.functions";
import { ACTIVITY_LABELS, isWindow, type ActivityCategory, type ClimateWindow } from "@/lib/climate";
import { getSecurityContact } from "@/lib/security-directory";
import { getZoneDetail } from "@/lib/zone.functions";
import { AlertCard } from "@/components/AlertCard";
import { SeverityBadge } from "@/components/SeverityBadge";
import { formatRelative, languageName } from "@/lib/format";

const zoneQuery = (slug: string) =>
  queryOptions({ queryKey: ["zone", slug], queryFn: () => getZoneDetail({ data: { slug } }), staleTime: 60_000 });

const climateQuery = (w: ClimateWindow) =>
  queryOptions({ queryKey: ["climate", w], queryFn: () => getClimate({ data: { window: w } }), staleTime: 60_000 });
const travelQuery = queryOptions({ queryKey: ["travel"], queryFn: () => getTravelData(), staleTime: 300_000 });

export const Route = createFileRoute("/region/$slug")({
  validateSearch: (s: Record<string, unknown>): { window?: ClimateWindow | undefined } => ({ window: isWindow(s["window"]) ? s["window"] : undefined }),
  loaderDeps: ({ search }) => ({ w: search.window ?? "14d" }),
  loader: async ({ context, deps, params }) => {
    void context.queryClient.ensureQueryData(travelQuery);
    await context.queryClient.ensureQueryData(zoneQuery(params.slug));
    return context.queryClient.ensureQueryData(climateQuery(deps.w));
  },
  head: ({ params }) => {
    const name = params.slug.split("-").map((p) => p[0]?.toUpperCase() + p.slice(1)).join(" ");
    const title = `${name} security climate — Magen Global`;
    const description = `Current posture, trend and recent activity affecting Jewish communities in ${name}.`;
    return { meta: [
      { title }, { name: "description", content: description },
      { property: "og:title", content: title }, { property: "og:description", content: description },
      { property: "og:type", content: "article" }, { name: "twitter:card", content: "summary" },
    ] };
  },
  component: RegionPage,
  errorComponent: RouteError,
  notFoundComponent: () => <div className="mx-auto max-w-5xl px-4 py-10 text-sm text-muted-foreground">This zone is not monitored yet. <Link to="/" className="underline">Back to the map</Link></div>,
});

function RegionPage() {
  const { slug } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const w = search.window ?? "14d";
  const { data } = useSuspenseQuery(climateQuery(w));
  const { data: travel } = useSuspenseQuery(travelQuery);
  const { data: detail } = useSuspenseQuery(zoneQuery(slug));
  if (!detail) throw notFound();
  const zone = data.zones.find((z) => z.slug === slug);
  const name = detail.name;
  const parent = detail.ancestors[detail.ancestors.length - 1];
  const items = data.stream.filter((i) => i.regionSlug === slug);
  const advisories = travel.advisoriesByRegion[detail.id] ?? [];
  const contact = getSecurityContact(slug);
  const cats = Object.entries(zone?.byCategory ?? {}) as [ActivityCategory, number][];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <nav aria-label="Breadcrumb" className="font-mono text-[0.6875rem] uppercase tracking-wider text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1">
          <li><Link to="/" className="hover:underline">Home</Link></li>
          {detail.ancestors.map((a) => (
            <li key={a.slug} className="flex items-center gap-1"><span aria-hidden="true">›</span><Link to="/region/$slug" params={{ slug: a.slug }} className="hover:underline">{a.name}</Link></li>
          ))}
          <li className="flex items-center gap-1" aria-current="page"><span aria-hidden="true">›</span>{name}</li>
        </ol>
      </nav>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">{name}</h1>
          {parent && <p className="text-sm text-muted-foreground">Part of <Link to="/region/$slug" params={{ slug: parent.slug }} className="font-medium underline">{parent.name}</Link></p>}
        </div>
        <WindowSelector value={w} onChange={(v) => navigate({ search: { window: v } })} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4 border border-border bg-card px-4 py-3">
        {zone && <PostureBadge p={zone.posture} />}
        {zone && <TrendLabel t={zone.trend} />}
        {zone && <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-muted-foreground">Score {zone.score}</span>}
        <span className="flex items-center gap-2">
          {detail.topSeverity ? <SeverityBadge severity={detail.topSeverity} size="sm" /> : <span className="text-xs font-medium text-muted-foreground">No incidents reported in the last 7 days</span>}
        </span>
        <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-muted-foreground">Last updated {formatRelative(detail.lastIngestOkAt)}</span>
      </div>

      {detail.children.length > 0 && (
        <section className="mt-6">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.18em]">Areas in {name}</h2>
          <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {detail.children.map((c) => (
              <Link key={c.slug} to="/region/$slug" params={{ slug: c.slug }} className="flex items-center justify-between gap-2 border border-border bg-card px-3 py-2.5 hover:bg-accent/50">
                <span className="text-sm font-medium text-foreground">{c.name}</span>
                {c.activeAlerts > 0 && c.topSeverity ? <SeverityBadge severity={c.topSeverity} size="sm" /> : <span className="text-xs text-muted-foreground">No incidents</span>}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-6">
        <h2 className="font-display text-sm font-bold uppercase tracking-[0.18em]">Active alerts</h2>
        {detail.alerts.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No reports in this area yet. No reports does not guarantee safety.</p>
        ) : (
          <div className="mt-2 grid gap-3 sm:grid-cols-2">{detail.alerts.map((a) => (
            <div key={a.id}>
              {a.regionSlug !== slug && <p className="mb-1 font-mono text-[0.6875rem] uppercase tracking-wider text-muted-foreground">{a.regionName}</p>}
              <AlertCard alert={a} />
            </div>
          ))}</div>
        )}
      </section>

      {(
        <section className="mt-6 border border-border bg-card p-5">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.18em]">Last 7 days</h2>
          <ActivityChart days={detail.days} />
        </section>
      )}

      <section className="mt-6 border border-border bg-card p-5">
        <h2 className="font-display text-sm font-bold uppercase tracking-[0.18em]">Why this posture?</h2>
        <ul className="mt-2 grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
          <li>{(zone?.confirmedAlerts ?? 0)} verified incident alert{(zone?.confirmedAlerts ?? 0) === 1 ? "" : "s"}</li>
          <li>{(zone?.developing ?? 0)} developing report{(zone?.developing ?? 0) === 1 ? "" : "s"}</li>
          <li>{(zone?.activityCount ?? 0)} activity report{(zone?.activityCount ?? 0) === 1 ? "" : "s"} in the last {w}</li>
          <li>{(zone?.institutionCount ?? 0)} mentioning Jewish institutions</li>
        </ul>
        {cats.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {cats.map(([c, n]) => (
              <span key={c} className="border border-border px-2 py-1 font-mono text-[0.6875rem] uppercase tracking-wider text-foreground">{ACTIVITY_LABELS[c]} · {n}</span>
            ))}
          </div>
        )}
        <p className="mt-3 text-xs text-muted-foreground">Activity reports raise awareness of the climate; they are not confirmed direct threats. <Link to="/about" className="underline">How we grade</Link>.</p>
      </section>

      <section className="mt-6">
        <h2 className="font-display text-sm font-bold uppercase tracking-[0.18em]">Recent timeline</h2>
        <div className="mt-2 space-y-1">
          {items.length === 0 ? <p className="text-sm text-muted-foreground">No recent activity in this time range. This does not guarantee safety.</p> : items.map((i) => <ActivityRow key={i.id} item={i} />)}
        </div>
        <Link to="/alerts" search={{ region: slug }} className="mt-3 inline-block text-sm font-medium text-primary underline">All alerts for {name}</Link>
      </section>

      {detail.advisories.length > 0 ? (
        <section className="mt-6">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.18em]">Official travel advisories</h2>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">{detail.advisories.map((a) => <AlertCard key={a.id} alert={a} />)}</div>
        </section>
      ) : advisories.length > 0 ? (
        <section className="mt-6 border border-border bg-card p-5">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.18em]">Official travel advisories</h2>
          {advisories.map((a) => (
            <p key={a.id} className="mt-2 text-sm"><a href={a.sourceUrl} target="_blank" rel="noopener noreferrer" className="font-medium underline">{a.title}</a> — {a.levelText}</p>
          ))}
        </section>
      ) : null}

      <section className="mt-6">
        <h2 className="font-display text-sm font-bold uppercase tracking-[0.18em]">Recent headlines</h2>
        {detail.headlines.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No recent headlines for this zone yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-border border border-border bg-card">
            {detail.headlines.map((h) => (
              <li key={h.id} className="px-4 py-2.5">
                <a href={h.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-foreground hover:underline">{h.title}</a>
                <p className="text-xs text-muted-foreground">
                  {h.publisher ? `${h.publisher} · ` : ""}{formatRelative(h.publishedAt)}
                  {h.language && h.language !== "en" ? ` · Translated from ${languageName(h.language)}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {parent && (
        <details className="mt-6 border border-border bg-card p-5">
          <summary className="cursor-pointer font-display text-sm font-bold uppercase tracking-[0.18em]">Also see {parent.name}</summary>
          {detail.parentAlerts.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No reports in this area yet.</p>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">{detail.parentAlerts.map((a) => <AlertCard key={a.id} alert={a} />)}</div>
          )}
          <Link to="/region/$slug" params={{ slug: parent.slug }} className="mt-3 inline-block text-sm font-medium text-primary underline">Open {parent.name}</Link>
        </details>
      )}

      {contact && (
        <section className="mt-6 border-l-2 border-sev-critical bg-card p-5">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.18em]">Emergency & community security</h2>
          <p className="mt-2 text-sm">Emergency: <a className="font-semibold underline" href={`tel:${contact.emergency}`}>{contact.emergency}</a></p>
        </section>
      )}
    </div>
  );
}

function ActivityChart({ days }: { days: { date: string; headlines: number; alerts: number }[] }) {
  const max = Math.max(1, ...days.map((d) => d.headlines + d.alerts));
  return (
    <div className="mt-3">
      <div className="flex h-32 items-end gap-2" role="img" aria-label="Headlines and alerts per day over the last 7 days">
        {days.map((d) => (
          <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
            <span className="font-mono text-[0.625rem] text-muted-foreground">{d.headlines + d.alerts}</span>
            <div className="flex w-full flex-col justify-end" style={{ height: "96px" }}>
              <div className="w-full bg-sev-high" style={{ height: `${(d.alerts / max) * 96}px` }} title={`${d.alerts} alerts`} />
              <div className="w-full bg-primary/70" style={{ height: `${(d.headlines / max) * 96}px` }} title={`${d.headlines} headlines`} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-2">
        {days.map((d) => (
          <span key={d.date} className="flex-1 text-center font-mono text-[0.625rem] uppercase text-muted-foreground">
            {new Date(d.date + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "short", timeZone: "GMT" })}
          </span>
        ))}
      </div>
      <p className="mt-2 flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 bg-primary/70" />Headlines</span>
        <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 bg-sev-high" />Alerts</span>
      </p>
    </div>
  );
}
