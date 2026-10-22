export function FeedStatusBanner({
  feedDelay,
  autopublishPaused,
}: {
  feedDelay: boolean;
  autopublishPaused: boolean;
}) {
  if (!feedDelay && !autopublishPaused) return null;

  return (
    <div role="status" className="space-y-2">
      {feedDelay && (
        <div className="flex items-start gap-3 rounded-lg border border-sev-moderate/50 bg-sev-moderate/10 px-4 py-3">
          <svg
            aria-hidden="true"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="mt-0.5 shrink-0 text-sev-moderate"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <p className="text-sm font-medium text-foreground">
            Data feeds are delayed.
          </p>
        </div>
      )}
      {autopublishPaused && (
        <div className="flex items-start gap-3 rounded-lg border border-sev-info/40 bg-sev-info/10 px-4 py-3">
          <svg
            aria-hidden="true"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="mt-0.5 shrink-0 text-sev-info"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M10 9v6M14 9v6" />
          </svg>
          <p className="text-sm font-medium text-foreground">
            Automatic updates are paused. Alerts may be delayed.
          </p>
        </div>
      )}
    </div>
  );
}
