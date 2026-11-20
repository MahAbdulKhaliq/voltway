# Check: research/curves-2026-11-19-volvo-polestar.json

**Verdict: FIX.** The numbers are right: every point of all 25 curves matches the Fastned page data. Six things need changing.
- The six EX40 82 kWh curves are a borrow across models and must be re-labelled.
- The 82 kWh curve skips a plateau.
- Source `type` and curve `kind` disagree.
- The EX30 curves need only a notes addition.
- The 2024 78 kWh cars and the 2021 car are an unproven match.

`npx tsx scripts/add-facts.ts research/curves-2026-11-19-volvo-polestar.json --check` returns "OK, batch is valid (491 variants, 172 sources after applying)".

## How I checked
Fastned's `chargeGraph` is embedded in the page HTML. WebFetch only sees the rendered text, which said "image only". So I fetched the three pages with curl (robots.txt is `Allow: /`; no block worked around). I parsed the embedded JSON into per-percent tables. Then I compared every point of every curve in the batch against those tables, not just three spot checks.

Page entries found:
- **Polestar 2 page** (`?model=2`): "78 kWh (2020 - 2023)", 150 kW, graph class `150+`, 87 points over 7-93 %, max 151. "82 kWh (2023+)", 206 kW, class `400`, 92 points over 6-100 %, max 206.75. "67 kWh (2020 - 2023)", class `300`. "69 kWh (2023+)", graph null.
- **Volvo `?model=XC40 Recharge`**: "78 kWh (2020 - 2023)", 150 kW, identical `150+` graph (byte-identical to the Polestar one). "82 kWh (2023 - 2024)", 200 kW, **graph null**. "Single Motor 70 kWh", class `300`.
- **Volvo `?model=EX30`**: "69 kWh (2024+)" and "Cross Country 69 kWh (2025+)", 160 kW, identical class `300` graph, 80 points over 10-89 %, max 158.73. "51 kWh", graph null.

## Table

| Variant (group) | Curve | Result | Evidence |
|---|---|---|---|
| 7 Polestar 2 78 kWh ids (2021 launch, 2022 LR dual/single, 2023 dual/perf/single, 2024 LR dual) | fastned-2026, 22 pts, peak 151 | ✅ values; ⚠ generation, see below | All 22 points equal the page: 7 %=142, 9 %=151, 18 %=135, 30 %=134, 50 %=91, 80 %=60, 93 %=16. Page is labelled "78 kWh (2020 - 2023)". |
| 4 EX40 78 kWh ids (2022 P8, P8 twin, 2023 twin, 2024 twin) | fastned-2026, source XC40 78 kWh page | ✅ values; ⚠ 2024 | Same 22 points, identical to the Polestar page. |
| 4 Polestar 2 82 kWh ids (2024 LR single, 2025 dual perf, dual, single) | fastned-2026, 22 pts, peak 206.8 | ✅ | All points equal the page: 6 %=201.6, 12 %=206.75, 25 %=163.84, 50 %=126.76, 73 %=60.03, 80 %=43.9, 100 %=0.61. Page: "82 kWh (2023+)". |
| 6 EX40 82 kWh ids (2024 RWD, 2025 single/twin, 2026 ER RWD/standard/twin) | fastned-polestar2-82kwh-2026, `tested`, `low_confidence` | 🏷 mislabel | Points are the Polestar 2 curve (match). But the Fastned XC40/EX40 82 kWh entry has a null graph, so nothing was measured on this car. See B. |
| 4 EX30 ids (2025 twin perf, 2026 single ER, 2026 twin perf, 2026 cross country) | fastned-2026, 18 pts over 10-89 %, peak 158.7 | ✅ values; ⚠ minor | The 18 points equal the page: 10 %=152.71, 29 %=158.73, 30 %=145.04, 50 %=100.7, 80 %=61.2, 89 %=26.2. Cross Country page identical. See C. |
| All 25 | source `type: community` with curve `kind: tested` | 🏷 inconsistent | `docs/design/data-sources.md` line 85 says store Fastned-derived curves as `tested` with the chain in the notes. Line 79 (B95) re-grades Chargeprice's simplified copies to `community`. The Tesla batch uses `testing_org`. Pick one. |
| All 25 | `accessed_on` 2026-11-19, specific URLs | ✅ | The Polestar URL is `en-gb` and the Volvo URLs are `en`; the XC40 URL needs `%20`, which is fine. |
| Polestar 2 78 kWh + EX40 78 kWh | peak 151 vs dc_max_kw 150/155 | ✅ | 150: +0.7 %. 155: -2.6 %. All within 5 %. |
| Polestar 2 82 kWh + EX40 2025/26 | peak 206.8 vs 205 | ✅ | +0.9 %. |
| EX40 2024 RWD | peak 206.8 vs dc_max 200 | ✅ (borderline) | +3.4 %, under 5 %. |
| EX30 | peak 158.7 vs 153 | ✅ (borderline) | +3.7 %. Page `chargeSpeed` is 160, so the page's own max supports the curve peak. See C. |
| Plausibility (B95) | at least 8 points below 100 %; no gap over 15 % | ✅ | 78 kWh: 21 points in 7-93 %, largest gap 5 %. 82 kWh: 21 points below 100 %, largest gap 10 % (15 to 25). EX30: 18 points, largest gap 5 %. |

