<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Define leaf-page metadata in each route's `head` option so TanStack Router applies page-specific titles and descriptions.
- Security climate (postures, activity classification) is derived in code from approved headlines and alerts (src/lib/climate.ts); the database schema stays unchanged, so the rubric lives in one tested module.
- Zone hierarchy (tree, descendants, roll-ups, ordering) lives in src/lib/zones.ts and is reused by map, zone pages, travel and filters; database zones are never hard-coded so the list can grow.
- Extra city zones live in the code catalogue src/lib/cities.ts (withCities adds them under their database parent; resolveRegionSlug routes items by title within the same country); every server function that builds a zone list must pass it through withCities so map, filters, briefings and climate stay consistent without schema changes.
- Read-only feed presentation uses the shared browser-safe feed-grouping utility after anonymous fetches and before pagination/counting; query caches retain grouped results so every consumer uses the same incident identity.
