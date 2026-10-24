# Step 11: ticker, news page, developing reports, mission
- [ ] Apply tested zone/time-aware feed grouping, headline-only exclusions, combined publisher links, and merged incident counts across public feeds; verify desktop/mobile.
- [x] Rebalance footer for desktop/mobile, remove header zone search, and expand support cards with the ad-free commitment; verify both layouts.
- [x] About: expand source explanation without organization names and reuse severity graphics; verify the page.
- [x] Live ticker under navbar (headlines + confirmed alerts, auto-refresh 2 min, pause on hover, reduced-motion fallback).
- [x] /news page with region + topic filters and pagination; News nav link.
- [x] Developing reports: dashed amber ring on map, legend entry, popup line, card label, detail banner, verification filter on /alerts.
- [x] Mission text on Home, About (Our mission + How we work + GDELT note), footer one-liner.
- [x] Liveness: "Updated N ago" near map, map data refreshes every 60 s.
- [x] Verify in running site (ticker hidden until headlines exist; /news empty until ingestion runs).

# Security climate upgrade (points 1-7)
- [x] Climate layer on map (posture ring + fill, activity counts, toggle, 24h/7d/14d)
- [x] Rules-based zone scoring + trend (src/lib/climate.ts, tested)
- [x] Activity classification from approved headlines (no database change)
- [x] Home: Threatcon from climate, regions requiring attention, activity stream, data-backed callouts
- [x] Zone briefing pages /regions/$slug
- [x] News type + time filters; ticker category tags incl. developing
- [x] Quality controls: dedupe, place resolution, thresholds, activity alone never CRITICAL
- [ ] 30-day window — blocked: public headline access is limited to 14 days by the database

# Front-end data update (brief)
- [x] Ticker 72h / 60 items, story dedupe, zone + translated tag, fallback under 8 items (alerts kept in ticker)
- [x] News: language filter, day groups, load more on scroll, translated + original headline (max range 14 days)
- [x] Map wording: "No incidents reported in the last 7 days" (current map kept)
- [x] Zone page: status, last updated, alerts with outlets/sources/expiry, official advisories, headlines, 7-day chart; /region/:slug alias
- [x] Alerts sorted by severity then newest, outlet counts and sources
- [x] Footer freshness stamp, "Data feeds are delayed" after 2h
- [x] /how-it-works page

# Support / giving
- [x] Stripe Checkout (card / Apple Pay / Google Pay) with custom USD amount; PayPal removed
- [x] Giving copy uses "Contribute", never "Donate"; button line break fixed on mobile
- [ ] Go live on Stripe — blocked: user is keeping Stripe in test mode for now
