const DOTS: { key: string; label: string; className: string }[] = [
  { key: "critical", label: "Critical", className: "bg-sev-critical map-bubble map-bubble--critical" },
  { key: "high", label: "High", className: "bg-sev-high map-bubble map-bubble--high" },
  { key: "moderate", label: "Moderate", className: "bg-sev-moderate map-bubble map-bubble--moderate" },
  { key: "elevated", label: "Info / Low (active alerts)", className: "bg-sev-info map-bubble map-bubble--elevated" },
  { key: "clear", label: "No current alerts", className: "bg-sev-clear map-bubble map-bubble--clear" },
  { key: "unmonitored", label: "Not yet monitored", className: "map-bubble map-bubble--unmonitored" },
];

export function MapLegend() {
  return (
    <div className="rounded-lg border border-border bg-card/95 p-3 shadow-sm backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Severity scale
      </p>
      <ul className="mt-2 space-y-1.5">
        {DOTS.map((dot) => (
          <li key={dot.key} className="flex items-center gap-2 text-xs text-foreground">
            <span
              aria-hidden="true"
              className={`inline-block h-3 w-3 shrink-0 rounded-full ${dot.className}`}
            />
            {dot.label}
          </li>
        ))}
      </ul>
      <p className="mt-2 border-t border-border pt-2 text-[0.6875rem] leading-relaxed text-muted-foreground">
        Green means no current alerts from monitored sources. It does not
        guarantee safety.
      </p>
    </div>
  );
}
