import { describe, expect, it } from "vitest";
import { ancestorsOf, buildZoneTree, bySeverityThenName, descendantsOf, rollupStatus } from "@/lib/zones";
import type { Severity } from "@/lib/alerts.types";

const z = (id: string, parentId: string | null) => ({ id, parentId, name: id, slug: id });
const tree = buildZoneTree([z("uk", null), z("england", "uk"), z("london", "england"), z("fr", null)]);
const own: Record<string, { activeAlerts: number; developingAlerts: number; topSeverity: Severity | null }> = {
  uk: { activeAlerts: 0, developingAlerts: 0, topSeverity: null },
  england: { activeAlerts: 1, developingAlerts: 0, topSeverity: "low" },
  london: { activeAlerts: 2, developingAlerts: 1, topSeverity: "high" },
  fr: { activeAlerts: 0, developingAlerts: 0, topSeverity: null },
};

describe("zone tree", () => {
  it("collects descendants three levels deep", () => {
    expect(descendantsOf(tree, "uk").map((d) => d.id).sort()).toEqual(["england", "london"]);
  });
  it("builds the breadcrumb root first", () => {
    expect(ancestorsOf(tree, "london").map((a) => a.id)).toEqual(["uk", "england"]);
  });
  it("rolls up counts and highest severity from all descendants", () => {
    expect(rollupStatus(tree, "uk", (n) => own[n.id]!)).toEqual({ activeAlerts: 3, developingAlerts: 1, topSeverity: "high" });
  });
  it("sorts by severity then name", () => {
    const list = [
      { name: "B", topSeverity: null, activeAlerts: 0 },
      { name: "A", topSeverity: null, activeAlerts: 0 },
      { name: "C", topSeverity: "high" as Severity, activeAlerts: 1 },
    ].sort(bySeverityThenName);
    expect(list.map((l) => l.name)).toEqual(["C", "A", "B"]);
  });
});
