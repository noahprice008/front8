import { describe, expect, it } from "vitest";
import { cityFor, withCities } from "@/lib/cities";
import { isProtest, resolveRegionSlug } from "@/lib/climate";

describe("city routing", () => {
  it("routes a US-tagged story naming Manhattan to New York City", () => {
    expect(resolveRegionSlug("united-states", "Orthodox Jewish man stabbed in midtown Manhattan")).toBe("new-york-city");
  });
  it("routes an area-tagged story to a city in the same country", () => {
    expect(resolveRegionSlug("us-northeast", "Rally outside Brooklyn synagogue")).toBe("new-york-city");
    expect(resolveRegionSlug("england", "Arson attack in Golders Green")).toBe("london");
  });
  it("routes global stories to the named city", () => {
    expect(resolveRegionSlug("global", "Paris synagogue ransacked during riot")).toBe("paris");
  });
  it("never moves a story to a city in another country", () => {
    expect(cityFor("spain", "Assault investigated in New York")).toBeNull();
    expect(resolveRegionSlug("spain", "Assault investigated in New York")).toBe("spain");
  });
  it("adds catalogue cities under their existing parent zone", () => {
    const zones = withCities([{ id: "fr", slug: "france", name: "France", parentId: null }]);
    expect(zones.find((z) => z.slug === "paris")?.parentId).toBe("fr");
    expect(zones.some((z) => z.slug === "toronto")).toBe(false);
  });
});

describe("protest detection", () => {
  it.each(["Free Palestine march blocks city centre", "Anti-Israel protesters clash with police", "Riot near Jewish quarter", "Pro-Palestinian rally outside embassy"])("flags %s", (t) => {
    expect(isProtest(t)).toBe(true);
  });
  it("ignores the month of March", () => {
    expect(isProtest("Synagogue reopens in March")).toBe(false);
  });
});