## A. The 78 kWh curve on 11 powertrains: right generation?
- Pack: the spec batch says 78 gross / 75 usable, NMC, 400 V on all 11. The page is the 78 kWh 400 V pack, so it matches the hardware.
- The page says "78 kWh (2020 - 2023)" and rates 150 kW. The 2023 cars and the 2022-23 EX40 are inside that range. The 2024 Polestar 2 Long Range Dual (155 kW) and the 2024 EX40 Twin are outside Fastned's stated dates. That is unproven, not wrong. The batch has no 2024 source showing the pack, motors and software are unchanged except the 155 kW rating; for 2024 Polestar the rating itself changed (150 to 155 kW, from a relay and an estimate). A small rating change on the same pack suggests a software or limit change, so the curve may differ.
- The 2021 Launch Edition: the batch's own notes say pre-OTA 2020-21 software charged slower (InsideEVs 99 kW, Nyland 133 kW). Fastned's graph is a post-update shape. The curve is not wrong for later cars but may overstate a car that never got the update. This is stated in the notes, so it is fine as a documented caveat.
- Second source: the notes cite InsideEVs/Teslarati (150 kW to about 35 %, about 70 kW near 75-80 %). I did not re-open that. It is only a rough agreement and a different shape (Fastned has 130 kW at 35 %, 60 kW at 80 %).
- Fastned's own 78 kWh graph is stepped whole-kW values, a smoothed or averaged series. Fine.
- Recommendation: keep the 2020-2023 ids as they are. For the two 2024 ids (`polestar/polestar-2/2024-long-range-dual-motor`, `volvo/ex40/2024-twin`), either find a 2024 source or mark the curve `low_confidence: true` with the note "Fastned dates the graph 2020-2023". The 2022 P8 and 2023 twin EX40 are fine.

## B. EX40 82 kWh borrowing the Polestar 2 82 kWh curve
- The Fastned XC40 "82 kWh (2023 - 2024)" entry has a null graph, so the batch says so correctly. The curve is therefore not a measurement of the EX40, and `kind: tested` is a mislabel. The rules (item 9) call for `kind: estimated`, `low_confidence: true`, and `based_on: { variant_id, reason }`, with `source_id` the sibling curve's source. The notes also give the right caveat.
- Is the match proven?
  - Usable kWh: 79 vs 79 (spec batch, both manufacturer/estimated mix); gross 82 vs 82. OK.
  - Voltage class 400 V and chemistry NMC on both. OK.
  - Peak: Polestar curve 206.8 vs EX40 `dc_max_kw` 200 (2024) or 205. Within 5 %. OK.
  - Caveats: several Polestar 82 kWh and EX40 gross values (`82e`) and 4 of 6 EX40 DC peaks (`205e`) are estimated. The 82 kWh Polestar and EX40 packs are both "108s1p NMC" per the notes, but motors differ and no page links the two packs' charging software. For the match to count as proven, every figure must be known on both sides; the estimated ones make it partly unproven. Say so in `reason`.
  - Corroboration: EV Database "tested 207 kW" on the EX40 (in the spec batch notes) is consistent with the 206.8 peak. Good support if you cite it.
- Fix: change the six EX40 82 kWh curves to `kind: estimated`, add `based_on: { variant_id: "<Polestar 2 82 kWh variant that holds the measured curve>", reason }`, keep `low_confidence: true`, and keep `source_id: src-fastned-polestar2-82kwh`. Check `add-facts.ts` line ~24 for the `based_on.variant_id` format. It takes a variant id, whereas this batch is keyed by powertrain id, so confirm how a powertrain-level `based_on` is expressed. If `based_on` is not allowed for powertrain curves, the owner must decide whether to keep these as `estimated` with the reasoning in notes only.
- The curve id `fastned-polestar2-82kwh-2026` is fine and clearly says whose curve it is.

