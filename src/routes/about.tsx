import { TIER_LABELS } from "@/lib/alerts.types";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { RouteError } from "@/components/RouteError";
import { SeverityBadge } from "@/components/SeverityBadge";
import { listPublicSources } from "@/lib/alerts.functions";
import type { Severity } from "@/lib/alerts.types";

const sourcesQuery = queryOptions({
  queryKey: ["public-sources"],
  queryFn: () => listPublicSources(),
  staleTime: 60_000,
});

export const Route = createFileRoute("/about")({
  loader: ({ context }) => context.queryClient.ensureQueryData(sourcesQuery),
  component: AboutPage,
  errorComponent: RouteError,
});

const SEVERITY_MEANINGS: { severity: Severity; text: string }[] = [
  {
    severity: "critical",
    text: "Imminent, life-threatening danger. Act immediately and follow official instructions.",
  },
  {
    severity: "high",
    text: "Serious, credible threat. Take protective action and monitor official channels.",
  },
  {
    severity: "moderate",
    text: "Credible but contained threat. Stay alert and review your plans.",
  },
  {
    severity: "low",
    text: "Minor or geographically distant events worth awareness.",
  },
  {
    severity: "info",
    text: "Context and background. No immediate action needed.",
  },
];

function AboutPage() {
  const { data: sources } = useSuspenseQuery(sourcesQuery);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
        About
      </h1>

      <section className="mt-6">
        <h2 className="font-display text-lg font-semibold text-foreground">Mission</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          The Eighth Front is an independent service that watches official
          government sources and verified news reporting, and publishes
          clear, sourced safety alerts for Jewish communities worldwide. We
          exist because worrying rumours travel faster than verified facts.
          Our answer is calm, graded, checkable information — never
          sensationalism.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-foreground">
          How alerts are produced
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Automated feeds collect items from official and verified sources.
          Each alert carries one of three tiers:
        </p>
        <ul className="mt-3 space-y-3 text-sm">
          <li className="rounded-lg border border-border bg-card p-4">
            <p className="font-semibold text-foreground">Tier: official</p>
            <p className="mt-1 leading-relaxed text-muted-foreground">
              Issued, or directly confirmed, by an official authority such as
              a government travel advisory or emergency service. Labelled
              "Official source".
            </p>
          </li>
          <li className="rounded-lg border border-border bg-card p-4">
            <p className="font-semibold text-foreground">Tier: verified news</p>
            <p className="mt-1 leading-relaxed text-muted-foreground">
              An automated summary of reporting by verified news publishers,
              with links to the original articles. Labelled "Automated
              summary of reporting by [publishers]".
            </p>
          </li>
          <li className="rounded-lg border border-border bg-card p-4">
            <p className="font-semibold text-foreground">Tier: trusted community security</p>
            <p className="mt-1 leading-relaxed text-muted-foreground">
              Reported by a vetted community security network — for example a
              local security coordinator or neighbourhood watch with an
              established track record. These sources are reviewed before
              being trusted, but are not official authorities. Labelled
              "Trusted community security source".
            </p>
          </li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-foreground">
          What each severity means
        </h2>
        <ul className="mt-3 space-y-2">
          {SEVERITY_MEANINGS.map(({ severity, text }) => (
            <li key={severity} className="flex items-start gap-3 text-sm">
              <span className="mt-0.5 shrink-0">
                <SeverityBadge severity={severity} size="sm" />
              </span>
              <span className="leading-relaxed text-muted-foreground">{text}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-foreground">Sources</h2>
        {sources.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            The public source list is being finalised. Every alert still links
            to its own primary source.
          </p>
        ) : (
          <ul className="mt-3 space-y-1.5 text-sm">
            {sources.map((source) => (
              <li key={source.url} className="flex items-baseline gap-2">
                <span className="text-[0.6875rem] uppercase tracking-wide text-muted-foreground">
                  {source.tier ? TIER_LABELS[source.tier] : "Source"}
                </span>
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

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-foreground">Limitations</h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li>
            Collection and summarisation are automated; rare errors are
            possible. Every alert links to its source so you can verify.
          </li>
          <li>
            Green on the map means no current alerts from monitored sources —
            it does not guarantee safety.
          </li>
          <li>
            We cover monitored regions only, and we are not an emergency
            service.
          </li>
          <li>
            This service complements, and does not replace, official
            emergency guidance.
          </li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-foreground">Contact</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Corrections and feedback:{" "}
          <a
            href="mailto:corrections@theeighthfront.org"
            className="text-primary underline underline-offset-2 hover:opacity-80"
          >
            corrections@theeighthfront.org
          </a>
          . See also our{" "}
          <Link to="/privacy" className="text-primary underline underline-offset-2 hover:opacity-80">
            privacy statement
          </Link>
          .
        </p>
      </section>
    </div>
  );
}

export const head = () => ({
  meta: [
    { title: "About — The Eighth Front" },
    {
      name: "description",
      content:
        "How alerts are produced, what each severity means, our sources, limitations and contact details.",
    },
    { property: "og:title", content: "About — The Eighth Front" },
    {
      property: "og:description",
      content:
        "How alerts are produced, what each severity means, our sources, limitations and contact details.",
    },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ],
});
