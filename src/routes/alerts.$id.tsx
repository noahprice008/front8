import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { RouteError } from "@/components/RouteError";
import { SeverityBadge } from "@/components/SeverityBadge";
import { SourceCitation } from "@/components/SourceCitation";
import { StatusLabel } from "@/components/StatusLabel";
import { getAlert } from "@/lib/alerts.functions";
import { tierStatusLabel } from "@/lib/alerts.types";
import { categoryLabel, formatUtc } from "@/lib/format";

const alertQuery = (id: string) =>
  queryOptions({
    queryKey: ["alert", id],
    queryFn: () => getAlert({ data: { id } }),
    staleTime: 30_000,
  });

export const Route = createFileRoute("/alerts/$id")({
  loader: async ({ params, context }) => {
    const detail = await context.queryClient.ensureQueryData(
      alertQuery(params.id),
    );
    if (!detail) throw notFound();
  },
  component: AlertDetailPage,
  errorComponent: RouteError,
  notFoundComponent: () => (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="font-display text-xl font-semibold text-foreground">
        Alert not found
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This alert does not exist, was withdrawn, or was never published.
      </p>
      <Link
        to="/alerts"
        className="mt-6 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        All alerts
      </Link>
    </div>
  ),
});

function AlertDetailPage() {
  const { id } = Route.useParams();
  const { data: alert } = useSuspenseQuery(alertQuery(id));
  if (!alert) throw notFound();

  const expired = new Date(alert.expiresAt).getTime() <= Date.now();
  const publishers = alert.sources
    .map((s) => s.publisher)
    .filter((p): p is string => Boolean(p));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        to="/alerts"
        search={{ region: alert.regionSlug }}
        className="text-sm font-medium text-primary underline underline-offset-2 hover:opacity-80"
      >
        ← All alerts in {alert.regionName}
      </Link>

      <article className="mt-4 rounded-xl border border-border bg-card p-5 sm:p-7">
        {expired && (
          <div
            role="status"
            className="mb-4 rounded-lg border border-sev-moderate/50 bg-sev-moderate/10 px-4 py-3 text-sm font-semibold text-foreground"
          >
            Expired — not a current alert
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <SeverityBadge severity={alert.severity} />
          <StatusLabel expired={expired} />
        </div>

        <h1 className="mt-3 font-display text-2xl font-semibold leading-snug text-foreground">
          {alert.title}
        </h1>

        <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">Region</dt>
            <dd className="mt-0.5 font-medium text-foreground">{alert.regionName}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Category</dt>
            <dd className="mt-0.5 font-medium text-foreground">
              {categoryLabel(alert.category)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Issuing authority</dt>
            <dd className="mt-0.5 font-medium text-foreground">
              {alert.issuingAuthority ?? "Not stated"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Alert tier</dt>
            <dd className="mt-0.5 font-medium text-foreground">
              {tierStatusLabel(alert.tier, publishers.join(", ") || alert.issuingAuthority)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Published</dt>
            <dd className="mt-0.5 font-medium text-foreground">{formatUtc(alert.publishedAt)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Expires</dt>
            <dd className="mt-0.5 font-medium text-foreground">{formatUtc(alert.expiresAt)}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Last reviewed</dt>
            <dd className="mt-0.5 font-medium text-foreground">
              {formatUtc(alert.lastReviewedAt)}
            </dd>
          </div>
          {alert.autoPublished && (
            <div>
              <dt className="text-xs text-muted-foreground">Publication</dt>
              <dd className="mt-0.5 font-medium text-foreground">
                Published automatically, pending review
              </dd>
            </div>
          )}
        </dl>

        <div className="mt-5 space-y-3 border-t border-border pt-5">
          <h2 className="text-sm font-semibold text-foreground">Summary</h2>
          {alert.summary.split("\n").map((para, i) => (
            <p key={i} className="text-sm leading-relaxed text-foreground">
              {para}
            </p>
          ))}
        </div>

        <SourceCitation
          sources={alert.sources}
          tier={alert.tier}
          primarySourceUrl={alert.primarySourceUrl}
        />
      </article>

      <p className="mt-4 text-sm text-muted-foreground">
        Spotted a mistake?{" "}
        <a
          href="mailto:corrections@theeighthfront.org?subject=Alert correction"
          className="text-primary underline underline-offset-2 hover:opacity-80"
        >
          Report an error
        </a>{" "}
        — corrections are reviewed before the alert is updated.
      </p>
    </div>
  );
}

export const head = () => ({
  meta: [
    { title: "Alert — The Eighth Front" },
    {
      name: "description",
      content: "Sourced community safety alert with severity, issuing authority and original sources.",
    },
    { property: "og:title", content: "Alert — The Eighth Front" },
    {
      property: "og:description",
      content: "Sourced community safety alert with severity, issuing authority and original sources.",
    },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ],
});