## C. EX30: 18 points over 10-89 %, peak 158.7 vs 153 rating
- The points match the page. The page's own `chargeSpeed` is 160 kW and the batch's 153 kW is the InsideEVs-relayed rating. The curve peak is +3.7 % over 153 and below the page's 160. This passes the 5 % rule. Do not drop it. Recommend noting in the curve notes that Fastned lists 160 kW max on the same page, so the `dc_max_kw` of 153 may be conservative (two ratings exist).
- The curve covers 10-89 %. There are no points at 0-9 % or 90-100 %, so the viewer will extrapolate or stop at 89 %. This is allowed (8+ points below 100 %, gaps under 15 %), but the page has no data outside 10-89 %. Say so on screen if the viewer shows the range, or leave as is.
- The InsideEVs second source cited has only 6 points and is lower after 40 %. It is not independent confirmation of the mid-range shape. The Fastned graph is smooth, with a notable +10 kW step at 29 to 30 % (158.7 to 145). Fine.

## D. Sampling loses a plateau on the 82 kWh curve
The batch jumps 15 % (199.5) to 25 % (163.8). The page shows about 184 kW at 18 %, 183 at 19 %, 181 at 21 %, 180 at 22 %, 178 at 23 % and 177 at 24 %, so a straight line between the two points is about 15-20 kW under the page around 20 %. Required: add 18 % (184.19) and 22 % (180.33).

## E. Fastned reuse terms (what I found)
- Fastned Terms of Use (https://www.fastnedcharging.com/en-gb/terms-conditions; the batch said 404, the en-gb URL reads): no clause on intellectual property, copying, scraping or reuse of site data. It covers accounts, pricing and data protection.
- Fastned UK Open Data / API Fair Use Policy (https://www.fastnedcharging.com/en-gb/uk-open-data): covers only "reference and availability data" about UK charge points and tariffs, not vehicle charge curves. It is not a licence for them. For that data: "Fastned retains all rights, title and interest"; the source must be acknowledged as Fastned; modified data must say it was modified; the licence is "limited, non-exclusive, non-transferable, and revocable"; no logos without written approval.
- robots.txt: `User-agent: *  Allow: /`.
- Bottom line: no reuse terms or licence for the car charge graphs exist. The facts (a curve of numbers) are not clearly protected, but rights are not granted either. `docs/design/data-sources.md` line 119 already lists Fastned charts as "No reuse terms found, Reference, asking Fastned is a later option". Recommendation: attribute Fastned on the curve (source title already does), do not use Fastned logos, keep the owner-approval step, and consider the "ask Fastned" email already listed as a later option. This is an owner decision, not a data defect.

## Required changes
1. All six `volvo/ex40/*` 82 kWh curves (`2024-single-motor-extended-range-rwd`, `2025-single-motor`, `2025-twin-motor`, `2026-single-motor-extended-range-rwd`, `2026-standard`, `2026-twin`): change `kind` from `tested` to `estimated` and add `based_on` naming the Polestar 2 82 kWh sibling and the pack match (82/79 kWh, 400 V, NMC, 200-205 kW). Keep `low_confidence: true`. Mention in `reason` that some EX40 and Polestar spec figures are themselves estimated, so the match is partly unproven.
2. All `polestar/polestar-2/*` and `volvo/ex40/*` 82 kWh curves: add points at 18 % (184.2 kW) and 22 % (180.3 kW).
3. All 25 curves: make source `type` and curve `kind` consistent. Either `testing_org` + `tested` (data-sources.md line 85, as the Tesla batch does) or `community` + `community` (B95 re-grade). Owner decision; the Fastned data is the original network data, not Chargeprice's simplified copy.
4. `polestar/polestar-2/2024-long-range-dual-motor` and `volvo/ex40/2024-twin`: set `low_confidence: true` (Fastned dates the graph 2020-2023; the 155 kW rating on 2024 cars shows a charging change and the match is unproven), or find a 2024 source.
5. EX30 curves: add to the notes that the page lists a 160 kW max (spec batch says 153 kW), and that the data covers 10-89 % only.
6. Record the finding in the source notes: Fastned reuse terms. The Terms of Use are readable at the `en-gb` URL and contain no reuse clause; the UK Open Data policy covers UK station data only. Replace "terms-of-use page not readable (404)" in the notes of `src-fastned-polestar2-78kwh`.

## No unknowns (item 14)
Batch covers 25 powertrains (7 + 4 + 4 + 6 + 4) with a curve each, so no powertrain in it lacks a curve. Not part of this batch (stated in NOTES): the Fastned 51 kWh EX30 and the EX40 single motor 70 kWh. Fastned has no graph for these, so any powertrain on those packs remains without a curve (check `research/powertrain-gaps.json`).
