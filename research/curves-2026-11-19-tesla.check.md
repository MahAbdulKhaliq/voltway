# Check: research/curves-2026-11-19-tesla.json

**Verdict: FIX.** The numbers are copied correctly from Fastned, and `add-facts --check` passes. The problems are label and scope: the NA applicability of the LR curve, the Model Y pack/market guess, and the source URL.

## What I checked
I re-fetched the Fastned pages and parsed the embedded `chargeGraph` JSON (one kW value per whole SoC %).
- Model 3 curves are on `https://www.fastnedcharging.com/en/brands-overview/tesla`.
- The Model Y curve is **not** on that URL. It is on `...tesla?model=Model%20Y` (labelled "Long Range (2022 - 2025)", chargeSpeed 250). The batch cites only the Model 3 URL.
- All 17 points of each of the three curves match the page exactly (0 mismatches, to 0.06 kW).

## Curve table

| Curve | Point | Batch | Fastned page | Result |
|---|---|---|---|---|
| fastned-2026-m3-lr (label "Model 3 Long Range (2019 - 2023)", Max 190 kW) | 11 % | 180.6 | 180.6 | ✅ |
| | 35 % | 194.1 | 194.1 | ✅ |
| | 50 % | 153.7 | 153.7 | ✅ |
| | 80 % | 56.8 | 56.8 | ✅ |
| | 90 % | 34.3 | 34.3 | ✅ |
| | peak | 194.1 (35 %) | 195.1 (38 %) | ⚠ the 5 % grid misses the true peak by 1 kW, harmless |
| fastned-2026-m3-sr (label "Standard Range (2020 - 2023)", Max 170 kW) | 10 % | 169.72 | 169.72 | ✅ |
| | 30 % | 138.26 | 138.26 | ✅ |
| | 50 % | 89.7 | 89.7 | ✅ |
| | 80 % | 36.89 | 36.89 | ✅ |
| | peak | 169.72 | 170.17 (11 %) | ✅ |
| fastned-2026-my-lr (label "Long Range (2022 - 2025)", chargeSpeed 250) | 8 % | 230.75 | 230.75 | ✅ peak |
| | 20 % | 181.7 | 181.7 | ✅ |
| | 50 % | 105.09 | 105.09 | ✅ |
| | 80 % | 48.42 | 48.42 | ✅ |
| | 90 % | 34.3 | 34.3 | ✅ |

The 85 % and 90 % values of the Model Y curve (43.9 and 34.3) equal the Model 3 LR values. This is genuine in Fastned's data, not a copy error.

