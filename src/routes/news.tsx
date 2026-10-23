import { indentLabel, zoneOptions } from "@/lib/zones";
import { infiniteQueryOptions, queryOptions, useSuspenseInfiniteQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { RouteError } from "@/components/RouteError";
import { getMapData, listHeadlines } from "@/lib/alerts.functions";
import { HEADLINE_TOPIC_LABELS, HEADLINE_TOPICS } from "@/lib/alerts.types";
import { formatRelative, languageName } from "@/lib/format";
import { ACTIVITY_CATEGORIES, ACTIVITY_LABELS } from "@/lib/climate";

const mapQuery = queryOptions({
  queryKey: ["map-data"],
  queryFn: () => getMapData(),
  staleTime: 30_000,
});

interface NewsSearch {
  region?: string | undefined;
  topic?: string | undefined;
  activity?: string | undefined;
  window?: string | undefined;
  lang?: "en" | "translated" | undefined;
}

type Deps = { region?: string | undefined; topic?: string | undefined; activity?: string | undefined; window?: string | undefined; lang?: "en" | "translated" | undefined };
function headlinesQuery(deps: Deps) {
  return infiniteQueryOptions({
    queryKey: ["headlines", deps],
    queryFn: ({ pageParam }) => listHeadlines({ data: { ...deps, page: pageParam } }),
    initialPageParam: 0,
    getNextPageParam: (last) => ((last.page + 1) * last.pageSize < last.total ? last.page + 1 : undefined),
    staleTime: 60_000,
  });
}

const validateSearch = (search: Record<string, unknown>): NewsSearch => ({
  region: typeof search["region"] === "string" ? search["region"] : undefined,
  topic: typeof search["topic"] === "string" ? search["topic"] : undefined,
  activity: typeof search["activity"] === "string" ? search["activity"] : undefined,
  window: typeof search["window"] === "string" ? search["window"] : undefined,
  lang: search["lang"] === "en" || search["lang"] === "translated" ? search["lang"] : undefined,
});

export const Route = createFileRoute("/news")({
  head,
  validateSearch,
  loaderDeps: ({ search: { region, topic, activity, window, lang } }) => ({ region, topic, activity, window, lang }),
  loader: ({ deps, context }) => {
    void context.queryClient.ensureQueryData(mapQuery);
    return context.queryClient.ensureInfiniteQueryData(headlinesQuery(deps));
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
  const { data: pages, fetchNextPage, hasNextPage, isFetchingNextPage } = useSuspenseInfiniteQuery(
    headlinesQuery({ region: search.region, topic: search.topic, activity: search.activity, window: search.window, lang: search.lang }),
  );
  const total = pages.pages[0]?.total ?? 0;
  const items = pages.pages.flatMap((p) => p.items);
  const groups: { day: string; items: typeof items }[] = [];
  for (const h of items) {
    const day = h.publishedAt ? new Date(h.publishedAt).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "GMT" }) : "Undated";
    const g = groups[groups.length - 1];
    if (g && g.day === day) g.items.push(h);
    else groups.push({ day, items: [h] });
  }
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasNextPage) return;
    const io = new IntersectionObserver((e) => {
      if (e[0]?.isIntersecting && !isFetchingNextPage) void fetchNextPage();
    }, { rootMargin: "400px" });
    io.observe(el);
    return () => io.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const regions = zoneOptions(mapData.regions);
  const regionName = (slug: string | null) =>
    regions.find((r) => r.slug === slug)?.name ?? slug ?? "";
  const update = (key: "region" | "topic" | "activity" | "window" | "lang", value: string) => {
    navigate({
      to: "/news",
      search: (prev) => {
        const next: Record<string, unknown> = { ...prev };
        if (value === "") delete next[key];
        else next[key] = value;
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
                {indentLabel(r.depth, r.name)}
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
        <div className="flex flex-col gap-1">
          <label htmlFor="news-activity" className="text-xs font-medium text-muted-foreground">
            Type
          </label>
          <select id="news-activity" className={SELECT_CLASS} value={search.activity ?? ""} onChange={(e) => update("activity", e.target.value)}>
            <option value="">All coverage</option>
            <option value="any">On-the-ground activity only</option>
            {ACTIVITY_CATEGORIES.map((c) => (
              <option key={c} value={c}>{ACTIVITY_LABELS[c]}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="news-window" className="text-xs font-medium text-muted-foreground">
            Time range
          </label>
          <select id="news-window" className={SELECT_CLASS} value={search.window ?? ""} onChange={(e) => update("window", e.target.value)}>
            <option value="">Last 14 days</option>
            <option value="7d">Last 7 days</option>
            <option value="24h">Last 24 hours</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="news-lang" className="text-xs font-medium text-muted-foreground">
            Language
          </label>
          <select id="news-lang" className={SELECT_CLASS} value={search.lang ?? ""} onChange={(e) => update("lang", e.target.value)}>
            <option value="">All languages</option>
            <option value="en">English</option>
            <option value="translated">Translated</option>
          </select>
        </div>
        {(search.region || search.topic || search.activity || search.window || search.lang) && (
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
        {total} headline{total === 1 ? "" : "s"}
      </p>

      {items.length === 0 ? (
        <div className="mt-3 rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
          No headlines match your filters yet. Headlines appear here as they
          are discovered from monitored news sources.
        </div>
      ) : (
        <div className="mt-3 space-y-6">
          {groups.map((g) => (
          <section key={g.day}>
            <h2 className="font-mono text-[0.6875rem] uppercase tracking-wider text-muted-foreground">{g.day}</h2>
        <ul className="mt-2 space-y-3">
          {g.items.map((h) => (
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
                {h.activityLabel && (
                  <span className="border border-brand-accent px-1.5 py-0.5 font-mono text-[0.625rem] uppercase tracking-wider text-brand-accent">
                    {h.activityLabel}
                  </span>
                )}
                {h.nearInstitution && (
                  <span className="font-mono text-[0.625rem] uppercase tracking-wider text-sev-high">Jewish institution</span>
                )}
                {h.regionSlug && (
                  <span className="text-xs text-muted-foreground">
                    {regionName(h.regionSlug)}
                  </span>
                )}
              </div>
              <h3 className="mt-1.5 text-base font-semibold leading-snug text-foreground">
                <a
                  href={h.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {h.title}
                </a>
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {h.publisher ? `${h.publisher} · ` : ""}
                {formatRelative(h.publishedAt)}
              </p>
              {h.language && h.language !== "en" && (
                <div className="mt-1 text-xs text-muted-foreground">
                  <span>Translated from {languageName(h.language)}</span>
                  {h.titleOriginal && (
                    <details className="mt-1">
                      <summary className="cursor-pointer">Original headline</summary>
                      <p className="mt-1 italic text-foreground">{h.titleOriginal}</p>
                    </details>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
          </section>
          ))}
        </div>
      )}
      <div ref={sentinel} className="h-1" />
      {isFetchingNextPage && <p className="mt-4 text-center text-sm text-muted-foreground">Loading more…</p>}
      {hasNextPage && !isFetchingNextPage && (
        <button type="button" onClick={() => void fetchNextPage()} className="mx-auto mt-4 block rounded-md border border-border px-3 py-1.5 text-sm font-medium hover:bg-accent">
          Load more
        </button>
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
