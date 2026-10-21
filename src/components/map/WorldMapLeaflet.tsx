import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { LayerGroup, Map as LeafletMap, TileLayer } from "leaflet";
import { markerStyleFor, type MapRegion, type MarkerStyle } from "@/lib/alerts.types";

const TILE_URLS = {
  light:
    "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
  dark:
    "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
};
const TILE_ATTRIBUTION = "&copy; Esri";

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c] ?? c);
}

function radiusFor(style: MarkerStyle, activeAlerts: number): number {
  switch (style) {
    case "critical":
    case "high":
      return Math.min(18 + activeAlerts * 2.5, 38);
    case "moderate":
    case "elevated":
      return Math.min(16 + activeAlerts * 2, 32);
    case "clear":
      return 13;
    default:
      return 14;
  }
}

function popupHtml(region: MapRegion): string {
  const name = escapeHtml(region.name);
  if (!region.covered) {
    return `<strong>${name}</strong><p class="leaflet-bubble-note">Not yet monitored.</p>`;
  }

  const parts: string[] = [];
  if (region.activeAlerts > 0) {
    parts.push(
      `<p class="leaflet-bubble-note">${region.activeAlerts} active alert${
        region.activeAlerts === 1 ? "" : "s"
      } · top severity: ${escapeHtml(region.topSeverity ?? "info")}</p>`,
    );
    if (region.latestAlerts.length > 0) {
      parts.push("<ul>");
      for (const alert of region.latestAlerts) {
        parts.push(
          `<li><a href="/alerts/${encodeURIComponent(alert.id)}">${escapeHtml(alert.title)}</a></li>`,
        );
      }
      parts.push("</ul>");
    }
  } else {
    parts.push(
      '<p class="leaflet-bubble-note">No current alerts. This does not guarantee safety.</p>',
      '<p class="leaflet-bubble-note">Travel advisories are listed on the <a href="/travel">Travel advice</a> page.</p>',
    );
  }
  parts.push(
    `<p class="leaflet-bubble-note"><a href="/alerts?region=${encodeURIComponent(region.slug)}">View all alerts for ${name}</a></p>`,
  );
  return `<strong>${name}</strong>${parts.join("")}`;
}

export default function WorldMapClient({
  regions,
  feedDelay,
}: {
  regions: MapRegion[];
  feedDelay: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    let cancelled = false;
    let observer: MutationObserver | null = null;

    (async () => {
      const L = (await import("leaflet")).default;
      const container = containerRef.current;
      if (cancelled || !container) return;

      const map = L.map(container, {
        scrollWheelZoom: false,
        zoomControl: false,
        worldCopyJump: true,
        minZoom: 2,
        maxZoom: 12,
        attributionControl: false,
      }).setView([31, 12], 2);
      mapRef.current = map;
      L.control.zoom({ position: "bottomright" }).addTo(map);

      const makeTiles = (dark: boolean): TileLayer =>
        L.tileLayer(dark ? TILE_URLS.dark : TILE_URLS.light, {
          attribution: TILE_ATTRIBUTION,
          subdomains: "abcd",
          maxZoom: 19,
        });

      let tiles = makeTiles(document.documentElement.classList.contains("dark"));
      tiles.addTo(map);

      observer = new MutationObserver(() => {
        map.removeLayer(tiles);
        tiles = makeTiles(document.documentElement.classList.contains("dark"));
        tiles.addTo(map);
      });
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });

      const DETAIL_ZOOM = 4;
      const parentsWithChildren = new Set(
        regions.map((r) => r.parentId).filter((id): id is string => !!id),
      );
      const overview: LayerGroup = L.layerGroup();
      const detail: LayerGroup = L.layerGroup();
      for (const region of regions) {
        const markers = region.parentId
          ? detail
          : parentsWithChildren.has(region.id)
            ? overview
            : null;
        if (region.lat == null || region.lng == null) continue;
        const realStyle = markerStyleFor(region);
        const style: string = feedDelay ? "stale" : realStyle;
        const radius = radiusFor(realStyle, region.activeAlerts);
        const size = radius * 2;
        const icon = L.divIcon({
          className: "map-bubble-anchor",
          html: `<div class="map-bubble map-bubble--${style}" style="width:${size}px;height:${size}px" aria-hidden="true">${region.activeAlerts > 0 ? `<span class="map-bubble-count">${region.activeAlerts}</span>` : ""}</div>`,
          iconSize: [size, size],
          iconAnchor: [radius, radius],
          popupAnchor: [0, -radius],
        });
        L.marker([region.lat, region.lng], {
          icon,
          keyboard: true,
          title: feedDelay ? `${region.name} (feed delayed)` : region.name,
        })
          .addTo(markers ?? map)
          .bindPopup(popupHtml(region), { maxWidth: 300 });
      }
      const syncZoom = () => {
        const zoomedIn = map.getZoom() >= DETAIL_ZOOM;
        if (zoomedIn) {
          map.removeLayer(overview);
          detail.addTo(map);
        } else {
          map.removeLayer(detail);
          overview.addTo(map);
        }
      };
      syncZoom();
      map.on("zoomend", syncZoom);
    })();

    return () => {
      cancelled = true;
      observer?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [regions, feedDelay]);

  return (
    <div
      ref={containerRef}
      className="h-[420px] w-full sm:h-[520px]"
      role="application"
      aria-label="World map showing monitored regions and active alerts. The same information is available as a text list."
    />
  );
}
