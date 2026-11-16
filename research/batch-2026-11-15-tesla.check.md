# Check: research/batch-2026-11-15-tesla.json

**Verdict: FIX.** The curve borrow must be dropped, the preconditioning estimates are not supported for 2026 cars, and a few other values need adjustment. `--check` passes (84 variants, 71 sources). tesla.com was not fetched (403).

## Table

| Variant | Field / curve | Value | Result | Evidence |
|---|---|---|---|---|
| model-y premium-awd-b, long-range-awd-b, long-range-awd-b-pre-6-11-25, long-range-awd-i | curve `borrowed-model-3-premium-awd-i-2023` | copied from Model 3 premium-awd-i `chargeprice-2023` | ❌ mismatch | Points equal the sibling's (9 pts, peak 250 kW) and the sibling curve is `tested`. But no pack match is shown. The batch's "same pack" rests on DB figures (82/79 kWh), which come from OpenEV (uncited, lowest rank). The sibling curve is recorded for the 2023 Model 3 Long Range Dual Motor. EV Database (the batch's own source family) lists the older Model 3 LR AWD (page 1992) as "Nominal 78.1 / Useable 75.0 kWh", cell "LG 5L", 4,416 cylindrical cells. The same site lists Model Y Premium AWD (Berlin) as "82.0 / 79.0 kWh", "LG 5M". Those are different packs (about 5 % apart in usable kWh, different cell reference). The batch itself concedes Shanghai/Berlin packs "may differ". Standing rule: drop. |
| model-3 performance-awd, performance, premium-awd-i, premium-i; model-y all 7 | `battery.preconditioning` = automatic_with_navigation (estimated) | | ❌ mismatch (not supported) | Nav half: EV Database pages say "Automatically using Navigation Yes" (checked 3332, 1992, 3403, 3843). "No manual" half: the TMC thread is Nov 2019 to Feb 2022 only. The last post is Feb 2022. It does not name Model 3/Y explicitly. It also shows the multi-stop workaround. Nothing there covers 2026 software. Current sources are mixed. The 2026 tslna guide lists three ways to warm the pack: no dedicated battery button, but Scheduled precondition (battery and cabin by a ready time), Defrost Car "also warms the battery", and nav to a Supercharger. A 2026 search excerpt mentions a "warm it up" method in the app that I could not verify. So the "navigation only, no manual control" half is not shown for 2026 cars, and Scheduled Precondition is a user-set trigger. I found no source for a Supercharger-screen "Precondition" button. The researcher's own notes admit "not confirmed for 2026 software". |
| model-3 performance-awd, performance | heat_pump standard (community) | | ✅ with caveat | EV DB 3332: "HP Standard Equipment Yes". European listing, same generation. Low-confidence flag is right. |
| model-3 premium-awd-i | heat_pump standard (community) | | ⚠ weak | EV DB 1992 says HP standard, but that page is the older LR AWD (78.1 kWh, LG 5L cell). The batch calls it "Highland 2023-2025" and maps by content. Page-to-car link is doubtful. Keep only as low_confidence or find the Highland page. |
| model-3 premium-i | heat_pump standard | | ✅ | EV DB 3403: "HP Standard Equipment Yes" (LFP RWD, European). |
| model-y premium-awd-b | heat_pump standard (community) | | ✅ | EV DB 3843: "HP Standard Equipment Yes". Berlin-built, matches. |
| model-y long-range-awd-b, -pre-6-11-25, -i; performance-b | heat_pump standard (estimated) | | ⚠ acceptable | Same model and generation as Premium AWD. Basis stated. The -i variants are imports whose origin isn't shown. Performance-b has a different trim. Marginal, but a heat pump is a lineup-wide feature, so low_confidence estimated is tolerable. |
| model-y rwd-b, standard-b | heat_pump standard (community) | | ⚠ weak | Abstract Ocean is a US retail-accessory blog. Quote: "The heat pump and the mobile charger both stay." It is about the US Standard (US page, USD). The Canadian car is Berlin-built (Drive Tesla Canada). Drive Tesla Canada says nothing on a heat pump. It is a vendor blog, not a manufacturer or independent source. Keep low_confidence or drop. |
| model-3 performance(-awd) | wheels 20 in standard | | ⚠ unverifiable for Canada | Source says "the Model 3 Performance now comes standard with 20″ Warp Wheels", but it is a US report and Canada is not stated. Flagged low_confidence, which is right. Acceptable only with that flag. |
| model-3 premium-awd-i | wheels 18 std, 19 option | | ✅ | iPhone in Canada: 570 km "with the standard 18-inch wheels", 520 km with 19-inch. Peak DC 250 kW, Shanghai-built. Matches the DB (570 km). |
| model-3 premium-i | wheels 18 std, 19 option | | ⚠ inferred | Auto123: "463 km when equipped with 18-inch wheels", 413 km with 19-inch. The page does not say which is standard. Inference from the headline range is reasonable but not shown. Keep low_confidence with the inference noted, or drop the `is_standard` claim. |
| model-y long-range-awd-b | wheels 19 std, 20 option | | ⚠ mapping | tslna: "Premium AWD: 19-inch standard, 20-inch +$2,600", 542 km. Matches the DB's 542 km for long-range-awd-b and premium-awd-b. The mapping to long-range-awd-b by content is plausible. But premium-awd-b has the same data and no wheels were added there, and the other two LR variants (526 km) get none. Add wheels to premium-awd-b too, or explain. |
| model-y rwd-b, standard-b | wheels 18 std | | ✅ | Drive Tesla Canada: "exclusively with 18-inch Aperture wheels", 463 km. tslna: "18″ Aperture (only option)". |
| model-y performance-b | wheels | none added | ⚠ gap | tslna gives "21″ Arachnid 2.0" standard for Performance (494 km). Could be added, low_confidence. |
| model-y rwd-b, standard-b (existing data) | 78/75 kWh LFP, 170 kW (not in batch) | | ❌ flagged data issue | See below. |

## Flagged data issue (rwd-b, standard-b at 78/75 kWh LFP, 170 kW)

The evidence points to the existing OpenEV-derived figures being wrong for the Canadian Standard.
- EV Database Model 3 RWD (LFP, CATL 6M), page 3403: usable "60.0 kWh" (marked estimated), "175 kW DC".
- Electric Autonomy (via search): "64 kWh (60 kWh usable)", 463 km.
- Electrek hands-on (via search): 463 km at 7.3 km/kWh, which implies roughly 63 kWh. 10-80 % in 24 min.
- Tesla Canada comparison table (via search): peak Supercharging 175 kW.
- Drive Tesla Canada cited a 225 kW peak and 516 km, which likely reflects another spec.

463 km divided by 7.3 km/kWh is about 63 kWh, which fits the ~60-64 kWh pack. It does not fit 75 kWh. 175 kW is supported by two or three sources, while 170 kW has none. The existing 78/75 kWh and 170 kW therefore conflict with the evidence, and the current `derived.minutes_10_80` of 24.7 depends on them. I could not open the Electrek page itself, so the 63 kWh figure is second-hand. The same likely applies to model-3 premium-i (LFP RWD, same EV DB page): check its existing data. Recommend a separate correction batch with manufacturer or Tesla Canada spec sources, not part of this batch.

## Other checks

- Sources used by the batch but defined elsewhere (`src-chargeprice-archive-2025-04`, `src-tslna-model-y-price-canada-2026`) exist in `data/sources/`.
- `type: community` for EV Database and the blogs is sensible. All have `accessed_on`.
- Fit with existing data: no range or capacity values are being changed. The existing premium-awd-b/long-range-awd-b figures (82/79 kWh) are OpenEV-sourced and the EV Database agrees, so there is no 5 % conflict on those.

## Required changes

1. Remove the `borrowed-model-3-premium-awd-i-2023` curve from all four Model Y variants (premium-awd-b, long-range-awd-b, long-range-awd-b-pre-6-11-25, long-range-awd-i). The pack match is not shown, and EV Database lists the older Model 3 LR AWD as 78.1/75 kWh LG 5L versus 82/79 kWh LG 5M on the Model Y.
2. Drop all `battery.preconditioning` estimates (11 variants). The "no manual control" half is not shown for 2026 (the TMC thread ends Feb 2022 and names no model; Scheduled Precondition and the app's Defrost warm the battery on a user trigger). Re-add only with a 2026 owner's manual page (the tesla.cn or tesla.com owner's-manual mirrors that appeared in search might be fetchable) stating what triggers battery warming, using the manual's actual wording.
3. model-3 premium-awd-i heat pump: cite the Highland EV Database page, or keep the claim as `low_confidence` and say the 1992 page is the older LR AWD.
4. rwd-b and standard-b heat pump: keep only as low_confidence community, or drop. The source is a US accessory vendor, not Tesla or an independent test.
5. model-3 premium-i wheels: note the 18-inch standard flag is inferred. Drop `is_standard` on 18 and 19 if the owner wants only stated facts.
6. Optionally add wheels for premium-awd-b (19 standard, 20 option) and performance-b (21 standard) from tslna, low_confidence.
7. Open a separate batch or issue to correct rwd-b, standard-b (and probably model-3 premium-i) capacity, DC peak and derived time (LFP about 60 kWh usable, 175 kW).

## Unverified and not retried

tesla.com (403, not retried). Electrek article text (only search excerpts).

## Applied by the main session (2026-11-15)
Done:
- Dropped the borrowed curve `borrowed-model-3-premium-awd-i-2023` from all four Model Y variants: no pack match shown (EV Database lists different cells, LG 5L vs 5M). Standing rule: drop.
- Dropped all 11 `automatic_with_navigation` preconditioning estimates: the "no manual control" half isn't shown for 2026 cars. Re-add later only from a 2026 owner's manual page.
- Model 3 Premium AWD-I heat pump: kept at low confidence, with a note that the cited EV Database page may be the pre-Highland car.
- Kept the rest as low confidence: Model Y RWD/Standard heat pump (community blog), Model 3 Premium-I 18 in standard, and Performance 20 in (US report). Kept the Model Y heat pump estimates.
Not done:
- Optional extra wheels (premium-awd-b 19/20, performance-b 21) from tslna were not added in this round.
- The Model Y Standard pack (rwd-b/standard-b stored as 78/75 kWh at 170 kW, while the evidence points to about 60 kWh usable at 175 kW) and the Model 3 Premium-I pack are left for a separate correction batch with Tesla Canada sources. Raised with the owner.
