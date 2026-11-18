# Phase 5 build plan: Drive mode handoff and route options (B72–B74, 2026-11-17)

Owner approvals (2026-11-17): hand navigation to Google Maps and Apple Maps, leg by leg by default and the whole trip at once when the limits allow (**B72**); route options in Settings, avoid tolls and avoid highways (**B73**); trips stay within Canada, always on for now (**B74**). Checklist items are tagged **[5]** in `CHECKLIST.md`; checks are in `QA.md` Phase 5.

R7 stays as decided: Voltway plans before the trip and links out. There is **no turn-by-turn inside Voltway** and no background tracking. B53's "later Drive mode" is narrowed to this handoff screen.

---

## 1. Drive mode (B72)

### Where it appears
Only when a trip is planned and on screen (the Trip panel in `RoutePanel.tsx` / `Itinerary.tsx`). A full-width **Drive** button sits under the car line (after the cost). It opens a **Drive** view in the same panel (it slides in like the Trip panel, B67; on phones the sheet opens at half). A back arrow returns to the trip; Close leaves Drive and the trip as the Trip close does.

### Drive view, top to bottom
1. **Next stop** (large): `Stop 2 of 4 · Petro-Canada, Kingston`, then `148 km · arrive ~2:45 pm`, then `Arrive 22 % → charge to 80 % · ~24 min · ~$11.80`. After the last stop the "next stop" is the destination (`Arrive with 31 %`).
2. **Navigate to this stop**: two big buttons, **Google Maps** and **Apple Maps**, each opening that app with the next stop as the destination.
3. **Whole trip** (only when allowed, §1.3): `Open the whole trip in Google Maps / Apple Maps`, a quieter pair of buttons.
4. **Stop list with progress**: start, each stop and the destination, as in the trip; reached stops are ticked and dimmed, the next one is marked "Next". Each stop has **Mark as reached** (or **Not reached yet** to undo), so progress works with location off.
5. A short note: "Google Maps and Apple Maps can't show Voltway's chargers. Only your planned stops are sent to them." and "Location is used only while this page is open."

Distances follow km / mi; times are local clock times; everything else (charge %, cost, ~ for estimated curves) comes from the existing plan, nothing new is stored.

### 1.1 Links (one module: `src/lib/nav-links.ts`; `directionsUrls` in `station-details.ts` moves there and is reused by the station panel)
Coordinates only (lat,lng, 5 decimals), so no names or addresses leave the page.

| Link | Google | Apple |
|---|---|---|
| **Next stop** | `https://www.google.com/maps/dir/?api=1&destination=LAT,LNG&travelmode=driving&dir_action=navigate` | `https://maps.apple.com/directions?destination=LAT,LNG&mode=driving` (+ `&avoid=tolls,highways` per B73) |
| **Whole trip** (remaining stops) | `…/maps/dir/?api=1&destination=END&waypoints=S1|S2|S3&travelmode=driving` (no `dir_action`, no `origin` = from where you are) | `https://maps.apple.com/directions?destination=END&waypoint=S1&waypoint=S2…&mode=driving` (+ avoid) |
| **Station panel** (existing, unchanged behaviour) | `…/maps/dir/?api=1&destination=LAT,LNG` | `https://maps.apple.com/?daddr=LAT,LNG` → moves to the new Apple form |

**Why these forms**
- Google: the Maps URLs API is the documented cross-platform form. `dir_action=navigate` starts navigation where the device allows; the docs don't say whether it works together with waypoints, so the whole-trip link leaves it out and Google shows the route preview with a Start button (one extra tap, never a broken link).
- Apple: Apple now documents **unified Maps URLs** (iOS 18.4 / macOS 15.4 and later) with a `/directions` path, `destination`, a repeatable **`waypoint`** for multi-stop routes, `mode=driving` and `avoid=tolls,highways`. That replaces the community-reported repeated-`daddr` form, which is undocumented, and Apple's forum reports that plain `daddr=lat,lng` has changed behaviour on recent iOS. On older Apple devices or other systems the link opens Apple Maps on the web.
- Google's URL API has **no avoid option**, so B73's choices can't travel to Google; the Drive note says so when an option is on: "Google Maps picks its own roads between stops. Apple Maps gets your Avoid choices."

