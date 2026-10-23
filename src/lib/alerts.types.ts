export type Severity = "info" | "low" | "moderate" | "high" | "critical";

export type AlertCategory =
  | "antisemitic_incident"
  | "demonstration"
  | "security_threat"
  | "travel_advisory"
  | "official_warning"
  | "other";

export type AlertTier = "official" | "verified_news" | "community_security";

export type AlertStatusFilter = "active" | "expired";

export type AlertVerification = "confirmed" | "developing";

export type VerificationFilter = "confirmed" | "developing";

export const HEADLINE_TOPIC_LABELS: Record<string, string> = {
  attack: "Attack",
  harassment: "Harassment",
  vandalism: "Vandalism",
  threat: "Threat",
  official_warning: "Official warning",
  hate_crime_data: "Hate crime data",
  policy_response: "Policy response",
  demonstration: "Demonstration",
  other: "Other",
};

export const HEADLINE_TOPICS = Object.keys(HEADLINE_TOPIC_LABELS);

export const SEVERITY_ORDER: Severity[] = [
  "info",
  "low",
  "moderate",
  "high",
  "critical",
];

export const SEVERITY_LABELS: Record<Severity, string> = {
  info: "Info",
  low: "Low",
  moderate: "Moderate",
  high: "High",
  critical: "Critical",
};

export const CATEGORY_LABELS: Record<AlertCategory, string> = {
  antisemitic_incident: "Antisemitic incident",
  demonstration: "Demonstration",
  security_threat: "Security threat",
  travel_advisory: "Travel advisory",
  official_warning: "Official warning",
  other: "Other",
};

export const CATEGORY_VALUES = Object.keys(CATEGORY_LABELS) as AlertCategory[];

export const TIER_LABELS: Record<AlertTier, string> = {
  official: "Official",
  verified_news: "Verified news",
  community_security: "Trusted community security source",
};

export const TIER_VALUES = Object.keys(TIER_LABELS) as AlertTier[];

/** Tier labels shown on the alert detail page. */
export function tierStatusLabel(tier: AlertTier, authority: string | null): string {
  if (tier === "official") return "Official source";
  if (tier === "community_security") return "Trusted community security source";
  return `Automated summary of reporting by ${authority ?? "verified publishers"}`;
}

export function topSeverityRank(severity: Severity): number {
  return SEVERITY_ORDER.indexOf(severity);
}

/** Map marker classification, mirroring the region_status view. */
export type MarkerStyle = "critical" | "high" | "moderate" | "elevated" | "clear" | "unmonitored";

export function markerStyleFor(region: {
  covered: boolean;
  activeAlerts: number;
  topSeverity: Severity | null;
}): MarkerStyle {
  if (!region.covered) return "unmonitored";
  if (region.activeAlerts > 0) {
    const s = region.topSeverity;
    if (s === "critical") return "critical";
    if (s === "high") return "high";
    if (s === "moderate") return "moderate";
    return "elevated"; // info or low with active alerts
  }
  return "clear";
}

export interface MapRegion {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  isoCode: string | null;
  lat: number | null;
  lng: number | null;
  covered: boolean;
  activeAlerts: number;
  topSeverity: Severity | null;
  latestAlerts: { id: string; title: string }[];
  developingAlerts: number;
  latestDeveloping: { id: string; title: string }[];
  zoneGroup: "diaspora" | "travel";
  /** 0 = country, 1 = nation, 2 = city. */
  depth: number;
  descendantCount: number;
}

export interface FeedStatus {
  lastIngestOkAt: string | null;
  autopublishEnabled: boolean;
  feedDelay: boolean;
}

export interface AlertListItem {
  id: string;
  title: string;
  summary: string;
  category: AlertCategory;
  severity: Severity;
  tier: AlertTier;
  issuingAuthority: string | null;
  autoPublished: boolean;
  publishedAt: string | null;
  expiresAt: string;
  lastReviewedAt: string | null;
  regionName: string;
  regionSlug: string;
  verification: AlertVerification;
  /** Independent outlets that reported this alert (list views). */
  sources?: { publisher: string | null; url: string }[];
  /** Distinct social accounts discussing this alert (unverified signal). */
  socialAccounts?: number;
}

export interface AlertDetail extends Omit<AlertListItem, "sources"> {
  primarySourceUrl: string;
  sources: { publisher: string | null; url: string }[];
}

export interface PublicSource {
  name: string | null;
  url: string;
  tier: AlertTier | null;
}

export interface TravelRegion {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

export interface TravelAdvisory {
  id: string;
  title: string;
  issuingAuthority: string | null;
  levelText: string;
  updatedAt: string | null;
  sourceUrl: string;
}

export interface TravelData {
  regions: TravelRegion[];
  sourcesByRegion: Record<string, PublicSource[]>;
  advisoriesByRegion: Record<string, TravelAdvisory[]>;
}

export interface Headline {
  id: string;
  url: string;
  title: string;
  publisher: string | null;
  publishedAt: string | null;
  regionSlug: string | null;
  topic: string | null;
  /** Activity classification label, null for general coverage. */
  activityLabel?: string | null;
  nearInstitution?: boolean;
  language?: string | null;
  titleOriginal?: string | null;
}

export interface TickerItem {
  kind: "alert" | "headline";
  id: string;
  title: string;
  source: string | null;
  url: string;
  publishedAt: string | null;
  /** Short tag such as PROTEST, VIOLENCE; defaults by kind. */
  tag?: string;
  regionName?: string | null;
  translated?: boolean;
}
