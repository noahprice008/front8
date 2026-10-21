import { useRouter } from "@tanstack/react-router";

export function RouteError({ error }: { error: unknown }) {
  console.error(error);
  const router = useRouter();

  return (
    <div
      role="alert"
      className="mx-auto max-w-xl px-4 py-20 text-center"
    >
      <h1 className="font-display text-xl font-semibold text-foreground">
        This page didn't load
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Something went wrong while loading data. You can retry, or come back
        shortly.
      </p>
      <button
        type="button"
        onClick={() => router.invalidate()}
        className="mt-6 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Try again
      </button>
    </div>
  );
}
