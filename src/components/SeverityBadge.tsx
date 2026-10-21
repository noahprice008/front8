import { severityLabel } from "@/lib/format";
import type { Severity } from "@/lib/alerts.types";

const STYLES: Record<Severity, string> = {
  info: "bg-sev-info/15 text-sev-info border-sev-info/40",
  low: "bg-sev-low/15 text-sev-low border-sev-low/40",
  moderate: "bg-sev-moderate/20 text-sev-moderate border-sev-moderate/50",
  high: "bg-sev-high/15 text-sev-high border-sev-high/45",
  critical: "bg-sev-critical/15 text-sev-critical border-sev-critical/45",
};

export function SeverityBadge({
  severity,
  size = "md",
}: {
  severity: Severity;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 rounded-full border font-medium " +
        (size === "sm" ? "px-2 py-0.5 text-[0.6875rem]" : "px-2.5 py-0.5 text-xs") +
        " " +
        STYLES[severity]
      }
    >
      <span
        aria-hidden="true"
        className={"rounded-full bg-current " + (size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2")}
      />
      {severityLabel(severity)}
    </span>
  );
}
