import {
  CATEGORY_LABELS,
  SEVERITY_LABELS,
  TIER_LABELS,
  type AlertCategory,
  type AlertTier,
  type Severity,
} from "./alerts.types";

const gmtFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "GMT",
});

/** "21 Oct 2026 08:02 GMT" — GMT uses the same zero offset as UTC. */
export function formatUtc(iso: string | null | undefined): string {
  if (!iso) return "Unknown";
  return gmtFormatter.format(new Date(iso)).replace(",", "") + " GMT";
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

/** "just now", "5m ago", "2h ago", "3d ago" — for ticker and liveness stamps. */
export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return "Unknown";
  const diffMs = Date.now() - new Date(iso).getTime();
  if (diffMs < 60_000) return "just now";
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
