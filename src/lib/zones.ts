import { SEVERITY_ORDER, type Severity } from "./alerts.types";

/** Minimal zone shape needed to build the tree. */
export interface ZoneNode {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
}

export interface ZoneTree<T extends ZoneNode> {
  byId: Map<string, T>;
  children: Map<string, T[]>;
  roots: T[];
}

export function buildZoneTree<T extends ZoneNode>(zones: T[]): ZoneTree<T> {
  const byId = new Map(zones.map((z) => [z.id, z]));
  const children = new Map<string, T[]>();
  const roots: T[] = [];
  for (const z of zones) {
    if (z.parentId && byId.has(z.parentId)) {
      const l = children.get(z.parentId) ?? [];
      l.push(z);
      children.set(z.parentId, l);
    } else roots.push(z);
  }
  const byName = (a: T, b: T) => a.name.localeCompare(b.name);
  roots.sort(byName);
  for (const l of children.values()) l.sort(byName);
  return { byId, children, roots };
}

/** All descendants (not including the zone itself), cycle-safe. */
export function descendantsOf<T extends ZoneNode>(tree: ZoneTree<T>, id: string): T[] {
  const out: T[] = [];
  const seen = new Set([id]);
  const stack = [...(tree.children.get(id) ?? [])];
  while (stack.length) {
    const z = stack.pop()!;
    if (seen.has(z.id)) continue;
    seen.add(z.id);
    out.push(z);
    stack.push(...(tree.children.get(z.id) ?? []));
  }
  return out;
}

/** Root-first chain of ancestors (not including the zone). */
export function ancestorsOf<T extends ZoneNode>(tree: ZoneTree<T>, id: string): T[] {
  const out: T[] = [];
  const seen = new Set<string>();
  let cur = tree.byId.get(id)?.parentId ?? null;
  while (cur && !seen.has(cur)) {
    seen.add(cur);
    const z = tree.byId.get(cur);
    if (!z) break;
    out.unshift(z);
    cur = z.parentId;
  }
  return out;
}

export function depthOf<T extends ZoneNode>(tree: ZoneTree<T>, id: string): number {
  return ancestorsOf(tree, id).length;
}

/** Depth-first ordered list with depth, for indented pickers. */
export function flattenTree<T extends ZoneNode>(tree: ZoneTree<T>): { zone: T; depth: number }[] {
  const out: { zone: T; depth: number }[] = [];
  const walk = (z: T, d: number, seen: Set<string>) => {
    if (seen.has(z.id)) return;
    seen.add(z.id);
    out.push({ zone: z, depth: d });
    for (const c of tree.children.get(z.id) ?? []) walk(c, d + 1, seen);
  };
  const seen = new Set<string>();
  for (const r of tree.roots) walk(r, 0, seen);
  return out;
}

export function maxSeverity(a: Severity | null, b: Severity | null): Severity | null {
  if (!a) return b;
  if (!b) return a;
  return SEVERITY_ORDER.indexOf(b) > SEVERITY_ORDER.indexOf(a) ? b : a;
}

export interface OwnStatus {
  activeAlerts: number;
  developingAlerts: number;
  topSeverity: Severity | null;
}

/** Status of a zone rolled up from itself and every descendant. */
export function rollupStatus<T extends ZoneNode>(
  tree: ZoneTree<T>,
  id: string,
  own: (z: T) => OwnStatus,
): OwnStatus {
  const self = tree.byId.get(id);
  const all = self ? [self, ...descendantsOf(tree, id)] : [];
  let res: OwnStatus = { activeAlerts: 0, developingAlerts: 0, topSeverity: null };
  for (const z of all) {
    const s = own(z);
    res = {
      activeAlerts: res.activeAlerts + s.activeAlerts,
      developingAlerts: res.developingAlerts + s.developingAlerts,
      topSeverity: maxSeverity(res.topSeverity, s.topSeverity),
    };
  }
  return res;
}

/** Sort by severity (highest first, none last), then name. */
export function bySeverityThenName(
  a: { name: string; topSeverity: Severity | null; activeAlerts: number },
  b: { name: string; topSeverity: Severity | null; activeAlerts: number },
): number {
  const rank = (z: typeof a) => (z.activeAlerts > 0 && z.topSeverity ? SEVERITY_ORDER.indexOf(z.topSeverity) : -1);
  return rank(b) - rank(a) || a.name.localeCompare(b.name);
}
