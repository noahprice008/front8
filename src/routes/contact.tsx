import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { contactSchema, submitContactMessage } from "@/lib/contact.functions";

type Search = { context?: string };

export const Route = createFileRoute("/contact")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    context: typeof s.context === "string" ? s.context.slice(0, 200) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Contact — Magen Global" },
      { name: "description", content: "Send a message, correction or tip to the Magen Global desk." },
      { property: "og:title", content: "Contact — Magen Global" },
      { property: "og:description", content: "Send a message, correction or tip to the Magen Global desk." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ContactPage,
});

const inputCls =
  "mt-1 w-full rounded-sm border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent";

function ContactPage() {
  const { context } = Route.useSearch();
  const send = useServerFn(submitContactMessage);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const parsed = contactSchema.safeParse({
      name: fd.get("name"),
      email: fd.get("email"),
      message: fd.get("message"),
      context,
      website: fd.get("website") || undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check the form");
      setStatus("error");
      return;
    }
    setStatus("sending");
    setError(null);
    const res = await send({ data: parsed.data }).catch(() => ({ ok: false as const, error: "Your message could not be sent." }));
    if (res.ok) setStatus("sent");
    else {
      setError(res.error);
      setStatus("error");
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <p className="telemetry">// Secure channel · Contact desk</p>
      <h1 className="mt-2 font-display text-3xl font-bold uppercase tracking-wide text-foreground">Contact</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Corrections, tips, privacy questions or general feedback. Messages go straight to our team.
        In an emergency, contact local emergency services.
      </p>

      <div className="hud-frame mt-6 border border-border bg-card p-6">
        {status === "sent" ? (
          <div role="status">
            <p className="telemetry text-sev-clear">// Transmission received</p>
            <p className="mt-2 text-sm text-foreground">Thank you — your message has been sent. We'll reply to the email you provided.</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="space-y-4">
            {context ? (
              <p className="telemetry">Reference: {context}</p>
            ) : null}
            <label className="block text-sm font-medium text-foreground">
              Name
              <input name="name" required maxLength={100} autoComplete="name" className={inputCls} />
            </label>
            <label className="block text-sm font-medium text-foreground">
              Email
              <input name="email" type="email" required maxLength={255} autoComplete="email" className={inputCls} />
            </label>
            <label className="block text-sm font-medium text-foreground">
              Message
              <textarea name="message" required rows={6} maxLength={2000} className={inputCls} />
            </label>
            <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
            {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
            <button
              type="submit"
              disabled={status === "sending"}
              className="inline-flex items-center rounded-sm bg-primary px-5 py-2.5 font-display text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {status === "sending" ? "Sending…" : "Send message"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
