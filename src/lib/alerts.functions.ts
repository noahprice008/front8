import { createServerFn } from "@tanstack/react-start";
import {
  CATEGORY_VALUES,
  SEVERITY_ORDER,
  type AlertCategory,
  type AlertDetail,
  type AlertListItem,
  type AlertStatusFilter,
  type AlertTier,
  TIER_VALUES,
  type FeedStatus,
  type MapRegion,
  type PublicSource,
  type Severity,
  type TravelData,
  type TravelAdvisory,
} from "./alerts.types";

const FEED_DELAY_MS = 3 * 60 * 60 * 1000;
const PAGE_SIZE = 20;

async function publicClient() {
  const { getPublicClient } = await import("@/lib/supabase-public.server");
  return getPublicClient();
}

interface RawAlertRow {
  id: string;
  title: string;
  summary: string;
  category: AlertCategory;
  severity: Severity;
  tier: AlertTier;
  issuing_authority: string | null;
  primary_source_url: string;
  auto_published: boolean;
  published_at: string | null;
  expires_at: string;
  last_reviewed_at: string | null;
  regions: { name: string; slug: string } | null;
}

interface RegionStatusRow {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  iso_code: string | null;
  lat: number | null;
  lng: number | null;
  covered: boolean | null;
  active_alerts: number | null;
  top_severity: Severity | null;
}

interface SettingsRow {
  autopublish_enabled: boolean | null;
  last_ingest_ok_at: string | null;
}

interface RegionIdNameSlugRow {
  id: string;
  name: string;
  slug: string;
}

interface PublicSourceRow {
  region_id: string | null;
  name: string | null;
  url: string;
  tier: AlertTier | null;
}

function mapAlertRow(row: RawAlertRow): AlertListItem {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    category: row.category,
    severity: row.severity,
    tier: row.tier,
    issuingAuthority: row.issuing_authority,
    autoPublished: row.auto_published,
    publishedAt: row.published_at,
    expiresAt: row.expires_at,
    lastReviewedAt: row.last_reviewed_at,
    regionName: row.regions?.name ?? "",
    regionSlug: row.regions?.slug ?? "",
  };
}

/** Regions + latest active alerts + feed status, for the home page map. */
export const getMapData = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ regions: MapRegion[]; feed: FeedStatus }> => {
    const supabase = await publicClient();

    const [regionRes, settingsRes, alertsRes] = await Promise.all([
      supabase
        .from("region_status")
        .select("id,parent_id,name,slug,iso_code,lat,lng,covered,active_alerts,top_severity")
        .order("name"),
      supabase
        .from("system_settings")
        .select("autopublish_enabled,last_ingest_ok_at")
        .limit(1),
      supabase
        .from("alerts")
        .select("id,title,region_id")
        .eq("status", "published")
        .neq("category", "travel_advisory")
        .gt("expires_at", new Date().toISOString())
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(300),
    ]);

    if (regionRes.error) throw new Error("Could not load map data.");
    if (alertsRes.error) throw new Error("Could not load map data.");

    const regionRows = (regionRes.data ?? []) as unknown as RegionStatusRow[];
    const parentOf = new Map(regionRows.map((r) => [r.id, r.parent_id]));
    const latestByRegion = new Map<string, { id: string; title: string }[]>();
    const push = (regionId: string, a: { id: string; title: string }) => {
      const list = latestByRegion.get(regionId) ?? [];
      if (list.length < 3) list.push({ id: a.id, title: a.title });
      latestByRegion.set(regionId, list);
    };
    for (const a of (alertsRes.data ?? []) as { id: string; title: string; region_id: string }[]) {
      push(a.region_id, a);
      const parent = parentOf.get(a.region_id);
      if (parent) push(parent, a); // roll child alerts up, like region_status does
    }

    const regions: MapRegion[] = regionRows.map((row) => ({
      id: row.id,
      parentId: row.parent_id,
      name: row.name,
      slug: row.slug,
      isoCode: row.iso_code,
      lat: row.lat,
      lng: row.lng,
      covered: Boolean(row.covered),
      activeAlerts: Number(row.active_alerts ?? 0),
      topSeverity: row.top_severity,
      latestAlerts: latestByRegion.get(row.id) ?? [],
    }));

    const settings = ((settingsRes.data ?? []) as unknown as SettingsRow[])[0];
    const lastIngestOkAt = settings?.last_ingest_ok_at ?? null;
    const feedDelay =
      !lastIngestOkAt ||
      Date.now() - new Date(lastIngestOkAt).getTime() > FEED_DELAY_MS;

    const feed: FeedStatus = {
      lastIngestOkAt,
      autopublishEnabled: settings ? Boolean(settings.autopublish_enabled) : true,
      feedDelay,
    };

    return { regions, feed };
  },
);

