import type { MapRegion, Severity } from "./alerts.types";

export type ThreatconLevel = "CRITICAL" | "HIGH" | "ELEVATED" | "MONITORED";

const RANK: Record<Severity, number> = { info: 0, low: 1, moderate: 2, high: 3, critical: 4 };

/** Global posture = highest active severity across top-level monitored zones. */
export function computeThreatcon(regions: MapRegion[]) {
  const zones = regions.filter((r) => !r.parentId && r.covered);
  const counts: Record<ThreatconLevel, number> = { CRITICAL: 0, HIGH: 0, ELEVATED: 0, MONITORED: 0 };
  for (const z of zones) {
    const rank = z.activeAlerts > 0 && z.topSeverity ? RANK[z.topSeverity] : 0;
    if (rank >= 4) counts.CRITICAL++;
    else if (rank === 3) counts.HIGH++;
    else if (rank === 2) counts.ELEVATED++;
    else counts.MONITORED++;
  }
  const level: ThreatconLevel = counts.CRITICAL
    ? "CRITICAL"
    : counts.HIGH
      ? "HIGH"
      : counts.ELEVATED
        ? "ELEVATED"
        : "MONITORED";
  return { level, counts };
}
