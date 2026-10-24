import { groupAlerts, groupHeadlines } from "./feed-grouping";
import { withCities } from "./cities";
import { refinedRegion } from "./alerts.functions";
import { createServerFn } from "@tanstack/react-start";
import type { Severity } from "./alerts.types";
import {
  ACTIVITY_LABELS,
  classifyHeadline,
  isProtest,
  isWindow,
  postureFor,
  resolveRegionSlug,
  scoreZone,
  trendFor,
  WINDOWS,
  type ActivityCategory,
  type ClimateWindow,
  type Posture,
  type Trend,
} from "./climate";

export interface ActivityItem {
  id: string;
  kind: "activity" | "alert" | "developing";
  title: string;
  url: string;
  publisher: string | null;
  publishedAt: string | null;
  regionSlug: string | null;
  regionName: string | null;
  category: ActivityCategory | null;
  categoryLabel: string;
  nearInstitution: boolean;
  severity: Severity | null;
}

export interface ZoneClimate {
  regionId: string;
  slug: string;
  name: string;
  posture: Posture;
  score: number;
  trend: Trend;
  activityCount: number;
  institutionCount: number;
  confirmedAlerts: number;
  developing: number;
  byCategory: Partial<Record<ActivityCategory, number>>;
  latest: ActivityItem[];
  /** Protests, riots, rallies and anti-Israel demonstrations in the window. */
  protestCount: number;
  protests: ActivityItem[];
  /** 0 = country, 1+ = area or city. */
  depth: number;
}

export interface ClimateData {
  window: ClimateWindow;
  zones: ZoneClimate[];
  /** Areas and cities below the countries, for the map. */
  areas: ZoneClimate[];
  stream: ActivityItem[];
  counts: Record<Posture, number>;
  overall: Posture;
  totalActivity: number;
  callouts: string[];
}

const EUROPE = new Set([
  "united-kingdom", "france", "germany", "netherlands", "belgium", "ireland", "italy", "spain",
  "austria", "switzerland", "sweden", "denmark", "poland", "hungary",
]);

