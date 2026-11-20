# Fact-check: curves-2026-11-20-w2-tesla-rivian-lucid.json

**Verdict: FIX.** `npx tsx scripts/add-facts.ts <batch> --check` passes (valid). Every Fastned and Gravity Touring point matches its source. The problems are in what the curves are attached to, the two merged curves, and the points that are really bounds or lower limits.

## Method
- Fetched the Fastned pages with curl and parsed the embedded `chargeGraph` JSON (Tesla Model S and X, Lucid Air, Lucid Gravity).
- Re-fetched all five InsideEVs articles and compared their text with the batch points.
- Looked up each covered powertrain's variants in `public/data/cars/` (pack, chemistry, voltage, `dc_max_kw`).
- Ran `checkCurve` from `scripts/lib/curve-check.ts` on every distinct curve.

## Results

| Curve (powertrains) | Result | Evidence |
|---|---|---|
| `fastned-2026-100kwh` (23 S/X ids) | ✅ points; 🏷 kind unproven; ❌ fit | All 21 points equal Fastned "100 kWh (2022+)" (3 %: 131.66, 36 %: 218.23, 50 %: 145.16, 80 %: 64.58, 91 %: 41.45). The Model X page carries identical "100 kWh (2022+)" and "Plaid 100 kWh" series. The page says "charging behaviour of this car ... around 30 °C" and never says "measured". Peak 218.2 kW is 12.7 % below `dc_max_kw` 250. |
| `fastned-2026-112kwh` (Air GT ×4) | ✅ points | 2 %: 305.63, 10 %: 252.86, 50 %: 180.14, 80 %: 94.26, 95 %: 66.79 all match. The page labels it "112 kWh (2023+)". |
| `fastned-2026-123kwh` (Gravity GT ×4) | ✅ points; ⚠ truncated | 12 %: 405.62, 40 %: 255.37, 60 %: 179.03, 87 %: 77.32 all match. The page labels it "123 kWh (2026+)". Data covers only 12-87 %. |
| `insideevs-outofspec-2021` (Plaid ×6) | ❌ / 🏷 mixed | See details below. |
| `insideevs-2021-dream` (Dream ×2, Sapphire ×4) | ✅ points (one a lower bound); ❌ mapping | 6 %: 302, 20 %: 282, 40 %: 210, 60 %: 133, 73 %: 100, 80 %: 84, 90 %: 50, 100 %: 4 all match the articles. 17 %: 290 is a lower bound ("290 kW or more ... 2% and 17%"). |
| `insideevs-2025-touring` (Gravity Touring ×2) | ✅ | All 10 table rows match (0 %: 310, 50 %: 180, 80 %: 80, 90 %: 50). The article says the battery was preconditioned and the charger could deliver 300 kW. Ambient temperature is not stated. |

### `insideevs-outofspec-2021` point by point
| Point | Result | Evidence |
|---|---|---|
| 0 %: 147 | ✅ | 544379: "immediately shot up to 147 kW". |
| 2 %: 150 | ⚠ unverifiable | Not found on the pages as fetched. The batch attributes it to Out of Spec ("~150 kW at 2 %"). |
| 8 %: 249 | 🏷 weak | 549335 says only "mostly at 249 kW peak" and a plateau from about 8 % to 33 %. Moloughney's own run reached 250 kW at about 5 %. |
| 33 %: 250 | ✅ | 544379: "held the 250 kW ... state of charge was 33 %". |
| 50 %: 148 | ❌ bound | 549335: "below 148 kW at 50% SOC". An upper bound is stored as a measurement. |
| 80 %: 68 | ❌ bound | Out of Spec says "below 68 kW at 80%". Moloughney says 70 kW at 80 %. The batch chose the bound. |
| 87 %: 50 | ❌ not found | 544379 does not mention 87 %. It lists 90 % at 40 min with no kW figure. |
| 95 %: 28 | ❌ bound | "Above 95% SOC it's less than 28 kW". |
| 100 %: 3 | ✅ | 544379: "still accepting 3 kW". |

