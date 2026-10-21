import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCard } from "@/components/AlertCard";
import { FeedStatusBanner } from "@/components/FeedStatusBanner";
import { FilterBar } from "@/components/FilterBar";
import { RouteError } from "@/components/RouteError";
import { getMapData, listAlerts } from "@/lib/alerts.functions";
import type { AlertStatusFilter } from "@/lib/alerts.types";

const mapQuery = queryOptions({
  queryKey: ["map-data"],
  queryFn: () => getMapData(),
  staleTime: 30_000,
});

interface AlertsSearch {
  region?: string | undefined;
  severity?: string | undefined;
  category?: string | undefined;
  tier?: string | undefined;
  status?: AlertStatusFilter | undefined;
  page?: number | undefined;
}

function alertsListQuery(deps: {
  region?: string | undefined;
  severity?: string | undefined;
  category?: string | undefined;
  tier?: string | undefined;
  status: AlertStatusFilter;
  page: number;
}) {
  return queryOptions({
    queryKey: ["alerts", deps],
    queryFn: () => listAlerts({ data: deps }),
    staleTime: 30_000,
  });
}

const validateSearch = (search: Record<string, unknown>): AlertsSearch => ({
  region: typeof search["region"] === "string" ? search["region"] : undefined,
  severity: typeof search["severity"] === "string" ? search["severity"] : undefined,
  category: typeof search["category"] === "string" ? search["category"] : undefined,
  tier: typeof search["tier"] === "string" ? search["tier"] : undefined,
  status: search["status"] === "expired" ? "expired" : "active",
  page:
    typeof search["page"] === "number" && search["page"] > 0
      ? Math.floor(search["page"])
      : undefined,
});

export const Route = createFileRoute("/alerts")({
  validateSearch,
  loaderDeps: ({ search: { region, severity, category, tier, status, page } }) => ({
    region,
    severity,
    category,
    tier,
    status: status ?? "active",
    page: page ?? 0,
  }),
  loader: ({ deps, context }) => {
    void context.queryClient.ensureQueryData(mapQuery);
    return context.queryClient.ensureQueryData(alertsListQuery(deps));
  },
  component: AlertsPage,
  errorComponent: RouteError,
});

function AlertsPage() {
  const search = Route.useSearch();
  const { data: mapData } = useSuspenseQuery(mapQuery);
  const { data: result } = useSuspenseQuery(
    alertsListQuery({
      region: search.region,
      severity: search.severity,
      category: search.category,
      tier: search.tier,
      status: search.status ?? "active",
      page: search.page ?? 0,
    }),
  );

  const regions = mapData.regions.map((r) => ({ slug: r.slug, name: r.name }));
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
        Alerts
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Every published alert, with its sources. This list is the accessible
        equivalent of the home-page map.
      </p>

      <div className="mt-4">
        <FeedStatusBanner
          feedDelay={mapData.feed.feedDelay}
          autopublishPaused={!mapData.feed.autopublishEnabled}
        />
      </div>

      <div className="mt-4 rounded-lg border border-border bg-card p-4">
        <FilterBar
          regions={regions}
          values={{
            region: search.region,
            severity: search.severity,
            category: search.category,
            tier: search.tier,
      tier: search.tier,
            status: search.status,
          }}
        />
      </div>

      <p className="mt-6 text-sm font-medium text-foreground" aria-live="polite">
        {result.total} {search.status === "expired" ? "expired" : "active"}{" "}
        alert{result.total === 1 ? "" : "s"}
      </p>

      {result.items.length === 0 ? (
        <div className="mt-3 rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
          No {search.status === "expired" ? "expired" : "active"} alerts match
          your filters. Try clearing a filter — absence of alerts never
          guarantees safety.
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {result.items.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav
          aria-label="Pagination"
          className="mt-6 flex items-center justify-between text-sm"
        >
          {result.page > 0 ? (
            <Link
              to="/alerts"
              search={{ ...search, page: result.page - 1 }}
              className="rounded-md border border-border px-3 py-1.5 font-medium text-foreground transition-colors hover:bg-accent"
            >
              Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-muted-foreground">
            Page {result.page + 1} of {totalPages}
          </span>
          {result.page + 1 < totalPages ? (
            <Link
              to="/alerts"
              search={{ ...search, page: result.page + 1 }}
              className="rounded-md border border-border px-3 py-1.5 font-medium text-foreground transition-colors hover:bg-accent"
            >
              Next
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}

export const head = () => ({
  meta: [
    { title: "Alerts — The Eighth Front" },
    {
      name: "description",
      content:
        "Browse all published safety alerts by region, severity and category, with links to original sources.",
    },
    { property: "og:title", content: "Alerts — The Eighth Front" },
    {
      property: "og:description",
      content:
        "Browse all published safety alerts by region, severity and category, with links to original sources.",
    },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ],
});
