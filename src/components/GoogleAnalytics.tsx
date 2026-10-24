import { useEffect, useRef, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Button } from "./ui/button";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const CONSENT_KEY = "analytics-consent";
type Consent = "granted" | "denied" | null;

export function GoogleAnalytics({ id }: { id: string | null }) {
  const path = useRouterState({ select: (s) => s.location.href });
  const ready = useRef(false);
  const [consent, setConsent] = useState<Consent>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(CONSENT_KEY);
      if (v === "granted" || v === "denied") setConsent(v);
    } catch {
      // storage unavailable — ask again
    }
    setChecked(true);
  }, []);

  useEffect(() => {
    if (!id || consent !== "granted" || ready.current) return;
    ready.current = true;
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", id, { send_page_view: false, anonymize_ip: true });
  }, [id, consent]);

  useEffect(() => {
    if (!id || consent !== "granted" || !window.gtag) return;
    window.gtag("event", "page_view", {
      page_path: path,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [id, path, consent]);

  const choose = (v: "granted" | "denied") => {
    try {
      localStorage.setItem(CONSENT_KEY, v);
    } catch {
      // ignore
    }
    setConsent(v);
  };

  if (!id || !checked || consent) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed inset-x-3 bottom-3 z-[1500] mx-auto max-w-2xl rounded-md border border-primary/40 bg-background/95 p-4 shadow-lg backdrop-blur sm:inset-x-6"
    >
      <p className="font-display text-xs font-semibold uppercase text-foreground">Cookies</p>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        With your permission we use Google Analytics cookies to count visits and see which pages
        are useful. No ads, no profiles.{" "}
        <Link to="/privacy" className="text-primary underline underline-offset-2">
          Privacy
        </Link>
      </p>
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <Button size="sm" variant="outline" onClick={() => choose("denied")}>
          Decline
        </Button>
        <Button size="sm" onClick={() => choose("granted")}>
          Accept
        </Button>
      </div>
    </div>
  );
}
