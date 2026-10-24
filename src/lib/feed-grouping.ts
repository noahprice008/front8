import { HEADLINE_EXCLUSIONS, INCIDENT_MARKERS, FEED_RULES } from "./feed.config";
import { SEVERITY_ORDER, type Severity } from "./alerts.types";
import { ancestorsOf, buildZoneTree, type ZoneNode } from "./zones";

const STOP_WORDS = new Set("the and for with from that this after into over under about have has had was were are been being their they his her its who what when where why how says said say amid new more than not but out off one two all through during against near outside across following reports report suspected suspect allegedly alleged".split(" "));
const normalize = (text: string) => text.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
export function titleWords(title: string): Set<string> {
  const text = normalize(title.replace(/\s+[-–—|]\s+[^-–—|]+$/, ""));
  return new Set(text.replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w))
    .map((w) => w.replace(/ies$/, "y").replace(/(ing|ed|es|s)$/, (suffix) => w.length - suffix.length >= 3 ? "" : suffix)));
}
export function wordSimilarity(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const word of a) if (b.has(word)) intersection++;
  return intersection / (a.size + b.size - intersection);
}
export function similarWords(a: Set<string>, b: Set<string>, threshold: number): boolean {
  if (wordSimilarity(a, b) >= threshold) return true;
  const smaller = Math.min(a.size, b.size);
  if (smaller < 3) return false;
  let intersection = 0;
  for (const word of a) if (b.has(word)) intersection++;
  return intersection / smaller >= FEED_RULES.containment;
}
export function keepHeadline(title: string): boolean {
  const text = normalize(title);
  return !HEADLINE_EXCLUSIONS.some((p) => text.includes(normalize(p))) || INCIDENT_MARKERS.some((p) => text.includes(normalize(p)));
}

export interface PublisherLink { publisher: string; url: string }
interface Story { id: string; title: string; publishedAt: string | null; regionSlug: string | null }
interface HeadlineStory extends Story { publisher: string | null; url: string }
interface AlertStory extends Story {
  summary: string; severity: Severity; verification: "confirmed" | "developing";
  eventKey?: string | null; sources?: { publisher: string | null; url: string }[];
  socialAccounts?: number; expiresAt?: string;
}
const timeOf = (item: Story) => item.publishedAt ? Date.parse(item.publishedAt) : NaN;
export function zoneFamily(zones: ZoneNode[]) {
  const tree = buildZoneTree(zones);
  const bySlug = new Map(zones.map((z) => [z.slug, z]));
  const parents = new Map(zones.map((z) => [z.slug, new Set(ancestorsOf(tree, z.id).map((p) => p.slug))]));
  return (a: string | null, b: string | null) => {
    if (!a || !b) return false;
    if (a === b) return true;
    return bySlug.has(a) && bySlug.has(b) && (parents.get(a)?.has(b) === true || parents.get(b)?.has(a) === true);
  };
}
function clusters<T extends Story>(items: T[], zones: ZoneNode[], threshold: number, alert: boolean): T[][] {
  const related = zoneFamily(zones);
  const sorted = [...items].sort((a, b) => (timeOf(b) || 0) - (timeOf(a) || 0));
  const prepared = new Map(sorted.map((item) => [item, { words: titleWords(item.title), summary: titleWords((item as unknown as Partial<AlertStory>).summary ?? "") }]));
  const groups: T[][] = [];
  for (const item of sorted) {
    const words = prepared.get(item);
    if (!words) continue;
    const group = groups.find((members) => members.every((member) => {
      if (!related(item.regionSlug, member.regionSlug)) return false;
      const delta = Math.abs(timeOf(item) - timeOf(member));
      if (!Number.isFinite(delta) || delta > FEED_RULES.hours * 3_600_000) return false;
      const other = prepared.get(member);
      if (!other) return false;
      const a = item as unknown as Partial<AlertStory>, b = member as unknown as Partial<AlertStory>;
      return (alert && Boolean(a.eventKey) && a.eventKey === b.eventKey)
        || similarWords(words.words, other.words, threshold)
        || (alert && similarWords(words.summary, other.summary, threshold));
    }));
    if (group) group.push(item); else groups.push([item]);
  }
  return groups;
}
export function groupHeadlines<T extends HeadlineStory>(items: T[], zones: ZoneNode[]) {
  return clusters(items.filter((h) => keepHeadline(h.title)), zones, FEED_RULES.headlineSimilarity, false).map((members) => {
    const newest = members[0];
    if (!newest) throw new Error("Empty headline group");
    const publishers = new Set(newest.publisher ? [newest.publisher.trim().toLowerCase()] : []);
    const alsoReportedBy: PublisherLink[] = [];
    for (const h of members.slice(1)) {
      const key = h.publisher?.trim().toLowerCase();
      if (!key || publishers.has(key)) continue;
      publishers.add(key);
      alsoReportedBy.push({ publisher: h.publisher?.trim() ?? "", url: h.url });
    }
    return { ...newest, alsoReportedBy, reportCount: members.length, regionSlugs: [...new Set(members.map((m) => m.regionSlug).filter((s): s is string => Boolean(s)))] };
  });
}
export function groupAlerts<T extends AlertStory>(items: T[], zones: ZoneNode[]) {
  return clusters(items, zones, FEED_RULES.alertSimilarity, true).map((members) => {
    const newest = members[0];
    if (!newest) throw new Error("Empty alert group");
    const highest = members.reduce((a, b) => SEVERITY_ORDER.indexOf(b.severity) > SEVERITY_ORDER.indexOf(a.severity) ? b : a, newest);
    const publishers = new Set<string>();
    const sources: { publisher: string | null; url: string }[] = [];
    for (const member of members) for (const source of member.sources ?? []) {
      let key = source.publisher?.trim().toLowerCase();
      if (!key) { try { key = new URL(source.url).hostname.replace(/^www\./, ""); } catch { key = source.url; } }
      if (publishers.has(key)) continue;
      publishers.add(key); sources.push(source);
    }
    const dated = members.filter((m) => Number.isFinite(timeOf(m)));
    const publishedAt = dated.length ? dated.reduce((a, b) => timeOf(a) < timeOf(b) ? a : b).publishedAt : newest.publishedAt;
    const social = members.map((m) => m.socialAccounts).filter((n): n is number => n !== undefined);
    return { ...newest, severity: highest.severity, verification: members.some((m) => m.verification === "confirmed") ? "confirmed" as const : "developing" as const,
      publishedAt, sources, socialAccounts: social.length ? Math.max(...social) : undefined,
      reportCount: members.length, memberIds: members.map((m) => m.id),
      regionSlugs: [...new Set(members.map((m) => m.regionSlug).filter((s): s is string => Boolean(s)))],
    };
  });
}