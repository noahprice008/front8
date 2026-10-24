import { ancestorsOf, buildZoneTree, depthOf, descendantsOf } from "./zones";
import { createServerFn } from "@tanstack/react-start";
import {
  CATEGORY_VALUES,
  HEADLINE_TOPICS,
  SEVERITY_ORDER,
  type AlertCategory,
  type AlertDetail,
  type AlertListItem,
  type AlertStatusFilter,
  type AlertTier,
  type AlertVerification,
  type Headline,
  TIER_VALUES,
  type FeedStatus,
  type MapRegion,
  type PublicSource,
  type Severity,
  type TickerItem,
  type TravelData,
  type TravelAdvisory,
  type VerificationFilter,
} from "./alerts.types";
import { ACTIVITY_LABELS, classifyHeadline, dedupeKey, isWindow, resolveRegionSlug, WINDOWS, type ActivityCategory } from "./climate";
import { groupAlerts, groupHeadlines } from "./feed-grouping";

const FEED_DELAY_MS = 2 * 60 * 60 * 1000;
const PAGE_SIZE = 20;

async function publicClient() {
  const { getPublicClient } = await import("@/lib/supabase-public.server");
  return getPublicClient();
}

export interface RawAlertRow {
  id: string;
  event_key?: string | null;
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
  verification: AlertVerification | null;
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

export function mapAlertRow(row: RawAlertRow): AlertListItem {
  return {
    id: row.id,
    eventKey: row.event_key,
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
    verification: row.verification === "developing" ? "developing" : "confirmed",
  };
}

/** Adds the outlets list (alert_sources) to each alert, in one bounded query. */
export async function attachSources(
  supabase: Awaited<ReturnType<typeof publicClient>>,
  items: AlertListItem[],
): Promise<void> {
  if (items.length === 0) return;
  const ids = items.map((i) => i.id);
  const [{ data }, social] = await Promise.all([
    supabase.from("alert_sources").select("alert_id,publisher,url").in("alert_id", ids).limit(500),
    // View not in generated types; read-only, only the account count is exposed.
    (supabase as unknown as { from: (t: string) => any })
      .from("alert_social_counts")
      .select("alert_id,accounts")
      .in("alert_id", ids)
      .limit(500) as Promise<{ data: { alert_id: string; accounts: number | null }[] | null }>,
  ]);
  const by = new Map<string, { publisher: string | null; url: string }[]>();
  for (const r of (data ?? []) as { alert_id: string; publisher: string | null; url: string }[]) {
    const l = by.get(r.alert_id) ?? [];
    l.push({ publisher: r.publisher, url: r.url });
    by.set(r.alert_id, l);
  }
  const accounts = new Map<string, number>();
  for (const r of social.data ?? []) {
    const n = Number(r.accounts);
    if (Number.isFinite(n) && n > 0) accounts.set(r.alert_id, n);
  }
  for (const i of items) {
    i.sources = by.get(i.id) ?? [];
    const n = accounts.get(i.id);
    if (n) i.socialAccounts = n;
  }
}

/** Regions + latest active alerts + feed status, for the home page map. */
export async function readMapData(): Promise<{ regions: MapRegion[]; feed: FeedStatus }> {
    const supabase = await publicClient();

    const [regionRes, settingsRes, alertsRes, groupRes] = await Promise.all([
      supabase
        .from("region_status")
        .select("id,parent_id,name,slug,iso_code,lat,lng,covered,active_alerts,top_severity")
        .eq("covered", true)
        .order("name")
        .limit(5000),
      supabase
        .from("system_settings")
        .select("autopublish_enabled,last_ingest_ok_at")
        .limit(1),
      supabase
        .from("alerts")
        .select("id,event_key,title,summary,region_id,severity,verification,published_at")
        .eq("status", "published")
        .gt("expires_at", new Date().toISOString())
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(1000),
      supabase.from("regions").select("id,zone_group").eq("covered", true).limit(5000),
    ]);

    if (regionRes.error) throw new Error("Could not load map data.");
    if (alertsRes.error) throw new Error("Could not load map data.");

    const regionRows = (regionRes.data ?? []) as unknown as RegionStatusRow[];
    const groupOf = new Map(((groupRes.data ?? []) as { id: string; zone_group: string | null }[]).map((g) => [g.id, g.zone_group]));
    const tree = buildZoneTree(regionRows.map((r) => ({ id: r.id, parentId: r.parent_id, name: r.name, slug: r.slug })));
    const latestByRegion = new Map<string, { id: string; title: string }[]>();
    const countByRegion = new Map<string, number>();
    const topByRegion = new Map<string, Severity>();
    const devCountByRegion = new Map<string, number>();
    const devLatestByRegion = new Map<string, { id: string; title: string }[]>();
    const push = (regionId: string, a: { id: string; title: string; severity: Severity; verification: string | null }) => {
      if (a.verification === "developing") {
        // Developing reports never change the confirmed marker count or colour.
        devCountByRegion.set(regionId, (devCountByRegion.get(regionId) ?? 0) + 1);
        const devList = devLatestByRegion.get(regionId) ?? [];
        if (devList.length < 3) devList.push({ id: a.id, title: a.title });
        devLatestByRegion.set(regionId, devList);
        return;
      }
      const list = latestByRegion.get(regionId) ?? [];
      if (list.length < 3) list.push({ id: a.id, title: a.title });
      latestByRegion.set(regionId, list);
      countByRegion.set(regionId, (countByRegion.get(regionId) ?? 0) + 1);
      const cur = topByRegion.get(regionId);
      if (!cur || SEVERITY_ORDER.indexOf(a.severity) > SEVERITY_ORDER.indexOf(cur)) {
        topByRegion.set(regionId, a.severity);
      }
    };
    const raw = (alertsRes.data ?? []) as { id: string; event_key: string | null; title: string; summary: string; region_id: string; severity: Severity; verification: string | null; published_at: string | null }[];
    const grouped = groupAlerts(raw.map((a) => ({ ...a, eventKey: a.event_key, publishedAt: a.published_at, regionSlug: tree.byId.get(a.region_id)?.slug ?? null, verification: a.verification === "developing" ? "developing" as const : "confirmed" as const })), [...tree.byId.values()]);
    for (const a of grouped) {
      const targetIds = new Set<string>();
      for (const slug of a.regionSlugs) {
        const z = regionRows.find((r) => r.slug === slug);
        if (!z) continue;
        targetIds.add(z.id);
        for (const ancestor of ancestorsOf(tree, z.id)) targetIds.add(ancestor.id);
      }
      for (const id of targetIds) push(id, { ...a, title: a.reportCount > 1 ? `${a.title} (${a.reportCount} reports combined)` : a.title });
    }

    const regions: MapRegion[] = regionRows.map((row) => ({
      id: row.id,
      parentId: tree.byId.has(row.parent_id ?? "") ? row.parent_id : null,
      name: row.name,
      slug: row.slug,
      isoCode: row.iso_code,
      lat: row.lat,
      lng: row.lng,
      covered: Boolean(row.covered),
      activeAlerts: countByRegion.get(row.id) ?? 0,
      topSeverity: topByRegion.get(row.id) ?? null,
      latestAlerts: latestByRegion.get(row.id) ?? [],
      developingAlerts: devCountByRegion.get(row.id) ?? 0,
      latestDeveloping: devLatestByRegion.get(row.id) ?? [],
      zoneGroup: groupOf.get(row.id) === "travel" ? "travel" : "diaspora",
      depth: depthOf(tree, row.id),
      descendantCount: descendantsOf(tree, row.id).length,
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
}
export const getMapData = createServerFn({ method: "GET" }).handler(() => readMapData());

export interface AlertsFilters {
  region?: string | undefined;
  severity?: string | undefined;
  category?: string | undefined;
  tier?: string | undefined;
  verification?: VerificationFilter | undefined;
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
      verification:
        q.verification === "confirmed" || q.verification === "developing"
          ? q.verification
          : undefined,
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

      const { data: zoneRows, error: zoneError } = await supabase.from("regions").select("id,name,slug,parent_id").limit(5000);
      if (zoneError) throw new Error("Could not load alerts.");
      const zones = (zoneRows ?? []).map((z) => ({ id: z.id, name: z.name, slug: z.slug, parentId: z.parent_id }));
      let query = supabase.from("alerts")
        .select("id,event_key,title,summary,category,severity,tier,issuing_authority,auto_published,published_at,expires_at,last_reviewed_at,verification,regions(name,slug)")
        .eq("status", "published");
      query = data.status === "active" ? query.gt("expires_at", new Date().toISOString()) : query.lte("expires_at", new Date().toISOString());
      const { data: rows, error } = await query.order("published_at", { ascending: false, nullsFirst: false }).limit(1000);
      if (error) throw new Error("Could not load alerts.");
      const raw = ((rows ?? []) as unknown as RawAlertRow[]).map(mapAlertRow);
      await attachSources(supabase, raw);
      const tree = buildZoneTree(zones);
      const selected = zones.find((z) => z.slug === data.region);
      const slugs = selected ? new Set([selected.slug, ...descendantsOf(tree, selected.id).map((z) => z.slug)]) : new Set<string>();
      const grouped = groupAlerts(raw, zones).filter((a) =>
        (!data.region || a.regionSlugs.some((slug) => slugs.has(slug))) &&
        (!data.severity || a.severity === data.severity) &&
        (data.category ? a.category === data.category : a.category !== "travel_advisory") &&
        (!data.tier || a.tier === data.tier) && (!data.verification || a.verification === data.verification))
        .sort((a, b) => SEVERITY_ORDER.indexOf(b.severity) - SEVERITY_ORDER.indexOf(a.severity) || (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
      const from = data.page * PAGE_SIZE;
      return { items: grouped.slice(from, from + PAGE_SIZE), total: grouped.length, page: data.page, pageSize: PAGE_SIZE };
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
          "id,title,summary,category,severity,tier,issuing_authority,primary_source_url,auto_published,published_at,expires_at,last_reviewed_at,verification,regions(name,slug)",
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
    const [alertsRes, zonesRes] = await Promise.all([
      supabase.from("alerts").select("id,event_key,title,summary,category,severity,tier,issuing_authority,auto_published,published_at,expires_at,last_reviewed_at,verification,regions!inner(name,slug)")
        .eq("status", "published").gt("expires_at", new Date().toISOString()).order("published_at", { ascending: false, nullsFirst: false }).limit(1000),
      supabase.from("regions").select("id,name,slug,parent_id").limit(5000),
    ]);
    if (alertsRes.error || zonesRes.error) throw new Error("Could not load alerts.");
    const items = ((alertsRes.data ?? []) as unknown as RawAlertRow[]).map(mapAlertRow);
    await attachSources(supabase, items);
    return groupAlerts(items, (zonesRes.data ?? []).map((z) => ({ ...z, parentId: z.parent_id }))).slice(0, data.limit);
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

interface HeadlineRow {
  id: string;
  url: string;
  title: string;
  publisher: string | null;
  published_at: string | null;
  region_slug: string | null;
  topic: string | null;
  language?: string | null;
  title_original?: string | null;
}

const HEADLINE_COLS = "id,url,title,publisher,published_at,region_slug,topic,language,title_original";

function mapHeadline(row: HeadlineRow): Headline {
  const c = classifyHeadline(row.title);
  return {
    activityLabel: c ? ACTIVITY_LABELS[c.category] : null,
    nearInstitution: c?.nearInstitution ?? false,
    id: row.id,
    url: row.url,
    title: row.title,
    publisher: row.publisher,
    publishedAt: row.published_at,
    regionSlug: resolveRegionSlug(row.region_slug, row.title) ?? row.region_slug,
    topic: row.topic,
    language: row.language ?? "en",
    titleOriginal: row.language && row.language !== "en" ? (row.title_original ?? null) : null,
  };
}

/** Ticker feed: newest 60 kept headlines from the last 72 hours (one per story) plus a few confirmed alerts. */
export const getTickerItems = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ items: TickerItem[]; zones: number; lastIngestOkAt: string | null }> => {
    const supabase = await publicClient();
    const since = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();

    const [headlinesRes, alertsRes, regionsRes, settingsRes] = await Promise.all([
      supabase
        .from("headlines")
        .select(HEADLINE_COLS)
        .eq("kept", true)
        .gt("published_at", since)
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(200),
      supabase
        .from("alerts")
        .select("id,event_key,title,summary,severity,issuing_authority,published_at,verification,regions(name,slug)")
        .eq("status", "published")
        .neq("category", "travel_advisory")
        .gt("expires_at", new Date().toISOString())
        .order("published_at", { ascending: false, nullsFirst: false })
        .limit(100),
      supabase.from("regions").select("id,parent_id,slug,name,covered").limit(1000),
      supabase.from("system_settings").select("last_ingest_ok_at").limit(1),
    ]);

    if (headlinesRes.error || alertsRes.error) throw new Error("Could not load ticker.");

    const regionRows = (regionsRes.data ?? []) as { id: string; parent_id: string | null; slug: string; name: string; covered: boolean }[];
    const nameOf = new Map(regionRows.map((r) => [r.slug, r.name]));
    const items: TickerItem[] = [];
    const zones = regionRows.map((r) => ({ ...r, parentId: r.parent_id }));
    for (const h of groupHeadlines(((headlinesRes.data ?? []) as unknown as HeadlineRow[]).map(mapHeadline), zones).slice(0, 60)) {
      const c = classifyHeadline(h.title);
      items.push({ tag: c ? c.category.toUpperCase() : "REPORT", kind: "headline", id: h.id, title: h.title,
        source: h.publisher, url: h.url, publishedAt: h.publishedAt, regionName: h.regionSlug ? nameOf.get(h.regionSlug) ?? null : null,
        translated: Boolean(h.language && h.language !== "en"), alsoReportedBy: h.alsoReportedBy });
    }
    const rawAlerts = (alertsRes.data ?? []) as unknown as { id: string; event_key: string | null; title: string; summary: string; severity: Severity; issuing_authority: string | null; published_at: string | null; verification: string | null; regions: { name: string; slug: string } | null }[];
    for (const a of groupAlerts(rawAlerts.map((a) => ({ ...a, eventKey: a.event_key, publishedAt: a.published_at, regionSlug: a.regions?.slug ?? null, verification: a.verification === "developing" ? "developing" as const : "confirmed" as const })), zones).slice(0, 10)) {
      items.push({ tag: a.verification === "developing" ? "DEVELOPING" : "ALERT", kind: "alert", id: a.id, title: a.title,
        source: a.issuing_authority, url: `/alerts/${a.id}`, publishedAt: a.publishedAt, regionName: a.regions?.name ?? null });
    }
    items.sort((x, y) => {
      const tx = x.publishedAt ? new Date(x.publishedAt).getTime() : 0;
      const ty = y.publishedAt ? new Date(y.publishedAt).getTime() : 0;
      return ty - tx;
    });
    const settings = ((settingsRes.data ?? []) as { last_ingest_ok_at: string | null }[])[0];
    return {
      items,
      zones: regionRows.filter((r) => r.covered).length,
      lastIngestOkAt: settings?.last_ingest_ok_at ?? null,
    };
  },
);

export interface HeadlinesFilters {
  region?: string | undefined;
  topic?: string | undefined;
  activity?: string | undefined;
  window?: string | undefined;
  lang?: "en" | "translated" | undefined;
  page: number;
}

export const listHeadlines = createServerFn({ method: "GET" })
  .inputValidator((input: unknown): HeadlinesFilters => {
    const q = (input ?? {}) as Partial<HeadlinesFilters>;
    return {
      region:
        typeof q.region === "string" && q.region.trim() ? q.region.trim() : undefined,
      topic: HEADLINE_TOPICS.includes(q.topic as string)
        ? (q.topic as string)
        : undefined,
      activity:
        q.activity === "any" || (typeof q.activity === "string" && q.activity in ACTIVITY_LABELS)
          ? q.activity
          : undefined,
      window: isWindow(q.window) ? q.window : undefined,
      lang: q.lang === "en" || q.lang === "translated" ? q.lang : undefined,
      page:
        Number.isFinite(Number(q.page)) && Number(q.page) > 0
          ? Math.floor(Number(q.page))
          : 0,
    };
  })
  .handler(
    async ({
      data,
    }): Promise<{ items: Headline[]; total: number; page: number; pageSize: number }> => {
      const supabase = await publicClient();
      const days = data.window && isWindow(data.window) ? WINDOWS[data.window] : 14;
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      const [heads, zr] = await Promise.all([
        supabase.from("headlines").select(HEADLINE_COLS).eq("kept", true).gt("published_at", since)
          .order("published_at", { ascending: false, nullsFirst: false }).limit(1000),
        supabase.from("regions").select("id,name,slug,parent_id").limit(5000),
      ]);
      if (heads.error || zr.error) throw new Error("Could not load headlines.");
      const zones = (zr.data ?? []).map((z) => ({ ...z, parentId: z.parent_id }));
      const tree = buildZoneTree(zones);
      const selected = zones.find((z) => z.slug === data.region);
      const slugs = new Set([data.region ?? "", ...(selected ? descendantsOf(tree, selected.id).map((z) => z.slug) : [])]);
      const all = groupHeadlines(((heads.data ?? []) as unknown as HeadlineRow[]).map(mapHeadline), zones).filter((h) => {
        const c = classifyHeadline(h.title);
        return (!data.region || h.regionSlugs.some((slug) => slugs.has(slug))) && (!data.topic || h.topic === data.topic)
          && (!data.lang || (data.lang === "en" ? h.language === "en" : h.language !== "en"))
          && (!data.activity || (data.activity === "any" ? Boolean(c) : c?.category === data.activity));
      });
      const from = data.page * PAGE_SIZE;
      return { items: all.slice(from, from + PAGE_SIZE), total: all.length, page: data.page, pageSize: PAGE_SIZE };
    },
  );