export interface AlertsFilters {
  region?: string | undefined;
  severity?: string | undefined;
  category?: string | undefined;
  tier?: string | undefined;
  status: AlertStatusFilter;
  page: number;
}

export const listAlerts = createServerFn({ method: "GET" })
  .inputValidator((input: unknown): AlertsFilters => {
    const q = (input ?? {}) as Partial<AlertsFilters>;
    return {
      region:
        typeof q.region === "string" && q.region.trim() ? q.region.trim() : undefined,
      severity: SEVERITY_ORDER.includes(q.severity as Severity)
        ? (q.severity as Severity)
        : undefined,
      category: CATEGORY_VALUES.includes(q.category as AlertCategory)
        ? (q.category as AlertCategory)
        : undefined,
      tier: TIER_VALUES.includes(q.tier as AlertTier) ? (q.tier as AlertTier) : undefined,
      status: q.status === "expired" ? ("expired" as const) : ("active" as const),
      page:
        Number.isFinite(Number(q.page)) && Number(q.page) > 0
          ? Math.floor(Number(q.page))
          : 0,
    };
  })
  .handler(
    async ({
      data,
    }): Promise<{ items: AlertListItem[]; total: number; page: number; pageSize: number }> => {
      const supabase = await publicClient();

      let query = supabase
        .from("alerts")
        .select(
          "id,title,summary,category,severity,tier,issuing_authority,auto_published,published_at,expires_at,last_reviewed_at,regions(name,slug)",
          { count: "exact" },
        )
        .eq("status", "published");

      query =
        data.status === "active"
          ? query.gt("expires_at", new Date().toISOString())
          : query.lte("expires_at", new Date().toISOString());

      if (data.region) {
        const { data: regionRows, error: regionErr } = await supabase
          .from("regions")
          .select("id,slug,parent_id");
        if (regionErr) throw new Error("Could not load alerts.");
        const all = (regionRows ?? []) as { id: string; slug: string; parent_id: string | null }[];
        const selected = all.find((r) => r.slug === data.region);
        const ids = selected
          ? [selected.id, ...all.filter((r) => r.parent_id === selected.id).map((r) => r.id)]
          : ["00000000-0000-0000-0000-000000000000"];
        query = query.in("region_id", ids);
      }
      if (data.severity) query = query.eq("severity", data.severity);
      if (data.category) query = query.eq("category", data.category);
      else query = query.neq("category", "travel_advisory");
      if (data.tier) query = query.eq("tier", data.tier as AlertTier);

      const from = data.page * PAGE_SIZE;
      const { data: rows, error, count } = await query
        .order("published_at", { ascending: false, nullsFirst: false })
        .range(from, from + PAGE_SIZE - 1);

      if (error) throw new Error("Could not load alerts.");

      return {
        items: ((rows ?? []) as unknown as RawAlertRow[]).map(mapAlertRow),
        total: count ?? 0,
        page: data.page,
        pageSize: PAGE_SIZE,
      };
    },
  );

export const getAlert = createServerFn({ method: "GET" })
  .inputValidator((input: { id: string }) => ({ id: String(input.id) }))
  .handler(async ({ data }): Promise<AlertDetail | null> => {
    const supabase = await publicClient();

    const [alertRes, sourcesRes] = await Promise.all([
      supabase
        .from("alerts")
        .select(
          "id,title,summary,category,severity,tier,issuing_authority,primary_source_url,auto_published,published_at,expires_at,last_reviewed_at,regions(name,slug)",
        )
        .eq("id", data.id)
        .eq("status", "published")
        .maybeSingle(),
      supabase
        .from("alert_sources")
        .select("publisher,url")
        .eq("alert_id", data.id)
        .order("created_at", { ascending: true }),
    ]);

    if (alertRes.error) throw new Error("Could not load alert.");
    if (!alertRes.data) return null;

    const row = alertRes.data as unknown as RawAlertRow;
    const sources = ((sourcesRes.data ?? []) as unknown as {
      publisher: string | null;
      url: string;
    }[]).map((s) => ({ publisher: s.publisher, url: s.url }));

    return {
      ...mapAlertRow(row),
      primarySourceUrl: row.primary_source_url,
      sources,
    };
  });

