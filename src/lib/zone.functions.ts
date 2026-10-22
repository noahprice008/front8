import { createServerFn } from "@tanstack/react-start";
import { SEVERITY_ORDER, type AlertListItem, type Headline, type Severity } from "./alerts.types";
import { attachSources } from "./alerts.functions";

async function publicClient() {
  const { getPublicClient } = await import("@/lib/supabase-public.server");
  return getPublicClient();
}

export interface ZoneDetail {
  id: string;
  name: string;
  slug: string;
  topSeverity: Severity | null;
  lastIngestOkAt: string | null;
  alerts: AlertListItem[];
  advisories: AlertListItem[];
  headlines: Headline[];
  /** Last 7 days, oldest first, GMT dates (YYYY-MM-DD). */
  days: { date: string; headlines: number; alerts: number }[];
}

const ALERT_COLS =
  "id,title,summary,category,severity,tier,issuing_authority,auto_published,published_at,expires_at,last_reviewed_at,verification,regions(name,slug)";

export const getZoneDetail = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => ({ slug: String(input.slug).slice(0, 80) }))
  .handler(async ({ data }): Promise<ZoneDetail | null> => {
    const supabase = await publicClient();
    const { data: region } = await supabase
      .from("regions")
      .select("id,name,slug")
      .eq("slug", data.slug)
      .maybeSingle();
    if (!region) return null;
    const r = region as { id: string; name: string; slug: string };

    const { data: kids } = await supabase.from("regions").select("id,slug").eq("parent_id", r.id).limit(200);
    const kidRows = (kids ?? []) as { id: string; slug: string }[];
    const ids = [r.id, ...kidRows.map((k) => k.id)];
    const slugs = [r.slug, ...kidRows.map((k) => k.slug)];
    const now = new Date().toISOString();
    const weekAgo = new Date(Date.now() - 7 * 86_400_000);
    weekAgo.setUTCHours(0, 0, 0, 0);
    const since = new Date(weekAgo.getTime() + 86_400_000).toISOString(); // 7 days incl. today

    const [alertsRes, headRes, headDaysRes, alertDaysRes, settingsRes] = await Promise.all([
      supabase.from("alerts").select(ALERT_COLS).eq("status", "published").in("region_id", ids)
        .gt("expires_at", now).order("severity", { ascending: false })
        .order("published_at", { ascending: false, nullsFirst: false }).limit(50),
      supabase.from("headlines").select("id,url,title,publisher,published_at,region_slug,topic,language,title_original")
        .eq("kept", true).in("region_slug", slugs).order("published_at", { ascending: false, nullsFirst: false }).limit(20),
      supabase.from("headlines").select("published_at").eq("kept", true).in("region_slug", slugs)
        .gte("published_at", since).limit(1000),
      supabase.from("alerts").select("published_at").eq("status", "published").in("region_id", ids)
        .gte("published_at", since).limit(1000),
      supabase.from("system_settings").select("last_ingest_ok_at").limit(1),
    ]);
    if (alertsRes.error) throw new Error("Could not load zone.");

    type Row = {
      id: string; title: string; summary: string; category: AlertListItem["category"]; severity: Severity;
      tier: AlertListItem["tier"]; issuing_authority: string | null; auto_published: boolean;
      published_at: string | null; expires_at: string; last_reviewed_at: string | null;
      verification: string | null; regions: { name: string; slug: string } | null;
    };
    const all: AlertListItem[] = ((alertsRes.data ?? []) as unknown as Row[]).map((a) => ({
      id: a.id, title: a.title, summary: a.summary, category: a.category, severity: a.severity, tier: a.tier,
      issuingAuthority: a.issuing_authority, autoPublished: a.auto_published, publishedAt: a.published_at,
      expiresAt: a.expires_at, lastReviewedAt: a.last_reviewed_at, regionName: a.regions?.name ?? r.name,
      regionSlug: a.regions?.slug ?? r.slug, verification: a.verification === "developing" ? "developing" : "confirmed",
    }));
    await attachSources(supabase, all);
    const advisories = all.filter((a) => a.tier === "official");
    const alerts = all.filter((a) => !advisories.includes(a));
    let top: Severity | null = null;
    for (const a of alerts) if (!top || SEVERITY_ORDER.indexOf(a.severity) > SEVERITY_ORDER.indexOf(top)) top = a.severity;

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekAgo.getTime() + (i + 1) * 86_400_000);
      return { date: d.toISOString().slice(0, 10), headlines: 0, alerts: 0 };
    });
    const bump = (iso: string | null, key: "headlines" | "alerts") => {
      const day = days.find((d) => d.date === iso?.slice(0, 10));
      if (day) day[key] += 1;
    };
    for (const h of (headDaysRes.data ?? []) as { published_at: string | null }[]) bump(h.published_at, "headlines");
    for (const a of (alertDaysRes.data ?? []) as { published_at: string | null }[]) bump(a.published_at, "alerts");

    type H = { id: string; url: string; title: string; publisher: string | null; published_at: string | null; region_slug: string | null; topic: string | null; language: string | null; title_original: string | null };
    const headlines: Headline[] = ((headRes.data ?? []) as unknown as H[]).map((h) => ({
      id: h.id, url: h.url, title: h.title, publisher: h.publisher, publishedAt: h.published_at,
      regionSlug: h.region_slug, topic: h.topic, language: h.language ?? "en",
      titleOriginal: h.language && h.language !== "en" ? h.title_original : null,
    }));

    const settings = ((settingsRes.data ?? []) as { last_ingest_ok_at: string | null }[])[0];
    return { id: r.id, name: r.name, slug: r.slug, topSeverity: top, lastIngestOkAt: settings?.last_ingest_ok_at ?? null, alerts, advisories, headlines, days };
  });
