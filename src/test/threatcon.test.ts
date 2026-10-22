import { describe, expect, it } from "vitest";
import { computeThreatcon } from "@/lib/threatcon";
import type { MapRegion } from "@/lib/alerts.types";

function zone(over: Partial<MapRegion>): MapRegion {
  return {
    id: over.id ?? "z",
    parentId: null,
    name: "Zone",
    slug: "zone",
    isoCode: null,
    lat: 0,
    lng: 0,
    covered: true,
    activeAlerts: 0,
    topSeverity: null,
    latestAlerts: [],
    developingAlerts: 0,
    latestDeveloping: [],
    ...over,
  };
}

describe("Threatcon posture levels", () => {
  it("names the calmest posture MONITORED, never GUARDED", () => {
    const { level, counts } = computeThreatcon([zone({ id: "uk" }), zone({ id: "fr" })]);
    expect(level).toBe("MONITORED");
    expect(counts.MONITORED).toBe(2);
    expect(counts).not.toHaveProperty("GUARDED");
  });

  it("still reports the higher postures unchanged", () => {
    expect(
      computeThreatcon([zone({ id: "uk", activeAlerts: 1, topSeverity: "critical" })]).level,
    ).toBe("CRITICAL");
    expect(
      computeThreatcon([zone({ id: "uk", activeAlerts: 1, topSeverity: "high" })]).level,
    ).toBe("HIGH");
    expect(
      computeThreatcon([zone({ id: "uk", activeAlerts: 1, topSeverity: "moderate" })]).level,
    ).toBe("ELEVATED");
  });
});
