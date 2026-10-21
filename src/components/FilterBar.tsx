import { useNavigate } from "@tanstack/react-router";
import { CATEGORY_VALUES, SEVERITY_ORDER, TIER_LABELS, TIER_VALUES } from "@/lib/alerts.types";
import { CATEGORY_LABELS, SEVERITY_LABELS } from "@/lib/alerts.types";
import type { AlertStatusFilter } from "@/lib/alerts.types";

export interface FilterValues {
  region?: string | undefined;
  severity?: string | undefined;
  category?: string | undefined;
  tier?: string | undefined;
  status?: AlertStatusFilter | undefined;
}

const SELECT_CLASS =
  "h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export function FilterBar({
  regions,
  values,
}: {
  regions: { slug: string; name: string; indent?: boolean }[];
  values: FilterValues;
}) {
  const navigate = useNavigate();

  const update = (key: keyof FilterValues, value: string) => {
    navigate({
      to: "/alerts",
      search: (prev) => {
        const next: Record<string, unknown> = { ...prev };
        if (value === "") {
          delete next[key];
        } else {
          next[key] = value;
        }
        delete next["page"];
        return next;
      },
    });
  };

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="filter-region" className="text-xs font-medium text-muted-foreground">
          Region
        </label>
        <select
          id="filter-region"
          className={SELECT_CLASS}
          value={values.region ?? ""}
          onChange={(e) => update("region", e.target.value)}
        >
          <option value="">All regions</option>
          {regions.map((r) => (
            <option key={r.slug} value={r.slug}>
              {r.indent ? "\u00A0\u00A0\u00A0— " : ""}
              {r.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="filter-severity" className="text-xs font-medium text-muted-foreground">
          Severity
        </label>
        <select
          id="filter-severity"
          className={SELECT_CLASS}
          value={values.severity ?? ""}
          onChange={(e) => update("severity", e.target.value)}
        >
          <option value="">Any severity</option>
          {SEVERITY_ORDER.map((s) => (
            <option key={s} value={s}>
              {SEVERITY_LABELS[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="filter-category" className="text-xs font-medium text-muted-foreground">
          Category
        </label>
        <select
          id="filter-category"
          className={SELECT_CLASS}
          value={values.category ?? ""}
          onChange={(e) => update("category", e.target.value)}
        >
          <option value="">All categories</option>
          {CATEGORY_VALUES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="filter-tier" className="text-xs font-medium text-muted-foreground">
          Source tier
        </label>
        <select
          id="filter-tier"
          className={SELECT_CLASS}
          value={values.tier ?? ""}
          onChange={(e) => update("tier", e.target.value)}
        >
          <option value="">All tiers</option>
          {TIER_VALUES.map((t) => (
            <option key={t} value={t}>
              {TIER_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="filter-status" className="text-xs font-medium text-muted-foreground">
          Status
        </label>
        <select
          id="filter-status"
          className={SELECT_CLASS}
          value={values.status ?? "active"}
          onChange={(e) => update("status", e.target.value)}
        >
          <option value="active">Active</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {(values.region || values.severity || values.category || values.tier) && (
        <button
          type="button"
          onClick={() =>
            navigate({
              to: "/alerts",
              search: { status: values.status ?? "active" },
            })
          }
          className="h-9 rounded-md border border-border px-3 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
