import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import type { LayerGroup, Map as LeafletMap, TileLayer } from "leaflet";
import { markerStyleFor, type MapRegion, type MarkerStyle } from "@/lib/alerts.types";
import type { ZoneClimate } from "@/lib/climate.functions";
import { ACTIVITY_LABELS, type ActivityCategory } from "@/lib/climate";

const ESRI = "https://server.arcgisonline.com/ArcGIS/rest/services";
type Basemap = "tactical" | "light" | "satellite" | "terrain";

const BASEMAPS: Record<Basemap, { label: string; url: string; labels?: string }> = {
  tactical: { label: "Tactical", url: `${ESRI}/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`, labels: `${ESRI}/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}` },
  light: { label: "Light", url: `${ESRI}/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}`, labels: `${ESRI}/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}` },
  satellite: { label: "Satellite", url: `${ESRI}/World_Imagery/MapServer/tile/{z}/{y}/{x}`, labels: `${ESRI}/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}` },
  terrain: { label: "Terrain", url: `${ESRI}/World_Topo_Map/MapServer/tile/{z}/{y}/{x}` },
};

const HOME: [number, number] = [31, 12];
const HOME_ZOOM = 2;
/** Phones show ~140° of longitude at zoom 2, so centre on the Atlantic to keep North America and Europe in view. */
const MOBILE_HOME: [number, number] = [42, -32];
const homeView = (): [number, number] => (typeof window !== "undefined" && window.innerWidth < 640 ? MOBILE_HOME : HOME);

const HTML_ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const escapeHtml = (v: string) => v.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c] ?? c);

function radiusFor(style: MarkerStyle, n: number): number {
  switch (style) {
    case "critical":
    case "high":
      return Math.min(18 + n * 2.5, 38);
    case "moderate":
    case "elevated":
      return Math.min(16 + n * 2, 32);
    case "clear":
      return 13;
    default:
      return 14;
  }
}

function popupHtml(region: MapRegion, zone?: ZoneClimate): string {
  const name = escapeHtml(region.name);
  const coords =
    region.lat != null && region.lng != null
      ? `<p class="leaflet-bubble-coords">${region.lat.toFixed(2)}°, ${region.lng.toFixed(2)}°</p>`
      : "";
  if (!region.covered) return `<strong>${name}</strong>${coords}<p class="leaflet-bubble-note">Not yet monitored.</p>`;
  const parts: string[] = [];
  if (zone) {
    parts.push(`<p class="leaflet-bubble-posture leaflet-bubble-posture--${zone.posture.toLowerCase()}">POSTURE: ${zone.posture} · ${zone.trend.toUpperCase()}</p>`);
    if (zone.activityCount > 0) {
      const cats = (Object.entries(zone.byCategory) as [ActivityCategory, number][]).map(([c, n]) => `${escapeHtml(ACTIVITY_LABELS[c])} ${n}`).join(" · ");
      parts.push(`<p class="leaflet-bubble-note">${zone.activityCount} activity report${zone.activityCount === 1 ? "" : "s"}: ${cats}</p>`);
    }
  }
  if (zone && zone.protestCount > 0) {
    parts.push(`<p class="leaflet-bubble-protest">PROTEST / RALLY ACTIVITY: ${zone.protestCount} report${zone.protestCount === 1 ? "" : "s"}</p><ul>`);
    for (const p of zone.protests.slice(0, 3)) parts.push(`<li><a href="${escapeHtml(p.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(p.title)}</a>${p.publisher ? `<p class="leaflet-bubble-note">${escapeHtml(p.publisher)}</p>` : ""}</li>`);
    parts.push("</ul>");
  }
  if (region.activeAlerts > 0) {
    parts.push(`<p class="leaflet-bubble-note">${region.activeAlerts} active alert${region.activeAlerts === 1 ? "" : "s"} · top severity: ${escapeHtml(region.topSeverity ?? "info")}</p>`);
    if (region.latestAlerts.length > 0) {
      parts.push("<ul>");
      for (const a of region.latestAlerts) parts.push(`<li><a href="/alerts/${encodeURIComponent(a.id)}">${escapeHtml(a.title)}</a>${(a.reportCount ?? 1) > 1 ? `<p class="leaflet-bubble-note">${a.reportCount} reports combined</p>` : ""}${a.sources?.length ? `<p class="leaflet-bubble-note">Sources: ${a.sources.map((source) => `<a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.publisher ?? "Source")}</a>`).join(", ")}</p>` : ""}</li>`);
      parts.push("</ul>");
    }
  } else {
    parts.push('<p class="leaflet-bubble-note">No incidents reported in the last 7 days. No reports does not guarantee safety.</p>');
  }
  if (region.developingAlerts > 0) {
    parts.push(`<p class="leaflet-bubble-note">${region.developingAlerts} developing report${region.developingAlerts === 1 ? "" : "s"}, unconfirmed</p>`);
    if (region.latestDeveloping.length > 0) {
      parts.push("<ul>");
      for (const a of region.latestDeveloping) parts.push(`<li><a href="/alerts/${encodeURIComponent(a.id)}">${escapeHtml(a.title)}</a>${(a.reportCount ?? 1) > 1 ? `<p class="leaflet-bubble-note">${a.reportCount} reports combined</p>` : ""}${a.sources?.length ? `<p class="leaflet-bubble-note">Sources: ${a.sources.map((source) => `<a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.publisher ?? "Source")}</a>`).join(", ")}</p>` : ""}</li>`);
      parts.push("</ul>");
    }
  }
  if (region.descendantCount > 0) parts.push(`<p class="leaflet-bubble-note">Includes ${region.descendantCount} area${region.descendantCount === 1 ? "" : "s"}</p>`);
  parts.push(`<p class="leaflet-bubble-note"><a href="/region/${encodeURIComponent(region.slug)}">Open zone briefing</a></p>`);
  parts.push(`<p class="leaflet-bubble-note"><a href="/alerts?region=${encodeURIComponent(region.slug)}">View all alerts for ${name}</a></p>`);
  return `<strong>${name}</strong>${coords}${parts.join("")}`;
}

