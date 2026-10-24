import type { Severity } from "./alerts.types";
import { cityFor } from "./cities";

/** Activity categories derived from approved headlines (no database change). */
export type ActivityCategory =
  | "violence"
  | "threat"
  | "vandalism"
  | "harassment"
  | "protest"
  | "security"
  | "travel";

export const ACTIVITY_LABELS: Record<ActivityCategory, string> = {
  violence: "Violence",
  threat: "Threat / incitement",
  vandalism: "Vandalism",
  harassment: "Harassment / intimidation",
  protest: "Protest / demonstration",
  security: "Security / policing",
  travel: "Travel / access disruption",
};

export const ACTIVITY_CATEGORIES = Object.keys(ACTIVITY_LABELS) as ActivityCategory[];

/** Rubric: how much one item contributes to a zone's climate score. */
export const ACTIVITY_WEIGHTS: Record<ActivityCategory, number> = {
  violence: 5,
  threat: 4,
  vandalism: 3,
  harassment: 2,
  protest: 2,
  security: 1,
  travel: 1,
};
/** Extra weight when the item mentions a Jewish institution. */
export const INSTITUTION_BONUS = 2;

/** Protests, riots, rallies and anti-Israel / "Free Palestine" mobilisation. */
export const PROTEST = /\b(protest\w*|demonstrat\w*|rally|rallies|rallied|march(es|ed|ers|ing)|encampment\w*|riot\w*|unrest|clash\w*|pro-palestin\w*|free palestine|anti-israel\w*|anti-zionis\w*|intifada|from the river to the sea|boycott israel|bds|walkout\w*|sit-in\w*|blockade\w*|mob)\b/i;

/** True when a title reports a protest, riot or rally (independent of its primary category). */
export function isProtest(title: string): boolean {
  return PROTEST.test(title);
}

const RULES: [ActivityCategory, RegExp][] = [
  ["violence", /\b(stab\w*|shot|shoot\w*|assault\w*|attack\w*|beat(en|ing)|punch\w*|arson\w*|firebomb\w*|murder\w*|killed|injur\w*|molotov)\b/i],
  ["threat", /\b(threat\w*|plot\w*|bomb|incite\w*|terror\w*|extremis\w*|jihad\w*)\b/i],
  ["vandalism", /\b(vandal\w*|graffiti|swastika\w*|desecrat\w*|daub\w*|smashed|defaced)\b/i],
  ["harassment", /\b(harass\w*|abuse\w*|abusive|intimidat\w*|spat|slur\w*|bully\w*|hate crime\w*|chant\w*)\b/i],
  ["protest", PROTEST],
  ["security", /\b(police|arrest\w*|security|custody|charged|guard\w*|investigat\w*|probe\w*|probing)\b/i],
  ["travel", /\b(travel\w*|flight\w*|airport\w*|advisory|evacuat\w*)\b/i],
];

const INSTITUTION = /\b(synagogue\w*|shul|kosher|jewish (school|centre|center|museum|cemetery|community|student\w*)|chabad|jcc|yeshiva|hillel|rabbi\w*)\b/i;

export interface Classification {
  category: ActivityCategory;
  nearInstitution: boolean;
  weight: number;
}

/** Classify a headline title. Returns null for general commentary that is not on-the-ground activity. */
export function classifyHeadline(title: string): Classification | null {
  const rule = RULES.find(([, re]) => re.test(title));
  if (!rule) return null;
  const nearInstitution = INSTITUTION.test(title);
  return {
    category: rule[0],
    nearInstitution,
    weight: ACTIVITY_WEIGHTS[rule[0]] + (nearInstitution ? INSTITUTION_BONUS : 0),
  };
}

/** Normalised key used to drop repeat reports of the same story. */
export function dedupeKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/[–—-]\s*[^–—-]+$/, "") // trailing " – Publisher"
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .slice(0, 70);
}

