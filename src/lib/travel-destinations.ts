/** Additional destinations reuse covered zones; this never changes their database classification. */
export const ADDITIONAL_TRAVEL_DESTINATIONS = new Set([
  "south-africa", "greece", "spain", "italy", "france", "australia", "mexico",
  "united-states", "united-kingdom", "canada", "germany", "austria",
  "netherlands", "switzerland", "hungary", "new-zealand",
]);

export function isTravelDestination(zone: { slug: string; zone_group: string | null }): boolean {
  return zone.zone_group === "travel" || ADDITIONAL_TRAVEL_DESTINATIONS.has(zone.slug);
}