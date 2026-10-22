# Step 11: ticker, news page, developing reports, mission
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
