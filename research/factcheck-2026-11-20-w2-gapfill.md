# Fact-check: research/batch-2026-11-20-w2-gapfill.json

**Verdict: FIX.** `--check` passes ("batch is valid, 1408 variants, 981 sources"). Most ADAC chemistry/voltage values hold. Five items need changes: the three 74.7 "usable" values, the Spectre 2027 DC, the Soul preconditioning, the Eletre Supercharger, and a few labels. Pages were reopened with WebFetch on 2026-11-20. Where I could only confirm via search excerpts I say so.

## Fix list

1. **Drop usable 74.7 for `lexus/rz/2026-rz-550e-f-sport-awd` and `lexus/tz/2027-tz-450e-premium-awd`; change `subaru/uncharted/2026-long-range-fwd` to 71.**
   - Wikipedia's C-HR+ page does say "74.7 kWh (usable)", but the repo contradicts it. Subaru US, Toyota and Lexus all state 74.7 as the pack figure (gross on file). The same pack on `subaru/uncharted/2026/gt-awd`, `sport-awd`, the RZ 350e/450e and the C-HR already holds usable 71 (estimated, EV Database via `src-r19-evdb-bz4x-touring-747`).
   - The batch's 74.7 is 5.2 % above that 71, so it fails the same-kind fit check. Its own note ("77 x 0.97") is circular.
   - Uncharted LR FWD: use 71 (estimated, same 74.7 pack as the sport-awd already on file), or drop it.
   - RZ 550e and TZ Premium carry a 76.96 gross pack. The previous round (NOTES "japan2 revision") already dropped usable for 76.96 for lack of a basis; nothing new justifies re-adding it. Drop both.
2. **Drop `dc_max_kw` 195 for `rolls-royce/spectre/2027-spectre` and `2027-black-badge-spectre`.**
   - The ADAC page is the European CCS2 Series II ("ab 11/26", 112.5 kWh, 195 kW). The US car is NACS and Rolls-Royce gave no US kW figure.
   - Electrive says the Series II pack matches BMW's i7 112.5 pack. The 2027 US i7 on file is 250 kW (manufacturer), and "14 % shorter charging" implies more than 195.
   - The batch's own note concedes the US value "could be higher", so it is not a confirmed same-hardware value. Leave empty and flag to the owner.
   - The Spectre 2027 chemistry (nmc) and voltage (400 V) are valid under B94. ADAC gave "Nickel-Mangan-Cobalt" and "400 V" for this exact pack. Keep.
3. **Relabel Gravity Grand Touring usable 121 as `community`.** Applies to the 3 Grand Touring ids; the Dream Edition estimate follows. Electrek states it as the reviewer's own text ("a 924 V battery pack with 121 kWh of usable capacity for the Grand Touring"), with no attribution to Lucid. The notes admit Lucid's page was not found. `manufacturer` is only right when the maker states it. Keep `low_confidence`.
   - Dream Edition: keep `estimated` (same 123 kWh gross pack as on file; the 2026 Dream Edition exists on file).
   - EV Database lists usable 123 for the MY26 Grand Touring; 121 is within 1.6 % of it, so there is no conflict.
4. **Drop Soul EV 39 `battery.preconditioning` `manual_only` (all 4 ids).**
   - Electric Revs (2018, about the 2020 Soul EV): "battery heater" is "optional" in North America, with an optional "Winter Mode"; the article says nothing about navigation. The "Premium 39 kWh" trim and the Canadian car may not have the option.
   - Even if it did, the value would be manual control for an optional feature. The rules need a source showing the car has it.
   - 2021-23 are extended from a 2018 article on the 2020 car but still labelled `community`; they would need `estimated` with the basis.
   - The 64 kWh Soul on file is `none` (estimated), so this would also split the model. Leave empty and ask the owner.
5. **Drop Eletre `supercharger_access` `no` (4 variants).**
   - Absence from a list is not a stated fact. The InsideEVs page ("last updated on March 20, 2026") names 33 brands and does not list Lotus; I confirmed that. It is a US article, and Supercharger access needs a source for the car's market (Canada). It was updated 8 months before today.
   - The estimate rules allow only same-hardware, same-pack sibling, same-cell ratio or lineup-wide features. None applies.
   - My own search found no Lotus Canada Supercharger announcement either, but that proves nothing. Leave empty and ask the owner.
