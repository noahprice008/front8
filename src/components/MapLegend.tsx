import { useState } from "react";

const DOTS: { key: string; label: string; className: string }[] = [
  { key: "critical", label: "Critical", className: "bg-sev-critical map-bubble map-bubble--critical" },
  { key: "high", label: "High", className: "bg-sev-high map-bubble map-bubble--high" },
  { key: "moderate", label: "Moderate", className: "bg-sev-moderate map-bubble map-bubble--moderate" },
  { key: "elevated", label: "Info / Low (active alerts)", className: "bg-sev-info map-bubble map-bubble--elevated" },
  { key: "clear", label: "No current alerts", className: "bg-sev-clear map-bubble map-bubble--clear" },
  { key: "unmonitored", label: "Not yet monitored", className: "map-bubble map-bubble--unmonitored" },
  { key: "posture-high", label: "Glowing ring: zone climate posture from recent activity", className: "map-legend-posture" },
  { key: "developing", label: "Developing report: single source, not yet confirmed", className: "map-legend-dev" },
];

export function MapLegend() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-border/40 bg-card/25 p-2 shadow-sm backdrop-blur-[3px] sm:p-3">
      {/* Mobile: compact toggle button; hidden on desktop where the key is always shown */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-foreground sm:hidden"
      >
        Map key
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
          className={open ? "rotate-180 transition-transform" : "transition-transform"}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <div className={(open ? "block " : "hidden ") + "sm:block"}>
        <p className="hidden text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:block">
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
          Bubble numbers are incident alerts, or activity reports when no
          alert is active. Activity is reported, not a confirmed direct
          threat. Green does not guarantee safety.
        </p>
      </div>
    </div>
  );
}
