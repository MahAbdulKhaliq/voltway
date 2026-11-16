# EV App: Planning

Working folder for brainstorming an all-in-one EV app that combines:

- **EV database**: vehicle specs (battery, efficiency, charging ports, trims)
- **Route planning**: trips with charging stops
- **Charging curve viewer**: power vs. state of charge, compared across vehicles

## Scope of this folder

Planning only: Markdown files for finding gaps and working out the design. No app code lives here. The app gets built later, once the design is settled.

## Documents

- ⭐ [overview.md](overview.md): **start here.** A one-page summary of the whole design
- [gaps-and-questions.md](gaps-and-questions.md): open questions and gaps, with IDs to refer to them
- [vision.md](vision.md): the owner's vision (market, database, charger map, route planner) and decisions so far
- [roadmap.md](roadmap.md): phases (database first, then map, then routing) and which docs each phase needs
- [data-sources.md](data-sources.md): free public sources for vehicles, curves, images and chargers, with licenses and gaps
- [vehicle-data-model.md](vehicle-data-model.md): vehicle hierarchy, fields, how each figure carries its source, curve storage, matching and source precedence
- [charging-curve-viewer.md](charging-curve-viewer.md): curve viewer inputs, charging maths, results, chart, comparison and estimated-curve templates
- [database-ui.md](database-ui.md): car picker, browse, car page, compare, how sources are shown, style and units
- [phase1-stack.md](phase1-stack.md): Phase 1 needs, a fully static architecture, recommended tools, free hosting and data refresh
- [charger-map.md](charger-map.md): Phase 2 charger map: free map tiles, charger data pipeline, filters, popups, status and Tesla access
- [route-planner.md](route-planner.md): Phase 3 route planner: routing services, energy model, stop rules, charging time, results and warnings
- [competitors.md](competitors.md): what existing tools do well and badly, the gap this app fills, and positioning
- [user-flows.md](user-flows.md): shared state, cross-links between parts and the main user journeys

## Status

Early ideation.