6. **Relabel BMW iX 2023 xDrive40 chemistry `estimated`.** The ADAC page covers "Modellstart 03/24" to "Modellende 01/25" (series from 11/21). 2024 and 2025 fall in the page; 2023 does not. Same hardware in another year is `estimated`. Also note ADAC net 74.1 against 71 usable on file (4.4 %, within tolerance).
7. **Minor labels (optional):**
   - The MX-30 chemistry uses `estimated` where the e-Golf and BMW cases use `manufacturer` for the same market difference. Under B94 (chemistry does not vary by market) `manufacturer` would also be fair for the NA MX-30; the batch is just inconsistent. The note citing the "04/22-12/24 page" is not a cited source; drop that phrase or add the page.
   - ADAC `type: testing_org` with `kind: manufacturer`: I could not confirm the "Messwerte Hersteller" heading text through the fetch tool. The table matches manufacturer-type figures (the MX-30 page also shows ADAC's own measured 36 kW, separate from the rated 50). The label is fair as "manufacturer data via ADAC".
8. **Item 14, still empty for covered models:**
   - `lexus/tz/2027/tz-450e-premium-touring-awd`: usable, chemistry, voltage (95.82 kWh pack; NOTES already lists it).
   - `rolls-royce/spectre/2024-2027` (8 ids): preconditioning.
   - After fixes 1, 2, 4 and 5 the following also become empty: Uncharted LR FWD (if not set to 71), RZ 550e usable, TZ Premium usable, Spectre 2027 DC (2 ids), Soul 39 preconditioning (4 ids), Eletre Supercharger (4 variants). The owner needs to decide the "no unknowns" rule for these.

## Per-value results

| Group (ids) | Field | Value | Result | Evidence |
|---|---|---|---|---|
| e-Golf 2015, 2016 | chemistry | nmc | ✅ | ADAC "Nickel-Mangan-Cobalt", 24.2 gross, 03/14-10/16; file gross 24.2 (US) matches |
| MX-30 2022-24 (3) | chemistry | nmc | ✅ | ADAC 09/20-04/22: NMC, 35.5 gross / 32.0 net, 400 V. File gross 35.5; NA car same pack. Label note, fix 7 |
| i7 2023-26 xdrive60 and m70 (8) | chemistry | nmc | ✅ | ADAC M70 page 07/23-06/26: NMC, 105.7/101.7. File carries 105.7 and 101.7. Page is M70; xDrive60 shares the pack |
| i7 2024-26 eDrive50 (3) | chemistry | nmc | ✅ | Estimated label right; eDrive50 on file has usable 101.7, same pack |
| iX 2023 xDrive40 | chemistry | nmc | 🏷 | Page 03/24-01/25 only; use `estimated` (fix 6) |
| iX 2024, 2025 xDrive40 | chemistry | nmc | ✅ | ADAC: NMC, 76.6 gross / 74.1 net, 400 V; file gross 76.6 |
| iX 2026 xDrive45, xDrive60 | chemistry | nmc | ✅ | ADAC "ab 03/25": NMC, 94.8 / 109.1 net, 175 / 195 kW; both match the file usable |
| iX 2026 m70 | chemistry | nmc | ✅ | Estimated, same large facelift pack as xDrive60 (file usable 108.9 vs 109.1, DC 195 both) |
| Ioniq Electric 2017-19 (3) | chemistry | nmc | ✅ | ADAC 11/16-07/19: NMC, 28.0 gross; EVSpecs 2019 NCM. ADAC 28 vs file gross 30.5 is a naming difference, not a pack change |
| Ioniq Electric 2020 | chemistry | nmc | ✅ | EVSpecs: "NCM622", LiNiCoMnO2, usable 38.3, gross 40.4 (matches file). `community` right |
| Ioniq Electric 2021 | chemistry | nmc | ✅ | Estimated from 2020, same pack |
| Countryman SE 2025 | chemistry, voltage | nmc, 400v | ✅ | ADAC 03/24-01/26: NMC, 66.5/64.6, 400 V (file 66.5/64.7) |
| Countryman SE 2026, 2027 | chemistry, voltage | nmc, 400v | ✅ | Estimated, same hardware another year |
| Spectre 2027 (standard) | chemistry, voltage | nmc, 400v | ✅ | ADAC Series II "ab 11/26": NMC, 112.5 net, 400 V; file usable 112 |
| Spectre 2027 Black Badge | chemistry, voltage | nmc, 400v | ✅ | Estimated, shares pack with the standard car (file usable 112 on both) |
| Spectre 2027 (2 ids) | dc_max_kw | 195 | ❌ | ADAC EU "195 kW"; the US NACS car is unconfirmed (fix 2) |
| VF 9 2024-27 (5) | chemistry | nmc | ✅ | ADAC: NMC, 123.0 net (matches NA usable 123 on file), 400 V. EU DC 250 vs NA 150 on file; cells unaffected. Estimated label right |
| Soul EV 39 2020 | chemistry | nmc | ✅ | EVSpecs "NCM (NMC)", SK Innovation, 39.2 usable, 327 V (matches file 39.2) |
| Soul EV 39 2021-23 | chemistry | nmc | ✅ | Estimated from 2020 |
| Soul EV 39 2020-23 | preconditioning | manual_only | ❌ | Electric Revs: heater "optional"; trim/car not shown to have it; years 2021-23 not labelled estimated (fix 4) |
| Gravity Grand Touring 2025-27 (3) | usable | 121 | 🏷 | Electrek quote present; reviewer text, not Lucid. Use `community` (fix 3) |
| Gravity Dream 2026 | usable | 121 | ✅ | Same 123 gross pack; estimated is right once the base is `community` |
| Gravity Touring 2026, 2027 | usable | 87.5 | ✅ | Ratio basis allowed (same cell family). Electrek "672 V pack with 89 kWh" unlabelled; 89 x 121/123 = 87.5 (a flat 2 kWh buffer gives 87.0, within 1 %). Keep `estimated` and `low_confidence` |
| Uncharted LR FWD | usable | 74.7 | ❌ | Same pack has usable 71 on file (estimated); 74.7 is the gross figure (fix 1) |
| RZ 550e | usable | 74.7 | ❌ | Gross is 76.96, no basis, previously dropped (fix 1) |
| TZ 450e Premium | usable | 74.7 | ❌ | Same as above (fix 1) |
| TZ 450e Premium | chemistry, voltage | nmc, 400v | ✅ | Gross 76.96 equals the RZ 550e on file (NMC, 400 V estimated); Autopian/InsideEVs say same cells and 400 V for the TNGA-K pack. Soft: prefer citing the RZ 550e as basis |
| i-MiEV 2012 | usable | 13.5 | ✅ | INL sheet (search excerpt of the energy.gov PDF, not reopened): total DC out 13.3-13.5 kWh, rated 16 kWh. `tested` is right; note it is energy delivered. Other databases say 14.5 (7 % higher). Keep `low_confidence` |
| i-MiEV 2013-17 (5) | usable | 13.5 | ✅ | Estimated, same 16 kWh pack on file for all years |
| Eletre (4) | supercharger_access | no | ❌ | Absent from a US list; Canada source needed (fix 5) |

## Answers to the specific questions

1. **ADAC pages:** every cited row exists (values above). Pack match with the file holds: e-Golf 24.2, MX-30 35.5, i7 105.7/101.7, iX 76.6 and 94.8/109.1, Countryman 66.5, Spectre 112, VF 9 123. The Ioniq 28 kWh gross differs from the file's 30.5, but the pack generation is the same. The `manufacturer` / `testing_org` label is fair (fix 7).
2. **EU chemistry/voltage as same-hardware basis (BMW, MINI, Spectre 2027, VF 9):** valid; neither varies by market. DC peak does vary, and the VF 9 EU 250 kW vs NA 150 kW and Spectre cases show it; the Spectre DC value is dropped (fix 2).
3. **Usable capacity:** Gravity 121 should be `community`. Touring 87.5 is acceptable. 74.7 for Uncharted, RZ and TZ is wrong (fix 1). i-MiEV 13.5 is acceptable as `tested`.
4. **Spectre 2027 DC 195:** drop (fix 2).
5. **Weak values:** drop both Soul `manual_only` and Eletre `no` (fixes 4 and 5).
6. **Coverage:** ids on each hardware share the cited hardware, except iX 2023 xDrive40 (label only), Spectre 2027 DC, and the usable 74.7 across three different pack figures (74.7 vs 76.96). No bare number, no EVChargingStations.com, and no blocked site cited.
