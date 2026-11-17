# Product

<!-- impeccable:product-schema 1 -->

Product truth for design work. The full design lives in `docs/design/` (start with `overview.md`; `vision.md` wins on conflicts). This file summarises it and does not replace it.

## Platform

web

## Users

- **Primary (owner decision B52, 2026-11-16): an EV owner planning a trip.** They already drive an EV and, before leaving, want to find chargers or plan a road trip with fast-charging stops. They use a phone or a laptop.
- **Also served:** EV shoppers comparing cars, and enthusiasts who want charging curves and sources. One interface in three layers: headline → full specs → sources.
- **Portfolio visitors:** Voltway is a personal tool and portfolio piece (P5), so a reviewer may open it briefly. Polish goes where a visitor looks first.

## Product Purpose

A free, no-login website for EV drivers: a simple trip planner and charger map, running on source-labelled EV specs and charging curves. Success is a driver getting a clear, honest before-the-trip plan (stops, charging times, warnings) for their own car, without an account.

Always non-commercial: no ads, payments or paid tiers. It is also a learning project for the owner (Astro, Vercel, web maps).

## Positioning

**The trip planner leads (B52).** Voltway is first a simple, free trip planner and charger map; the car database supports it. What a neighbouring product could not copy truthfully: the planner and map run on the same open, source-labelled vehicle data, and every figure shows where it came from, including when it is an estimate.

The planner is deliberately simpler than A Better Routeplanner: a threshold rule (drive to about 15 %, charge to 80 %), not an optimiser.

## Operating Context

- Used before a trip, not while driving. No turn-by-turn navigation.
- No accounts. The chosen car, units, theme and last trip are saved only in the visitor's browser.
- Screens: the home page is the charger map with the trip planner on it (B26, B50); Cars (browse and car pages); Charging (curve viewer); Compare; About.
- Data covers Canada today (NRCan ratings, AFDC chargers). Branding is market-neutral (B12) and the site states its coverage openly.

## Capabilities and Constraints

- Fully static Astro site with React islands, ECharts, MapLibre with OpenFreeMap tiles. One Vercel Function for routing (openrouteservice free plan, 30 route calls per visitor per 10 minutes).
- Everything must fit free tiers.
- **No bare numbers:** every vehicle figure is a sourced value with a kind (Official (Canada), Official (US), Manufacturer, Tested, Community, Estimated). "Unknown" is allowed.
- Estimated curves are shown as estimates: dashed line, "Estimated" badge, rounded times.
- Metric internally; a km/mi switch on screen.
- All on-screen text comes from the i18n dictionary (`src/i18n/`). English now, French later.
- Charger data is static and refreshed monthly. No live availability, no pricing comparison, no community reviews.
- Out of scope for v1: winter effects, waypoints, user-set charge target, smart stop selection, Level 2 trip stops.

## Brand Commitments

- The name **Voltway** stays, with market-neutral branding (B12).
- **Source badges stay on every vehicle figure.**
- **Light and dark themes** are both supported.
- Honest wording: the site says "estimate" where figures are estimates and does not claim live or real-world data it lacks.

## Evidence on Hand

- Real vehicle data in `data/`, charger data in `public/data/map/`, link-preview image `public/og.png`.
- Competitor notes in `docs/design/competitors.md`.
- No testimonials, user counts, press or benchmarks exist. Do not invent any.

## Product Principles

1. The planner is the front door; the data is why it can be trusted.
2. Simple and clear beats complete: right enough and easy to understand.
3. Show the source, and say plainly when something is an estimate or unknown.
4. No account, no cost, nothing stored about the visitor on a server.
5. A wrong range estimate can strand someone: stay conservative and keep warnings visible.

## Accessibility & Inclusion

WCAG AA. Keep passing the axe checks from the polish pass (contrast, keyboard use, target sizes), in both themes and at phone width.