## Cross-cutting findings
- **Fastned curve, EU CCS2 cap.** The batch notes say the 218 kW cap is a CCS2 effect, and that is plausible. But every covered S/X id is CA/US-market with NACS and a 250 kW Supercharger. Fastned's curve is capped about 13 % below the car's rated peak, and its 3 % start (132 kW) is also a charger effect. It fails the B95 "peak within 5 % of `dc_max_kw`" test. If it is not set as the default, the Plaid ids still get a sounder default from the V3 run.
- **Fastned "measured" status.** Fastned does not say its graph is measured. The page says only "shows the charging behaviour". `tested` plus `low_confidence: true` is borderline. The source `type: testing_org` is a stretch for a charging operator; "community" or a note on provenance would be more honest.
- **Year labels.** Fastned labels its curves "(2022+)", "(2023+)" and "(2026+)". They are applied to the 2021 S/X ids, the 2022 Air GT and the 2025 Gravity GT, which the page does not cover. For S/X the pack is identical. For the Air 2022 GT and Gravity 2025 GT the software and hardware are unproven.
- **Truncated curves.** The S/X curve covers 3-91 %, the Air 2-95 % and the Gravity 12-87 %. `powerAt` holds the first and last values flat. The Gravity curve would therefore show 405 kW at 0 % and 77 kW at 100 %. The S/X curve would show 132 kW at 0 % and 41 kW at 100 %. The linter does not warn about this.
- **Plaid merge.** Merging two tests into one `tested` curve is not sound here. Three of nine points are "below X" bounds from one test. The 80 % point mixes a bound (68) with the other test's value (70). The 0 % and 33 % points come from the other run. The 87 % point has no source. The `conditions` block (preconditioned yes, 250 kW) is only proven for Out of Spec; Moloughney's article does not say whether the battery was preconditioned.
- **Lucid Air Dream merge.** Both articles are on the Dream Edition Range, but they are separate sessions:
  - 550025 names no charger and no preconditioning.
  - 555634 says Electrify America (up to 350 kW) with a preconditioned battery.
  - `conditions` (preconditioned yes, 350 kW) applies to only half the points.
  - The two sessions are still within ~5 % of each other at 40 % and 80 %.
- **Sapphire sharing the Dream curve.**
  - The curve is a 2021 Dream Edition Range test with 2021 software, and the batch itself says Lucid promised a charging update.
  - The 2024-27 Sapphires have the same 118 kWh pack and 300 kW `dc_max_kw` in the repo, so pack and hardware match.
  - But rule 5 requires no relevant change in charging software across the years. Fastned's 2023+ Air curve and InsideEVs' 2024 GT test both exceed the 2021 curve at mid-SoC (Fastned 180 kW at 50 %), so software drift is likely.
  - Nothing here proves Sapphire matches. Keep it only as an explicitly low-confidence borrow, or drop it.
- **Gravity GT second source.** The batch notes say InsideEVs (375 kW peak, over 300 kW to nearly 40 %) conflicts with Fastned (under 300 kW from 26 %). B95 #13 wants a second source that agrees with the shape; here it does not. `low_confidence` is correctly set, but the curve is "conservative", not verified.
- **Gravity Dream Edition vs GT.** The pack (123 kWh) and `dc_max_kw` (400) match in the repo. The Dream Edition's motors differ and the Fastned page does not distinguish them. This is acceptable only as low confidence.
- **Spec-data oddities in the repo.** Not batch errors, but they weaken the pack match:
  - `lucid/air/2023-grand-touring-performance`: gross 112, usable 109.1, against the curve's "112 kWh".
  - `lucid/air/2024-grand-touring`: gross 111 with usable 112 (gross below usable).
  - Gravity GT/Dream ids have usable unknown; only gross 123 is known.
