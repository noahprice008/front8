import { lazy, Suspense, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { MapLegend } from "../MapLegend";
import type { MapRegion } from "@/lib/alerts.types";
import type { ZoneClimate } from "@/lib/climate.functions";

const WorldMapClient = lazy(() => import("./WorldMapLeaflet"));

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
  useEffect(() => setMounted(true), []);

  return (
    <div>
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
            <WorldMapClient regions={regions} feedDelay={feedDelay} climate={climate ?? []} />
          </Suspense>
        ) : (
          <div aria-hidden="true" className="h-[62svh] min-h-[380px] w-full bg-muted sm:h-[520px] sm:min-h-0 lg:h-[680px]" />
        )}
        <div className="absolute bottom-2 left-2 z-[700] max-w-[220px] sm:bottom-3 sm:left-3 sm:max-w-[250px]">
          <MapLegend />
        </div>
      </div>
      <div className="mt-3 flex justify-end">
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
