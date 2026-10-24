import { describe, expect, it } from "vitest";
import { isTravelDestination } from "@/lib/travel-destinations";

describe("additional Israeli travel destinations", () => {
  it("includes South Africa without changing its diaspora classification", () => {
    expect(isTravelDestination({ slug: "south-africa", zone_group: "diaspora" })).toBe(true);
  });
  it.each(["greece", "spain", "italy", "france", "australia", "mexico", "united-states", "united-kingdom", "canada", "germany", "austria", "netherlands", "switzerland", "hungary", "new-zealand"])("includes %s", (slug) => {
    expect(isTravelDestination({ slug, zone_group: "diaspora" })).toBe(true);
  });
  it("preserves destinations supplied by the database", () => {
    expect(isTravelDestination({ slug: "thailand", zone_group: "travel" })).toBe(true);
  });
  it("does not turn an unrelated city into a destination", () => {
    expect(isTravelDestination({ slug: "paris", zone_group: "diaspora" })).toBe(false);
  });
});