import { createServerFn } from "@tanstack/react-start";
import type { Severity } from "./alerts.types";
import {
  ACTIVITY_LABELS,
  classifyHeadline,
  dedupeKey,
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
}

export interface ClimateData {
  window: ClimateWindow;
  zones: ZoneClimate[];
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
    window: (isWindow(input?.window) ? input!.window : "7d") as ClimateWindow,
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
        .select("id,title,region_id,severity,verification,category,published_at,issuing_authority")
        .eq("status", "published")
        .neq("category", "travel_advisory")
        .gt("expires_at", new Date().toISOString())
        .limit(500),
    ]);
    if (regionsRes.error || headRes.error || alertRes.error) throw new Error("Could not load climate data.");

    const regions = (regionsRes.data ?? []) as { id: string; name: string; slug: string; parent_id: string | null; covered: boolean }[];
    const byId = new Map(regions.map((r) => [r.id, r]));
    const topOf = (id: string) => {
      const r = byId.get(id);
      return r?.parent_id ? byId.get(r.parent_id) ?? r : r;
    };
    const bySlug = new Map(regions.map((r) => [r.slug, r]));

    interface Acc { weights: number[]; recent: number; prior: number; inst: number; sev: Severity[]; dev: number; cats: Partial<Record<ActivityCategory, number>>; latest: ActivityItem[] }
    const acc = new Map<string, Acc>();
    const get = (id: string) => {
      let a = acc.get(id);
      if (!a) acc.set(id, (a = { weights: [], recent: 0, prior: 0, inst: 0, sev: [], dev: 0, cats: {}, latest: [] }));
      return a;
    };

    const stream: ActivityItem[] = [];
    const seen = new Set<string>();
    for (const h of (headRes.data ?? []) as { id: string; url: string; title: string; publisher: string | null; published_at: string | null; region_slug: string | null }[]) {
      const key = dedupeKey(h.title);
      if (seen.has(key)) continue;
      seen.add(key);
      const c = classifyHeadline(h.title);
      if (!c) continue;
      const slug = resolveRegionSlug(h.region_slug, h.title);
      const reg = slug ? bySlug.get(slug) : undefined;
      const top = reg ? topOf(reg.id) : undefined;
      const item: ActivityItem = {
        id: h.id, kind: "activity", title: h.title, url: h.url, publisher: h.publisher,
        publishedAt: h.published_at, regionSlug: top?.slug ?? null, regionName: top?.name ?? null,
        category: c.category, categoryLabel: ACTIVITY_LABELS[c.category], nearInstitution: c.nearInstitution, severity: null,
      };
      stream.push(item);
      if (!top) continue;
      const a = get(top.id);
      a.weights.push(c.weight);
      a.cats[c.category] = (a.cats[c.category] ?? 0) + 1;
      if (c.nearInstitution) a.inst++;
      const t = h.published_at ? new Date(h.published_at).getTime() : 0;
      if (t >= mid) a.recent++; else a.prior++;
      if (a.latest.length < 5) a.latest.push(item);
    }

    for (const al of (alertRes.data ?? []) as { id: string; title: string; region_id: string; severity: Severity; verification: string | null; published_at: string | null; issuing_authority: string | null }[]) {
      const top = topOf(al.region_id);
      if (!top) continue;
      const a = get(top.id);
      const developing = al.verification === "developing";
      if (developing) a.dev++; else a.sev.push(al.severity);
      stream.push({
        id: al.id, kind: developing ? "developing" : "alert", title: al.title, url: `/alerts/${al.id}`,
        publisher: al.issuing_authority, publishedAt: al.published_at, regionSlug: top.slug, regionName: top.name,
        category: null, categoryLabel: developing ? "Developing report" : "Verified incident", nearInstitution: false, severity: al.severity,
      });
    }

    const counts: Record<Posture, number> = { CRITICAL: 0, HIGH: 0, ELEVATED: 0, MONITORED: 0 };
    const zones: ZoneClimate[] = regions
      .filter((r) => !r.parent_id && r.covered)
      .map((r) => {
        const a = acc.get(r.id) ?? { weights: [], recent: 0, prior: 0, inst: 0, sev: [], dev: 0, cats: {}, latest: [] };
        const inputs = { activityWeights: a.weights, alertSeverities: a.sev, developingCount: a.dev };
        const posture = postureFor(inputs);
        counts[posture]++;
        return {
          regionId: r.id, slug: r.slug, name: r.name, posture, score: scoreZone(inputs),
          trend: trendFor(a.recent, a.prior), activityCount: a.weights.length, institutionCount: a.inst,
          confirmedAlerts: a.sev.length, developing: a.dev, byCategory: a.cats, latest: a.latest,
        };
      })
      .sort((x, y) => y.score - x.score);

    stream.sort((x, y) => new Date(y.publishedAt ?? 0).getTime() - new Date(x.publishedAt ?? 0).getTime());

    const callouts: string[] = [];
    const euroProtest = zones.filter((z) => EUROPE.has(z.slug) && (z.byCategory.protest ?? 0) > 0);
    if (euroProtest.length >= 2)
      callouts.push(`Demonstration activity reported in ${euroProtest.length} European countries: ${euroProtest.map((z) => z.name).join(", ")}.`);
    const inst = zones.filter((z) => z.institutionCount > 0);
    if (inst.length > 0)
      callouts.push(`Reports mentioning Jewish institutions in ${inst.length} zone${inst.length === 1 ? "" : "s"}: ${inst.slice(0, 5).map((z) => z.name).join(", ")}.`);
    const rising = zones.filter((z) => z.trend === "increasing");
    if (rising.length > 0)
      callouts.push(`Activity increasing in ${rising.slice(0, 5).map((z) => z.name).join(", ")}.`);

    const overall: Posture = counts.CRITICAL ? "CRITICAL" : counts.HIGH ? "HIGH" : counts.ELEVATED ? "ELEVATED" : "MONITORED";
    return {
      window: data.window, zones, stream: stream.slice(0, 40), counts, overall,
      totalActivity: zones.reduce((s, z) => s + z.activityCount, 0), callouts,
    };
  });
