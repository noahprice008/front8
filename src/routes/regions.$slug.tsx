import { createFileRoute, redirect } from "@tanstack/react-router";

// Old address: /regions/:slug forwards to the zone briefing at /region/:slug.
export const Route = createFileRoute("/regions/$slug")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/region/$slug", params: { slug: params.slug }, statusCode: 301 });
  },
});
