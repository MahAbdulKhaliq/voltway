# Data Sources

Phase 1, step 1 of [roadmap.md](roadmap.md). Free public sources for a **minimum viable data set**, with their licenses and gaps. Covers D1, D8, D9, C1 and N4 in [gaps-and-questions.md](gaps-and-questions.md).

*Researched 2026-11-15. Licenses and dataset contents change, so re-check each source before building.*

**Not legal advice.** The license summaries below are drawn from each project's own pages. Read the actual license text before shipping.

---

## Summary: the proposed minimum stack

| Need | Primary source | License | Fills it? |
|------|----------------|---------|-----------|
| Which EVs are sold in Canada, with official range and efficiency | **NRCan Fuel Consumption Ratings (BEV)** | Open Government Licence – Canada | ✅ Strong |
| Battery, DC power, 400V/800V, ports, chemistry, wheels, heat pump | **OpenEV Data** | CDLA-Permissive-2.0 | 🟡 Good structure, patchy contents |
| Charging curves | **Open EV Data (Chargeprice, archived)** | MIT, with an attribution requirement | 🟡 Older models only, and some curves are generic estimates |
| US cross-check for efficiency and range | **FuelEconomy.gov** (EPA/DOE) | US government data. Terms not confirmed | 🟢 Supporting role |
| Chargers (Phase 2) | **NREL AFDC API** (covers Canada) + **Open Charge Map** | Free API key / CC BY 4.0 | ✅ Strong |
| Car images | **Wikimedia Commons** | Varies per file (CC BY / CC BY-SA / public domain) | 🟡 Usable, with attribution |
| Anything still missing | **Entered by hand** from manufacturer spec pages, with sources cited | n/a | Fills gaps |

**The headline finding:** no single free source covers everything. The plan is to **combine several sources into one record per vehicle**, with each figure tagged with where it came from. That fits the accuracy pitch: every number can show its source.

---

## 1. Vehicle specs

