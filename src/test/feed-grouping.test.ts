import { describe, expect, it } from "vitest";
import { groupAlerts, groupHeadlines, keepHeadline, similarWords, titleWords, wordSimilarity } from "@/lib/feed-grouping";
import { HEADLINE_EXCLUSIONS, INCIDENT_MARKERS } from "@/lib/feed.config";
import type { AlertListItem, Headline } from "@/lib/alerts.types";

const zones = [
  { id: "us", name: "US", slug: "us", parentId: null },
  { id: "nyc", name: "NYC", slug: "nyc", parentId: "us" },
  { id: "la", name: "LA", slug: "la", parentId: "us" },
  { id: "fr", name: "France", slug: "fr", parentId: null },
];
const headline = (id: string, changes: Partial<Headline> = {}): Headline => ({ id, title: "Chabad rabbi attacked in NYC Diamond District", url: `https://example.com/${id}`, publisher: id, publishedAt: "2026-10-24T00:00:00Z", regionSlug: "nyc", topic: null, ...changes });
const alert = (id: string, changes: Partial<AlertListItem> = {}): AlertListItem => ({ ...headline(id), summary: "Man assaults Chabad rabbi in New York Diamond District", severity: "moderate", verification: "developing", category: "antisemitic_incident", tier: "verified_news", issuingAuthority: null, autoPublished: true, expiresAt: "2026-10-30T00:00:00Z", lastReviewedAt: null, regionName: "NYC", regionSlug: "nyc", ...changes });

describe("feed grouping", () => {
  it("normalises case, accents, publisher suffixes, punctuation, stop words and stems", () => {
    expect(titleWords("THE cafés attacked synagogues - BBC")).toEqual(new Set(["caf", "attack", "synagogu"]));
  });
  it("computes Jaccard similarity without using URLs", () => {
    expect(wordSimilarity(new Set(["a", "b", "c"]), new Set(["b", "c", "d"]))).toBe(0.5);
    expect(similarWords(new Set(["a", "b", "c"]), new Set(["b", "c", "d"]), 0.55)).toBe(false);
    expect(similarWords(new Set(["a", "b", "c"]), new Set(["b", "c", "d"]), 0.5)).toBe(true);
  });
  it("accepts almost complete containment of a meaningful title", () => {
    expect(similarWords(new Set(["rabbi", "attack", "diamond"]), new Set(["rabbi", "attack", "diamond", "district", "new", "york"]), 0.55)).toBe(true);
    expect(similarWords(new Set(["rabbi"]), new Set(["rabbi", "school", "open"]), 0.55)).toBe(false);
  });
  it("groups headlines within 72 hours across a parent/child and picks newest", () => {
    const groups = groupHeadlines([headline("BBC", { publishedAt: "2026-10-21T00:00:00Z", regionSlug: "us" }), headline("CNN")], zones);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.id).toBe("CNN");
    expect(groups[0]?.alsoReportedBy).toEqual([{ publisher: "BBC", url: "https://example.com/BBC" }]);
  });
  it("keeps different zone families and siblings separate", () => {
    expect(groupHeadlines([headline("1"), headline("2", { regionSlug: "fr" }), headline("3", { regionSlug: "la" })], zones)).toHaveLength(3);
  });
  it("keeps headlines beyond 72 hours separate", () => {
    expect(groupHeadlines([headline("1"), headline("2", { publishedAt: "2026-10-20T23:59:59Z" })], zones)).toHaveLength(2);
  });
  it("does not allow a parent or timestamp bridge to merge incompatible members", () => {
    expect(groupHeadlines([headline("1"), headline("2", { regionSlug: "us" }), headline("3", { regionSlug: "la" })], zones)).toHaveLength(2);
    expect(groupHeadlines([headline("1"), headline("2", { publishedAt: "2026-10-22T00:00:00Z" }), headline("3", { publishedAt: "2026-10-20T00:00:00Z" })], zones)).toHaveLength(2);
  });
  it("never repeats a publisher regardless of case", () => {
    const groups = groupHeadlines([headline("a", { publisher: "BBC" }), headline("b", { publisher: "bbc" }), headline("c", { publisher: "CNN" })], zones);
    expect(groups[0]?.alsoReportedBy.map((s) => s.publisher)).toEqual(["CNN"]);
  });
  it("combines the NYC Chabad incident once using severity, confirmation, earliest date and unique sources", () => {
    const raw = [alert("a", { title: "NYC Diamond District Chabad rabbi attacked", sources: [{ publisher: "BBC", url: "https://bbc.com/a" }] }), alert("b", { title: "Chabad rabbi attacked in NYC Diamond District - CNN", severity: "high", verification: "confirmed", publishedAt: "2026-10-23T00:00:00Z", sources: [{ publisher: "bbc", url: "https://bbc.com/b" }, { publisher: "CNN", url: "https://cnn.com/a" }] })];
    const groups = groupAlerts(raw, zones);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({ severity: "high", verification: "confirmed", publishedAt: "2026-10-23T00:00:00Z", reportCount: 2 });
    expect(groups[0]?.sources).toHaveLength(2);
    expect(raw[0]?.severity).toBe("moderate");
  });
  it("merges by event key only inside the zone and time boundaries", () => {
    expect(groupAlerts([alert("a", { eventKey: "event" }), alert("b", { title: "Completely different wording", summary: "Other text", eventKey: "event" })], zones)).toHaveLength(1);
    expect(groupAlerts([alert("a", { eventKey: "event" }), alert("b", { eventKey: "event", regionSlug: "fr" })], zones)).toHaveLength(2);
    expect(groupAlerts([alert("a", { eventKey: "event" }), alert("b", { eventKey: "event", publishedAt: "2026-10-20T00:00:00Z" })], zones)).toHaveLength(2);
  });
  it("can group alerts by summary similarity", () => {
    expect(groupAlerts([alert("a", { title: "Breaking update" }), alert("b", { title: "Another incident announcement" })], zones)).toHaveLength(1);
  });
  it("hides exclusions only without incident markers and never hides alerts", () => {
    for (const pattern of HEADLINE_EXCLUSIONS) expect(keepHeadline(`Local ${pattern} bulletin`)).toBe(false);
    for (const marker of INCIDENT_MARKERS) expect(keepHeadline(`Election campaign ${marker}`)).toBe(true);
    expect(groupHeadlines([headline("a", { title: "Weather forecast" })], zones)).toHaveLength(0);
    expect(groupAlerts([alert("a", { title: "Weather forecast" })], zones)).toHaveLength(1);
  });
  it("does not merge unknown dates or unknown locations", () => {
    expect(groupHeadlines([headline("a", { publishedAt: null }), headline("b", { publishedAt: null })], zones)).toHaveLength(2);
    expect(groupHeadlines([headline("a", { regionSlug: null }), headline("b", { regionSlug: null })], zones)).toHaveLength(2);
  });
  it("handles 200 headlines and 100 alerts quickly", () => {
    const start = performance.now();
    expect(groupHeadlines(Array.from({ length: 200 }, (_, i) => headline(String(i))), zones)).toHaveLength(1);
    expect(groupAlerts(Array.from({ length: 100 }, (_, i) => alert(String(i))), zones)).toHaveLength(1);
    expect(performance.now() - start).toBeLessThan(250);
  });
});