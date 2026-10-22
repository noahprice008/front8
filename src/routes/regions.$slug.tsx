import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { RouteError } from "@/components/RouteError";
import { ActivityRow, PostureBadge, TrendLabel, WindowSelector } from "@/components/ClimateBriefing";
import { getClimate } from "@/lib/climate.functions";
import { getTravelData } from "@/lib/alerts.functions";
import { ACTIVITY_LABELS, isWindow, type ActivityCategory, type ClimateWindow } from "@/lib/climate";
import { getSecurityContact } from "@/lib/security-directory";

const climateQuery = (w: ClimateWindow) =>
  queryOptions({ queryKey: ["climate", w], queryFn: () => getClimate({ data: { window: w } }), staleTime: 60_000 });
const travelQuery = queryOptions({ queryKey: ["travel"], queryFn: () => getTravelData(), staleTime: 300_000 });

export const Route = createFileRoute("/regions/$slug")({
  validateSearch: (s: Record<string, unknown>): { window?: ClimateWindow | undefined } => ({ window: isWindow(s["window"]) ? s["window"] : undefined }),
  loaderDeps: ({ search }) => ({ w: search.window ?? "14d" }),
  loader: async ({ context, deps }) => {
    void context.queryClient.ensureQueryData(travelQuery);
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
});

function RegionPage() {
  const { slug } = Route.useParams();
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const w = search.window ?? "14d";
  const { data } = useSuspenseQuery(climateQuery(w));
  const { data: travel } = useSuspenseQuery(travelQuery);
  const zone = data.zones.find((z) => z.slug === slug);
  if (!zone) throw notFound();
  const items = data.stream.filter((i) => i.regionSlug === slug);
  const advisories = travel.advisoriesByRegion[zone.regionId] ?? [];
  const contact = getSecurityContact(slug);
  const cats = Object.entries(zone.byCategory) as [ActivityCategory, number][];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <p className="font-mono text-[0.6875rem] uppercase tracking-wider text-muted-foreground">Zone briefing · {slug.toUpperCase()}</p>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold text-foreground">{zone.name}</h1>
        <WindowSelector value={w} onChange={(v) => navigate({ search: { window: v } })} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4 border border-border bg-card px-4 py-3">
        <PostureBadge p={zone.posture} />
        <TrendLabel t={zone.trend} />
        <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-muted-foreground">Score {zone.score}</span>
      </div>

      <section className="mt-6 border border-border bg-card p-5">
        <h2 className="font-display text-sm font-bold uppercase tracking-[0.18em]">Why this posture?</h2>
        <ul className="mt-2 grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
          <li>{zone.confirmedAlerts} verified incident alert{zone.confirmedAlerts === 1 ? "" : "s"}</li>
          <li>{zone.developing} developing report{zone.developing === 1 ? "" : "s"}</li>
          <li>{zone.activityCount} activity report{zone.activityCount === 1 ? "" : "s"} in the last {w}</li>
          <li>{zone.institutionCount} mentioning Jewish institutions</li>
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
        <Link to="/alerts" search={{ region: slug }} className="mt-3 inline-block text-sm font-medium text-primary underline">All alerts for {zone.name}</Link>
      </section>

      {advisories.length > 0 && (
        <section className="mt-6 border border-border bg-card p-5">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.18em]">Travel advisory</h2>
          {advisories.map((a) => (
            <p key={a.id} className="mt-2 text-sm"><a href={a.sourceUrl} target="_blank" rel="noopener noreferrer" className="font-medium underline">{a.title}</a> — {a.levelText}</p>
          ))}
        </section>
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
