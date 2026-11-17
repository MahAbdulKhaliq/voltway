# Charger Map

Phase 2 of [roadmap.md](roadmap.md). A simple map of public Level 2 and Level 3 chargers in Canada, with plug types, kW range filters (B35) and plug filters. Covers N3, N5, N7 and the map part of S3 in [gaps-and-questions.md](gaps-and-questions.md). The power bands in [vision.md](vision.md) ("Power bands") set where the slider stops sit.

*Researched 2026-11-15. Free-tier terms change, so re-check them at build time.*

---

**Where it lives (B26, 2026-11-16):** the map is the **home page**; the Charging tab moves to `/charging`.

## 1. Goals

- **Show every public Level 2 and Level 3 charger in Canada** on one fast map.
- **Simpler than PlugShare:** level checkboxes, then a kW range slider per level (B35, replacing the original power bands), then plug types.
- **Stay inside the Phase 1 setup:** a static site and free hosting. **No server.**
- **Tie into the car database:** ~~"Show only chargers my car can use"~~ *(superseded by B55, 2026-11-17: the map box was removed; My car's plug switches drive trip planning, and the station panel still says whether the car can use a station).*

---

## 2. Map building blocks (S3, map part) ✅

| Part | Choice | Why | Fallback |
|------|--------|-----|----------|
| **Map library** | **MapLibre GL JS** | Open source, fast vector maps, built-in marker clustering | Leaflet (simpler, raster tiles) |
| **Base map tiles** | **[OpenFreeMap](https://openfreemap.org)** | Free, **no API key, no registration**, and no published view limits. OpenStreetMap data. | **Self-hosted Protomaps** (below) |
| **Fallback tiles** | **Protomaps PMTiles** extract of Canada, stored on **Cloudflare R2** | A single static file, no server. R2's free tier (10 GB storage, free egress) should fit a Canada extract, though the exact size isn't confirmed. | A paid tier from a tile provider, if ever needed |
| **Attribution** | "© OpenStreetMap contributors" + tile provider + charger data sources | Required by the licenses | n/a |

**Look (B53, 2026-11-17):** the map uses Voltway's own colours, "Road Paint": asphalt charcoal land in dark, pale concrete in light, with stronger roads and place names at regional zoom. The tiles, fonts and layer list still come from OpenFreeMap's hosted styles; the site fetches the style and recolours every layer before the map draws it (`src/lib/map-style.ts`). A layer no rule knows keeps its own colour, and if the style can't be recoloured the map falls back to the hosted style as it is. The attribution is unchanged.

**Caveat:** OpenFreeMap is offered as-is, with no uptime guarantee, and is funded by donations. Using **MapLibre** keeps the switch to the Protomaps fallback a configuration change, not a rewrite.

**What this means for "Canada vs. Ontario only":** map tiles **don't force Ontario-only**. Both options are free for all of Canada. **Phase 2 covers all of Canada.** Routing (Phase 3) is the remaining cost question.

---

## 3. Charger data

### Source: AFDC, Canada only ✅

*Renamed 2026-11-16:* NREL is now the **National Laboratory of the Rockies (NLR)**, and the API host moved from `developer.nrel.gov` (retired 2026-05-29) to **`developer.nlr.gov`**. Same paths and fields. Rate limit confirmed at 1,000 requests per hour per key.
From [data-sources.md](data-sources.md) §5. The fields this design uses:

| Field | Used for |
|-------|----------|
| `ev_level2_evse_num`, `ev_dc_fast_num` | **Level** (Level 2 vs. Level 3). Stations with only Level 1 are dropped. |
| `ev_charging_units` → `connectors` → `power_kw`, `port_count` | **kW range filter** (B35) and port counts per plug |
| `ev_connector_types` | **Plug filter:** `J1772`, `J1772COMBO` (CCS1), `TESLA` (NACS), `CHADEMO` |
| `ev_network` | Network name: the source calls Superchargers "Tesla" and destination chargers "Tesla Destination" |
| `access_code`, `access_detail_code`, `restricted_access` | Hide private stations. Flag "customers only" and limited hours. |
| `status_code` | Available / planned / temporarily unavailable (§6) |
| `ev_pricing` (+ `ev_pricing_fr`) | Pricing text, shown as given |
| Name, address, coordinates, `updated_at`-style date | Popup and "last updated" note |

**Access:** a free API key from developer.nlr.gov (1,000 requests per hour), stored as the GitHub Actions secret `NLR_API_KEY`. One pull a day is plenty.

**Licence (B30, 2026-11-16):** used under NLR's data terms (free to use and copy, credit DOE/NLR, no endorsement). Credits name DOE/NLR and NRCan. Network name note: Superchargers appear as network **"Tesla"**, not "Tesla Supercharger"; Destination chargers as "Tesla Destination".

### Pipeline (same static pattern as Phase 1)
```
Scheduled GitHub Action (monthly, B36; also by hand)
   → pull all Canadian electric stations from AFDC
   → keep public Level 2 / Level 3, drop Level 1-only and private
   → assign level and plugs per station, keeping each port's rated kW for the range filter (rules in vision.md)
   → sanity checks (below)
   → write map data files → deploy with the static site
```

**Size:** about 15,000 Canadian charging locations (NRCan reported ~14,700 in March 2026). As compact map data that's a few MB, so it can ship as **static files**. If it gets large, split it into one Level 2 file and one Level 3 file, so Level 3 (the smaller set, more often wanted) loads first.

### Automatic checks instead of human review
Phase 1's rule is "a person approves every change". That doesn't work for thousands of stations changing between pulls, so the map relies on **automatic checks**:
- **Stop the update** if the station count drops by more than **10%** from the last good pull (likely an API problem, not real closures).
- **Stop the update** if required fields go missing across many stations.
- Otherwise, publish automatically and log what changed.

**How it goes live (B27, 2026-11-16):** the scheduled Action (monthly since B36) opens a pull request with the change summary, runs the full CI steps itself, and **merges it automatically** when the sanity checks and CI pass. If anything fails, the PR stays open and the run fails so the owner is notified. This exception to "a person approves" covers charger data only; vehicle data keeps human review.

### Open Charge Map: later, not v1 (N7) ✅
- **v1 uses AFDC only.** One source keeps the data simple and avoids duplicate stations.
- **Later**, if AFDC turns out to be missing networks: add Open Charge Map to fill gaps. **Duplicate rule (proposal):** same network, within ~50 m, and overlapping plug types means one station. Prefer AFDC's record and add any OCM-only ports.

---

## 4. Filters

### Level and power (kW range sliders, B35 ✅)
```
☑ Level 3 (fast)                    ☐ Level 2 (slow)
    Power: Any power                    (slider appears when ticked)
    ●━━━━━━━━━━━━━━━━━━━━━━━━●
    0   50  100  150  250  350  Max
```
- **Default: Level 3 on, Level 2 off (N8 ✅, decided 2026-11-15).** Most people open a charger map looking for fast charging, and Level 2 more than triples the number of pins. The user's own filter choice is saved in the browser.
- **One two-handle kW slider per level** (decided 2026-11-16, B35; it replaced the power-band checkboxes). It appears only when its level is ticked and covers the full range by default.
- **Stops** (the handles snap to these, in kW): Level 2: 0, 3.6, 7.2, 11.5, 19.2, Max. Level 3: 0, 50, 100, 150, 250, 350, Max. "Max" means no upper limit, so ports listed above the top figure are never lost. The stops sit on the old band edges, plus 150 and 350 for Level 3, where much hardware sits.
- A port matches when **min ≤ its rated kW ≤ max** (both ends included, so "50 kW and up" includes 50 kW units). The handles can't cross or meet.
- **Unknown power:** ports with no kW figure match only while the slider covers its **full range**. Once the range is narrowed, a short note under the slider says they're hidden.
- The current range is written above the slider in words: "Any power", "Up to 100 kW", "50 kW and up", "50–150 kW". Each handle has its own label and spoken value for screen readers, and arrow keys move it one stop.
- A site shows if **any** of its ports match the level, the kW range and a ticked plug.

### Plugs
☑ CCS1 ☑ NACS ☑ CHAdeMO ☑ J1772. All on by default.

### ~~"Chargers my car can use"~~ (removed by B55, 2026-11-17)
*Superseded: the map no longer has this box. My car's NACS / CCS1 / CHAdeMO switches drive trip planning instead (see §5). The history below is kept for the record.*

- **Moved to Phase 1b (B28, 2026-11-16):** built together with My car (checklist 5.2), since My car doesn't exist yet. The map ships without it.
- A toggle that appears when **My car** is set (from Phase 1).
- It filters by the car's `charge_port` and **supercharger_access** from the data model (B38, 2026-11-16: `adapters_included` isn't researched yet, so it is not used; it can refine this later).
- Example: a CCS1 car with Supercharger access through an adapter sees CCS1 sites **and** Superchargers, with Superchargers marked "needs adapter".
- **NACS cars also see J1772 sites (B42, 2026-11-16):** most come with a J1772 → NACS adapter. A note about that adapter in the station panel is *later* (TD-P12).

*Phase 4 (2026-11-17, DESIGN-4 4.9):* the filters open from one "Chargers" control that shows how many filters are on. While this toggle is ticked, the plug boxes for plugs the car can't use are shown unticked and locked, with a one-line note, so the two never disagree.

### Network
*Later:* filter by network (Tesla, FLO, Petro-Canada, Electrify Canada, Circuit électrique, ChargePoint…). It's a useful filter but not part of the simple v1 set.

### Other
- **Hide "customers only" and limited-hours sites:** *later.* In v1 they're shown with a warning in the popup.

---

## 5. Pins, clusters and popups

### Pins
- **Shape and colour by level:** a bolt icon for Level 3 and a plug icon for Level 2, so the level is never shown by colour alone.
- **Clusters** when zoomed out, showing a count. Clicking a cluster zooms in. Chargers stay grouped **up to zoom 15** so downtown pins don't pile up (B57 ✅, 2026-11-17). **(B54, 2026-11-17)** The cluster disc is split by a vertical line into a white Level 2 part and a yellow Level 3 part, in proportion to the counts.
- **B55 (2026-11-17) supersedes the split fill:** a cluster is a dark disc with a pale count, its ring divided into a white Level 2 arc and a yellow Level 3 arc in proportion. Speed bolts and plug drawings show only on groups of fewer than 20 and on single pins. **Tesla Superchargers** have a red Level 3 pin with a Tesla-style T; Tesla Destination (Level 2) pins stay white with the T. The map's "Chargers my car can use" tick box is removed; My car's plug toggles (NACS, CCS1, CHAdeMO) drive trip planning instead.
- **B60 (2026-11-17):** no place card after a "Where to?" pick: the search's Plan trip plans to that place, and its fast-charger count shows under the search.
- **B59 (2026-11-17), phones:** Map key and Locate me are 44 px round icon buttons; the map credits fold into a compact ⓘ; the panel is a draggable bottom sheet (peek, half, full) over a full-height map; zoom buttons hide on touch screens.
- **B58 (2026-11-17):** speed bolts and plug drawings show only from zoom 9 in, on groups and pins alike, no longer tied to the group size (replaces the "fewer than 20" rule of B55). The map's "Choose your car" prompt is removed; the header's "Pick your car" dialog is the one car picker.
- **At-a-glance marks (B54):** speed bolts top right of a cluster or Level 3 pin from the fastest known Level 3 port (1 bolt ≤ 75 kW, 2 ≤ 150 kW, 3 above; none when unknown) and tiny plug drawings stacked on the left (CCS1, NACS, CHAdeMO, J1772, stacked). A **Map key** toggle above Locate me explains every mark.
- **Status shown on the pin:** a greyed pin with a small mark for "temporarily unavailable" (§6).

### Popup (bottom sheet on phones)
| Section | Content |
|---------|---------|
| Header | Station name, network, level badge |
| **Ports** | One line per plug and power: "**2 × CCS1 · 180 kW**", "1 × CHAdeMO · 50 kW", "4 × NACS · 250 kW" |
| Access | Public / customers only / limited hours. **Tesla note** where it applies (§7) |
| Pricing | The text as provided, or "Not listed" |
| Status | Available / temporarily unavailable (with the expected date only while it is in the future, B32) |
| **Directions** | "Open in Google Maps" / "Open in Apple Maps" links. **No in-app navigation in v1.** |
| Footer | "Data: NRCan / NLR AFDC · updated [date]" |

### Finding a place
- **"Where to?" box (B50 ✅, 2026-11-16):** instant suggestions from the GeoNames place list (B45), "Search full address" on press. Picking a place flies the map there and opens a **place card**: the place name, the number of fast chargers nearby, and **Route here**, which starts the trip planner on this map ([route-planner.md](route-planner.md) §1).
- **"Locate me":** uses the browser's location. **On load the map locates the visitor** (B56 ✅, 2026-11-17): the browser asks for permission the first time; skipped when a trip link opens the planner or permission was refused before. Nothing is stored. A later pan or zoom saves the view as usual, even near the user's location (B33 ✅, 2026-11-16).

### Stations in view (B34 ✅, 2026-11-16)
- Pins are drawn on a canvas, which keyboards and screen readers can't reach. So the filter panel has a **"Stations in view"** list: the stations that match the filters inside the current map view, **nearest the map centre first, capped at 50**, with a line saying how many are listed when there are more.
- Each item is a button showing the station name, its level and top power, and its city. Choosing one opens its station panel and centres the map on it.
- The list opens with a toggle button under the station count and updates when the map stops moving. When the view holds too many stations, it says to zoom in.
- **Wide screens (over 640 px) first.** On phones the panel and the bottom sheet compete for space; a phone version may follow (TD-P11).
- **Search by place name: not in v1 (B29, 2026-11-16); superseded by the "Where to?" box (B50, Phase 3).** v1 had "Locate me" plus pan and zoom; Phase 3 added place and address search in the "Where to?" box above. *Original proposal:* v1 uses a **static list of Canadian places** (cities, towns), so no search service is needed. GeoNames (CC BY 4.0) is one possible source. Full address search comes with routing in Phase 3 (S6).
- **Default view:** the user's last map position (saved in the browser), or else a view of southern Ontario and Québec, where most chargers are.

---

## 6. Status (N5) ✅

- **No live availability** ("in use", "free now") in v1. That data is usually paid or network-specific.
- AFDC gives a slower status, which is shown:
  - **Available:** normal pin
  - **Temporarily unavailable:** greyed pin, with the expected reopening date **only while that date is still in the future** (B32 ✅, 2026-11-16). Most dates in the source have already passed, and a past date would mislead.
  - **Planned:** **hidden by default.** *Later:* a "Show planned" toggle
- Every popup says **when the data was last updated**, so people know it isn't live.

---

## 7. Tesla Supercharger access (N3) ✅

**The problem:** a NACS plug on a site doesn't mean every car can use it. Many Superchargers are open to non-Teslas (usually with an adapter and the Tesla app), but not all. **AFDC doesn't seem to record which sites are open to other cars.**

**v1 approach, kept simple and honest:**
- Tesla **Supercharger** sites are shown with a note: "**Tesla network.** Non-Tesla access varies by site and usually needs the Tesla app and possibly an adapter. Check the Tesla app."
- *Phase 1b (B28):* the two My car variations below come with My car. v1 always shows the generic note.
- If **My car** is a Tesla, the note is hidden.
- If **My car** has `supercharger_access: via adapter`, the note says "Your car can use Superchargers **with an adapter** where the site is open to non-Teslas."
- **Tesla Destination** sites (Level 2) get a short note that some are customers-only.
- *Later:* look for an open source of per-site non-Tesla access (N9).

---

## 8. Out of scope for Phase 2 v1

- Live availability
- Open Charge Map as a second source
- Network filter, "hide restricted" filter, "show planned" toggle
- Place-name and address search (Phase 3, B29)
- "Chargers my car can use" and My-car Tesla notes (Phase 1b, B28)
- The "Find chargers this fast" and "How fast would my car charge here?" links (Phase 1b, B31)
- Directions inside the app (Phase 3 covers trips, and v1 links out to Google/Apple Maps)
- Reviews, photos, check-ins (PlugShare-style community features)
- Level 1 chargers

---

## 9. Questions resolved here, and new ones

**Resolved:** N3 (v1 approach), N5, N7, N8 (Level 3 only by default), S3 for map tiles (routing stays open).

**New:**
| ID | Question |
|----|----------|
| N9 | Is there an open source for **which Superchargers are open to non-Teslas** in Canada? |
| S6 | **Address search (geocoding)** for Phase 3: which free service? The public Nominatim service has a strict usage policy. |