- **Coverage gaps.**
  - The batch skips the 2021 S/X `long-range-plus` and `performance` ids (94 kWh usable). That is documented.
  - The Air 2025-27 Grand Touring ids (117 kWh) are not covered. That is documented.
  - Air Pure and Touring ids and Gravity 2027 Dream are not covered.
  - Under the owner's "no unknowns" rule these still have only estimated curves.

## Linter (`checkCurve`, B95)
| Curve | Warnings |
|---|---|
| `fastned-2026-100kwh` | none (peak is not checked from below) |
| `insideevs-outofspec-2021` | gap: 30 % between 50 % and 80 % (the 33-50 % gap is 17 %, also over 15) |
| `fastned-2026-112kwh` | none |
| `insideevs-2021-dream` | gap: 20 % (20-40 and 40-60) |
| `fastned-2026-123kwh` | none; first point is 12 % and last 87 % (not flagged) |
| `insideevs-2025-touring` | none |

No errors. Peaks above `dc_max_kw` are within 5 % (Air 305.6 vs 300, Gravity 405.6 vs 400, Touring 310 vs 300).

## Numbered fix list
1. **Plaid curve `insideevs-outofspec-2021` (all 6 ids).** Do not store "below" bounds as measurements. Either use Moloughney's article alone (0 %: 147, 33 %: 250, 80 %: 70, 100 %: 3, plus the 250 kW at ~5 % mention), which is too sparse, or keep the merge but label it as a combined reading in the curve notes. Drop 87 % (50 kW) as unsourced, drop or verify 2 % (150 kW), and replace 50 % (148), 80 % (68) and 95 % (28) with `soc_percent` values the sources actually state. Do not claim `preconditioned: yes` for Moloughney's run.
2. **Plaid curve gaps.** After the changes in item 1 the curve still has a 30 % gap (50-80 %). The 50 % and 80 % figures are bounds only, so consider dropping the whole curve and letting the Fastned curve stand, or keep it as `low_confidence` with the gap documented.
3. **Fastned S/X curve.**
   - Add to the notes that the peak is capped at 218 kW by the European CCS2 chargers.
   - Do not make it the default curve for NACS cars with a 250 kW rated peak. It fails the "peak within 5 % of `dc_max_kw`" rule by 13 %. Let the viewer pick the Plaid InsideEVs curve first on Plaid ids.
   - Reconsider `kind: tested` and `type: testing_org`, since Fastned does not say the graph is measured.
4. **Truncated curves.** Add start and end anchors, or note the range clearly. At minimum the viewer must not extend 405 kW to 0 % on the Gravity curve or 77 kW to 100 %. Consider dropping the Gravity GT/Dream curve until 0-12 % and 87-100 % are covered.
5. **Sapphire (4 ids).** Remove `insideevs-2021-dream` from `lucid/air/2024-sapphire`, `2025-sapphire`, `2026-sapphire` and `2027-sapphire`, or keep it with a clear note that it is a 2021 Dream test and unproven for Sapphire software.
6. **Dream curve conditions.** Remove `preconditioned: yes` and `charger_kw: 350` from `insideevs-2021-dream`, or split the curve into the two sessions. Neither condition is stated for the 550025 run. Replace 17 %: 290 (a lower bound) with the 6 %: 302 peak and a stated plateau, or note it as a lower bound.
7. **Air 2023 Grand Touring Performance and 2024 Grand Touring.** Check the spec data (usable 109.1 and gross 111 against the curve's 112 kWh) before keeping the Fastned curve on these ids. Add a note about the mismatch.
8. **Air 2022 Grand Touring and Gravity 2025 Grand Touring.** The Fastned labels are "2023+" and "2026+". Note the year gap in curve notes, or drop these two ids.
9. **Gravity GT/Dream.** Note in curve notes that the Dream Edition motors differ from the GT and that only gross 123 kWh is known.
10. **No-unknowns rule.** List the Lucid Air Pure/Touring, Air 2025-27 Grand Touring, 2021 S/X Long Range Plus/Performance and Gravity 2027 Dream ids as still-uncovered curve gaps.
