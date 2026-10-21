import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { RouteError } from "@/components/RouteError";
import { getMapData, listHeadlines } from "@/lib/alerts.functions";
import { HEADLINE_TOPIC_LABELS, HEADLINE_TOPICS } from "@/lib/alerts.types";
import { formatRelative } from "@/lib/format";

const mapQuery = queryOptions({
  queryKey: ["map-data"],
  queryFn: () => getMapData(),
  staleTime: 30_000,
});

interface NewsSearch {
  region?: string | undefined;
  topic?: string | undefined;
  page?: number | undefined;
}

function headlinesQuery(deps: {
  region?: string | undefined;
  topic?: string | undefined;
  page: number;
}) {
  return queryOptions({
    queryKey: ["headlines", deps],
    queryFn: () => listHeadlines({ data: deps }),
    staleTime: 60_000,
  });
}

const validateSearch = (search: Record<string, unknown>): NewsSearch => ({
  region: typeof search["region"] === "string" ? search["region"] : undefined,
  topic: typeof search["topic"] === "string" ? search["topic"] : undefined,
  page:
    typeof search["page"] === "number" && search["page"] > 0
      ? Math.floor(search["page"])
      : undefined,
});

export const Route = createFileRoute("/news")({
  head,
  validateSearch,
  loaderDeps: ({ search: { region, topic, page } }) => ({
    region,
    topic,
    page: page ?? 0,
  }),
  loader: ({ deps, context }) => {
    void context.queryClient.ensureQueryData(mapQuery);
    return context.queryClient.ensureQueryData(headlinesQuery(deps));
  },
  component: NewsPage,
  errorComponent: RouteError,
});

const SELECT_CLASS =
  "h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function NewsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { data: mapData } = useSuspenseQuery(mapQuery);
  const { data: result } = useSuspenseQuery(
    headlinesQuery({
      region: search.region,
      topic: search.topic,
      page: search.page ?? 0,
    }),
  );

  const regions = mapData.regions
    .filter((r) => !r.parentId)
    .flatMap((p) => [
      { slug: p.slug, name: p.name },
      ...mapData.regions
        .filter((c) => c.parentId === p.id)
        .map((c) => ({ slug: c.slug, name: c.name, indent: true })),
    ]);
  const regionName = (slug: string | null) =>
    regions.find((r) => r.slug === slug)?.name ?? slug ?? "";
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  const update = (key: "region" | "topic", value: string) => {
    navigate({
      to: "/news",
      search: (prev) => {
        const next: Record<string, unknown> = { ...prev };
        if (value === "") delete next[key];
        else next[key] = value;
        delete next["page"];
        return next;
      },
    });
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
        News
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Headlines are found automatically from news sources worldwide and
        linked, not republished. Inclusion is not endorsement or verification.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="news-region" className="text-xs font-medium text-muted-foreground">
            Region
          </label>
          <select
            id="news-region"
            className={SELECT_CLASS}
            value={search.region ?? ""}
            onChange={(e) => update("region", e.target.value)}
          >
            <option value="">All regions</option>
            {regions.map((r) => (
              <option key={r.slug} value={r.slug}>
                {r.indent ? "   — " : ""}
                {r.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="news-topic" className="text-xs font-medium text-muted-foreground">
            Topic
          </label>
          <select
            id="news-topic"
            className={SELECT_CLASS}
            value={search.topic ?? ""}
            onChange={(e) => update("topic", e.target.value)}
          >
            <option value="">All topics</option>
            {HEADLINE_TOPICS.map((t) => (
              <option key={t} value={t}>
                {HEADLINE_TOPIC_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        {(search.region || search.topic) && (
          <button
            type="button"
            onClick={() => navigate({ to: "/news", search: {} })}
            className="h-9 rounded-md border border-border px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            Clear filters
          </button>
        )}
      </div>

      <p className="mt-6 text-sm font-medium text-foreground" aria-live="polite">
        {result.total} headline{result.total === 1 ? "" : "s"}
      </p>

      {result.items.length === 0 ? (
        <div className="mt-3 rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
          No headlines match your filters yet. Headlines appear here as they
          are discovered from monitored news sources.
        </div>
      ) : (
        <ul className="mt-3 space-y-3">
          {result.items.map((h) => (
            <li
              key={h.id}
              className="rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                {h.topic && (
                  <span className="rounded-sm bg-secondary px-1.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-wide text-secondary-foreground">
                    {HEADLINE_TOPIC_LABELS[h.topic] ?? h.topic}
                  </span>
                )}
                {h.regionSlug && (
                  <span className="text-xs text-muted-foreground">
                    {regionName(h.regionSlug)}
                  </span>
                )}
              </div>
              <h2 className="mt-1.5 text-base font-semibold leading-snug text-foreground">
                <a
                  href={h.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {h.title}
                </a>
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {h.publisher ? `${h.publisher} · ` : ""}
                {formatRelative(h.publishedAt)}
              </p>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <nav
          aria-label="Pagination"
          className="mt-6 flex items-center justify-between text-sm"
        >
          {result.page > 0 ? (
            <Link
              to="/news"
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
              to="/news"
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

export function head() {
  return {
    meta: [
      { title: "News — Magen Global" },
      {
        name: "description",
        content:
          "Automatically discovered headlines from news sources worldwide, linked to the original publishers. Inclusion is not endorsement or verification.",
      },
      { property: "og:title", content: "News — Magen Global" },
      {
        property: "og:description",
        content:
          "Automatically discovered headlines from news sources worldwide, linked to the original publishers. Inclusion is not endorsement or verification.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  };
}
