# Check: batch-2026-11-15-egmp-3row.json

**Verdict: FIX.** `add-facts.ts --check` passes (84 variants, 49 sources). Most values hold. Four items need changes: IONIQ 9 `dc_max_kw` kind, the IONIQ 9 curve borrowing, the EV9 GT `published_10_80_min` estimate, and an existing-data conflict on EV9 peak DC.

## Table

| Variant | Field / curve | Value | Result | Evidence |
|---|---|---|---|---|
| IONIQ 9 standard | battery.chemistry | nmc | ✅ | Electrek: "an NMC (nickel-manganese-cobalt) lithium-ion pack", 110.3 kWh. Kind community is right. |
| IONIQ 9 standard | capacity_usable_kwh | 106 kWh | ✅ page, ❌ fit | EV Database (EU Long Range RWD) says 106.0 usable, 110.3 nominal. But the repo has awd and awd-performance at 99.5 (OpenEV, manufacturer). That is 6.5 % apart for the same 110.3 pack, so it should show as a conflict. See change 5. |
| IONIQ 9 standard | ac_max_kw | 11 | ✅ | EVDB: 11 kW AC. EU listing, low_confidence is right. |
| IONIQ 9 standard | dc_max_kw | 237 kW, manufacturer | 🏷 mislabel | Electrek says "up to ~237 kW at a native 800 V station", with no attribution to Hyundai. The batch note says it "relays Hyundai", but the page doesn't. The same article gives the author's own measured peak as "nearly 215 kW". EVDB lists 250 kW. Not a manufacturer figure. |
| IONIQ 9 standard | wheels 19 in 255/60R19, standard | | ✅ (caveat) | evspecifications: US 2026 RWD S, 19-inch, 255/60R19. Canadian Standard is assumed to be the RWD S, and low_confidence is set. |
| IONIQ 9 standard | curve evercars-2026, community, 3 points | 10 %:211, 60 %:235, 80 %:124 | ✅ values, ⚠ adequacy | EverCars: 211 kW at 10 %, 235 kW peak at 60 %, 124 kW at 80 %, 23:19 for 10-80 %. Trim not stated. 400 kW charger. "did not allow for preconditioning". Kind community is fair. With 3 points, a straight line from 10 % to 60 % and 60 % to 80 % is invented shape. The peak at 60 % is unlikely to be a plateau start. Electrek's own test peaked at ~215 kW. Fine as a low-confidence standalone curve, but not a base for borrowing (see below). `preconditioned: unknown` is acceptable. The source implies "no". |
| IONIQ 9 awd | curve borrowed-ioniq9-standard-2026 (estimated, based_on standard) | same 3 points | ❌ unproven match | Gross 110.3 is the same, and the stated peaks are about the same. But usable is 106 (standard, new) vs 99.5 (awd, existing), which is 6.5 %, over the 1 % limit. awd `dc_max_kw` in the repo is 350 (OpenEV), vs 237 on standard. Neither peak is a sourced match. The sibling curve has only 3 points. Source id and points are otherwise correct. Match unproven, so B16 is not met. |
| IONIQ 9 awd-performance | same borrowed curve | same | ❌ unproven | Same as awd (usable 99.5, dc 350 in repo). Also a different motor set. |
| IONIQ 9 awd, awd-performance | battery.chemistry nmc | nmc | ✅ | Electrek. Same pack across trims (110.3 in repo for all three). |
| EV9 land-awd-gt-line | curve insideevs-2024, tested | 18 %:200, 40 %:207, 44 %:209, 55 %:216, 60 %:201, 70 %:180, 80 %:103 | ✅ (18 % ⚠ placed) | InsideEVs: 40 %: 207, 44 %: 209, ~55 %: 216 (peak), ~60 %: 201, 70 %: 180, 80 %: 103. All match. The article says the test started at 18 % and the car "began sucking in roughly 200 kW of charging power almost immediately". Placing 200 kW at the 18 % start is defensible, because the page gives both the start SoC and the approximate power. It is a rounded value, and the batch notes say so. 2024 GT-Line, 99.8 kWh, AWD per the article. Electrify America 350 kW, temperature and preconditioning not stated, session interrupted once. Kind tested is right. Note the ~55 % and ~60 % are approximate on the page. |
| EV9 land-awd | curve borrowed from GT-Line | same 7 points | ✅ points copied exactly, ⚠ conflicting peak | Same 99.8 kWh pack, 800 V, NMC. Peak: Kia claims 210 (EVDB), tested 216, which is 2.8 %. Usable 95 for both in the repo. But the repo has `dc_max_kw` 240 (Chargeprice, unsourced) on both land-awd and land-awd-gt-line. That is 11 % off the tested 216, and the batch does not fix it (see change 4). |
| EV9 wind | curve borrowed from GT-Line | same | ⚠ acceptable, caveat | Same pack (99.8 kWh), 210 vs 216 kW (2.8 %). The sibling is AWD (dual motor) and Wind is a single-motor RWD. The Wind usable and DC figures come from the EVDB AWD page, not an RWD page. Pack-limited charging makes this plausible, but the RWD pack match is not shown on a page for the RWD car. |
| EV9 gt | curve borrowed from GT-Line | same | ⚠ marginal | GT 206 kW (EVDB, claimed) vs 216 kW tested = 4.6 %, within 5 %. Usable 96 on both. Same chemistry and 800 V. Different motors (160/270 kW per Kia Canada), though the pack is shared. Accept, but it is at the limit and based on a claimed figure. |
| EV9 wind | capacity_usable_kwh 96 | | ✅ | EVDB 99.8 AWD: 96.0 usable, marked estimated on the page. Community, low_confidence. |
| EV9 wind | ac_max_kw 10.9 | | ✅ | Edwards: onboard charger "10.9" with no unit. The Kia owner manual en_US specs page gives OBC max 10.9 kW. Unit confirmed. |
| EV9 wind | dc_max_kw 210, manufacturer | | ✅ | EVDB: Kia claims 210 kW max. Also 210 on the Edwards GT-Line page. |
| EV9 wind | published_10_80_min 24 | | ✅ (caveat) | Edwards Wind: "24 min (350kW, max 310A)". This is the US AWD Wind, not the Canadian RWD Wind. low_confidence is set. |
| EV9 wind | wheels 19 in 255/60R19 | | ✅ (caveat) | Edwards Wind says "19-inch alloy", 255/60R19. This is AWD, and the RWD is assumed the same. |
| EV9 gt | published_10_80_min 24, estimated | | ❌ basis fails | Rule 5 needs a sibling with the same pack, motors and charger hardware. The GT's motors differ from Land/Wind (160 kW front + 270 kW rear). Kia Canada says only "less than 25 minutes". "Reviewers measure about 24" is not cited. Drop it. |
| EV9 gt | capacity_usable_kwh 96 | | ✅ | EVDB GT: 96.0 usable, 99.8 nominal. |
| EV9 gt | ac_max_kw 11 | | ✅ (minor) | EVDB GT: 11 kW. The Kia manual and US sheets give 10.9. Within 1 %, but inconsistent with the other trims. |
| EV9 gt | dc_max_kw 206, manufacturer | | ⚠ kind | EVDB GT: 206 kW DC, and its notes say Kia claims 24 min at 210 kW. The Australian spec sheet is relayed second-hand. Acceptable as relayed, with low_confidence. |
| EV9 gt | wheels 21 in 285/45R21 | | ✅ | Kia Canada release: "285/45R-21 high-performance Continental tires", "21-inch alloy wheels". |
| EV9 gt-line | wheels 21 in 285/45R21 | | ✅ | Edwards GT-Line: 21-inch alloy, 285/45R21. |
| EV9 land-awd | wheels 20 in 275/50R20 | | ✅ | Edwards Land: "20-inch alloy", 275/50R20. |
| EV9 light | wheels 19 in; ac 10.9; usable 73 | | ✅ | Edwards Light: 19-inch alloy, 255/60R19, OBC 10.9, RWD. EVDB 76.1 RWD: 73.0 usable. |
| EV9 all five | battery.chemistry nmc | nmc | ✅ | EV Seekers: "Both packs use nickel manganese cobalt (NMC) lithium-ion cells supplied by SK On." EVDB also lists NMC for 99.8 and for the GT page. The 76.1 pack is also covered (the Light listing says NMC from the same article). |
| EV9 light, wind, land-awd, land-awd-gt-line, gt | battery.preconditioning automatic_and_manual, manufacturer | | ⚠ source is the UK copy | The page (en_GB) says a manual switch turns battery conditioning on/off, and that setting a fast charging station as destination heats or cools the battery. That supports both halves. The page names no model, but MV1 is the EV9: the MV1 2026 en_US specs page lists 76.1 and 99.8 kWh packs, 10.9 kW OBC, and Standard, Extended, GT-Line and GT trims. The manual states the feature "applies only to vehicles with a battery heater", and the batch should note this. The cited URL is en_GB (UK market). Cite the en_US page for a Canadian car, or confirm the Canadian trims have the battery heater. Source note "MV1 inferred" can now say confirmed. |

