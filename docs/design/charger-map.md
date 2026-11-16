# Charger Map

Phase 2 of [roadmap.md](roadmap.md). A simple map of public Level 2 and Level 3 chargers in Canada, with plug types and power-band filters. Covers N3, N5, N7 and the map part of S3 in [gaps-and-questions.md](gaps-and-questions.md). The power bands and their rules are already set in [vision.md](vision.md) ("Power bands").

*Researched 2026-11-15. Free-tier terms change, so re-check them at build time.*

---

**Where it lives (B26, 2026-11-16):** the map is the **home page**; the Charging tab moves to `/charging`.

## 1. Goals

- **Show every public Level 2 and Level 3 charger in Canada** on one fast map.
- **Simpler than PlugShare:** level checkboxes, then power bands, then plug types. No kW slider.
- **Stay inside the Phase 1 setup:** a static site and free hosting. **No server.**
- **Tie into the car database:** "Show only chargers my car can use".

---

## 2. Map building blocks (S3, map part) ✅

| Part | Choice | Why | Fallback |
|------|--------|-----|----------|
| **Map library** | **MapLibre GL JS** | Open source, fast vector maps, built-in marker clustering | Leaflet (simpler, raster tiles) |
| **Base map tiles** | **[OpenFreeMap](https://openfreemap.org)** | Free, **no API key, no registration**, and no published view limits. OpenStreetMap data. | **Self-hosted Protomaps** (below) |
| **Fallback tiles** | **Protomaps PMTiles** extract of Canada, stored on **Cloudflare R2** | A single static file, no server. R2's free tier (10 GB storage, free egress) should fit a Canada extract, though the exact size isn't confirmed. | A paid tier from a tile provider, if ever needed |
| **Attribution** | "© OpenStreetMap contributors" + tile provider + charger data sources | Required by the licenses | n/a |

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
| `ev_charging_units` → `connectors` → `power_kw`, `port_count` | **Power bands** and port counts per plug |
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
Scheduled GitHub Action (daily)
   → pull all Canadian electric stations from AFDC
   → keep public Level 2 / Level 3, drop Level 1-only and private
   → assign level, power bands and plugs per station (rules in vision.md)
   → sanity checks (below)
   → write map data files → deploy with the static site
```

**Size:** about 15,000 Canadian charging locations (NRCan reported ~14,700 in March 2026). As compact map data that's a few MB, so it can ship as **static files**. If it gets large, split it into one Level 2 file and one Level 3 file, so Level 3 (the smaller set, more often wanted) loads first.

### Automatic checks instead of human review
Phase 1's rule is "a person approves every change". That doesn't work for thousands of stations changing daily, so the map relies on **automatic checks**:
- **Stop the update** if the station count drops by more than **10%** from the last good pull (likely an API problem, not real closures).
- **Stop the update** if required fields go missing across many stations.
- Otherwise, publish automatically and log what changed.

**How it goes live (B27, 2026-11-16):** the daily Action opens a pull request with the change summary, runs the full CI steps itself, and **merges it automatically** when the sanity checks and CI pass. If anything fails, the PR stays open and the run fails so the owner is notified. This exception to "a person approves" covers charger data only; vehicle data keeps human review.

### Open Charge Map: later, not v1 (N7) ✅
- **v1 uses AFDC only.** One source keeps the data simple and avoids duplicate stations.
- **Later**, if AFDC turns out to be missing networks: add Open Charge Map to fill gaps. **Duplicate rule (proposal):** same network, within ~50 m, and overlapping plug types means one station. Prefer AFDC's record and add any OCM-only ports.

---

## 4. Filters

### Level and power bands (from vision.md)
```
☑ Level 3 (fast)                    ☐ Level 2 (slow)
    ☑ Up to 50 kW                       (bands appear when ticked)
    ☑ 51–100 kW
    ☑ 101–250 kW
    ☑ Over 250 kW
    ☑ Unknown power
```
- **Default: Level 3 on, Level 2 off (N8 ✅, decided 2026-11-15).** Most people open a charger map looking for fast charging, and Level 2 more than triples the number of pins. The user's own filter choice is saved in the browser.
- Band checkboxes appear only when their level is ticked. All bands are on by default.
- A site shows if **any** of its ports match the ticked bands.

### Plugs
☑ CCS1 ☑ NACS ☑ CHAdeMO ☑ J1772. All on by default.

### "Chargers my car can use" ✅
- **Moved to Phase 1b (B28, 2026-11-16):** built together with My car (checklist 5.2), since My car doesn't exist yet. The map ships without it.
- A toggle that appears when **My car** is set (from Phase 1).
- It filters by the car's `charge_port`, plus **adapters_included** and **supercharger_access** from the data model.
- Example: a CCS1 car with Supercharger access through an adapter sees CCS1 sites **and** Superchargers, with Superchargers marked "needs adapter".

### Network
*Later:* filter by network (Tesla, FLO, Petro-Canada, Electrify Canada, Circuit électrique, ChargePoint…). It's a useful filter but not part of the simple v1 set.

### Other
- **Hide "customers only" and limited-hours sites:** *later.* In v1 they're shown with a warning in the popup.

---

## 5. Pins, clusters and popups

### Pins
- **Shape and colour by level:** a bolt icon for Level 3 and a plug icon for Level 2, so the level is never shown by colour alone.
- **Clusters** when zoomed out, showing a count. Clicking a cluster zooms in.
- **Status shown on the pin:** a greyed pin with a small mark for "temporarily unavailable" (§6).

### Popup (bottom sheet on phones)
| Section | Content |
|---------|---------|
| Header | Station name, network, level badge |
| **Ports** | One line per plug and power: "**2 × CCS1 · 180 kW**", "1 × CHAdeMO · 50 kW", "4 × NACS · 250 kW" |
| Access | Public / customers only / limited hours. **Tesla note** where it applies (§7) |
| Pricing | The text as provided, or "Not listed" |
| Status | Available / temporarily unavailable (with expected date if given) |
| **Directions** | "Open in Google Maps" / "Open in Apple Maps" links. **No in-app navigation in v1.** |
| Footer | "Data: NRCan / NLR AFDC · updated [date]" |

### Finding a place
- **"Locate me":** uses the browser's location, **only when asked**. Nothing is stored.
- **Search by place name: not in v1 (B29, 2026-11-16).** v1 has "Locate me" plus pan and zoom. Place search arrives with Phase 3 address search (S6). *Original proposal:* v1 uses a **static list of Canadian places** (cities, towns), so no search service is needed. GeoNames (CC BY 4.0) is one possible source. Full address search comes with routing in Phase 3 (S6).
- **Default view:** the user's last map position (saved in the browser), or else a view of southern Ontario and Québec, where most chargers are.

---

## 6. Status (N5) ✅

- **No live availability** ("in use", "free now") in v1. That data is usually paid or network-specific.
- AFDC gives a slower status, which is shown:
  - **Available:** normal pin
  - **Temporarily unavailable:** greyed pin, with the expected reopening date if given
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
