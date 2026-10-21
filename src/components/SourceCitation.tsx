import { tierLabel } from "@/lib/format";
import type { AlertTier } from "@/lib/alerts.types";

export function SourceCitation({
  sources,
  tier,
  primarySourceUrl,
}: {
  sources: { publisher: string | null; url: string }[];
  tier: AlertTier;
  primarySourceUrl: string;
}) {
  const all = [
    ...(primarySourceUrl ? [{ publisher: null, url: primarySourceUrl }] : []),
    ...sources.filter((s) => s.url !== primarySourceUrl),
  ];
  const deduped = all.filter(
    (s, i) => all.findIndex((x) => x.url === s.url) === i,
  );

  if (deduped.length === 0) return null;

  return (
    <div className="mt-4 border-t border-border pt-4">
      <h2 className="text-sm font-semibold text-foreground">Source{deduped.length > 1 ? "s" : ""}</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        {tierLabel(tier)} tier —{" "}
        {tier === "official"
          ? "issued or confirmed by an official authority."
          : "drawn from reporting by verified news publishers."}
      </p>
      <ul className="mt-2 space-y-1.5">
        {deduped.map((source, i) => (
          <li key={source.url} className="text-sm">
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-primary underline underline-offset-2 hover:opacity-80"
            >
              {source.publisher || source.url}
            </a>
            {source.publisher && (
              <span className="ml-1 text-xs text-muted-foreground">
                ({new URL(source.url).hostname.replace(/^www\./, "")})
              </span>
            )}
            {i === 0 && !source.publisher && (
              <span className="ml-1 text-xs text-muted-foreground">(primary source)</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