Other points:
- **Measured, not modelled:** Fastned states the curve shows "the charging behaviour of this car when the battery is in optimal conditions (around 30 °C)". `kind: tested` is acceptable, since Fastned measured it on its own network. `battery_temp_c: 30` is recorded.
- **Point rules:** every curve has 17 points below 100 %, with no SoC gap over 5 %. The LR curve starts at 11 % and the Model Y curve at 8 %, so neither covers 0 to 8–11 %. The SR curve covers 10 to 90 %.
- **Second source (InsideEVs):** InsideEVs quotes Fastned's 2019–20 LR AWD at 195 kW peak and about 128 kW 20–80 % average. The batch's 126 kW is time-weighted, which I reproduced from the page (LR 126.0 kW, SR 80.6 kW against InsideEVs' 82). The plain SoC-mean is higher (LR 143.9, SR 94.4), so the average depends on the definition. Agreement is good for LR and SR. There is **no second source for the Model Y**. My time-weighted figure from the page is 98.7 kW. The search found only evkx.net, which is blocked/modelled, and an InsideEVs 4680 piece that is a different pack.
- **Fastned vs batch peak text:** the batch notes cite "peak 250 kW claimed". The Model Y page says chargeSpeed 250 and the curve peaks at 230.75 kW, which is under 250, so it is fine.
- **Powertrain data is empty:** every one of the 17 powertrains has no pack, `dc_max_kw`, chemistry or voltage. `research/powertrain-gaps.json` lists all eight required fields as missing. The B95 plausibility test (pack kWh, voltage, peak within 5 % of `dc_max_kw`) **cannot be run**, and the match is unproven for every id.

## Generation and market match

| Curve | Ids | Result | Evidence |
|---|---|---|---|
| m3-lr | 2019 LR, 2019 LR AWD, 2020 LR AWD, 2019 Performance, 2020 Performance | ✅ plausible | Fastned's label starts at 2019. InsideEVs says its test car was the 2019–20 LR AWD (75 kWh). Performance shares the LR pack, but no source says so. |
| m3-lr | 2017 LR, 2018 LR, 2018 Performance | ⚠ unproven | Fastned's label starts at 2019. Earlier cars had different charging software and V2 limits. Nothing shows they share the 2019 curve. |
| m3-lr | all of the above | ⚠ market | Measured on EU CCS2. See the CCS2 cap section below. |
| m3-sr | 2019 SR+, 2020 SR+, 2019 SR, 2020 SR | ⚠ | The page label is "2020 - 2023", so 2019 cars are outside the label. The batch's own note says the 2021 SR+ (51 kWh) charges slower, but the label includes 2021–23, which is inconsistent. The plain "Standard Range" (non-Plus) pack is not documented. |
| my-lr | `2023-long-range-awd-import`, `2024-long-range-awd-i`, `2024-long-range-awd-ca`, `2023-performance-ca`, `2024-performance-import` | ❌ not established | Fastned does not state the pack. The "China-built LG pack" claim is only a guess. Sold-in-Canada cars of 2023 may be Fremont (Panasonic) or Berlin. `2024-long-range-awd-i` is a **US**-market id (powertrain gaps) and `2023-performance-ca` carries a different trim. The Performance ids carry the LR curve with no evidence that the Performance has the same pack or charging behaviour. |

## CCS2 cap on North American cars

The Fastned LR curve is on the EU CCS2 port and plateaus at about 195 kW. InsideEVs (2021 Model 3 LR AWD, Supercharger test, 250 kW peak, 106 kW 20–80 % average) shows NA cars reaching about 250 kW early. The two averages are in the same range, so the curve overall is the right *shape*. The early part (below about 30–40 %) is understated by up to 25 %.

**Recommendation: keep, but with changes.**
- Keep the LR curve for 2019–2020 LR / LR AWD / Performance as `tested`.
- Set `low_confidence: true` on every id. Add to the notes: "EU CCS2; NA Supercharger early peak ~250 kW, early plateau understated".
- The batch has not declared market or port as a condition. Add `market: EU/CCS2` or `charger_kw: 300 CCS2` in conditions, or say it in the notes, so the site can show the label.
- Do not show it as the display default for a NA car.
- For the SR curve, the same note applies, with the 170 kW label peak.

## Required changes

1. Source URL: add a second source, or change `url`, for the Model Y curve to `https://www.fastnedcharging.com/en/brands-overview/tesla?model=Model%20Y` and give the title "Long Range (2022 - 2025)". Right now the cited page does not contain this curve.
2. Set `low_confidence: true` on `fastned-2026-m3-lr` for `tesla/model-3/2017-long-range`, `2018-long-range` and `2018-performance`. The Fastned label starts at 2019. Or drop these three.
3. Set `low_confidence: true` on `fastned-2026-m3-lr` for the five remaining ids (2019/2020 LR/AWD/Performance) because the curve is EU CCS2 and the cars are NA (see above), and add the note.
4. `fastned-2026-m3-sr`: the label spans 2020–2023 (including 2021–23 cars the batch says charge slower). Either drop the 2019 SR+/SR ids, or set `low_confidence: true` and fix the notes so they match the label. The notes currently say "2020 - 2023" and also "used only for the 2019–2020 49 kWh cars".
5. `fastned-2026-my-lr`: keep `low_confidence: true`, but fix the notes. The "LG-cell China-built" claim has no source, so rewrite the notes as "pack unknown; Fastned's EU 2022–25 LR". Drop it from the two Performance ids (`2023-performance-ca`, `2024-performance-import`) unless a source shows the Performance shares the LR pack and charge limits. Drop it from `2024-long-range-awd-i` (US market) unless the owner confirms the match.
6. Optionally add the 38 % / 195.1 kW peak point to the LR curve (the peak is currently 194.1).
7. Fill the empty powertrain required fields (pack, `dc_max_kw`, chemistry, voltage) so B95 can be checked. Until then, the match is unproven.
8. Terms: no reuse terms found. The owner must confirm before the batch is applied.

## Missing generations: reachable sources

Not covered by this batch: Model 3 2018/2019 Mid Range, Model 3 2021–23 LR AWD / Performance (82 kWh), Model 3 2023 RWD (LFP), 2023+ Highland (Fastned's "2023+" entries are identical copies, per researcher), all Model Y trims from 2020–2022 Fremont (Panasonic), Model Y 2024+ and 2026 trims, and every LFP car.

- **InsideEVs (Moloughney Supercharger tests):** 2021 Model 3 LR AWD (82 kWh) has a 250 kW peak and 106 kW 20–80 % average; the article has charts, and text may give points. Also the 4680 Model Y report (32 min to 80 %).
- **Bjørn Nyland (YouTube/spreadsheet):** 2019 LR AWD (250 kW peak, 128 kW average per InsideEVs), 2021 SR+ (159 kW peak, 64 kW average, per the batch).
- **A Better Route Planner public car pages:** check terms and mark `community` and `low_confidence`.
- **P3 charging index:** not checked here; verify which Teslas it covers.
- **Fastned Model Y page:** the Standard Range (2022–2025) entry, which I saw exists on the page, is another candidate for the LFP/RWD cars. It has a chart, so confirm the data is present before use.
- Not usable: evkx.net (blocked, partly modelled).

## Applied by the researcher (2026-11-19)
- Model Y curve now cites its own source `src-fastned-tesla-model-y-2026` (`...tesla?model=Model%20Y`, "Long Range (2022 - 2025)"); the Model 3 source title/notes cover Model 3 only and state the Terms of Use are readable with no reuse clause.
- `low_confidence: true` on every Tesla curve (2017-18 LR/Performance, 2019-20 LR/Performance, 2019-20 SR/SR+ and Model Y); notes carry "EU CCS2; NA Supercharger early peak ~250 kW" and the market (EU/CCS2) (the conditions schema has no market field).
- LR curve: added the 38 % / 195.1 kW peak point (18 points). SR notes rewritten to match the Fastned label (2020 - 2023), the 2019 cars outside it, and the 2021 SR+ excluded.
- Model Y note rewritten to "pack unknown"; curve removed from `2023-performance-ca`, `2024-performance-import`, `2024-long-range-awd-i`. Remaining ids: `2023-long-range-awd-import` (78.1 kWh NMC) and `2024-long-range-awd-ca` (82 kWh NCA): different packs in the spec data, kept as instructed, flagged to the owner.
- Powertrain data rebuilt (`npm run data:build`): generation matches rechecked (LR ids 78.8 kWh NCA 250 kW; SR ids 53.1 kWh NCA 170 kW). 2021+ 82 kWh LR/Performance, LFP and 2024+ NMC 78.1 cars are different packs and get no curve.
- Missing generations: Fastned has no new data (Model Y Standard Range 2022-25 and 2025+ graph null; "2023+" Model 3 and "2025+" Model Y LR entries are byte-identical copies). InsideEVs articles (343256, 356710, 361594, 427836, 503311, 506520, 519382) give averages and 3-4 milestones, charts are images; evercars 2026 Model Y RWD has 6 prose points. None reach 8 points, none used.
- `npx tsx scripts/add-facts.ts research/curves-2026-11-19-tesla.json --check`: OK.
