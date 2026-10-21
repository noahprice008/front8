import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCard } from "@/components/AlertCard";
import { FeedStatusBanner } from "@/components/FeedStatusBanner";
import { RouteError } from "@/components/RouteError";
import { WorldMap } from "@/components/map/WorldMap";
import { getLatestAlerts, getMapData } from "@/lib/alerts.functions";
import { formatUtc } from "@/lib/format";

const mapQuery = queryOptions({
  queryKey: ["map-data"],
  queryFn: () => getMapData(),
  staleTime: 30_000,
});

const latestQuery = queryOptions({
  queryKey: ["latest-alerts"],
  queryFn: () => getLatestAlerts({ data: { limit: 3 } }),
  staleTime: 30_000,
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => {
    void context.queryClient.ensureQueryData(mapQuery);
    void context.queryClient.ensureQueryData(latestQuery);
  },
  component: HomePage,
  errorComponent: RouteError,
});

function HomePage() {
  const { data } = useSuspenseQuery(mapQuery);
  const { data: latest } = useSuspenseQuery(latestQuery);

  const monitored = data.regions.filter((r) => r.covered).length;
  const totalActive = data.regions.reduce(
    (sum, r) => sum + (r.covered ? r.activeAlerts : 0),
    0,
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* Hero */}
      <section className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Independent · sourced · no fear, just facts
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
          Safety alerts for Jewish communities, from sources you can check.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          The Eighth Front monitors official government advice and verified
          news reporting around the clock, and publishes graded, sourced
          alerts for Jewish communities worldwide — so you hear early, and can
          verify for yourself.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/alerts"
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
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
        <dl className="mt-8 grid grid-cols-3 gap-4 border-y border-border py-4 text-sm">
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
      </section>

      {/* World map */}
      <section className="mt-10" aria-label="World map">
        <h2 className="font-display text-xl font-semibold text-foreground">
          The world, at a glance
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          One bubble per monitored region. Click any region for its latest
          alerts.
        </p>
        <div className="mt-4 space-y-3">
          <FeedStatusBanner
            feedDelay={data.feed.feedDelay}
            autopublishPaused={!data.feed.autopublishEnabled}
          />
          <WorldMap regions={data.regions} feedDelay={data.feed.feedDelay} />
        </div>
      </section>

      {/* Latest alerts */}
      <section className="mt-12" aria-label="Latest alerts">
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
      <section className="mt-12 rounded-xl border border-border bg-card p-6 sm:p-8">
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

export const head = () => ({
  meta: [
    {
      title: "The Eighth Front — Safety alerts for Jewish communities",
    },
    {
      name: "description",
      content:
        "Independent, sourced safety alerts for Jewish communities worldwide. Live world map, graded alerts, official sources.",
    },
    { property: "og:title", content: "The Eighth Front — Safety alerts for Jewish communities" },
    {
      property: "og:description",
      content:
        "Independent, sourced safety alerts for Jewish communities worldwide. Live world map, graded alerts, official sources.",
    },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ],
});
