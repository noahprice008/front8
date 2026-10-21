import { cn } from "@/lib/utils";

export function StatusLabel({
  expired,
  className,
}: {
  expired: boolean;
  className?: string;
}) {
  if (expired) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground",
          className,
        )}
      >
        Expired — not a current alert
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-sev-clear/40 bg-sev-clear/10 px-2 py-0.5 text-xs font-medium text-sev-clear",
        className,
      )}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      Active
    </span>
  );
}
