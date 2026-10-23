import { useId, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { getMapData } from "@/lib/alerts.functions";

/** Header search: find any monitored zone (including sub-zones) by name. */
export function ZoneSearch({ className = "", onDone }: { className?: string; onDone?: () => void }) {
  const id = useId();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const { data } = useQuery({ queryKey: ["map-data"], queryFn: () => getMapData(), staleTime: 60_000, enabled: open || q.length > 0 });

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term || !data) return [];
    const byId = new Map(data.regions.map((r) => [r.id, r]));
    return data.regions
      .filter((r) => r.name.toLowerCase().includes(term))
      .sort((a, b) => Number(!a.name.toLowerCase().startsWith(term)) - Number(!b.name.toLowerCase().startsWith(term)) || a.name.localeCompare(b.name))
      .slice(0, 8)
      .map((r) => ({ slug: r.slug, name: r.name, parent: r.parentId ? byId.get(r.parentId)?.name ?? null : null }));
  }, [q, data]);

  const go = (slug: string) => {
    setQ("");
    setOpen(false);
    onDone?.();
    navigate({ to: "/region/$slug", params: { slug } });
  };

  return (
    <div className={`relative ${className}`}>
      <input
        type="search"
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls={`${id}-list`}
        aria-activedescendant={results[active] ? `${id}-${active}` : undefined}
        aria-label="Search zones"
        placeholder="Search zones"
        value={q}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onChange={(e) => { setQ(e.target.value); setActive(0); setOpen(true); }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
          else if (e.key === "Enter" && results[active]) { e.preventDefault(); go(results[active].slug); }
          else if (e.key === "Escape") setOpen(false);
        }}
        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      {open && q.trim() && (
        <ul id={`${id}-list`} role="listbox" className="absolute left-0 right-0 top-full z-[1100] mt-1 max-h-72 overflow-auto border border-border bg-popover text-popover-foreground shadow-lg">
          {results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">{data ? "No matching zones" : "Loading…"}</li>
          ) : results.map((r, i) => (
            <li
              key={r.slug}
              id={`${id}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => { e.preventDefault(); go(r.slug); }}
              onMouseEnter={() => setActive(i)}
              className={`cursor-pointer px-3 py-2 text-sm ${i === active ? "bg-accent" : ""}`}
            >
              {r.name}
              {r.parent && <span className="ml-1 text-xs text-muted-foreground">· {r.parent}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