export const getLatestAlerts = createServerFn({ method: "GET" })
  .inputValidator((input: { limit?: number | undefined }) => ({
    limit: Math.min(Math.max(1, Math.floor(Number(input.limit) || 5)), 10),
  }))
  .handler(async ({ data }): Promise<AlertListItem[]> => {
    const supabase = await publicClient();
    const { data: rows, error } = await supabase
      .from("alerts")
      .select(
        "id,title,summary,category,severity,tier,issuing_authority,auto_published,published_at,expires_at,last_reviewed_at,regions!inner(name,slug)",
      )
      .eq("status", "published")
      .neq("category", "travel_advisory")
      .gt("expires_at", new Date().toISOString())
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(data.limit);

    if (error) throw new Error("Could not load alerts.");
    return ((rows ?? []) as unknown as RawAlertRow[]).map(mapAlertRow);
  });

export const getTravelData = createServerFn({ method: "GET" }).handler(
  async (): Promise<TravelData> => {
    const supabase = await publicClient();

    const [regionsRes, sourcesRes, advisoriesRes] = await Promise.all([
      supabase.from("regions").select("id,name,slug,parent_id").eq("covered", true).order("name"),
      supabase
        .from("public_sources")
        .select("region_id,name,url,tier")
        .not("region_id", "is", null)
        .order("tier", { ascending: true }),
      supabase
        .from("alerts")
        .select("id,region_id,title,summary,issuing_authority,primary_source_url,published_at,updated_at")
        .eq("status", "published")
        .eq("category", "travel_advisory")
        .gt("expires_at", new Date().toISOString())
        .order("published_at", { ascending: false, nullsFirst: false }),
    ]);

    if (regionsRes.error) throw new Error("Could not load travel advice.");

    const advisoriesByRegion: Record<string, TravelAdvisory[]> = {};
    for (const a of (advisoriesRes.data ?? []) as unknown as {
      id: string;
      region_id: string;
      title: string;
      summary: string;
      issuing_authority: string | null;
      primary_source_url: string;
      published_at: string | null;
      updated_at: string | null;
    }[]) {
      const level = /level\s*\d[^.\n]*/i.exec(a.summary)?.[0] ?? a.summary;
      const list = advisoriesByRegion[a.region_id] ?? [];
      list.push({
        id: a.id,
        title: a.title,
        issuingAuthority: a.issuing_authority,
        levelText: level.trim(),
        updatedAt: a.published_at ?? a.updated_at,
        sourceUrl: a.primary_source_url,
      });
      advisoriesByRegion[a.region_id] = list;
    }

    const sourcesByRegion: Record<string, PublicSource[]> = {};
    for (const s of (sourcesRes.data ?? []) as unknown as PublicSourceRow[]) {
      const regionId = s.region_id;
      if (!regionId) continue;
      const list = sourcesByRegion[regionId] ?? [];
      list.push({ name: s.name, url: s.url, tier: s.tier });
      sourcesByRegion[regionId] = list;
    }

    const rows = (regionsRes.data ?? []) as unknown as (RegionIdNameSlugRow & {
      parent_id: string | null;
    })[];
    const ordered: TravelData["regions"] = [];
    for (const r of rows.filter((x) => !x.parent_id)) {
      ordered.push({ id: r.id, name: r.name, slug: r.slug, parentId: null });
      for (const c of rows.filter((x) => x.parent_id === r.id))
        ordered.push({ id: c.id, name: c.name, slug: c.slug, parentId: r.id });
    }

    return { regions: ordered, sourcesByRegion, advisoriesByRegion };
  },
);

export const listPublicSources = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicSource[]> => {
    const supabase = await publicClient();
    const { data, error } = await supabase
      .from("public_sources")
      .select("name,url,tier")
      .order("tier", { ascending: true });
    if (error) throw new Error("Could not load sources.");
    return ((data ?? []) as unknown as {
      name: string | null;
      url: string;
      tier: AlertTier | null;
    }[]).map((s) => ({ name: s.name, url: s.url, tier: s.tier }));
  },
);
