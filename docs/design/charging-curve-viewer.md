# Charging Curve Viewer

Phase 1, step 3 of [roadmap.md](roadmap.md). How the app shows charging curves and works out charging time and range gained. Covers C3–C9 in [gaps-and-questions.md](gaps-and-questions.md). It builds on the curve storage in [vehicle-data-model.md](vehicle-data-model.md) §5.

---

## 1. What the reference app does

[better-dcfc-calculator](https://better-dcfc-calculator.vercel.app/charging) (checked 2026-11-15), the model the owner pointed to:

- **Choosing a car:** make → model → variant (with battery kWh in the name), a "custom vehicle" mode, a "Surprise me" button and an "exclude Chinese makes" filter.
- **Inputs:** a range scenario (rated range, or steady speeds of 90/112/120 km/h with or without 2 kW of heating), usable battery, **station power** (for example 400 kW), **dwell time** (minutes lost to parking and paying) and a "limit by current" toggle.
- **Chart:** Y axis switchable between **power and current**, X axis switchable between **SoC and time**. It shows the **car's limit** and the **actual speed** under the **charger limit** line, with the charging window (for example 10% → 80%) marked.
- **Results:** session time, **ideal vs. actual time ("lost to limits")**, range added, average power, and **range added per hour of charging**.
- **For enthusiasts:** estimated pack voltage and current, peak and average amps, pack resistance, cell layout and chemistry.
- **Extras:** an "add to comparison" button, a road-trip mode, leaderboards and a lifetime cost calculator.

### What we borrow, and where we differ
| Borrow | Where we differ |
|--------|-----------------|
| The chart: car curve + charger limit + delivered power | **A source badge on every curve** (Tested / Estimated…). It's the accuracy pitch. |
| "Ideal vs. lost to charger limits" | **Canada first:** filter to cars sold in Canada (from NRCan), metric by default |
| Range added and average power | **Simpler by default:** enthusiast details sit behind a "More detail" panel |
| Adding cars to a comparison | **Estimated curves look different** (dashed line) and are never passed off as real |

---

## 2. Inputs

| Input | Default | Options | |
|-------|---------|---------|-|
| **Vehicle** | The car picked on first load (saved in the browser) | Make → model → year → variant. Every car is listed whatever its markets (B98, 2026-11-20; was "filter: sold in Canada, on by default") | MVP |
| **Curve** | The variant's default curve (§7 of the data model) | A dropdown when the variant has more than one: "Tested (source, date)", "Estimated" | MVP |
| **Start → end SoC** | **10% → 80%** | Two sliders, 0–100% in 1% steps | MVP |
| **Charger power** | **"No limit"** (shows the car's own curve) | Presets matching the map's bands: **50 · 100 · 150 · 250 · 350 kW**, or a custom figure | MVP |
| **Range basis** | **Combined consumption** (B117; was highway) | City / combined / highway | MVP |
| **Dwell time** | 0 min | Minutes for parking and paying | *later* (more useful for trips) |

**Why highway by default:** fast charging mostly happens on road trips, so highway consumption gives the most realistic "km added" figure.
*B117 (owner, 2026-11-20): the default is now **Combined**; highway stays one click away. When the car has no figure for the picked basis, the select and the "Added (…)" label show the one used (combined, else highway), and missing bases are greyed out (QA fix, 2026-11-20).*

---

## 3. The calculation

### Steps
Work through the charging window in **small steps of SoC** (for example 0.5%). For each step:

1. **Car power** = the curve's power at that SoC, joining points with straight lines.
2. **Delivered power** = the **lower** of car power and charger power (C4, simple version).
3. **Energy for the step** = `usable_kWh × step% / 100`.
4. **Time for the step** = energy ÷ delivered power.

Add up across the window:
- **Total time** = sum of step times
- **Energy added** = `usable_kWh × (end% − start%) / 100`
- **Average power** = energy added ÷ total time
- **Ideal time** = the same sum using car power only. **Lost to charger limits** = total time − ideal time.
- **km added** = energy added × 1000 ÷ consumption (Wh/km)

### Usable battery unknown (B10) ✅
**Decision (2026-11-16):** if a car's usable capacity isn't known, the calculation uses its gross (total) capacity instead. Results are then treated like estimates: times rounded to 5 minutes and shown with "~", and the viewer says the total capacity was used.

### Charging losses (C9) ✅
**Decision:** in v1, **no loss factor in the time calculation.** The curve's kW is treated as the power going into the battery, and energy is labeled "**added to battery**".

- **Why:** it keeps the maths transparent and in line with how most published curves are presented. Losses mostly affect **energy drawn from the charger**, which matters for **cost**, and cost is out of scope for v1. *(Superseded by B19: cost is in v1.)*
- **Added 2026-11-15 (B19):** cost is in v1 after all: price per kWh input (default C$0.45; *B99, 2026-11-20: plain $0.45, no currency or country*), cost = energy added ÷ 0.92 × price, with the drawn kWh and the assumed losses shown.
- **Originally:** when cost is added, show "drawn from charger ≈ added ÷ efficiency" with a stated assumption, for example ~90–95% for DC. That figure is an assumption to check then.
- **Note for imports:** when a source says whether its curve was measured at the charger or the battery, record it in the curve's `conditions`.

---

## 4. Outputs (C6, C7) ✅

### Results panel (always visible)
| Result | Example format | Why |
|--------|----------------|-----|
| **Charging time** | "10% → 80% in **24 min**" | The number people care about most |
| **km added** | "+**310 km** (highway)" | What the time buys you |
| **km added per 10 minutes** ⭐ | "**129 km** per 10 min" | **The fairest comparison between cars** (C7). It combines charging speed with efficiency, so a fast-charging but inefficient car doesn't look better than it is. |
| **Average power** | "**136 kW** average" | Better than peak kW for comparing cars |
| **Lost to charger limits** | "+6 min because of the 150 kW charger" | Shown only when a charger limit is set |
| **Curve source badge** | "Tested · [source] · 2025" or "**Estimated**" | Accuracy pitch (P9) |

**"km added per 10 minutes" over "per hour"**: real stops last 15–30 minutes, so a per-hour figure (like the reference app's) is harder to picture. The comparison view keeps "per 10 min" as its headline figure.

*B83 (2026-11-18): the charging time is the headline of the viewer (Overpass, display size); the other results follow as one quieter row, not equal tiles.*

### More detail panel (folded by default, for enthusiasts)
- Peak power and the SoC where it occurs
- Time spent above 100 / 150 / 200 kW
- The curve's raw points (table), its conditions and source link
- *Later:* estimated pack voltage and current, as in the reference app

---

## 5. The chart (C6) ✅

### Default view: **power (kW) vs. SoC (%)**
- **Car curve:** solid line. **Dashed if estimated**, with an "Estimated" tag on the line itself.
- **Charger limit:** horizontal line at the chosen power (hidden when "No limit").
- **Delivered power:** shaded area under the lower of the two lines, **only inside the start → end window**.
- **Charging window:** the start and end SoC marked with vertical guides. Dragging them changes the sliders.
- **Hover:** shows SoC, kW and elapsed time at that point.

*B83 (2026-11-18): the chart follows the headline. Start and end are one two-handle slider aligned under the chart's % axis; the guides are drawn in the text colour ("stop bars"). A non-estimated curve is drawn like the trip line: yellow on the dark road band. Owner change the same day: the line is solid only inside the charging window; outside it the curve is drawn as long lane-line dashes. The chart sits on a raised panel, and each result on its own card.*

### Toggle: **power vs. time (minutes)**
- The same session plotted over elapsed minutes. It's the more intuitive view for "how long will I sit here?".
- *Later:* SoC vs. time (the "how full after 15 minutes?" view).

### Not in v1
- Plotting current (amps) instead of power. That's for enthusiasts, under *later*.

---

## 6. Comparing cars (C5, C6) ✅

- **Overlay up to 4 curves** on one chart, each with its own colour. They can be different cars, or **different curves for the same car** (for example tested vs. estimated, or before and after a software update).
- **Shared settings:** one start/end SoC and one charger power apply to every car in the comparison, so it's fair.
- **Comparison table** under the chart, one row per car: charging time, km added, **km per 10 min**, average kW, curve source badge.
- **Sort** by any column. The default is km per 10 min.
- **Mixed-quality warning:** if the comparison mixes tested and estimated curves, a short note says so.
- The comparison is saved in the browser along with the selected car.

---

## 7. Conditions (C3) ✅ for v1

- **v1 assumption: a warm or preconditioned battery and mild weather.** This matches how most published curves are measured. It's shown as a small note: "Assumes a warm battery. Cold batteries charge slower."
- A curve's recorded `conditions` (preconditioned, temperature, charger used) appear in the More detail panel.
- **Cold-weather effects are out of scope for v1**, in line with Q-V4. The later plan uses temperature and battery chemistry for a rough slow-down, following the same approach as the planned winter range estimate.
- *B116 (owner, 2026-11-20): the winter **range** estimate is now an Outside temperature field on the Charging page; see [outside-temperature.md](outside-temperature.md). Heat pump or not drives most of the range difference; LFP packs take a smaller cold penalty. Cold **charging** speed is still out of scope.*

---

## 8. Charger limits (C4)

*B83 (2026-11-18, owner): the charger limit is set with a slider in 50 kW steps (50–350 kW, Max = no limit), in the map's slider look, not a dropdown with a custom field. See [design-language.md](design-language.md).*

**v1 (simple):** delivered power = the lower of car power and the charger's **kW rating**. That covers the common case: a 150 kW-max car on a 50 kW charger.

**Known gaps, for later:**
- **Current limits:** a 400V car can't always reach a charger's rated kW, because the charger caps current (amps), not just power. Modeling this needs charger current limits, which the AFDC data generally doesn't include.
- **800V cars on 400V-only chargers** (for example some older units or Tesla V3 Superchargers) can charge much slower, or need the car's own boost converter. Needs the variant's `dc_max_current_a` and the charger's voltage range.
- **Shared-power stalls**, where two cars split a cabinet's output.

In v1, the results panel shows a small note when a **800V car** is paired with a charger that may be **400V-only**, rather than modeling it. *That needs charger voltage data, so it may wait until Phase 2.*

---

## 9. Estimated curve templates (C8) ✅ as a starting proposal

For variants with no measured curve. Each template is a list of **SoC → fraction of the car's peak DC kW**. The estimated curve is the template × `dc_max_kw`.

**Calibrated 2026-11-16 (B41).** The table started as uncalibrated placeholders; the owner approved the tuned 30–80 % values from `docs/plan/calibration-report.md` (19 reference cars; within ±15 %: 15 → 16). Old values are shown struck through where they changed.

| SoC | **400V NMC/NCA** | **800V NMC/NCA** | **LFP** (any voltage) |
|-----|------------------|------------------|-----------------------|
| 0% | 0.70 | 0.75 | 0.80 |
| 10% | 1.00 | 1.00 | 1.00 |
| 30% | ~~1.00~~ 0.97 | ~~1.00~~ 0.96 | ~~0.90~~ 0.81 |
| 50% | ~~0.75~~ 0.71 | ~~0.95~~ 0.90 | ~~0.75~~ 0.63 |
| 70% | ~~0.55~~ 0.51 | ~~0.70~~ 0.64 | ~~0.60~~ 0.47 |
| 80% | ~~0.45~~ 0.43 | ~~0.45~~ 0.42 | ~~0.50~~ 0.42 |
| 90% | 0.25 | 0.15 | 0.30 |
| 100% | 0.08 | 0.05 | 0.10 |

**Chemistry unknown:** use the NMC template for the variant's voltage class, and say so in the curve's `basis` note.

### Calibration (before launch)
1. Take every variant that has a **tested curve**, **or** a published **10–80% time** (a manufacturer claim or a single cited test result; see data-sources.md, "The practical plan for curves").
2. Build its estimated curve from the template anyway.
3. Compare the **10–80% times**. The target is to be within about **±15%** for most cars (a starting goal). Manufacturer claims tend to be best-case, so give tested figures more weight when the two differ.
4. Adjust the template numbers until most cars fall inside the target, and record the result in this doc.
5. If one template can't fit a group (for example a brand with a very flat curve), split it into a separate template.

**Result (2026-11-16, B41):** a weighted Huber fit (tested curves count most) moved only the 30–80 % points. Still outside ±15 %: Silverado EV (−36 %), LYRIQ (−26 %) and Kona (−20 %), all estimated faster than their reference; GM Ultium may need its own template once tested GM curves exist. LFP rests on one car (EX30). No template split for now. Re-run with `npm run calibrate` as references are added.

### How estimated curves are shown
- **Update (B92, 2026-11-19):** the viewer shows the best curve only. The Curve dropdown appears only when a car has two or more measured curves (labelled by source and year); a template estimate is shown only when it is the car's only curve.
- Dashed line, an "Estimated" badge, and an expandable explanation: "Based on a typical 800V NMC curve and this car's 220 kW peak. No measured curve available yet."
- Results calculated from estimated curves show times **rounded to the nearest 5 minutes** (for example "~25 min"), so they don't look more precise than they are.

---

### Measured range of a curve (B24) ✅
**Decision (2026-11-16):** a measured curve is only measured between its first and last points. Beyond them the viewer still holds the nearest measured power (so any window can be calculated), but that part of the line is **dashed** and labelled "Not measured", a note gives the measured range, and any result whose window reaches into it (including the 10–80 % tile) is shown as **estimated** ("~", rounded to 5 minutes, Estimated badge). Estimated curves also carry an "Estimated" tag on the line.

---

## 10. Out of scope for v1

- ~~**Charging cost**~~: in v1 after all (B19, 2026-11-15; see §3)
- **Road-trip mode** inside the viewer (Phase 3, the route planner, covers trips)
- **Leaderboards.** A ranked "fastest charging" list is a nice later idea. It ties into the database's rankings (D6).
- **Custom vehicle entry** (users typing in their own car's specs)
- **Current (amps) charts, pack voltage estimates**
- **Cold-weather slow-down**

---

## 11. Questions resolved here, and new ones

**Resolved:** C3 (for v1), C5, C6, C7, C8 (proposal), C9.

**New:**
| ID | Question |
|----|----------|
| C10 | Which **testing sources** have curves we're allowed to record? Needed to calibrate the templates (§9) and to replace estimated curves. |
| C11 | Should a curve's **AC charging** (Level 2 time, for example 20% → 100% overnight) also be shown, using `ac_max_kw`? It's easy to calculate and useful for owners. |

**B66 (2026-11-17):** the price per kWh is one site-wide setting, shared with Settings in the header and with the trip planner's stop costs; changing it here changes it there.
