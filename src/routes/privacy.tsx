import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head,
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
            Only if you accept the cookie notice, we use Google Analytics
            cookies to count page visits and see which regions are being
            checked. We use no advertising features and build no profiles. If
            you decline, no analytics cookies are set. To change your choice,
            clear this site's data in your browser and the notice will appear
            again. Filter choices made in the alerts list are stored only in
            the page address, never on our servers as personal data.
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
            <Link
              to="/contact"
              search={{ context: "Privacy question" }}
              className="text-primary underline underline-offset-2 hover:opacity-80"
            >
              Contact us
            </Link>
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

export function head() { return {
  meta: [
    { title: "Privacy — Magen Global" },
    {
      name: "description",
      content:
        "Plain privacy statement: no accounts, no tracking profiles, minimal anonymous analytics.",
    },
    { property: "og:title", content: "Privacy — Magen Global" },
    {
      property: "og:description",
      content:
        "Plain privacy statement: no accounts, no tracking profiles, minimal anonymous analytics.",
    },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ],
}; }
