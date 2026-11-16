# Check: batch-2026-11-15-ultium-large.json

**Verdict: FIX.** `add-facts.ts --check` passes (84 variants, 83 sources). Wheels, chemistry, ports and the 40 min claims largely hold. Four things must change: the two assumed curve points, the Silverado 205 kWh "gross", the Silverado 11.5 kW AC estimate, and one wrong source URL. Several LYRIQ curve points could not be found in the article.

## Table

| Variant | Field / curve | Value | Result | Evidence |
|---|---|---|---|---|
| silverado wt-max-range | curve `statecharge-rst-2024` pts 10/32/34/52/66/75 % | 347/347/300/300/148/185 kW | ✅ | Article (slug ending `-10-80`): "about 347 kW", ~300 kW at 34-52 %, "just under 150 kW at about 64-68%", "over 180 kW at 74-76%". |
| silverado wt-max-range | curve pt 80 % | 175 kW | ❌ | Article gives no 80 % figure; the batch's own notes say it is assumed. Remove from a `tested` curve. |
| silverado wt-max-range | curve source URL | `.../2024-chevrolet-silverado-ev-rst-dc-fast-charging-analysis/` | ❌ | That URL returns a listing page with no data. The article is at `.../2024-chevrolet-silverado-ev-rst-dc-fast-charging-analysis-10-80/`. |
| silverado wt-max-range | curve pack match (2024 RST FE vs 2026 WT Max) | "same pack" | ⚠ unproven | Article: GM doesn't disclose pack size, "more than 200 kWh". No source ties the 2024 RST pack to the 2026 WT Max pack. Only EVCS 2027 says 2027 = 2026 pack. Needs `low_confidence` (kept) and a note saying carry-over is assumed. |
| silverado wt-max-range | `capacity_gross_kwh` | 205 kWh | ❌ / 🏷 | Wikipedia lists "205 kWh, Max Range", bare, and says nothing on gross vs usable. InsideEVs: 213.7 gross (calculated), 204 usable (reported) for the same pack. 205 is almost certainly usable. Wikipedia also mentions a "200 kWh" battery. |
| silverado wt-max-range | `capacity_usable_kwh` | 204 kWh | ✅ | InsideEVs: "204 kWh (reported)" for the 2024 RST pack. Max-pack mapping assumed (low_confidence). |
| silverado wt-max-range | `ac_max_kw` | 19.2 kW | ⚠ | Charge Port lists "WT Max Range (fleet only)" at 19.2 kW with **no year**, not "2026". The 2026 LT Max and RST Max are listed at 19.2 kW. Keep only if the note says the year is unstated. |
| silverado wt-std, lt-std | `capacity_gross_kwh` | 119 kWh | ⚠ | Wikipedia infobox "119 kWh, Standard Range", bare. Not a manufacturer statement (cites MotorTrend). Charge Port lists no pack sizes. thinkEV says "200 kWh". Weak but flagged low_confidence. |
| silverado wt-ext, lt-ext, trail-boss | `capacity_gross_kwh` | 170 kWh | ✅ (lt-ext) / ⚠ (others) | InsideEVs: "The battery in my tester is a whopping 170 kilowatt-hours" (2025 LT Ext). Bare, so gross label is acceptable. WT Ext and Trail Boss rely on name mapping and Wikipedia. |
| silverado wt-std, lt-std | `ac_max_kw` | 11.5 kW estimated | ❌ | Charge Port lists 11.5 kW for the **2027** Standard. EVCS 2027 says carry-over "same powertrain and battery", not the charger. The same Charge Port page lists the 2026 LT Max and RST Ext at 19.2 kW standard, versus 11.5 kW standard on the 2027 LT Ext. So the charger changed between 2026 and 2027, and the basis fails (rule 5). Drop both. |
| silverado all 6 | `charge_port` | ccs1 | ✅ (US) | EVCS: "NACS charging port instead of the CCS1 used in the 2024-2026 model years". Canada not shown to differ. thinkEV's 2026 page lists "CCS1/NACS", so keep low_confidence. Not verified that a 2026 Canadian truck has no NACS; kind `manufacturer` is a relay and acceptable. |
| silverado all 6 | `battery.chemistry` | nmc | ✅ | thinkEV: "200 kWh NMC" (model level). InsideEVs: NMC pouch cells (RST pack). |
| silverado lt-ext | `published_10_80_min` | 40 min, tested | ✅ with caveat | InsideEVs: Chevrolet "says it will do the 10-80% sprint in 40 minutes"; author: "It did." 2025 LT Ext Range. Measured, but rounded and a single run. Charge Port says Chevrolet published no 10-80 figure, so the note "also quoted as Chevrolet claim" is contested. Keep `tested`, low_confidence. |
| silverado wt-std | wheels 18 in std | 18 | ✅ | Cars.com 471782 "e4WD Crew Cab Standard Range Work Truck", 18 x 8.0 steel. |
| silverado wt-ext | wheels 18 in std | 18 | ✅ | Cars.com 471783: 18 x 8.0 aluminum. |
| silverado wt-max | wheels 18 in std | 18 | ✅ | Cars.com 471784: 18 x 8.0. Page shows no battery, so the Max pack for WT is inferred from the name. |
| silverado lt-std | wheels 18 in std | 18 | ✅ | Cars.com 471785: 18 x 8.5 aluminum. |
| silverado lt-ext | wheels 18 in std | 18 | ✅ | Cars.com 471786: 18 x 8.5 aluminum. |
| silverado trail-boss-ext | wheels 18 in std | 18 | ✅ | Cars.com 471788: 18 x 8.5 aluminum. Guide Auto "35-inch" claim not reopened (⚠). |
| lyriq awd | curve `statecharge-2024` pts 24/25/33/46/71/79/88/100 | 187/150/150/88/110/99/47/18 | ✅ | Article: "nearly 187 kW" at ~24 %; "drops sharply to about 150 kW"; "local bottom of about 88 kW around 46%"; ~110 kW at 71 %; "below 100 kW" after 79 %; 88-100 % "under one-quarter of peak" (47 kW); ~18 kW at the end. |
| lyriq awd | curve pts 40 % / 100 kW and 53 % / 94 kW | 100, 94 | ⚠ | Not found in the fetched article summary (only "declines gradually" from 33 % and "climbs slowly" 46-71 %). Researcher must quote the text or delete them. |
| lyriq awd | curve pt 10 % / 187 kW | 187 | ❌ | Article gives no figure at 10 %. Batch notes say assumed. Remove from a `tested` curve (the curve can start at the first stated point). |
| lyriq awd | curve pack carry-over 2024 → 2026 | "carried over" | ⚠ unproven | EVCS 2027: "single battery pack for all versions", specs "appear to be the same" as 2026. Nothing links the 2024 pack to 2026. Charge Port says every Lyriq is 102 kWh, but is a 2026-27 page. |
| lyriq awd | curve kind / conditions | tested, EVgo 350 kW | ✅ | State Of Charge, 0-100 % session, 10-80 over 41 min at 118 kW average. Matches the notes. |
| lyriq standard, v | curve `borrowed-lyriq-awd-2024` (`based_on` awd) | copies awd points | ⚠ | Points equal the awd curve (including the unsupported 10 % point and the two unverified points). Repo data: standard, awd and v all have 100.4 gross / 95 usable, 400 V, 190 kW peak, so the numeric match holds in the repo. But the batch's reason cites "102 kWh", which conflicts with the repo's 95 kWh usable (102 is State Of Charge's "net"). Same-pack evidence is the Charge Port line "every Lyriq 102 kWh" (2026 page). Acceptable once the awd curve is fixed; correct the reason text. `source_id` matches the sibling's. |
| lyriq all 3 | `charge_port` | ccs1 | ⚠ conflict | Charge Port: "Leftover 2023-2026 Lyriqs have a CCS1 port". CarGurus: 2026 "still comes equipped with... CCS". thinkEV (Canada): 2027 "trades the CCS connector found on current models". These support CCS1. Repo currently has `nacs` from OpenEV for all three (probably 2027-style data). Flagged, keep low_confidence and let the owner resolve. The conflict note is appropriate. |
| lyriq all 3 | `published_10_80_min` | 40 min | ✅ | CarGurus: Cadillac says "10% to 80%... in about 40 minutes". Manufacturer kind OK as a relay. |
| lyriq standard | wheels 20 std / 22 opt | 20, 22 | ✅ | Cars.com 468062 Luxury RWD: 20-in, 265/50R20, 22-in in accent packages. CarGurus: "20 inches, with 22-inch available on the bottom four trims". |
| lyriq v | wheels 22 std | 22 | ✅ | Cars.com 468080: 22-in, 275/40R22. |
| lyriq all 3 | `battery.chemistry` | nmc, estimated | ✅ | EV Database lists "NMC", "Pouch", "GM Ultium 140Ah" for LYRIQ-V MY26. The page also shows 95/91 kWh (not used). LYRIQ-V is stated directly, so `v` could be a non-estimated value. Standard and awd rely on same cells (Charge Port: every Lyriq one pack); basis OK. |

## Fit with existing data
- LYRIQ: batch notes say 102 kWh net; repo has 95 usable / 100.4 gross (OpenEV). A 7 % gap exists in prose only, because the batch adds no capacity field. Do not add 102 as a field.
- Silverado: the repo has no capacity. Peak 350 kW matches the tested peak (347).
- LYRIQ 190 kW peak vs tested 187: fine.

## Required changes
1. Silverado `statecharge-rst-2024`: delete the 80 % / 175 kW point (assumed). Fix `source_id` URL to `https://evchargingstations.com/chargingnews/2024-chevrolet-silverado-ev-rst-dc-fast-charging-analysis-10-80/`. State in the notes that the 2024 RST First Edition pack is assumed equal to the 2026 WT Max pack (not shown by any source) and keep `low_confidence`.
2. LYRIQ `statecharge-2024`: delete the 10 % / 187 kW point. Quote or remove the 40 % / 100 kW and 53 % / 94 kW points. Note that 2024 → 2026 pack equality is assumed.
3. LYRIQ `borrowed-lyriq-awd-2024` (standard, v): regenerate the points from the corrected awd curve. Replace "102 kWh" in the reason with the repo's figures (100.4 gross / 95 usable, 400 V, 190 kW), and cite the Charge Port "every Lyriq 102 kWh" for same-pack.
4. Silverado WT Max: drop `battery.capacity_gross_kwh` = 205 (it is usable, not gross). If a gross figure is wanted, use InsideEVs 213.7 (calculated, RST pack) as a separate value with that label.
5. Silverado `ac_max_kw` 11.5 kW (wt-std, lt-std): drop. 2026 and 2027 chargers differ per the Charge Port page itself.
6. Silverado WT Max `ac_max_kw` 19.2: either drop, or reword the note to say the page lists "WT Max Range (fleet only)" with no year; it is not a 2026 listing.
7. Silverado 119 / 170 gross (wt-std, lt-std, wt-ext, trail-boss): keep only if the owner accepts Wikipedia plus name mapping; otherwise restrict to lt-ext 170 (InsideEVs, 2025 LT Ext).
8. Silverado lt-ext `published_10_80_min`: soften the note, since the Charge Port says Chevrolet published no 10-80 time while InsideEVs says it did.
9. Optional: LYRIQ-V chemistry could be non-estimated (EV Database states it for the V).

Not reopened or unreadable: Guide Auto Trail Boss article (⚠ not reopened), OpenEV and GM/Cadillac pages (blocked).

## Applied by the main session (2026-11-15)
Done:
- Dropped both tested curves (Silverado `statecharge-rst-2024`, LYRIQ `statecharge-2024`) and the two `borrowed-lyriq-awd-2024` curves. Each had assumed or unquoted points, and nothing shows the 2024 test pack carried into the 2026 variant (the same standing rule as for borrowed curves). Re-add once a source ties the packs together, using only the quoted points.
- Silverado gross: dropped Wikipedia's bare 119 (wt-std, lt-std) and 205 (wt-max; probably usable). Kept 170 from InsideEVs on lt-ext and wt-ext, and re-cited trail-boss 170 to InsideEVs (same Extended pack). Kept wt-max usable 204.
- Dropped the estimated AC 11.5 kW on wt-std and lt-std (the charger changed between 2026 and 2027). Reworded the WT Max 19.2 kW note to say the listing has no year.
- Softened the lt-ext 10–80 note.
- Kept ports ccs1 (low confidence), LYRIQ 40 min (manufacturer via CarGurus), the wheels and the LYRIQ chemistry estimate.
Not done:
- LYRIQ port: OpenEV's `nacs` for all three 2026 variants conflicts with the ccs1 added here (likely 2027 data). The data build will show "sources differ". Whether to drop the OpenEV match is an owner decision. Raised.
