import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works — Magen Global methodology" },
      { name: "description", content: "How Magen Global tracks the antisemitic climate outside Israel: source tiers, developing vs confirmed reports, human review and automated summaries." },
      { property: "og:title", content: "How it works — Magen Global methodology" },
      { property: "og:description", content: "Source tiers, developing vs confirmed reports, human review and automated summaries explained." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HowItWorks,
});

const H2 = "mt-8 font-display text-sm font-bold uppercase tracking-[0.18em] text-foreground";
const P = "mt-2 text-sm leading-relaxed text-muted-foreground";

function HowItWorks() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="font-mono text-[0.6875rem] uppercase tracking-wider text-muted-foreground">Methodology</p>
      <h1 className="mt-1 font-display text-3xl font-bold text-foreground">How it works</h1>

      <h2 className={H2}>Our mission</h2>
      <p className={P}>
        Magen Global is a safety service for Jews living or travelling outside Israel. We track the
        current antisemitic climate on the ground, country by country. It is not about Israel, or
        about events inside Israel, Gaza or the West Bank.
      </p>

      <h2 className={H2}>Three source tiers</h2>
      <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
        <li><strong className="text-foreground">Official</strong> — governments, police and other public authorities, including official travel advisories.</li>
        <li><strong className="text-foreground">Verified news</strong> — established news outlets with editorial standards.</li>
        <li><strong className="text-foreground">Trusted community security source</strong> — recognised Jewish community security organisations.</li>
      </ul>

      <h2 className={H2}>Developing and confirmed</h2>
      <p className={P}>
        A report from a single outlet is marked <strong className="text-foreground">Developing: single source, unconfirmed</strong>.
        When two or more independent outlets report the same event it becomes <strong className="text-foreground">Confirmed</strong>,
        and we show how many outlets reported it, with links to each.
      </p>

      <h2 className={H2}>Human review and automation</h2>
      <p className={P}>
        Critical items are reviewed by a person. Summaries and translations of non-English
        headlines are produced automatically by AI, and are labelled as such. Always check the
        original source before acting on a report.
      </p>

      <h2 className={H2}>What the map colours mean</h2>
      <p className={P}>
        Green means no incidents reported in the last 7 days. No reports does not guarantee safety.
      </p>

      <div className="mt-8 border-l-2 border-sev-critical bg-card p-4">
        <p className="text-sm font-semibold text-foreground">This is not an emergency service.</p>
        <p className="mt-1 text-sm text-muted-foreground">In an emergency, call your local emergency services.</p>
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        Questions or corrections? <Link to="/contact" className="text-primary underline">Contact us</Link>.
      </p>
    </div>
  );
}
