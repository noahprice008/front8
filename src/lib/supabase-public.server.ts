import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | undefined;

/**
 * Server-side publishable client for anonymous public reads.
 * RLS still applies (policies grant anon read access); this client never
 * holds a service-role key and never persists a session.
 */
export function getPublicClient(): SupabaseClient {
  if (cached) return cached;

  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
  if (!url || !key) {
    throw new Error(
      "Missing Supabase environment variables for public reads (SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY).",
    );
  }

  cached = createClient(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) => {
        const headers = new Headers(
          typeof Request !== "undefined" && input instanceof Request
            ? input.headers
            : undefined,
        );
        if (init?.headers) {
          new Headers(init.headers).forEach((value, k) => headers.set(k, value));
        }
        // New-format sb_ keys are opaque, not JWTs: send apikey only.
        if (
          key.startsWith("sb_") &&
          headers.get("Authorization") === `Bearer ${key}`
        ) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });

  return cached;
}