### 1.2 Whole-trip limits
The **remaining** stops travel as waypoints, the destination as the destination, and the start is "where you are now".

| App | Documented limit | Voltway offers whole trip when the remaining stops are | Why |
|---|---|---|---|
| Google | 3 waypoints in mobile browsers, 9 elsewhere; URL ≤ 2,048 chars | **≤ 3** | Drive mode is used on phones, and a phone browser hands the link to the app. Detecting "mobile browser" reliably isn't possible, so the lowest documented limit is used everywhere. Over the limit Google silently drops waypoints, which would hide charging stops. |
| Apple | no number documented; the Maps app's own multi-stop limit is 14 stops plus the destination | **≤ 9** | A margin below the app's own limit, and the same top number as Google's documented desktop limit. Our longest real test trip (Toronto → Halifax) has 10 stops. |

With more remaining stops than the limit, that app's whole-trip button is hidden (not disabled) and a line says "Too many stops to send at once. Go stop by stop." As stops are reached, the remaining count falls and the button appears.

### 1.3 Progress from location (foreground only)
- Drive asks for location only when opened (the same permission the map's Locate me uses). It uses `watchPosition` **while the page is visible**; it stops on `visibilitychange` → hidden and on leaving Drive. Nothing about the position is stored (B56, B69).
- Each fix is projected on the route (`route-geo.ts` `project`). A stop counts as **reached** when the car is within **1 km** of it, or the projection is at least **2 km past** the stop's place along the route while within **5 km** of the line. Reached stops never un-tick by themselves (only by "Not reached yet").
- **Distance to the next stop:** with a good fix (on the route), the route distance from the projection to the stop; otherwise the planned leg distance. **Arrive ~time:** now + that distance's share of the leg's drive time.
- With location refused or unavailable: a quiet line "Location is off. Mark stops as you reach them." and the manual buttons.

### 1.4 Coming back to the page
A phone browser may reload the page after a trip to the maps app. So Drive keeps **in `sessionStorage` (this tab only, gone when the tab closes)** the trip's ends, battery settings, route options and which stops are reached, and reopens Drive on reload. That re-asks `/api/route` once (the CDN usually answers from cache). On Exit / Close the entry is deleted.
*This is an exception to B62 ("never where a trip started"): the start is held for the open tab only, never in `localStorage`. Approved by the owner 2026-11-17.*

### 1.5 Screen awake
While Drive is open and the page is visible, Drive holds a **Screen Wake Lock** (`navigator.wakeLock.request('screen')`), re-requests it when the page becomes visible again (the browser drops it when hidden), and releases it on leaving Drive. Where the API is missing, nothing is shown.

---

## 2. Route options in Settings (B73, B74)

### 2.1 What ORS supports (checked 2026-11-17)
| Need | ORS directions option | Source |
|---|---|---|
| Avoid tolls | `options.avoid_features: ["tollways"]` (driving profiles) | ORS routing-options docs |
| Avoid highways | `options.avoid_features: ["highways"]`; staff say this means OSM `highway=motorway` and `motorway_link` | ORS docs; ORS forum (2024) |
| No border crossings | `options.avoid_borders: "all"` (driving profiles) | ORS docs |
| Avoid a country | `options.avoid_countries: [214]` (United States is 214, Canada 35) | ORS docs and country list |
| Geocoding in Canada only | `boundary.country=CA` | **already in use** (`ors.ts`) |

Limits on the hosted API: 6,000 km per route, 50 waypoints; the **150 km limit applies to avoid *polygons*** only, not to `avoid_features` or `avoid_borders`. With an avoid option ORS switches to a slower algorithm that respects turn restrictions, so answers may take longer (our 20 s timeout stays). A first long test trip with each option confirms this before the item is ticked.

**Charging stops with highways avoided:** stops are picked from chargers near the route line (2 km, widening to 10 km), whatever roads the line uses, so the planner needs no change. Trips get longer and slower and some highway service-centre chargers drop out; the energy model keeps its highway figure (conservative on slower roads). Tested with one avoid-highways trip.

### 2.2 Settings
Under the existing rows of the Settings gear (B65), a **Route** group:
- **Avoid tolls**: switch, off by default.
- **Avoid highways**: switch, off by default.
- **Stay in Canada**: switch shown **on and disabled**, with "Trips outside Canada aren't supported yet."

Stored in `localStorage` as `voltway.routeOptions` = `{ avoidTolls, avoidHighways }` (`storage.ts` KEYS). Changes fire a `voltway:routeOptions` event like the price setting. The trip form shows a one-line summary when any option is on ("Avoiding tolls, highways · Change"), which opens Settings.

### 2.3 Request and validation
- `/api/route?from=…&to=…&avoid=tolls,highways` (`avoid` optional; only `tolls` and `highways`, each at most once, any order → sorted so the CDN cache key is stable). Anything else → **400 badRequest**.
- The function always sends `avoid_borders: "all"` (B74), plus `avoid_features` from `avoid`.
- **Ends outside Canada (B74):** the function checks both ends against a Canada outline **before** calling ORS (no ORS call spent) and answers **422 `{ error: "outsideCanada", end: "from" | "to" | "both" }`**. The trip form then shows "Trips outside Canada aren't supported yet. Pick a start in Canada." (or destination) instead of a trip.
  - **Outline:** Natural Earth Admin 0 countries, 1:10m v5.1.2 (public domain), Canada only, bundled with the function (not sent to browsers; about 460 KB). The land border (points Natural Earth shares with the US and Saint-Pierre-et-Miquelon) is kept to about 20 m, the coast simplified to about 300 m. North of 60.5° N the only land neighbour is Alaska, so there the rule is simply "east of 141° W", and the Arctic islands are left out of the file.
  - **Slack:** an end up to **0.5 km** outside the land border counts as in Canada (border towns, river crossings; ORS then decides), and up to **3 km** outside the coast when it is more than 5 km from the land border (the simplified coast misses headlands such as Tofino). Point Roberts, Blaine and Calais stay outside. *(Changed while building, 2026-11-17: the plan said 200 m simplification and 1 km slack everywhere; at 1 km downtown Detroit counted as Canada and the coast needed more room.)*
  - A trip that ORS can't route without crossing the border (e.g. Campobello Island) gets the normal "no route" message.
- Route options are part of the ends key (`useTrip.ts`), so a changed option counts as a new trip: with a trip on screen it re-plans once on its own (one `/api/route` call); on the form, "Return to plan" turns into "Plan trip".
- Share links don't carry route options (the receiver's own Settings apply).

