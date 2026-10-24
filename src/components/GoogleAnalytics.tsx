import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function GoogleAnalytics({ id }: { id: string | null }) {
  const path = useRouterState({ select: (s) => s.location.href });
  const ready = useRef(false);

  useEffect(() => {
    if (!id || ready.current) return;
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
    window.gtag("config", id, { send_page_view: false });
  }, [id]);

  useEffect(() => {
    if (!id || !window.gtag) return;
    window.gtag("event", "page_view", {
      page_path: path,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [id, path]);

  return null;
}
