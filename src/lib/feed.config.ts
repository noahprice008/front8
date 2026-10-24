// Headline-only safety net. Alerts are never filtered by these patterns.
export const HEADLINE_EXCLUSIONS = [
  "campaign ad", "political ad", "attack ad", "campaign", "election results", "poll",
  "traffic", "car crash", "collision", "crash", "accident", "highway", "obituary",
  "died peacefully", "sports", "scores", "weather",
];
export const INCIDENT_MARKERS = [
  "antisemit", "hate crime", "synagogue", "swastika", "vandal", "arson", "assault",
  "attacked", "stabbing", "shooting", "ramming", "bomb", "threat", "harass",
  "desecrat", "graffiti", "Holocaust denial", "Jewish school", "Jewish cemetery",
];
export const FEED_RULES = { hours: 72, headlineSimilarity: 0.55, alertSimilarity: 0.5, containment: 0.9 };