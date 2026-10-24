import { groupAlerts, groupHeadlines } from "./feed-grouping";
import { createServerFn } from "@tanstack/react-start";
import { SEVERITY_ORDER, type AlertListItem, type Headline, type Severity } from "./alerts.types";
import { readMapData, attachSources } from "./alerts.functions";
import { ancestorsOf, buildZoneTree, bySeverityThenName, descendantsOf, rollupStatus } from "./zones";

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
  ancestors: { name: string; slug: string }[];
  children: { name: string; slug: string; activeAlerts: number; developingAlerts: number; topSeverity: Severity | null }[];
  parentAlerts: AlertListItem[];
  /** Last 7 days, oldest first, GMT dates (YYYY-MM-DD). */
  days: { date: string; headlines: number; alerts: number }[];
}

const ALERT_COLS =
  "id,event_key,title,summary,category,severity,tier,issuing_authority,auto_published,published_at,expires_at,last_reviewed_at,verification,regions(name,slug)";

export const getZoneDetail = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => ({ slug: String(input.slug).slice(0, 80) }))
  .handler(async ({ data }): Promise<ZoneDetail | null> => {
    const supabase = await publicClient();
    const [zonesRes, statusRes] = await Promise.all([
      supabase.from("regions").select("id,name,slug,parent_id").eq("covered", true).limit(5000),
      supabase.from("region_status").select("id,active_alerts,developing_alerts,top_severity").eq("covered", true).limit(5000),
    ]);
    type Z = { id: string; name: string; slug: string; parentId: string | null };
    const zl: Z[] = ((zonesRes.data ?? []) as { id: string; name: string; slug: string; parent_id: string | null }[])
      .map((z) => ({ id: z.id, name: z.name, slug: z.slug, parentId: z.parent_id }));
    const tree = buildZoneTree(zl);
    const r = zl.find((z) => z.slug === data.slug);
    if (!r) return null;
    type St = { id: string; active_alerts: number | null; developing_alerts: number | null; top_severity: Severity | null };
    const st = new Map(((statusRes.data ?? []) as St[]).map((x) => [x.id, x]));
    const own = (z: Z) => {
      const x = st.get(z.id);
      return { activeAlerts: Number(x?.active_alerts ?? 0), developingAlerts: Number(x?.developing_alerts ?? 0), topSeverity: x?.top_severity ?? null };
    };
    const desc = descendantsOf(tree, r.id);
    const ancestors = ancestorsOf(tree, r.id).map((a) => ({ name: a.name, slug: a.slug }));
    let children = (tree.children.get(r.id) ?? [])
      .map((c) => ({ name: c.name, slug: c.slug, ...rollupStatus(tree, c.id, own) }))
      .sort(bySeverityThenName);
    const parentId = r.parentId;
    const ids = [r.id, ...desc.map((k) => k.id)];
    const slugs = [r.slug, ...desc.map((k) => k.slug)];
    const now = new Date().toISOString();
    const weekAgo = new Date(Date.now() - 7 * 86_400_000);
    weekAgo.setUTCHours(0, 0, 0, 0);
    const since = new Date(weekAgo.getTime() + 86_400_000).toISOString(); // 7 days incl. today

    const [alertsRes, headRes, headDaysRes, alertDaysRes, settingsRes, parentRes] = await Promise.all([
      supabase.from("alerts").select(ALERT_COLS).eq("status", "published").in("region_id", ids)
        .gt("expires_at", now).order("severity", { ascending: false })
        .order("published_at", { ascending: false, nullsFirst: false }).limit(1000),
      supabase.from("headlines").select("id,url,title,publisher,published_at,region_slug,topic,language,title_original")
        .eq("kept", true).in("region_slug", slugs).order("published_at", { ascending: false, nullsFirst: false }).limit(200),
      supabase.from("headlines").select("id,url,title,publisher,published_at,region_slug").eq("kept", true).in("region_slug", slugs)
        .gte("published_at", since).limit(1000),
      supabase.from("alerts").select(ALERT_COLS).eq("status", "published").in("region_id", ids)
        .gte("published_at", since).limit(1000),
      supabase.from("system_settings").select("last_ingest_ok_at").limit(1),
      parentId
        ? supabase.from("alerts").select(ALERT_COLS).eq("status", "published").eq("region_id", parentId)
            .gt("expires_at", now).order("published_at", { ascending: false, nullsFirst: false }).limit(100)
        : Promise.resolve({ data: [] as unknown[] }),
    ]);
    if (alertsRes.error) throw new Error("Could not load zone.");

    type Row = {
      id: string; event_key: string | null; title: string; summary: string; category: AlertListItem["category"]; severity: Severity;
      tier: AlertListItem["tier"]; issuing_authority: string | null; auto_published: boolean;
      published_at: string | null; expires_at: string; last_reviewed_at: string | null;
      verification: string | null; regions: { name: string; slug: string } | null;
    };
    const toItem = (a: Row): AlertListItem => ({
      id: a.id, eventKey: a.event_key, title: a.title, summary: a.summary, category: a.category, severity: a.severity, tier: a.tier,
      issuingAuthority: a.issuing_authority, autoPublished: a.auto_published, publishedAt: a.published_at,
      expiresAt: a.expires_at, lastReviewedAt: a.last_reviewed_at, regionName: a.regions?.name ?? r.name,
      regionSlug: a.regions?.slug ?? r.slug, verification: a.verification === "developing" ? "developing" : "confirmed",
    });
    const raw = [...((alertsRes.data ?? []) as unknown as Row[]), ...((parentRes.data ?? []) as unknown as Row[])].map(toItem);
    await attachSources(supabase, raw);
    const grouped = groupAlerts(raw, zl);
    const all = grouped.filter((a) => a.regionSlugs.some((slug) => slugs.includes(slug)));
    const parentAlerts = grouped.filter((a) => !all.includes(a));
    const advisories = all.filter((a) => a.tier === "official");
    const alerts = all.filter((a) => !advisories.includes(a));
    let top: Severity | null = null;
    for (const a of alerts) if (a.verification === "confirmed" && (!top || SEVERITY_ORDER.indexOf(a.severity) > SEVERITY_ORDER.indexOf(top))) top = a.severity;

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekAgo.getTime() + (i + 1) * 86_400_000);
      return { date: d.toISOString().slice(0, 10), headlines: 0, alerts: 0 };
    });
    const bump = (iso: string | null, key: "headlines" | "alerts") => {
      const day = days.find((d) => d.date === iso?.slice(0, 10));
      if (day) day[key] += 1;
    };
    const dailyHeads = ((headDaysRes.data ?? []) as { id: string; url: string; title: string; publisher: string | null; published_at: string | null; region_slug: string | null }[]).map((h) => ({ ...h, publishedAt: h.published_at, regionSlug: h.region_slug }));
    for (const h of groupHeadlines(dailyHeads, zl)) bump(h.publishedAt, "headlines");
    for (const a of groupAlerts(((alertDaysRes.data ?? []) as unknown as Row[]).map(toItem), zl)) bump(a.publishedAt, "alerts");

    type H = { id: string; url: string; title: string; publisher: string | null; published_at: string | null; region_slug: string | null; topic: string | null; language: string | null; title_original: string | null };
    const headlines: Headline[] = groupHeadlines(((headRes.data ?? []) as unknown as H[]).map((h) => ({
      id: h.id, url: h.url, title: h.title, publisher: h.publisher, publishedAt: h.published_at,
      regionSlug: h.region_slug, topic: h.topic, language: h.language ?? "en",
      titleOriginal: h.language && h.language !== "en" ? h.title_original : null,
    })), zl).slice(0, 20);

    const map = await readMapData();
    children = children.map((c) => { const status = map.regions.find((z) => z.slug === c.slug); return status ? { ...c, activeAlerts: status.activeAlerts, developingAlerts: status.developingAlerts, topSeverity: status.topSeverity } : c; });
    const settings = ((settingsRes.data ?? []) as { last_ingest_ok_at: string | null }[])[0];
    return { id: r.id, name: r.name, slug: r.slug, topSeverity: top, lastIngestOkAt: settings?.last_ingest_ok_at ?? null, alerts, advisories, headlines, days, ancestors, children, parentAlerts };
  });

