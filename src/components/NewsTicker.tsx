import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { getTickerItems } from "@/lib/alerts.functions";
import { formatRelative } from "@/lib/format";
import type { TickerItem } from "@/lib/alerts.types";

function TickerEntry({ item, hidden }: { item: TickerItem; hidden?: boolean }) {
  const body = (
    <>
      <span
        className={`ticker-tag ${item.kind === "alert" ? "ticker-tag--alert" : "ticker-tag--report"}`}
      >
        {item.kind === "alert" ? "ALERT" : "REPORT"}
      </span>
      {item.source ? <span className="ticker-source">{item.source}</span> : null}
      <span className="ticker-time">{formatRelative(item.publishedAt)}</span>
      <span className="ticker-title">{item.title}</span>
    </>
  );
  if (item.kind === "alert") {
    return (
      <Link
        to="/alerts/$id"
        params={{ id: item.id }}
        className="ticker-item"
        aria-hidden={hidden || undefined}
        tabIndex={hidden ? -1 : undefined}
      >
        {body}
      </Link>
    );
  }
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="ticker-item"
      aria-hidden={hidden || undefined}
      tabIndex={hidden ? -1 : undefined}
    >
      {body}
    </a>
  );
}

export function NewsTicker() {
  const { data } = useQuery({
    queryKey: ["ticker"],
    queryFn: () => getTickerItems(),
    refetchInterval: 120_000,
    staleTime: 60_000,
  });

  const items = data ?? [];
  if (items.length === 0) return null;

  // 20% slower than the original pace (duration × 1.25)
  const duration = Math.max(50, items.length * 7.5);

  return (
    <div className="ticker" role="region" aria-label="Live reports ticker">
      <div className="ticker-label">
        <span className="ticker-dot" aria-hidden="true" />
        LIVE
      </div>
      <div className="ticker-viewport">
        <div className="ticker-track" style={{ animationDuration: `${duration}s` }}>
          {items.map((item) => (
            <TickerEntry key={item.id} item={item} />
          ))}
          {/* Duplicate copy for the seamless loop; hidden from keyboard and screen readers */}
          {items.map((item) => (
            <TickerEntry key={`${item.id}-dup`} item={item} hidden />
          ))}
        </div>
      </div>
    </div>
  );
}
