import type { PublisherLink } from "@/lib/feed-grouping";

export function AlsoReportedBy({ sources }: { sources?: PublisherLink[] }) {
  if (!sources?.length) return null;
  const link = (source: PublisherLink) => <a key={source.publisher.toLowerCase()} href={source.url} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">{source.publisher}</a>;
  return <div className="mt-1 text-xs text-muted-foreground">
    Also reported by {sources.slice(0, 2).map((source, i) => <span key={source.publisher}>{i > 0 ? ", " : ""}{link(source)}</span>)}
    {sources.length > 2 && <details className="inline"><summary className="ml-1 inline cursor-pointer">+{sources.length - 2}</summary><span className="ml-1">{sources.slice(2).map((source, i) => <span key={source.publisher}>{i > 0 ? ", " : ""}{link(source)}</span>)}</span></details>}
  </div>;
}