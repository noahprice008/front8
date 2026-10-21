import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
        Privacy
      </h1>

      <div className="mt-6 space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">
            No accounts, no tracking profiles
          </h2>
          <p className="mt-2">
            This service requires no sign-up and stores nothing about you as a
            person. You can read every alert, the map and the travel advice
            without giving us anything.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">
            Minimal analytics
          </h2>
          <p className="mt-2">
            We may count anonymous page views to know which regions are being
            checked. These counts contain no identifiers and are not linked
            to you or your device in a way we could reverse. Filter choices
            made in the alerts list are stored only in the page address, never
            on our servers as personal data.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">
            What we publish
          </h2>
          <p className="mt-2">
            Alert content comes from public sources — government advisories
            and verified news reporting — and links to the originals. We do
            not publish personal information about private individuals.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold text-foreground">
            Contact
          </h2>
          <p className="mt-2">
            Questions about this statement:{" "}
            <a
              href="mailto:privacy@theeighthfront.org"
              className="text-primary underline underline-offset-2 hover:opacity-80"
            >
              privacy@theeighthfront.org
            </a>
            .
          </p>
        </section>

        <p>
          <Link
            to="/about"
            className="text-primary underline underline-offset-2 hover:opacity-80"
          >
            Back to About
          </Link>
        </p>
      </div>
    </div>
  );
}

export const head = () => ({
  meta: [
    { title: "Privacy — The Eighth Front" },
    {
      name: "description",
      content:
        "Plain privacy statement: no accounts, no tracking profiles, minimal anonymous analytics.",
    },
    { property: "og:title", content: "Privacy — The Eighth Front" },
    {
      property: "og:description",
      content:
        "Plain privacy statement: no accounts, no tracking profiles, minimal anonymous analytics.",
    },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ],
});
