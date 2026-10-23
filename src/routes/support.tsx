import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Support Magen Global — Independent Safety Intelligence" },
      {
        name: "description",
        content:
          "Magen Global is self-funded and free worldwide. Support our intelligence coverage, infrastructure and team.",
      },
      { property: "og:title", content: "Support Magen Global" },
      {
        property: "og:description",
        content: "Help expand independent safety intelligence for Jewish communities worldwide.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SupportPage,
});

const PAYPAL_LINK = "https://paypal.me/MagenGlobal";

const AREAS = [
  {
    title: "Advanced Intelligence & OSINT Tools",
    body: "Funding real-time API integrations, automated news ingestion pipelines, translation engines, and global threat monitoring services.",
    icon: <path d="M12 3 4 6v6c0 4.5 3.4 8.3 8 9 4.6-.7 8-4.5 8-9V6l-8-3Z" />,
  },
  {
    title: "High-Availability Infrastructure",
    body: "Scaling server capacity, high-speed push notification alerts, and enterprise-grade mapping data layers.",
    icon: <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />,
  },
  {
    title: "Dedicated Manpower",
    body: "Supporting round-the-clock threat verification analysts, regional monitoring liaisons, and community safety experts.",
    icon: (
      <>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20c.6-3.5 3.3-5.5 6.5-5.5s5.9 2 6.5 5.5M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.8c1.9.7 3.2 2.5 3.5 5.2" />
      </>
    ),
  },
  {
    title: "Global & Mobile Expansion",
    body: "Developing native mobile applications with geofenced proximity alerts to safeguard Jewish travelers and diaspora communities everywhere.",
    icon: (
      <>
        <rect x="6" y="2.5" width="12" height="19" rx="2" />
        <path d="M11 18h2" />
      </>
    ),
  },
];

function SupportPage() {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setNotice(null);
    const value = Number(amount);
    if (!amount || !Number.isFinite(value) || value < 1) {
      setError("Please enter an amount of at least 1.");
      return;
    }
    setError(null);
    // PayPal.Me links take the amount as an optional path segment.
    window.open(`${PAYPAL_LINK}/${value.toFixed(2)}`, "_blank", "noopener,noreferrer");
    setNotice("PayPal checkout opened in a new tab. Thank you for your support.");
  }

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6 sm:py-16">
      <section className="text-center">
        <span className="inline-block border border-brand-accent/50 bg-brand-accent/10 px-3 py-1 font-display text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-brand-accent sm:text-xs">
          Self-Funded &amp; Independent Intelligence
        </span>
        <h1 className="mx-auto mt-5 max-w-3xl font-display text-3xl font-bold leading-tight text-foreground sm:text-5xl">
          Empower Global Jewish Community Safety
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Magen Global is 100% self-funded and free for all users worldwide. Your support directly
          accelerates our technology, intelligence coverage, and operational reach.
        </p>
      </section>

      <section className="mt-12 sm:mt-16" aria-labelledby="where">
        <h2 id="where" className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Where your support goes
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 sm:gap-4">
          {AREAS.map((a) => (
            <div key={a.title} className="border border-border border-l-2 border-l-brand-accent bg-card p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-brand-accent" aria-hidden="true">
                  {a.icon}
                </svg>
                <div>
                  <h3 className="font-display text-sm font-semibold text-foreground sm:text-base">{a.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-lg sm:mt-16" aria-labelledby="contribute">
        <form onSubmit={submit} noValidate className="border border-border bg-card p-5 shadow-sm sm:p-7">
          <h2 id="contribute" className="font-display text-lg font-semibold text-foreground">
            Make a contribution
          </h2>

          <label htmlFor="amount" className="mt-5 block text-sm font-medium text-foreground">
            Amount (USD)
          </label>
          <div className="mt-1.5">
            <input
              id="amount"
              type="number"
              inputMode="decimal"
              min={1}
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter custom amount (e.g. 25)"
              aria-invalid={!!error}
              className="h-11 w-full border border-input bg-background px-3 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Contributions are processed in USD. PayPal converts automatically at checkout if your card or balance is in another currency.
          </p>
          {error ? <p className="mt-1.5 text-sm text-destructive">{error}</p> : null}

          <button
            type="submit"
            className="mt-5 w-full bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Proceed to PayPal Checkout
          </button>
          {notice ? <p role="status" className="mt-3 text-sm text-foreground">{notice}</p> : null}

          <p className="mt-3 text-xs text-muted-foreground">
            Prefer to give monthly? Simply repeat your contribution each month — recurring subscriptions are coming soon.
          </p>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="5" y="11" width="14" height="10" rx="1.5" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            256-bit encrypted security • Processed safely via PayPal
          </p>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Magen Global is an independent platform. Contributions support technology, infrastructure, and team operations.
          </p>
        </form>
      </section>

      <section className="mx-auto mt-10 max-w-3xl border border-border bg-muted/40 p-5 text-center sm:p-7">
        <h2 className="font-display text-lg font-semibold text-foreground">Questions, Feedback, or Institutional Support?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          If you represent an organization or would like to speak with our lead developer directly, get in touch.
        </p>
        <Link
          to="/contact"
          className="mt-4 inline-flex items-center justify-center border border-primary px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          Contact Us
        </Link>
      </section>
    </div>
  );
}