---

## 3. Words
All new text goes in `src/i18n/en.json` (`drive.*`, `settings.route*`, `trip.err.outsideCanada*`). Button labels stay short (B68).

## 4. Not in this phase
Turn-by-turn, re-planning during the drive, live battery, background tracking, avoid options for Google, Level 2 stops, routes in the US.

## 5. Owner decisions (approved 2026-11-17)
1. Apple's documented unified URL (`maps.apple.com/directions?…&waypoint=…`) instead of the community `daddr` form, for the station panel too. ✅
2. Whole-trip limits: Google ≤ 3 remaining stops, Apple ≤ 9. ✅
3. `sessionStorage` (tab only) for Drive, an exception to B62. ✅
4. Natural Earth Canada outline as a new data source for the "outside Canada" check. ✅

## 6. Charging past 80 % before a long stretch (B75, owner 2026-11-18)
`src/lib/trip-plan.ts`: the stop choice is now a pure `choose(pos, soc)`. Before charging at a stop, `departFrom` looks one step ahead from 80 %: if the destination is reachable, or the next stop would be in the usual window (near or wide), it keeps 80 %. If the next stop would only be an "earlier" short hop, or there is none, it charges to reach the first charger past the car's reach (or the destination) with the threshold left, plus both detours, rounded up and capped at 100 %. A stop never departs below its arrival level. Each stop shows its own `departSoc`; the assumptions line says "more before a long stretch with few chargers".
