import { describe, expect, it } from "vitest";
import { clusterAlertStatus } from "@/lib/alerts.types";

describe("city cluster alert severity", () => {
  it("uses the most serious active alert regardless of city count or alert volume", () => {
    expect(clusterAlertStatus([
      { activeAlerts: 20, topSeverity: "low" },
      { activeAlerts: 1, topSeverity: "critical" },
      { activeAlerts: 2, topSeverity: "high" },
    ])).toEqual({ activeAlerts: 23, topSeverity: "critical", style: "critical" });
  });
  it("does not colour a group for a severity without active alerts", () => {
    expect(clusterAlertStatus([
      { activeAlerts: 0, topSeverity: "critical" },
      { activeAlerts: 1, topSeverity: "moderate" },
    ]).style).toBe("moderate");
  });
  it("keeps a group without active alerts clear", () => {
    expect(clusterAlertStatus([{ activeAlerts: 0, topSeverity: null }])).toEqual({ activeAlerts: 0, topSeverity: null, style: "clear" });
  });
});