const LOCATION_ALIASES: [string, RegExp][] = [
  ["united-states", /\b(u\.?s\.?a?|united states|america\w*|new york|nyc|brooklyn|manhattan|midtown|queens|philadelphia|philly|los angeles|chicago|boston|miami|florida|california|texas|washington|congress\w*|nypd)\b/i],
  ["united-kingdom", /\b(uk|britain|british|england|london|manchester|blackpool|leeds|glasgow|scotland|wales)\b/i],
  ["france", /\b(france|french|paris|marseille|lyon)\b/i],
  ["germany", /\b(germany|german|berlin|munich|hamburg|frankfurt)\b/i],
  ["canada", /\b(canada|canadian|toronto|montreal|vancouver|ottawa)\b/i],
  ["australia", /\b(australia\w*|sydney|melbourne|bondi)\b/i],
  ["netherlands", /\b(netherlands|dutch|amsterdam|rotterdam)\b/i],
  ["belgium", /\b(belgi\w*|brussels|antwerp)\b/i],
  ["ireland", /\b(ireland|irish|dublin)\b/i],
  ["italy", /\b(italy|italian|rome|milan)\b/i],
  ["spain", /\b(spain|spanish|madrid|barcelona)\b/i],
  ["austria", /\b(austria\w*|vienna)\b/i],
  ["switzerland", /\b(switzerland|swiss|zurich|geneva)\b/i],
  ["sweden", /\b(sweden|swedish|stockholm|malm[oö])\b/i],
  ["denmark", /\b(denmark|danish|copenhagen)\b/i],
  ["poland", /\b(poland|polish|warsaw|krak[oó]w)\b/i],
  ["hungary", /\b(hungar\w*|budapest)\b/i],
  ["argentina", /\b(argentin\w*|buenos aires)\b/i],
  ["brazil", /\b(brazil\w*|s[aã]o paulo|rio)\b/i],
  ["mexico", /\b(mexic\w*)\b/i],
  ["south-africa", /\b(south africa\w*|johannesburg|cape town)\b/i],
  ["new-zealand", /\b(new zealand|auckland|wellington)\b/i],
  ["czechia", /\b(czech\w*|prague)\b/i],
  ["greece", /\b(greece|greek|athens)\b/i],
  ["norway", /\b(norway|norwegian|oslo)\b/i],
  ["finland", /\b(finland|finnish|helsinki)\b/i],
  ["romania", /\b(romania\w*|bucharest)\b/i],
  ["turkey", /\b(turkey|turkish|t[üu]rkiye|istanbul)\b/i],
  ["india", /\b(india|indian|mumbai|kochi)\b/i],
];

/** Resolve the most specific zone: a named city inside the tagged country first, then place names for "global" items. */
export function resolveRegionSlug(regionSlug: string | null, title: string): string | null {
  const city = cityFor(regionSlug, title);
  if (city) return city.slug;
  if (regionSlug && regionSlug !== "global") return regionSlug;
  return LOCATION_ALIASES.find(([, re]) => re.test(title))?.[0] ?? null;
}

export type Posture = "CRITICAL" | "HIGH" | "ELEVATED" | "MONITORED";
export type Trend = "increasing" | "stable" | "decreasing";

const ALERT_POINTS: Record<Severity, number> = { info: 0, low: 1, moderate: 3, high: 6, critical: 10 };
export const DEVELOPING_POINTS = 2;

/** Score thresholds. Activity alone can raise a zone to HIGH but never to CRITICAL. */
export const THRESHOLDS = { elevated: 4, high: 20, critical: 30 };
/** Activity alone needs at least this many separate reports to reach HIGH. */
export const MIN_REPORTS_FOR_HIGH = 3;

export interface ZoneInputs {
  /** Weights of activity items in the window. */
  activityWeights: number[];
  /** Severities of confirmed, non-travel active alerts. */
  alertSeverities: Severity[];
  developingCount: number;
}

export function scoreZone(z: ZoneInputs): number {
  const activity = z.activityWeights.reduce((s, w) => s + w, 0);
  const alerts = z.alertSeverities.reduce((s, sev) => s + ALERT_POINTS[sev], 0);
  return activity + alerts + z.developingCount * DEVELOPING_POINTS;
}

export function postureFor(z: ZoneInputs): Posture {
  const score = scoreZone(z);
  const hasCritical = z.alertSeverities.includes("critical");
  const hasHigh = z.alertSeverities.includes("high");
  if (hasCritical || (score >= THRESHOLDS.critical && hasHigh)) return "CRITICAL";
  if (hasHigh || (score >= THRESHOLDS.high && z.activityWeights.length >= MIN_REPORTS_FOR_HIGH)) return "HIGH";
  if (score >= THRESHOLDS.elevated || z.alertSeverities.includes("moderate")) return "ELEVATED";
  return "MONITORED";
}

const POSTURE_RANK: Record<Posture, number> = { MONITORED: 0, ELEVATED: 1, HIGH: 2, CRITICAL: 3 };

/**
 * A parent zone (country/state) is scored only on reports assigned to it directly;
 * reports in separate cities are never summed together. Its posture is the higher of
 * its own posture and its most serious child zone.
 */
export function rollupPosture(own: Posture, children: Posture[]): Posture {
  return [own, ...children].reduce((a, b) => (POSTURE_RANK[b] > POSTURE_RANK[a] ? b : a), "MONITORED" as Posture);
}

/** Compare the newer half of the window with the older half (±25% band = stable). */
export function trendFor(recent: number, prior: number): Trend {
  if (recent === prior) return "stable";
  if (prior === 0) return recent >= 2 ? "increasing" : "stable";
  const ratio = recent / prior;
  if (ratio >= 1.25) return "increasing";
  if (ratio <= 0.75) return "decreasing";
  return "stable";
}

export const WINDOWS = { "24h": 1, "7d": 7, "14d": 14 } as const;
export type ClimateWindow = keyof typeof WINDOWS;
export const isWindow = (v: unknown): v is ClimateWindow =>
  typeof v === "string" && v in WINDOWS;
