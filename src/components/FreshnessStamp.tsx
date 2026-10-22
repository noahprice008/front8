import { useQuery } from "@tanstack/react-query";
import { getTickerItems } from "@/lib/alerts.functions";
import { formatRelative } from "@/lib/format";

const DELAY_MS = 2 * 60 * 60 * 1000;

/** "Last updated X ago", with a quiet delay notice when feeds are older than 2 hours. Shares the ticker query. */
export function FreshnessStamp() {
  const { data } = useQuery({
    queryKey: ["ticker"],
    queryFn: () => getTickerItems(),
    refetchInterval: 120_000,
    staleTime: 60_000,
  });
  if (!data) return null;
  const at = data.lastIngestOkAt;
  const delayed = !at || Date.now() - new Date(at).getTime() > DELAY_MS;
  return (
    <p className="font-mono text-[0.6875rem] uppercase tracking-wider text-muted-foreground">
      Last updated {formatRelative(at)}
      {delayed && <span className="ml-2 normal-case tracking-normal">· Data feeds are delayed.</span>}
    </p>
  );
}
