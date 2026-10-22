import { createFileRoute, redirect } from "@tanstack/react-router";

// Short alias: /region/:slug opens the zone briefing at /regions/:slug.
export const Route = createFileRoute("/region/$slug")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/regions/$slug", params: { slug: params.slug } });
  },
});