### NRCan Fuel Consumption Ratings, battery-electric vehicles ⭐ the backbone
- **What it is:** the Government of Canada's official ratings for every BEV sold in Canada, from manufacturer-supplied lab tests. Published by Natural Resources Canada on open.canada.ca.
- **Coverage:** model years **2012–2026**. The BEV CSV resource is dated 2026-09-29.
- **Fields (18 columns):** model year, make, model, vehicle category, motor kW, transmission, fuel type, **city / highway / combined kWh/100 km**, Le/100 km equivalents, **range (km)**, CO₂ figures, smog rating, **recharge time (h, at 240 V)**.
- **License:** Open Government Licence – Canada (free reuse, commercial included, with attribution).
- **Why it's the backbone:** it answers "is this car sold in Canada?" and supplies **official Canadian rated figures**. That suits a Canada-first, accuracy-led app.
- **Missing:** battery kWh, DC charging power, charging curves, ports, trims and features.
- **Links:** [dataset](https://open.canada.ca/data/en/dataset/98f1a129-f628-4ce4-b24d-6f16bf24dd64) · [BEV CSV resource (English)](https://open.canada.ca/data/en/dataset/98f1a129-f628-4ce4-b24d-6f16bf24dd64/resource/026e45b4-eb63-451f-b34f-d9308ea3a3d9) · [French version](https://open.canada.ca/data/en/dataset/98f1a129-f628-4ce4-b24d-6f16bf24dd64/resource/0b0f5a42-b00b-4b6a-9185-4d4de1424801)
- *Corrected 2026-11-15:* the earlier "BEV CSV resource" link pointed to the French file. The English and French CSVs are separate resources; the importer uses the English one.

### OpenEV Data ⭐ the spec layer
- **What it is:** a community-maintained EV spec dataset on GitHub. Each vehicle is a JSON file checked against a published schema. Releases ship as JSON, CSV, SQLite, SQL and XML.
- **Coverage:** about 65+ brands, including Tesla, Ford, Chevrolet, Cadillac, Rivian, Lucid, Hyundai, Nissan, Polestar and Volvo. Organized as base model → year → trim. **Kia wasn't in the brand list**, which is a big gap for Canada. Total vehicle count isn't published. Last push seen: 2025-12-30.
- **The schema is an excellent fit** for this app's needs. It has fields for:
  - Battery: gross and net kWh, **chemistry** (lfp / nmc / nca…), usable SoC window
  - **`heat_pump`**, thermal management, **preconditioning**
  - DC: max kW, **400V/800V class**, power limits by voltage
  - **Charging curve:** power or current vs. SoC points, with conditions and a source URL
  - Charge ports (CCS1, NACS, CHAdeMO, J1772 type_1…)
  - Rated range by cycle (EPA, WLTP…) **and separate real-world range**, including winter profiles
  - **Wheels:** standard and optional sizes, tire sizes
  - **Markets** (country codes) and availability status
  - Image URLs and a **required sources list** with source type (oem, regulatory, testing_org…)
- **But the contents are patchy.** One sample record (2024 Hyundai IONIQ 5 base) had:
  - ✅ 77.4 / 72.6 kWh gross/net, 220 kW DC, 800V, EPA 488 km, WLTP 507 km
  - ❌ **no charging curve**, no heat pump field, no wheels
  - ❌ markets listed US but **not CA**
  - ❌ chemistry only as generic "li-ion", and its source was just a manufacturer homepage
- **License:** CDLA-Permissive-2.0 (free to use, change and share). The tools are Apache 2.0 and the docs are CC BY 4.0.
- **How to use it:** as a **starting point and as the model for our own schema** (see the next doc, `vehicle-data-model.md`). Fill in its gaps ourselves, and consider contributing fixes back.
- **Links:** [docs](https://open-ev-data.github.io/1.4.x) · [schema](https://open-ev-data.github.io/1.4.x/dataset/SCHEMA) · [dataset repo](https://github.com/open-ev-data/open-ev-data-dataset)

### FuelEconomy.gov (US EPA / DOE)
- **What it is:** official US ratings, available as a CSV/XML download or a REST API.
- **EV fields:** city / highway / combined **kWh per 100 mi**, EPA range, charge time at 120 V and 240 V, motor kW.
- **Missing:** battery kWh and DC charge power.
- **License:** US government data, run by Oak Ridge National Laboratory for DOE and EPA. The site's terms weren't confirmed.
- **Role:** cross-checking NRCan figures, and covering US-only models if the app expands beyond Canada later.
- **Link:** [web services](https://fueleconomy.gov/feg/ws)

---

## 2. Charging curves

The hardest gap, as expected (C1).

### Open EV Data (Chargeprice), archived ⭐ the main curve source
- **What it is:** the original open EV charging dataset from the price-comparison service Chargeprice. Charging curves are stored as **SoC % → kW** points.
- **Status:** **archived and read-only** (the KilowattApp fork was archived 2025-05-04). It won't get updates, so **newer models are missing**.
- **Important flag:** each curve has an "is default curve" marker. When no measured data existed, the project filled in a **generic shape**: 95% of max DC power at 0% SoC, peak at 75%, AC rate at 100%. **Those curves must not be shown as real data.** **Decision (2026-11-15): skip them on import** and log which were skipped. Our own tuned template (charging-curve-viewer.md §9) is the only estimated curve for those cars, so there are never two competing "Estimated" curves.
- **The flag isn't reliable (found and approved 2026-11-15, B6):** most filler curves are *not* flagged. Of 876 curves marked as measured, 175 share one identical shape and hundreds more follow round-number templates. The importer also skips curves with fewer than 3 points, or whose points below 100% SoC are all round fractions of the curve's peak. Result: 122 curves kept.
- **The Fastned link can no longer be re-checked:** the original chargeprice/open-ev-data repo and its README are gone (2026-11-15). The chain stays as researched, and each curve's notes say it can't be re-verified.
- **Where its curves came from:** the project says its measured curves are **simplified versions of Fastned's published charging charts**. Fastned is a European fast-charging network that publishes a curve for each car, measured in good conditions (battery around 30 °C). So the chain is **Fastned → Chargeprice → us**. Store them as `tested`, with that chain in the source notes.
- **License:** MIT, **with a visible attribution requirement** (on an About page, in docs or in a README).
- **Links:** [KilowattApp fork](https://github.com/KilowattApp/open-ev-data) · [original](https://www.github.com/chargeprice/open-ev-data) · [tijs fork](https://www.github.com/tijs/open-ev-data)

### OpenEV Data, charging-curve field
- The schema supports curves with conditions and sources, but the sample record had none. Expect only a few curves.

### What to do about missing curves
In order of preference:
1. **Use measured curves** from the sources above where they exist.
2. **Enter them by hand** from published test results, recording a handful of SoC/kW points and citing the source. *(Check the publisher's terms. Copying a whole chart or dataset needs care, even when the underlying facts are fair to use.)*
3. **Fall back to an estimate** built from max DC kW and 400V/800V class, **clearly labeled "Estimated"**. That way every car gets a curve and nobody is misled.

### Not reusable without permission
- **evkx.net** and **better-dcfc-calculator** (which appears to use evkx data): no open license found, and evkx.net blocked automated access. Use them **only for reference and comparison**.
  - evkx has a [developers page](https://evkx.net/developers/) with information on its charging-curve data. Using it would probably mean **contacting them**, so it's **out of scope for now** (owner's decision, 2026-11-15) while other options are explored. It's a possible later option if the open sources fall short.
- **ev-database.org**, **evspecifications.com**: no open license found. Reference only.

---

### Tested curves: wider search (C10, researched 2026-11-15)

**Bottom line: there's no open, maintained database of tested DC charging curves for North American cars.** The Chargeprice archive is still the only usable bulk source. Everything else is either closed, very small, about other things, or charger-side.

| Source | What it has | License / terms | Useful? |
|--------|-------------|-----------------|---------|
| **Chargeprice archive** (above) | SoC → kW curves derived from Fastned charts, for older models | MIT + attribution | ✅ **Use**, labeled as Fastned-derived |
| **[Argonne D3](https://www.anl.gov/taps/downloadable-dynamometer-database)** (US DOE lab) | Dynamometer **efficiency** tests for 16 EVs (2012–2023, for example 2023 IONIQ 5, 2020 Model 3, Bolt). No DC charging curves found on the IONIQ 5 page. Argonne has studied fast-charge profiles (100+ sessions), but no public release was found. | Public. **Attribution text required** | 🟡 Not for curves. **Useful for real-world efficiency** (`tested` consumption) |
| **[INL Advanced Vehicle Testing](https://avt.inl.gov/sites/default/files/pdf/fsev/2013LeafDCFCAtTempEOT.pdf)** | Older DC fast-charge-at-temperature reports (for example the 2013 Leaf) | Public US government reports | 🟢 Historical only. Possibly useful for the later cold-weather model |
| **[INL/NREL EVSE characterization](https://www.osti.gov/dataexplorer/biblio/dataset/2574506)** | 10 Hz data from 350 kW chargers | Public, anonymized | ❌ Charger-side, cars not identified |
| **[KIT charging dataset](https://publikationen.bibliothek.kit.edu/1000190660)** | 18 sessions, 16 EVs (Model 3, IONIQ 5, EV6, Leaf, ID.3…), with SoC | **CC BY 4.0** | 🟡 Probably AC (three-phase), mostly European models. Not a DC source |
| **[TU Dortmund dataset](https://zenodo.org/records/14065331)** | Lab charging profiles, 8 EVs | **CC BY 4.0** | ❌ Grid-quality focus, SoC not mentioned |
| **[CAA winter test](https://caaneo.ca/magazine/drive/caa-conducts-first-large-scale-winter-ev-test-drive-evaluate-cold-weather/)** (Canada) | **km added in 15 minutes of DC charging in winter**, per car | Editorial (no open license) | 🟡 **Individual results can be cited as facts.** Useful for the later winter feature, not for curves |
| **TeslaLogger fleet stats** | Tesla curves by model and firmware, from shared logs | No reuse terms found | ❌ Tesla only, terms unclear |
| **Fastned per-car charts** | The original curves behind Chargeprice's data | No reuse terms found | 🟡 Reference. Asking Fastned is a later option |
| **evkx.net** | Curves and an implementation guide | Not open | ⏸ Out of scope for now (owner's decision) |
| **Independent testers** (Out of Spec, InsideEVs, P3, Bjørn Nyland…) | Many measured curves | Editorial / copyrighted | 🟡 Reference. Asking permission is a later option |

### The practical plan for curves

1. **Import the Chargeprice curves** where they match our cars. Label them "Tested (Fastned, via Open EV Data)".
2. **Tune the estimated templates with summary numbers, not whole curves** (C12, ✅ approved). Calibration (charging-curve-viewer.md §9) only needs a **10–80% time** per car, and those are widely published:
   - **Manufacturer-claimed 10–80% times** (for example "18 minutes"): recorded as `manufacturer` facts, with the source.
   - **Single test results** (for example a published 10–80% time or CAA's km added in 15 min): recorded as `tested` facts, with the source. One number with a citation isn't copying someone's dataset.
3. **Every other car gets an estimated curve**, clearly labeled. The tuned templates make those estimates as good as they can be.
4. **Later options:**
   - Ask Fastned, independent testers or evkx for permission to use their curves
   - Accept **community-submitted curves** through pull requests on the data repository (no accounts needed), with each submission citing its log
   - **Contribute our improvements back** to OpenEV Data

**What this means for C10:** no longer blocking. The app can launch with Fastned-derived curves for some cars, well-tuned estimates for the rest, and honest labels on both. Better measured curves stay an ongoing goal.

---

## 3. Trim features (heat pump, wheels)

- **OpenEV Data** has the fields (`heat_pump`, `wheels_tires`), but they're often empty.
- **Fallback: enter them by hand** from manufacturer build-and-price or spec pages (**US first, then Canadian**, B15 2026-11-15), citing each source. Individual facts like "has a heat pump: yes" are low-risk to record.
- **The effect on range** (D10) is still unsolved. No free source turns "21-inch wheels" or "no heat pump" into a % range change. That's a modeling job for later.

---

## 4. Car images

- **Wikimedia Commons:** most files are under free licenses (CC BY, CC BY-SA or public domain), and commercial use is usually allowed.
  - **Check the license on each file's own page**, and show credit and a license link. Commons has an attribution generator.
  - Avoid photos with **readable licence plates or identifiable people**.
  - A free photo license doesn't cover **trademarks**. Showing car logos for identification is normal, but don't use them as branding.
- **Manufacturer press sites:** usually allowed for editorial use under their own terms. It varies, so read each one.
- **Fallback:** a simple silhouette per body type (sedan / SUV / truck) until an image is found.
- **Links:** [Commons reuse guide](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia)

---

## 5. Chargers (needed for Phase 2, but checked now)

### NLR (formerly NREL) AFDC Alternative Fuel Stations API ⭐ primary
- **Covers Canada:** `country=CA`. NRCan's own station locator is built on it.
- **Fields that fit the vision:**
  - Connector types: `J1772`, `J1772COMBO` (CCS1), `TESLA` (NACS), `CHADEMO` ✅ all four plugs in the vision
  - Port counts per level: `ev_level2_evse_num`, `ev_dc_fast_num` → Level 2 vs. Level 3
  - `ev_charging_units` → connectors → **`power_kw`**, which feeds the power bands. *Note:* the field is mostly rated maximum power, but sometimes actual power delivered.
  - `ev_network` (including "Tesla Supercharger" and "Tesla Destination"), `access_code` (public/private), `restricted_access`, `status_code` (available / planned / temporarily unavailable), `ev_pricing`
- **Access:** free, with an API key from **developer.nlr.gov** (the old developer.nrel.gov host was retired 2026-05-29). 1,000 requests per hour per key; DEMO_KEY is 50 per day.
- **Watch out:**
  - Expect **missing `power_kw` values**, which is why the vision has an "Unknown power" band.
  - Reports suggest NRCan's data **doesn't capture every network**. NRCan reported about **39,654 public ports at 14,743 locations** as of March 2026.
  - The API docs state no licence or attribution terms (checked 2026-11-16). Canadian records come from NRCan, so the exact licence wording is confirmed during build (map checklist M1) before anything is published.
- **Links:** [field dictionary](https://afdc.energy.gov/data_download/alt_fuel_stations_format) · [EV charging units endpoint](https://developer.nlr.gov/docs/transportation/alt-fuel-stations-v1/ev-charging-units)

### Open Charge Map: secondary, fills gaps
- **License:** user-contributed data is CC BY 4.0. **Imported data keeps its original provider's license**, and **visible attribution for each provider is required**.
- OCM calls itself a "non-commercial, non-profit service". Its terms don't spell out commercial use.
- **Role:** fills gaps where AFDC is missing stations. **In use since Phase 6 (B77, 2026-11-18):** only open-licensed providers (1 OCM contributors CC BY 4.0, 24 AddÉnergie CC BY 3.0, 45 Greems CC0), about 3 API calls a month; duplicate rules in [DESIGN-6.md](../plan/DESIGN-6.md) P3.
- **Fair use (API spec):** no repeated duplicate queries; throttle; custom user agent; key as `X-API-Key` header; OCM may ban excessive callers; for full-dataset refreshes clone their GitHub export instead.
- **Link:** [terms](https://openchargemap.org/about/terms)

### Not usable
- **PlugShare**, **ChargePoint**: closed data.

---

## 5a. Places (Phase 3 trip planner, B45, added 2026-11-16)

### GeoNames ⭐ place names for From/To suggestions
- **What:** Canadian populated places (cities, towns, villages) with name, province and coordinates. Phase 3 keeps places with **population ≥ 1,000** (about 3,000 rows) as a static file, so typing in From/To suggests places with no service call (route-planner.md §6).
- **License:** **CC BY 4.0**. Credit GeoNames on the About page.
- **Access:** a free download (`CA.zip` or `cities1000.zip` from download.geonames.org), refreshed by hand when needed; no key.
- **Full addresses** still go to ORS geocoding, only when the visitor presses Search.
- **Link:** [GeoNames export](https://download.geonames.org/export/dump/)

### Natural Earth ⭐ Canada outline for the "trips in Canada only" check (B74, added 2026-11-17)
- **What:** the 1:10m Admin 0 countries layer (v5.1.2), Canada only, simplified (land border kept to about 20 m, coast to about 300 m; Arctic islands left out, where a simple rule applies). Only the trip function reads it, to refuse a start or destination outside Canada before asking openrouteservice; browsers never download it.
- **License:** **public domain**. Credited on the About page anyway.
- **Access:** `npm run fetch:canada` (download from the natural-earth-vector GitHub release), by hand when needed; no key. Writes `data/imported/naturalearth/canada.json` with the download's checksum.
- **Link:** [Natural Earth Admin 0](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-countries/)

---

## 6. New gaps this research found

| ID | Gap | Notes |
|----|-----|-------|
| D11 | **Matching the same car across sources.** NRCan, OpenEV Data and Chargeprice all name vehicles differently ("IONIQ 5 AWD Long Range" vs. "Ioniq 5 77.4 kWh AWD"). | Needs a matching rule or a hand-built mapping table. Core to combining sources. |
| D12 | **Which source wins when they disagree?** For example, NRCan range vs. OpenEV Data EPA range. | Proposal: NRCan wins for Canadian rated figures. Otherwise use the most specific cited source, and show both where it helps. |
| D13 | **Kia, and other Canadian-market cars missing from OpenEV Data.** | Hand entry, starting from the NRCan list. |
| C8 | **How "Estimated" curves are generated and labeled.** | Ties to the accuracy pitch. |
| N7 | **Removing duplicate stations across AFDC and Open Charge Map.** | Phase 2. |

---

## Recommended next steps

1. **Build the starter vehicle list from NRCan:** recent model years (for example 2024–2026), deduplicated to the models that matter.
2. **Fill it in from OpenEV Data and the Chargeprice archive** where matches exist.
3. **Enter by hand** what's still missing for a starter set (about 20–30 popular Canadian EVs). This is design work for `vehicle-data-model.md`, not code.
4. **Design the schema next:** `vehicle-data-model.md`, using OpenEV Data's schema as the model, plus source tags on every field (P9, D12).
