# Finish review: Phase 4 "Road Paint" (item 4.19)

Date: 2026-11-17. Reviewer: main session, impeccable `document` pass plus the evidence below.

## Verdict: SHIP

The built site matches the Road Paint direction in `docs/plan/DESIGN-4.md` and the owner decisions B52–B57. No blocking issues remain.

## Evidence
- **Accessibility:** axe (wcag2a, wcag2aa, wcag21a, wcag21aa) finds no serious or critical violations on any page or map state, at 1280 and 375 px, in dark and light (`ui-check-4.17.md`, after the Map key focus fix).
- **QR checks:** QR1–QR28 pass (results in QA.md; the 4.17 gaps in coverage were run in ui-check-4.20.md, except an offline reload). QR22 passes with this item: root `DESIGN.md` and `.impeccable/design.json` describe the built tokens and components.
- **Item checks:** each B54/B55/B56 item was checked in the browser (`ui-check-4.21-4.25.md`, `ui-check-4.26-4.30.md`, `ui-check-4.15-4.16.md`, `ui-check-4.12-4.14.md`).
- **Owner phone test (4.18):** passed, nothing to fix.
- **Contrast:** every colour pair set together in CSS, plus map marks and the trip line, is covered by `tests/contrast.test.ts`.

## Against the direction contract
- **Thesis (the trip is a painted line):** met. Yellow is kept for the trip, the primary action and the current page. Chargers turn grey during a trip (B54), so the route is the only yellow on the map.
- **Own world:** asphalt and concrete surfaces, centre-line yellow with ink labels, white stop bars, construction orange only for warnings, and Archivo with tabular figures. The light theme uses dark amber for yellow-role text.
- **First viewport:** full-screen map, planner card top left (a bottom sheet on phones), the floating nav pill top right on every page, and map controls bottom right.
- **Signature interaction:** selecting a stop lights it in the list and on the map (4.11).
- **Refused default:** no navy-and-green map-app look. There is no blue, teal or green chrome (QR1).

## Left as minor (not blocking; logged in `.claude/HANDOFF.md`)
- The map's plug filter boxes and My car's plug switches are separate settings (B55 keeps them apart). A driver might expect them to match.
- `/about` says "trip planner's" in lower case where the UI says "Trip".
- At 375 px with a charger limit set, the chart's limit label crosses the curve and the "Estimated" label. It is readable but crowded.
- The open Map key covers the map credits.
- A long gap warning makes the folded trip sheet run about 28 px past an 812 px phone screen. The sheet still scrolls.
