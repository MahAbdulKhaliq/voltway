---
version: 1
slug: "src-pages-index-astro"
primary_target: "src/pages/index.astro"
related_targets: []
---

# Surface brief: home (charger map + trip planner)

- **Scope and mode:** `src/pages/index.astro` and its islands. Operate. Part of the whole-site redesign (`docs/plan/DESIGN-4.md`).
- **Audience and job:** an EV owner planning a road trip before leaving, on a phone or laptop.
- **Task:** destination, car, plan; then read total time, stops and any problem at a glance.
- **Content:** real trip data from the planner; real car and charger data. No source badges on the trip result ("~" only, owner decision).
- **Constraints:** WCAG AA, light and dark, i18n dictionary, free tiers, no accounts, standard web controls.
- **Memorable moment:** the plan appearing as one painted yellow line, dashed exactly where there is no charger.
- **Unresolved:** exact light-theme palette; how far small yellow text is allowed.

## Direction contract

THESIS: The trip is a painted line on the road. It refuses the category default of a dark navy map app with a green accent.

OWN-WORLD: Asphalt charcoal surfaces, centre-line yellow for the route and filled primary buttons with dark labels, white stop bars, construction orange for warnings, Archivo with tabular figures. Light theme: pale concrete with the same roles.

STORY: The visitor says where they are going and what they drive, sees how long it takes and where they stop, and trusts it because a missing charger is shown as plainly as a present one.

FIRST VIEWPORT: Full-screen map in Voltway's own asphalt style. Planner card floating top left (destination search, "your car" tile; after planning: trip line, total time as the largest text, then the stop list with the painted line). Navigation pill top right. Map controls bottom right. Phone: bottom sheet with the summary and any gap warning above the fold. Signature interaction: selecting a stop lights it in the list and on the map while chargers off the route dim.

FORM: Road Paint, a grounded direction chosen by the owner from re-roll round 1 (dark steer), not the assigned index. seed:cc8d130713ab8f2a

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