export interface TravelZoneCard {
  name: string;
  slug: string;
  activeAlerts: number;
  topSeverity: Severity | null;
  latestHeadline: { title: string; url: string; publishedAt: string | null } | null;
}

/** Travel-destination zones with rolled-up status and their newest headline. */
export const getTravelZones = createServerFn({ method: "GET" }).handler(async (): Promise<TravelZoneCard[]> => {
  const supabase = await publicClient();
  const [zonesRes, mapData] = await Promise.all([
    supabase.from("regions").select("id,name,slug,parent_id,zone_group").eq("covered", true).limit(5000),
    readMapData(),
  ]);
  if (zonesRes.error) throw new Error("Could not load travel zones.");
  type R = { id: string; name: string; slug: string; parent_id: string | null; zone_group: string | null };
  const rows = (zonesRes.data ?? []) as R[];
  const zl = rows.map((z) => ({ id: z.id, name: z.name, slug: z.slug, parentId: z.parent_id }));
  const tree = buildZoneTree(zl);
  const travel = rows.filter((r) => r.zone_group === "travel");
  const slugsOf = new Map(travel.map((t) => [t.id, [t.slug, ...descendantsOf(tree, t.id).map((d) => d.slug)]]));
  const allSlugs = [...new Set([...slugsOf.values()].flat())];
  const { data: heads } = allSlugs.length
    ? await supabase.from("headlines").select("id,title,url,publisher,published_at,region_slug").eq("kept", true)
        .in("region_slug", allSlugs).order("published_at", { ascending: false, nullsFirst: false }).limit(1000)
    : { data: [] };
  const newest = new Map<string, { title: string; url: string; publishedAt: string | null }>();
  const mappedHeads = ((heads ?? []) as { id: string; title: string; url: string; publisher: string | null; published_at: string | null; region_slug: string }[]).map((h) => ({ ...h, regionSlug: h.region_slug, publishedAt: h.published_at }));
  for (const h of groupHeadlines(mappedHeads, zl)) for (const slug of h.regionSlugs)
    if (!newest.has(slug)) newest.set(slug, { title: h.title, url: h.url, publishedAt: h.publishedAt });
  return travel
    .map((t) => {
      const s = mapData.regions.find((r) => r.id === t.id) ?? { activeAlerts: 0, topSeverity: null };
      const latest = (slugsOf.get(t.id) ?? []).map((sl) => newest.get(sl)).filter((x) => !!x)
        .sort((a, b) => (b?.publishedAt ?? "").localeCompare(a?.publishedAt ?? ""))[0] ?? null;
      return { name: t.name, slug: t.slug, activeAlerts: s.activeAlerts, topSeverity: s.topSeverity, latestHeadline: latest };
    })
    .sort(bySeverityThenName);
});
