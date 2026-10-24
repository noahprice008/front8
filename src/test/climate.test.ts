import { describe, expect, it } from "vitest";
import { classifyHeadline, dedupeKey, postureFor, resolveRegionSlug, trendFor } from "@/lib/climate";

describe("climate rules", () => {
  it("classifies a protest headline as protest", () => {
    expect(classifyHeadline("Pro-Palestinian protest marches through Paris")?.category).toBe("protest");
  });
  it("adds the institution bonus for synagogue mentions", () => {
    const c = classifyHeadline("Arson attempt at synagogue");
    expect(c?.category).toBe("violence");
    expect(c?.weight).toBe(7);
  });
  it("ignores commentary without on-the-ground activity", () => {
    expect(classifyHeadline("Dalhousie Centre for Jewish Studies blossoms")).toBeNull();
  });
  it("activity alone never makes a zone CRITICAL", () => {
    expect(postureFor({ activityWeights: Array(20).fill(5), alertSeverities: [], developingCount: 0 })).toBe("HIGH");
  });
  it("two reports alone never reach HIGH", () => {
    expect(postureFor({ activityWeights: [7, 7], alertSeverities: [], developingCount: 0 })).toBe("ELEVATED");
  });
  it("a confirmed critical alert makes a zone CRITICAL", () => {
    expect(postureFor({ activityWeights: [], alertSeverities: ["critical"], developingCount: 0 })).toBe("CRITICAL");
  });
  it("score 4 is ELEVATED, below is MONITORED", () => {
    expect(postureFor({ activityWeights: [2, 2], alertSeverities: [], developingCount: 0 })).toBe("ELEVATED");
    expect(postureFor({ activityWeights: [2, 1], alertSeverities: [], developingCount: 0 })).toBe("MONITORED");
  });
  it("trend uses a ±25% band", () => {
    expect(trendFor(5, 4)).toBe("increasing");
    expect(trendFor(4, 4)).toBe("stable");
    expect(trendFor(3, 4)).toBe("decreasing");
  });
  it("resolves global headlines by place name", () => {
    expect(resolveRegionSlug("global", "Woman stabs Jewish man in Midtown NYC")).toBe("new-york-city");
    expect(resolveRegionSlug("france", "anything")).toBe("france");
  });
  it("dedupes the same story from different publishers", () => {
    expect(dedupeKey("French Jews forced into hiding – Fox News")).toBe(dedupeKey("French Jews forced into hiding"));
  });
});
