import { Link } from "@tanstack/react-router";
import type { ActivityItem, ClimateData, ZoneClimate } from "@/lib/climate.functions";
import type { ClimateWindow, Posture, Trend } from "@/lib/climate";
import { formatRelative } from "@/lib/format";

export const POSTURE_CLS: Record<Posture, string> = {
  CRITICAL: "text-sev-critical border-sev-critical",
  HIGH: "text-sev-high border-sev-high",
  ELEVATED: "text-sev-moderate border-sev-moderate",
  MONITORED: "text-sev-clear border-sev-clear",
};
const TREND: Record<Trend, string> = { increasing: "▲ Increasing", stable: "■ Stable", decreasing: "▼ Decreasing" };
const LEVELS: Posture[] = ["CRITICAL", "HIGH", "ELEVATED", "MONITORED"];

export function PostureBadge({ p }: { p: Posture }) {
  return <span className={`border px-2 py-0.5 font-display text-[0.6875rem] font-bold uppercase tracking-[0.18em] ${POSTURE_CLS[p]}`}>{p}</span>;
}

export function TrendLabel({ t }: { t: Trend }) {
  const cls = t === "increasing" ? "text-sev-high" : t === "decreasing" ? "text-sev-clear" : "text-muted-foreground";
  return <span className={`font-mono text-[0.6875rem] uppercase tracking-wider ${cls}`}>{TREND[t]}</span>;
}

export function WindowSelector({ value, onChange }: { value: ClimateWindow; onChange: (w: ClimateWindow) => void }) {
  return (
    <div className="tactical-panel inline-flex gap-1 p-1" role="group" aria-label="Time range">
      {(["24h", "7d", "14d"] as ClimateWindow[]).map((w) => (
        <button key={w} type="button" aria-pressed={value === w} onClick={() => onChange(w)}
          className={`rounded-sm px-2.5 py-1 font-mono text-[0.6875rem] font-semibold uppercase tracking-wider ${value === w ? "bg-brand-accent text-brand-accent-foreground" : "text-foreground hover:bg-accent"}`}>
          {w}
        </button>
      ))}
    </div>
  );
}

export function ThreatconBar({ data }: { data: ClimateData }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border border-border bg-card px-4 py-3" role="status" aria-label={`Global posture ${data.overall}`}>
      <div className="flex items-center gap-2">
        <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-muted-foreground">Threatcon</span>
        <PostureBadge p={data.overall} />
      </div>
      <ul className="flex flex-wrap gap-4 font-mono text-[0.6875rem] uppercase tracking-wider">
        {LEVELS.map((l) => (
          <li key={l} className="text-muted-foreground"><span className={POSTURE_CLS[l].split(" ")[0]}>{data.counts[l]}</span> {l} zones</li>
        ))}
        <li className="text-muted-foreground"><span className="text-foreground">{data.totalActivity}</span> activity reports · {data.window}</li>
      </ul>
    </div>
  );
}

const KIND_CLS: Record<ActivityItem["kind"], string> = {
  alert: "border-sev-high text-sev-high",
  developing: "border-sev-moderate text-sev-moderate",
  activity: "border-brand-accent text-brand-accent",
};

export function ActivityRow({ item }: { item: ActivityItem }) {
  const inner = (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`border px-1.5 py-0.5 font-mono text-[0.625rem] uppercase tracking-wider ${KIND_CLS[item.kind]}`}>
          {item.kind === "activity" ? "Activity" : item.kind === "alert" ? "Verified" : "Developing"}
        </span>
        <span className="font-mono text-[0.625rem] uppercase tracking-wider text-muted-foreground">{item.categoryLabel}</span>
        {item.nearInstitution && <span className="font-mono text-[0.625rem] uppercase tracking-wider text-sev-high">Jewish institution</span>}
        {item.regionName && <span className="text-xs text-muted-foreground">· {item.regionName}</span>}
      </div>
      <p className="mt-1 text-sm font-medium leading-snug text-foreground group-hover:underline">{item.title}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{formatRelative(item.publishedAt)}</p>
    </>
  );
  const cls = "group block border-l-2 border-border py-2 pl-3 hover:border-brand-accent";
  return item.kind === "activity" ? (
    <a href={item.url} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
  ) : (
    <Link to="/alerts/$id" params={{ id: item.id }} className={cls}>{inner}</Link>
  );
}

export function AttentionList({ zones }: { zones: ZoneClimate[] }) {
  const ranked = zones.filter((z) => z.score > 0).slice(0, 8);
  if (ranked.length === 0) return <p className="text-sm text-muted-foreground">No zones show recent activity in this time range.</p>;
  return (
    <ol className="divide-y divide-border">
      {ranked.map((z, i) => (
        <li key={z.regionId}>
          <Link to="/region/$slug" params={{ slug: z.slug }} className="flex items-center gap-3 py-2.5 hover:bg-accent/50">
            <span className="w-5 font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
            <span className="flex-1 text-sm font-semibold text-foreground">{z.name}</span>
            <span className="hidden font-mono text-[0.6875rem] text-muted-foreground sm:inline">{z.activityCount} reports</span>
            <TrendLabel t={z.trend} />
            <PostureBadge p={z.posture} />
          </Link>
        </li>
      ))}
    </ol>
  );
}

export function ClimateBriefing({ data }: { data: ClimateData }) {
  return (
    <section className="mt-10 grid gap-6 lg:grid-cols-5" aria-label="Climate briefing">
      <div className="hud-frame border border-border bg-card p-5 lg:col-span-2">
        <h2 className="font-display text-sm font-bold uppercase tracking-[0.18em] text-foreground">Regions requiring attention</h2>
        <p className="mt-1 text-xs text-muted-foreground">Ranked by climate score over the last {data.window}.</p>
        <div className="mt-3"><AttentionList zones={data.zones} /></div>
        {data.callouts.length > 0 && (
          <ul className="mt-4 space-y-2 border-t border-border pt-3">
            {data.callouts.map((c) => (
              <li key={c} className="border-l-2 border-sev-moderate pl-3 text-xs leading-relaxed text-foreground">{c}</li>
            ))}
          </ul>
        )}
      </div>
      <div className="hud-frame border border-border bg-card p-5 lg:col-span-3">
        <div className="flex items-end justify-between gap-2">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.18em] text-foreground">Recent activity stream</h2>
          <Link to="/news" className="text-xs font-medium text-primary underline underline-offset-2">All reports</Link>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Verified incidents, developing reports and on-the-ground activity. Activity is reported, not confirmed as a direct threat.</p>
        <div className="mt-3 max-h-[440px] space-y-1 overflow-y-auto pr-1">
          {data.stream.length === 0 ? <p className="text-sm text-muted-foreground">No recent activity.</p> : data.stream.slice(0, 15).map((it) => <ActivityRow key={it.id} item={it} />)}
        </div>
      </div>
    </section>
  );
}
