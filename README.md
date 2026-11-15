# Voltway

Voltway is a free, no-login website for EV drivers and shoppers: trustworthy EV specs and charging curves where **every figure shows its source**.

Current coverage: EVs sold in Canada, with official ratings from Natural Resources Canada (NRCan). The data model and UI are built so more markets can be added.

Phase 1 (in progress): vehicle database + charging curves. A charger map and a trip planner follow in later phases.

- Live site: https://voltway-ten.vercel.app/
- Static site built with [Astro](https://astro.build), hosted on Vercel.
- Vehicle data is stored as JSON in this repository and validated against JSON Schemas in `schema/` at build time.
- Build plan: [`docs/plan/`](docs/plan/).

## Data sources and credits

Full credits will appear on the site's About & sources page. Data used:

- **NRCan Fuel Consumption Ratings (BEV)**, Natural Resources Canada. Open Government Licence – Canada.
- **OpenEV Data**. CDLA-Permissive-2.0.
- **Open EV Data (Chargeprice, archived)**, charging curves derived from Fastned's published charts. MIT License.

*Exact attribution text to be filled in from each license when the importers are built.*
