import {
  CATEGORY_LABELS,
  SEVERITY_LABELS,
  TIER_LABELS,
  type AlertCategory,
  type AlertTier,
  type Severity,
} from "./alerts.types";

const utcFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "UTC",
});

/** "21 Oct 2026, 08:02 UTC" — timestamps are always shown in UTC. */
export function formatUtc(iso: string | null | undefined): string {
  if (!iso) return "Unknown";
  return utcFormatter.format(new Date(iso)).replace(",", "") + " UTC";
}

export function severityLabel(severity: Severity): string {
  return SEVERITY_LABELS[severity] ?? severity;
}

export function categoryLabel(category: AlertCategory): string {
  return CATEGORY_LABELS[category] ?? category;
}

export function tierLabel(tier: AlertTier): string {
  return TIER_LABELS[tier] ?? tier;
}

export function isExpired(expiresAt: string): boolean {
  return new Date(expiresAt).getTime() <= Date.now();
}
