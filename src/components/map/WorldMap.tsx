import { lazy, Suspense, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { MapLegend } from "../MapLegend";
import type { MapRegion } from "@/lib/alerts.types";

const WorldMapClient = lazy(() => import("./WorldMapLeaflet"));

export function WorldMap({
  regions,
  feedDelay,
}: {
  regions: MapRegion[];
  feedDelay: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div>
      <div className="relative overflow-hidden rounded-xl border border-border bg-muted">
        {mounted ? (
          <Suspense
            fallback={
              <div
                aria-hidden="true"
                className="h-[420px] w-full animate-pulse bg-muted sm:h-[520px]"
              />
            }
          >
            <WorldMapClient regions={regions} feedDelay={feedDelay} />
          </Suspense>
        ) : (
          <div aria-hidden="true" className="h-[420px] w-full bg-muted sm:h-[520px]" />
        )}
        <div className="absolute bottom-3 left-3 z-[700] max-w-[250px]">
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
