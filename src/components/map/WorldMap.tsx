import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { MapLegend } from "../MapLegend";
import type { MapRegion } from "@/lib/alerts.types";
import type { ZoneClimate } from "@/lib/climate.functions";

const WorldMapClient = lazy(() => import("./WorldMapLeaflet"));

type Group = "diaspora" | "travel";
const GROUPS: { id: Group; label: string }[] = [
  { id: "diaspora", label: "Jewish communities" },
  { id: "travel", label: "Israeli travel destinations" },
];

export function WorldMap({
  regions,
  feedDelay,
  climate,
}: {
  regions: MapRegion[];
  feedDelay: boolean;
  climate?: ZoneClimate[];
}) {
  const [mounted, setMounted] = useState(false);
  const [group, setGroup] = useState<Group>("diaspora");
  useEffect(() => setMounted(true), []);
  const shown = useMemo(() => regions.filter((r) => r.zoneGroup === group), [regions, group]);

  return (
    <div>
      <div className="mb-2 flex justify-start">
        <div className="tactical-panel inline-flex gap-1 p-1" role="group" aria-label="Zone group">
          {GROUPS.map((g) => (
            <button
              key={g.id}
              type="button"
              aria-pressed={group === g.id}
              onClick={() => setGroup(g.id)}
              className={`rounded-sm px-2.5 py-1 font-display text-[0.6875rem] font-semibold uppercase tracking-wider transition-colors ${group === g.id ? "bg-brand-accent text-brand-accent-foreground" : "text-foreground hover:bg-accent"}`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>
      <div className="relative overflow-hidden -mx-4 border-y border-border bg-muted sm:mx-0 sm:rounded-xl sm:border">
        {mounted ? (
          <Suspense
            fallback={
              <div
                aria-hidden="true"
                className="h-[62svh] min-h-[380px] w-full animate-pulse bg-muted sm:h-[520px] sm:min-h-0 lg:h-[680px]"
              />
            }
          >
            <WorldMapClient regions={shown} feedDelay={feedDelay} climate={climate ?? []} />
          </Suspense>
        ) : (
          <div aria-hidden="true" className="h-[62svh] min-h-[380px] w-full bg-muted sm:h-[520px] sm:min-h-0 lg:h-[680px]" />
        )}
        <div className="absolute bottom-2 left-2 z-[700] max-w-[220px] sm:bottom-3 sm:left-3 sm:max-w-[250px]">
          <MapLegend />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">No reports does not guarantee safety.</p>
        <Link
          to="/alerts"
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          View as list
        </Link>
      </div>
    </div>
  );
}
