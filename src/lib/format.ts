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

/** "expires in 18h" / "expires in 3d" / "expired". */
export function formatExpiresIn(iso: string, now = Date.now()): string {
  const ms = new Date(iso).getTime() - now;
  if (ms <= 0) return "expired";
  const h = Math.floor(ms / 3_600_000);
  if (h < 1) return `expires in ${Math.max(1, Math.floor(ms / 60_000))}m`;
  if (h < 48) return `expires in ${h}h`;
  return `expires in ${Math.floor(h / 24)}d`;
}

/** Normalised title used to drop near-duplicate stories. */
export function storyKey(title: string): string {
  return title.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "").replace(/\s+/g, " ").trim();
}

const LANG_NAMES: Record<string, string> = { en: "English", fr: "French", de: "German", es: "Spanish", it: "Italian", nl: "Dutch", pt: "Portuguese", sv: "Swedish", pl: "Polish", ru: "Russian", uk: "Ukrainian", hu: "Hungarian", cs: "Czech", da: "Danish", no: "Norwegian", fi: "Finnish", el: "Greek", tr: "Turkish", ar: "Arabic", he: "Hebrew", ro: "Romanian", be: "Belarusian", hr: "Croatian", sk: "Slovak", bg: "Bulgarian" };
export function languageName(code: string | null | undefined): string {
  if (!code) return "another language";
  return LANG_NAMES[code.toLowerCase().slice(0, 2)] ?? code.toUpperCase();
}

/** Plain-language verification label from the number of independent outlets. */
export function verificationText(v: "confirmed" | "developing", outlets: number): string {
  if (v === "developing") return "Developing: single source, unconfirmed";
  return outlets >= 2 ? `Confirmed by ${outlets} independent outlets` : "Confirmed by multiple independent outlets";
}