function isDescendant(all: MapRegion[], r: MapRegion, ancestorId: string): boolean {
  const byId = new Map(all.map((x) => [x.id, x]));
  let cur = r.parentId;
  for (let i = 0; cur && i < 10; i++) {
    if (cur === ancestorId) return true;
    cur = byId.get(cur)?.parentId ?? null;
  }
  return false;
}

export default function WorldMapClient({ regions, feedDelay, climate }: { regions: MapRegion[]; feedDelay: boolean; climate: ZoneClimate[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const tilesRef = useRef<TileLayer[]>([]);
  const [ready, setReady] = useState(false);
  const [basemap, setBasemap] = useState<Basemap>("tactical");
  const [cursor, setCursor] = useState<string>("--");
  const [zoom, setZoom] = useState(HOME_ZOOM);
  const [full, setFull] = useState(false);
  const [showClimate, setShowClimate] = useState(true);
  const [protestsOnly, setProtestsOnly] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      const container = containerRef.current;
      if (cancelled || !container) return;

      const map = L.map(container, {
        scrollWheelZoom: "center",
        zoomControl: false,
        worldCopyJump: true,
        minZoom: 2,
        maxZoom: 18,
        zoomSnap: 0.5,
        attributionControl: false,
      }).setView(homeView(), HOME_ZOOM);
      // Only zoom with the wheel once the user clicks the map, so the page still scrolls.
      map.scrollWheelZoom.disable();
      map.on("click", () => map.scrollWheelZoom.enable());
      map.on("mouseout", () => map.scrollWheelZoom.disable());
      mapRef.current = map;
      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.control.scale({ position: "bottomright", imperial: false }).addTo(map);

      map.on("mousemove", (e) => setCursor(`${e.latlng.lat.toFixed(3)}°, ${e.latlng.lng.toFixed(3)}°`));
      map.on("mouseout", () => setCursor("--"));

      const DETAIL_ZOOM = 5;
      (window as unknown as { L: typeof L }).L = L;
      await import("leaflet.markercluster");
      if (cancelled) return;
      const zoneById = new Map(climate.map((z) => [z.regionId, z]));
      const overview: LayerGroup = L.layerGroup();
      // Cities and areas are always on the map; nearby ones cluster at wide zoom and split as you zoom in.
      const detail: LayerGroup = (L as unknown as { markerClusterGroup: (o: object) => LayerGroup }).markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: (z: number) => (z <= 3 ? 34 : z <= 5 ? 24 : 14),
        spiderfyOnMaxZoom: true,
        iconCreateFunction: (c: { getChildCount: () => number }) =>
          L.divIcon({ className: "map-bubble-anchor", html: `<div class="map-cluster">${c.getChildCount()}</div>`, iconSize: [30, 30] }),
      });
      for (const region of regions) {
        if (region.lat == null || region.lng == null) continue;
        const sub = region.depth > 0;
        const group = sub ? detail : overview;
        const zone = zoneById.get(region.id);
        // A country split into cities only keeps its own bubble for reports filed on the country itself.
        if (!sub && region.descendantCount > 0 && (region.ownReports ?? 0) === 0) continue;
        if (protestsOnly && !(zone && zone.protestCount > 0)) continue;
        const realStyle = markerStyleFor(region);
        const protests = zone?.protestCount ?? 0;
        const climateStyle =
          showClimate && zone && region.activeAlerts === 0 && (zone.posture !== "MONITORED" || protests > 0)
            ? zone.posture === "HIGH" || zone.posture === "CRITICAL" ? "high" : "moderate"
            : null;
        const style: string = feedDelay ? "stale" : climateStyle ?? realStyle;
        const base = radiusFor(realStyle, region.activeAlerts) + (showClimate && zone ? Math.min(zone.activityCount, 10) * 0.6 : 0);
        const radius = sub ? Math.max(9, base * 0.7) : base;
        const size = radius * 2;
        const posture = showClimate && zone && zone.posture !== "MONITORED" ? `<span class="map-posture map-posture--${zone.posture.toLowerCase()}" aria-hidden="true"></span>` : "";
        const activityBadge = showClimate && zone && zone.activityCount > 0 && region.activeAlerts === 0 ? `<span class="map-bubble-count">${zone.activityCount}</span>` : "";
        const devRing = region.developingAlerts > 0 ? '<span class="map-bubble-dev" aria-hidden="true"></span>' : "";
        const protestBadge = protests > 0 ? `<span class="map-protest-badge" title="${protests} protest / rally report${protests === 1 ? "" : "s"}">${protests}</span>` : "";
        const subBadge = !sub && region.descendantCount > 0 ? `<span class="map-subzone-badge" title="${region.descendantCount} areas, click to zoom">${region.descendantCount}</span>` : "";
        const icon = L.divIcon({
          className: "map-bubble-anchor",
          html: `<div class="map-bubble-wrap" style="width:${size}px;height:${size}px">${posture}${devRing}<div class="map-bubble map-bubble--${style}" style="width:${size}px;height:${size}px" aria-hidden="true">${region.activeAlerts > 0 ? `<span class="map-bubble-count">${region.activeAlerts}</span>` : activityBadge}</div>${protestBadge}${subBadge}</div>`,
          iconSize: [size, size],
          iconAnchor: [radius, radius],
          popupAnchor: [0, -radius],
        });
        const lat = region.lat;
        const lng = region.lng;
        const marker = L.marker([lat, lng], {
          icon,
          keyboard: true,
          title: feedDelay ? `${region.name} (feed delayed)` : protests > 0 ? `${region.name} (protest activity)` : region.name,
        })
          .addTo(group)
          .bindPopup(popupHtml(region, zone), { maxWidth: 320 });
        marker.on("click", (e) => {
          const t = (e as unknown as { originalEvent?: MouseEvent }).originalEvent?.target as HTMLElement | undefined;
          if (!t?.closest?.(".map-subzone-badge")) return;
          marker.closePopup();
          const pts = regions
            .filter((r) => r.lat != null && r.lng != null && isDescendant(regions, r, region.id))
            .map((r) => [r.lat!, r.lng!] as [number, number]);
          if (pts.length) map.flyToBounds(L.latLngBounds([[lat, lng], ...pts]).pad(0.3), { maxZoom: 8, duration: 0.8 });
        });
        marker.on("dblclick", () => map.flyTo([lat, lng], sub ? 8 : 6, { duration: 0.8 }));
      }
      overview.addTo(map);
      detail.addTo(map);
      const syncZoom = () => setZoom(map.getZoom());
      syncZoom();
      map.on("zoomend", syncZoom);
      setReady(true);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      tilesRef.current = [];
      setReady(false);
    };
  }, [regions, feedDelay, climate, showClimate, protestsOnly]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    (async () => {
      const L = (await import("leaflet")).default;
      tilesRef.current.forEach((t) => map.removeLayer(t));
      const cfg = BASEMAPS[basemap];
      const layers = [L.tileLayer(cfg.url, { maxZoom: 19, maxNativeZoom: 17 })];
      if (cfg.labels) layers.push(L.tileLayer(cfg.labels, { maxZoom: 19, maxNativeZoom: 16, pane: "overlayPane" }));
      layers.forEach((l) => l.addTo(map));
      tilesRef.current = layers;
    })();
  }, [basemap, ready]);

  useEffect(() => {
    const t = setTimeout(() => mapRef.current?.invalidateSize(), 50);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setFull(false);
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [full]);

  const btn =
    "rounded-sm px-2 py-1 font-display text-[0.625rem] sm:px-2.5 sm:text-[0.6875rem] font-semibold uppercase tracking-wider transition-colors";

  return (
    <div className={full ? "fixed inset-0 z-[1000] bg-background" : "relative"}>
      <div
        ref={containerRef}
        className={`tactical-map w-full ${full ? "h-full" : "h-[62svh] min-h-[380px] sm:h-[520px] sm:min-h-0 lg:h-[680px]"}`}
        role="application"
        aria-label="World map showing monitored regions and active alerts. The same information is available as a text list."
      />
      <div className="pointer-events-none absolute inset-0 z-[600] tactical-grid" aria-hidden="true" />

      <div className="absolute right-2 top-2 z-[700] flex flex-col items-end gap-1.5 sm:right-3 sm:top-3 sm:gap-2">
        <button
          type="button"
          aria-expanded={menuOpen}
          aria-label="Map controls"
          onClick={() => setMenuOpen((v) => !v)}
          className="tactical-panel flex h-8 items-center gap-1.5 px-2.5 font-display text-[0.625rem] font-semibold uppercase tracking-wider text-foreground sm:hidden"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M12 3 2 8l10 5 10-5-10-5Z" /><path d="m2 16 10 5 10-5" /></svg>
          Layers
        </button>
        <div className={`${menuOpen ? "flex" : "hidden"} tactical-panel flex-wrap justify-end gap-1 p-1 sm:flex`} role="group" aria-label="Map style">
          {(Object.keys(BASEMAPS) as Basemap[]).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={basemap === k}
              onClick={() => setBasemap(k)}
              className={`${btn} ${basemap === k ? "bg-brand-accent text-brand-accent-foreground" : "text-foreground hover:bg-accent"}`}
            >
              {BASEMAPS[k].label}
            </button>
          ))}
        </div>
        <div className={`${menuOpen ? "flex" : "hidden"} tactical-panel flex-wrap justify-end gap-1 p-1 sm:flex`}>
          <button type="button" aria-pressed={showClimate} onClick={() => setShowClimate((v) => !v)} className={`${btn} ${showClimate ? "bg-brand-accent text-brand-accent-foreground" : "text-foreground hover:bg-accent"}`}>
            Climate layer
          </button>
          <button type="button" aria-pressed={protestsOnly} onClick={() => setProtestsOnly((v) => !v)} className={`${btn} ${protestsOnly ? "bg-brand-accent text-brand-accent-foreground" : "text-foreground hover:bg-accent"}`}>
            Protests only
          </button>
          <button type="button" className={`${btn} text-foreground hover:bg-accent`} onClick={() => mapRef.current?.flyTo(homeView(), HOME_ZOOM, { duration: 0.8 })}>
            Reset view
          </button>
          <button type="button" className={`${btn} text-foreground hover:bg-accent`} aria-pressed={full} onClick={() => setFull((f) => !f)}>
            {full ? "Exit full screen" : "Full screen"}
          </button>
        </div>
      </div>

      <div className="tactical-panel absolute left-3 top-3 z-[700] hidden px-2.5 sm:block py-1.5 font-mono text-[0.6875rem] text-foreground" aria-live="off">
        <span className="text-muted-foreground">POS </span>
        {cursor}
        <span className="ml-3 text-muted-foreground">ZOOM </span>
        {zoom.toFixed(1)}
      </div>
      {full && (
        <p className="tactical-panel absolute bottom-3 left-1/2 hidden sm:block z-[700] -translate-x-1/2 px-3 py-1 text-[0.6875rem] text-muted-foreground">
          Press Esc to exit · Double-click a bubble to zoom in
        </p>
      )}
    </div>
  );
}