export const getClimate = createServerFn({ method: "GET" })
  .inputValidator((input: { window?: string } | undefined) => ({
    window: (isWindow(input?.window) ? input?.window : "7d") as ClimateWindow,
  }))
  .handler(async ({ data }): Promise<ClimateData> => {
    const { getPublicClient } = await import("@/lib/supabase-public.server");
    const supabase = await getPublicClient();
    const days = WINDOWS[data.window];
    const now = Date.now();
    const since = now - days * 86_400_000;
    const mid = now - (days * 86_400_000) / 2;

    const [regionsRes, headRes, alertRes] = await Promise.all([
      supabase.from("regions").select("id,name,slug,parent_id,covered"),
      supabase
        .from("headlines")
        .select("id,url,title,publisher,published_at,region_slug")
        .eq("kept", true)
        .gt("published_at", new Date(since).toISOString())
        .order("published_at", { ascending: false })
        .limit(1000),
      supabase
        .from("alerts")
        .select("id,event_key,title,summary,region_id,severity,verification,category,published_at,issuing_authority")
        .eq("status", "published")
        .neq("category", "travel_advisory")
        .gt("expires_at", new Date().toISOString())
        .limit(500),
    ]);
    if (regionsRes.error || headRes.error || alertRes.error) throw new Error("Could not load climate data.");

    const dbRegions = (regionsRes.data ?? []) as { id: string; name: string; slug: string; parent_id: string | null; covered: boolean }[];
    const regions = withCities(dbRegions.map((r) => ({ ...r, parentId: r.parent_id })))
      .map((r) => ({ id: r.id, name: r.name, slug: r.slug, parent_id: r.parentId, covered: "covered" in r ? Boolean(r.covered) : true }));
    const byId = new Map(regions.map((r) => [r.id, r]));
    /** The zone and every ancestor, most specific first. */
    const chainOf = (id: string) => {
      const out: typeof regions = [];
      let cur = byId.get(id);
      for (let i = 0; cur && i < 6; i++) { out.push(cur); cur = cur.parent_id ? byId.get(cur.parent_id) : undefined; }
      return out;
    };
    const bySlug = new Map(regions.map((r) => [r.slug, r]));

    interface Acc { weights: number[]; recent: number; prior: number; inst: number; sev: Severity[]; dev: number; cats: Partial<Record<ActivityCategory, number>>; latest: ActivityItem[]; protests: ActivityItem[] }
    const empty = (): Acc => ({ weights: [], recent: 0, prior: 0, inst: 0, sev: [], dev: 0, cats: {}, latest: [], protests: [] });
    const acc = new Map<string, Acc>();
    const get = (id: string) => {
      let a = acc.get(id);
      if (!a) acc.set(id, (a = empty()));
      return a;
    };
    // Signals assigned directly to a zone (not rolled up from its cities).
    const own = new Map<string, Acc>();
    const getOwn = (id: string) => {
      let a = own.get(id);
      if (!a) own.set(id, (a = empty()));
      return a;
    };

    const stream: ActivityItem[] = [];
    const zonesForGrouping = regions.map((r) => ({ ...r, parentId: r.parent_id }));
    const rawHeads = ((headRes.data ?? []) as { id: string; url: string; title: string; publisher: string | null; published_at: string | null; region_slug: string | null }[]).map((h) => ({ ...h, publishedAt: h.published_at, regionSlug: resolveRegionSlug(h.region_slug, h.title) ?? h.region_slug }));
    for (const h of groupHeadlines(rawHeads, zonesForGrouping)) {
      const c = classifyHeadline(h.title);
      if (!c) continue;
      const slug = resolveRegionSlug(h.region_slug, h.title);
      const reg = slug ? bySlug.get(slug) : undefined;
      const item: ActivityItem = {
        id: h.id, kind: "activity", title: h.title, url: h.url, publisher: h.publisher,
        publishedAt: h.published_at, regionSlug: reg?.slug ?? null, regionName: reg?.name ?? null,
        category: c.category, categoryLabel: ACTIVITY_LABELS[c.category], nearInstitution: c.nearInstitution, severity: null,
      };
      stream.push(item);
      if (!reg) continue;
      const protest = c.category === "protest" || isProtest(h.title);
      const t = h.published_at ? new Date(h.published_at).getTime() : 0;
      getOwn(reg.id).weights.push(c.weight);
      for (const z of chainOf(reg.id)) {
        const a = get(z.id);
        a.weights.push(c.weight);
        a.cats[c.category] = (a.cats[c.category] ?? 0) + 1;
        if (c.nearInstitution) a.inst++;
        if (t >= mid) a.recent++; else a.prior++;
        if (a.latest.length < 5) a.latest.push(item);
        if (protest) a.protests.push(item);
      }
    }

    const rawAlerts = ((alertRes.data ?? []) as { id: string; event_key: string | null; title: string; summary: string; region_id: string; severity: Severity; verification: string | null; published_at: string | null; issuing_authority: string | null }[]).map((al) => ({ ...al, eventKey: al.event_key, publishedAt: al.published_at, regionSlug: refinedRegion(byId.get(al.region_id)?.slug ?? "", "", al.title).regionSlug || null, verification: al.verification === "developing" ? "developing" as const : "confirmed" as const }));
    for (const al of groupAlerts(rawAlerts, zonesForGrouping)) {
      const reg = (al.regionSlug ? bySlug.get(al.regionSlug) : undefined) ?? byId.get(al.region_id);
      if (!reg) continue;
      const developing = al.verification === "developing";
      if (developing) getOwn(reg.id).dev++; else getOwn(reg.id).sev.push(al.severity);
      for (const z of chainOf(reg.id)) { const a = get(z.id); if (developing) a.dev++; else a.sev.push(al.severity); }
      stream.push({
        id: al.id, kind: developing ? "developing" : "alert", title: al.title, url: `/alerts/${al.id}`,
        publisher: al.issuing_authority, publishedAt: al.publishedAt, regionSlug: reg.slug, regionName: reg.name,
        category: null, categoryLabel: developing ? "Developing report" : "Verified incident", nearInstitution: false, severity: al.severity,
      });
    }

    const counts: Record<Posture, number> = { CRITICAL: 0, HIGH: 0, ELEVATED: 0, MONITORED: 0 };
    const childrenOf = new Map<string, typeof regions>();
    for (const r of regions) if (r.parent_id) childrenOf.set(r.parent_id, [...(childrenOf.get(r.parent_id) ?? []), r]);
    const memo = new Map<string, { posture: Posture; score: number }>();
    const levelOf = (id: string, depth = 0): { posture: Posture; score: number } => {
      const hit = memo.get(id);
      if (hit) return hit;
      const o = own.get(id) ?? empty();
      const inputs = { activityWeights: o.weights, alertSeverities: o.sev, developingCount: o.dev };
      const kids = depth < 6 ? (childrenOf.get(id) ?? []).map((k) => levelOf(k.id, depth + 1)) : [];
      const res = {
        posture: rollupPosture(postureFor(inputs), kids.map((k) => k.posture)),
        score: Math.max(scoreZone(inputs), ...kids.map((k) => k.score), 0),
      };
      memo.set(id, res);
      return res;
    };
    const toZone = (r: (typeof regions)[number]): ZoneClimate => {
      const a = acc.get(r.id) ?? empty();
      const lvl = levelOf(r.id);
      return {
        regionId: r.id, slug: r.slug, name: r.name, posture: lvl.posture, score: lvl.score,
        trend: trendFor(a.recent, a.prior), activityCount: a.weights.length, institutionCount: a.inst,
        confirmedAlerts: a.sev.length, developing: a.dev, byCategory: a.cats, latest: a.latest,
        protestCount: a.protests.length, protests: a.protests.slice(0, 5), depth: chainOf(r.id).length - 1,
      };
    };
    const zones: ZoneClimate[] = regions.filter((r) => !r.parent_id && r.covered).map(toZone).sort((x, y) => y.score - x.score);
    for (const z of zones) counts[z.posture]++;
    const areas: ZoneClimate[] = regions.filter((r) => r.parent_id && r.covered).map(toZone);
    // Every monitored zone (countries and their cities) counts toward the posture totals.
    for (const z of areas) counts[z.posture]++;

    stream.sort((x, y) => new Date(y.publishedAt ?? 0).getTime() - new Date(x.publishedAt ?? 0).getTime());

    const callouts: string[] = [];
    const euroProtest = zones.filter((z) => EUROPE.has(z.slug) && (z.byCategory.protest ?? 0) > 0);
    if (euroProtest.length >= 2)
      callouts.push(`Demonstration activity reported in ${euroProtest.length} European countries: ${euroProtest.map((z) => z.name).join(", ")}.`);
    const protestCities = areas.filter((z) => z.protestCount > 0).sort((x, y) => y.protestCount - x.protestCount);
    if (protestCities.length > 0)
      callouts.push(`Protests, rallies or riots reported in ${protestCities.length} cit${protestCities.length === 1 ? "y" : "ies"}: ${protestCities.slice(0, 6).map((z) => z.name).join(", ")}.`);
    const inst = zones.filter((z) => z.institutionCount > 0);
    if (inst.length > 0)
      callouts.push(`Reports mentioning Jewish institutions in ${inst.length} zone${inst.length === 1 ? "" : "s"}: ${inst.slice(0, 5).map((z) => z.name).join(", ")}.`);
    const rising = zones.filter((z) => z.trend === "increasing");
    if (rising.length > 0)
      callouts.push(`Activity increasing in ${rising.slice(0, 5).map((z) => z.name).join(", ")}.`);

    const overall: Posture = counts.CRITICAL ? "CRITICAL" : counts.HIGH ? "HIGH" : counts.ELEVATED ? "ELEVATED" : "MONITORED";
    return {
      window: data.window, zones, areas, stream: stream.slice(0, 40), counts, overall,
      totalActivity: zones.reduce((s, z) => s + z.activityCount, 0), callouts,
    };
  });