## Required changes

1. **IONIQ 9 standard `dc_max_kw`**: Electrek states 237 kW with no attribution and also reports its own measured peak "nearly 215 kW". Change the kind to `community` and drop "relays Hyundai", or find a Hyundai or Hyundai Canada page that states a peak and cite that for `manufacturer`. Also fix the source note on `src-electrek-ioniq9-review-2026`.
2. **IONIQ 9 borrowed curves (awd, awd-performance)**: remove them. Usable is 106 (new) vs 99.5 (existing) at 6.5 %, over the 1 % limit. The peak is 237 vs 350 in the repo, and neither is a verified manufacturer figure. The sibling is a 3-point curve with an assumed linear shape. Re-add them only once usable and peak are reconciled across the three IONIQ 9 trims and the standard curve has more points.
3. **IONIQ 9 curve evercars-2026**: keep as a standalone low-confidence community curve if desired, but add to the notes that the shape between the three points is unknown, that Electrek's own test peaked near 215 kW, and that the source says the car "did not allow for preconditioning" (the batch records `unknown`).
4. **EV9 `dc_max_kw` conflict**: the repo has 240 kW on land-awd and land-awd-gt-line (Chargeprice, unsourced), against Kia's 210 (Edwards GT-Line page: "210 max DC") and the tested 216. Add `dc_max_kw` 210 (manufacturer) to land-awd and land-awd-gt-line so the borrowed curves are not shown beside an 11 % inconsistent peak.
5. **IONIQ 9 usable conflict**: either add a note on the 106 value pointing out the existing 99.5 on awd/awd-performance, or reconcile it. The same pack giving 106 and 99.5 should not go live unflagged.
6. **EV9 gt `published_10_80_min`**: drop the estimate. The motors differ from the Land/Wind siblings, so rule 5 fails. Kia Canada's "less than 25 minutes" can go in a note, and the page figure is not a number to store.
7. **EV9 preconditioning**: swap the cited URL to the MV1 2026 en_US version of the page (or add it), and mention the battery-heater limitation in the notes. Update the "MV1 inferred" wording, because the specs page shows MV1 is the EV9.
8. **EV9 wind**: optional. Note in the borrowing reason that the sibling is AWD while Wind is RWD, and that no RWD page was read for usable or DC.

## Applied by the main session (2026-11-15)
1. IONIQ 9 standard `dc_max_kw` 237: kind changed to `community`; note now says the figure is not attributed to Hyundai and Electrek measured ~215 kW. Done.
2. IONIQ 9 awd / awd-performance borrowed curves: removed. Done.
3. evercars-2026 notes: sparse-shape, Electrek ~215 kW and no-preconditioning caveats added; `preconditioned` set to `no` (the page says the car did not allow it). Done.
4. EV9 land-awd and land-awd-gt-line: `dc_max_kw` 210 (manufacturer) added (EV Database Kia claim; Edwards GT-Line sheet). Done.
5. IONIQ 9 usable 106 vs 99.5: conflict note added on the 106 value; not reconciled (needs a Hyundai figure). Partly done.
6. EV9 GT `published_10_80_min` estimate: dropped. Done.
7. EV9 preconditioning: battery-heater limit added and "MV1 inferred" wording changed to confirmed. The citation stays on the en_GB page because the en_US copy of t00027 returns 404; the note says so. Partly done.
8. Wind borrowing reason now says the tested sibling is AWD and the Wind is RWD. Done.
