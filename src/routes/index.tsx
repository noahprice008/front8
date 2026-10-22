import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCard } from "@/components/AlertCard";
import { FeedStatusBanner } from "@/components/FeedStatusBanner";
import { RouteError } from "@/components/RouteError";
import { WorldMap } from "@/components/map/WorldMap";
import { getLatestAlerts, getMapData } from "@/lib/alerts.functions";
import { formatRelative, formatUtc } from "@/lib/format";
import { getClimate } from "@/lib/climate.functions";
import { isWindow, type ClimateWindow } from "@/lib/climate";
import { ClimateBriefing, ThreatconBar, WindowSelector } from "@/components/ClimateBriefing";

const mapQuery = queryOptions({
  queryKey: ["map-data"],
  queryFn: () => getMapData(),
  staleTime: 30_000,
  refetchInterval: 60_000,
});

const latestQuery = queryOptions({
  queryKey: ["latest-alerts"],
  queryFn: () => getLatestAlerts({ data: { limit: 3 } }),
  staleTime: 30_000,
});

const climateQuery = (w: ClimateWindow) =>
  queryOptions({
    queryKey: ["climate", w],
    queryFn: () => getClimate({ data: { window: w } }),
    staleTime: 30_000,
    refetchInterval: 120_000,
  });

export const Route = createFileRoute("/")({
  head,
  validateSearch: (s: Record<string, unknown>): { window?: ClimateWindow | undefined } => ({
    window: isWindow(s["window"]) ? s["window"] : undefined,
  }),
  loaderDeps: ({ search }) => ({ w: search.window ?? "7d" }),
  loader: ({ context, deps }) => {
    void context.queryClient.ensureQueryData(climateQuery(deps.w));
    void context.queryClient.ensureQueryData(mapQuery);
    void context.queryClient.ensureQueryData(latestQuery);
  },
  component: HomePage,
  errorComponent: RouteError,
});

function HomePage() {
  const { data } = useSuspenseQuery(mapQuery);
  const { data: latest } = useSuspenseQuery(latestQuery);
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const win = search.window ?? "7d";
  const { data: climate } = useSuspenseQuery(climateQuery(win));

  const topLevel = data.regions.filter((r) => !r.parentId);
  const monitored = topLevel.filter((r) => r.covered).length;
  const totalActive = topLevel.reduce(
    (sum, r) => sum + (r.covered ? r.activeAlerts : 0),
    0,
  );

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col px-4 py-4 sm:block sm:px-6 sm:py-10 lg:px-8">
      {/* Hero */}
      <section className="order-2 mt-8 max-w-3xl sm:mt-0">
        <h1 className="font-display text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
          Know the climate. Understand the risk. Stay prepared.
        </h1>
        <p className="mt-6 font-display text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Our Mission
        </p>
        <p className="mt-2 text-base leading-relaxed text-muted-foreground">
          Magen Global is an independent safety intelligence service for Jews
          living or travelling outside Israel. We monitor the evolving
          antisemitic climate on the ground, country by country, tracking
          attacks, threats, harassment, demonstrations near Jewish institutions,
          and other forms of targeting against Jewish individuals and
          communities.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/alerts"
            className="inline-flex items-center rounded-sm bg-primary px-5 font-display uppercase tracking-wider py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            View current alerts
          </Link>
          <Link
            to="/about"
            className="inline-flex items-center rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            How this works
          </Link>
        </div>
        <dl className="mt-8 grid grid-cols-3 gap-2 sm:gap-4 border-y border-border py-4 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Regions monitored</dt>
            <dd className="mt-0.5 text-lg font-semibold text-foreground">{monitored}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Active alerts</dt>
            <dd className="mt-0.5 text-lg font-semibold text-foreground">{totalActive}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Last successful feed</dt>
            <dd className="mt-0.5 text-sm font-medium text-foreground">
              {data.feed.lastIngestOkAt ? formatUtc(data.feed.lastIngestOkAt) : "Never"}
            </dd>
          </div>
        </dl>
        <ThreatconBar data={climate} />
      </section>

      {/* World map */}
      <section className="order-1 sm:mt-10" aria-label="World map">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">
              Current climate
            </h2>
            <p className="mt-1 hidden text-sm text-muted-foreground sm:block">
              One zone per monitored region. The outer ring shows each zone's
              climate posture from verified incidents, developing reports and
              recent activity. Click any zone for details.
            </p>
          </div>
          <div className="flex items-center gap-3">
          <WindowSelector value={win} onChange={(w) => navigate({ search: { window: w }, resetScroll: false })} />
          <p className="font-mono text-[0.6875rem] uppercase tracking-wider text-muted-foreground" aria-live="off">
            {data.feed.lastIngestOkAt
              ? `Updated ${formatRelative(data.feed.lastIngestOkAt)}`
              : "Feed not yet updated"}
          </p>
          </div>
        </div>
        <div className="mt-3 space-y-3 sm:mt-4">
          <FeedStatusBanner
            feedDelay={data.feed.feedDelay}
            autopublishPaused={!data.feed.autopublishEnabled}
          />
          <WorldMap regions={data.regions} feedDelay={data.feed.feedDelay} climate={climate.zones} />
        </div>
      </section>

      <div className="order-3 sm:order-none"><ClimateBriefing data={climate} /></div>

      {/* Latest alerts */}
      <section className="order-4 mt-12" aria-label="Latest alerts">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-xl font-semibold text-foreground">
            Latest alerts
          </h2>
          <Link
            to="/alerts"
            className="text-sm font-medium text-primary underline underline-offset-2 hover:opacity-80"
          >
            All alerts
          </Link>
        </div>
        {latest.length === 0 ? (
          <div className="mt-4 rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
            No active alerts right now. Monitored regions are showing green on
            the map — which means no current alerts from monitored sources. It
            does not guarantee safety.
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {latest.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        )}
      </section>

      {/* How this works */}
      <section className="order-5 mt-12 rounded-xl border border-border bg-card p-6 sm:p-8">
        <h2 className="font-display text-xl font-semibold text-foreground">
          How this works
        </h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-3">
          <div>
            <p className="text-sm font-semibold text-primary">1 · Monitor</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Automated feeds watch official government advisories and a
              curated list of verified news publishers, around the clock.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-primary">2 · Grade</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Every item is graded by tier — official, trusted community security source, or an automated summary
              of verified reporting — and by severity, with links to the
              original sources.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-primary">3 · Publish</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Alerts go live on the map and list, stay reviewable, and expire
              visibly. Expired alerts are archived, never silently deleted.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export function head() { return {
  meta: [
    {
      title: "Magen Global — Safety alerts for Jewish communities",
    },
    {
      name: "description",
      content:
        "Independent, sourced safety alerts for Jewish communities worldwide. Live world map, graded alerts, official sources.",
    },
    { property: "og:title", content: "Magen Global — Safety alerts for Jewish communities" },
    {
      property: "og:description",
      content:
        "Independent, sourced safety alerts for Jewish communities worldwide. Live world map, graded alerts, official sources.",
    },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ],
}; }
