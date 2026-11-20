# Check: batch-2026-11-19-tesla-model-y.json

**Verdict: FIX.** `--check` passes (490 variants, 162 sources). Cited pages were reopened. Tesla's own pages are 403, so everything is third-party and low-confidence. Several groups of values need changes: wrong-market AC figures, one inconsistent pack basis across sibling ids, a mislabelled 2027 L capacity, and a weak 2021 SR. The 2026 Standard answer is below.

## Answers to the flagged points

1. **Juniper Standard US (69 gross / 64.7 usable LFP, 225 kW) vs existing CA `2026-rwd-b` / `2026-standard-b` (OpenEV 78/75 LFP 170 kW).** The existing OpenEV values are the wrong ones.
   - 225 kW is stated for Standard trims on thechargeport ("225 kW for the Standard trims"), on Wikipedia ("225 kW on the Standard trim") and on ArenaEV ("Supercharger 225 kW max").
   - OpenEV's 78/75 is the LG NMC pack's figure. EV Database lists the LFP cars at 60/57 (CATL 6L) or 64/60 (CATL 6M), so "LFP 78/75" is internally inconsistent.
   - Rated-energy cross-check (my own, from `public/data/cars/`): 463 km x 154 Wh/km = 71.3 kWh from the wall. A 75 kWh usable pack can't give that. About 62-65 usable does.
   - **Not settled:** 69 gross (ArenaEV, US-labelled) vs 64/60 (EV Database, EU car, 175 kW). The usable 64.7 is a ratio estimate across those two pages, and the batch itself says pack equality is unproven.
   - The batch only adds preconditioning to `2026-rwd-b` / `2026-standard-b`, so the conflict stays in the data. Owner decision needed on replacing the OpenEV values.
2. **OpenEV 82/79 vs EV Database 78.1/75 for 2024-25 LR AWD / Performance.** Unresolved by the sources, and the batch treats it inconsistently.
   - ArenaEV says "82 kWh total / 75 kWh usable" for 2021-2025, so 82 gross is not at odds with EV Database. OpenEV's 79 usable is the odd one.
   - The batch gives 82/79 to `2024-long-range-awd` [CA,US] (497 km, 178 Wh/km) and 78.1/75 to `2024-long-range-awd-ca` / `-i` (496 / 495.7 km, 178 / 177.9 Wh/km). The cars are rated identically, so one hardware set can't be two packs.
   - Same problem for `2024-performance` (82/79, 459 km, 192 Wh/km) vs `2023-performance-ca` (78.1/75, 459 km, 192 Wh/km).
3. **2024 LR RWD NMC 250 kW vs OpenEV LFP 170 kW.** Unproven.
   - The cited EV Database page 3363 is the **European Premium RWD, Juniper, order window Oct/Dec 2025 to Mar 2026**. It is not the US 2024 car, which this powertrain also covers.
   - The "ArenaEV 78.1 / 250 kW for LR RWD 2025" claim in the notes isn't backed by any source record in the batch.
   - OpenEV's LFP / 78 / 75 pairing is implausible (see point 1), but that doesn't prove NMC for the US car.
   - Wall-energy check: 89.8 kWh at 515 km. Consistent with either 75 or 79 usable, so it doesn't decide.
4. **2027 L 83 kWh as usable.** Mislabelled. The page says "The U.S. version features an 83 kWh pack" and doesn't say gross or usable. Per the researcher rule, a bare pack figure is gross. The same article's Shanghai "88 kWh" pack is Wikipedia's 88.2 gross. Fix below.
5. **Chemistry by factory.**
   - The batch's Fremont 2020-23 rows say NCA (InsideEVs: "2170-type NCA (main use: Model 3/Model Y from California)").
   - The same factory's 2024-25 rows say NMC from OpenEV, relabelled `manufacturer`.
   - InsideEVs calls Panasonic's cells NCA, so one hardware line has two chemistries across rows. Pick one basis.
   - China LGES = NCM/NMC ✅ (page: "LG Energy Solution... NCM... Shanghai"). It does not mention Berlin, and the batch's note "Shanghai- and Berlin-built" overstates it.
   - LFP = CATL ✅.
6. **Mixed-build ids.** The following ids contain cars that may be built in different places.
   - `2024-long-range-awd` and `2024-performance` [CA,US].
   - `2025-long-range-awd` and `2025-performance` [CA,US].
   - `2024-rwd-ca` (variants `2024/rwd-ca` [CA] and `2024/rwd` [CA,US]). The US half of `2024/rwd` shares the CA row's 394 km / 173 Wh/km, so the pack basis is unproven for US cars.
   - `2024-long-range-awd-i` is a **US** car, but its notes justify NMC and 78.1/75 with "Canadian China-built car", which is not a basis for a US car.
   - InsideEVs doesn't mention Canada or where Canadian cars are built, so "Canadian cars are China-built" for the `-import` / `-ca` rows is not on the cited page (only the EV Database 1743 note relays it, not a fetched source).
7. **Preconditioning.** `automatic_with_navigation`, `estimated`, with Teslabs and EV Database both named. This is correctly formed and defensible.
   - Teslabs (read): "Currently, you cannot manually start preconditioning in the menu or via the Tesla app." Its only comment disagrees: the app can start it with a Supercharger selected.
   - Tesla manual pages are 403. Search excerpts (not read in full) say warm-up is automatic when navigating to a Supercharger, a **Scheduled Precondition and Charge** setting exists, and climate/defrost warms the battery as needed. They suggest 2025.2 added third-party DC chargers as triggers.
   - So no source shows a dedicated manual battery-preconditioning control. Nothing proves its absence either. Keep `automatic_with_navigation`, `low_confidence`, and say in the notes that scheduled precondition and one dissenting comment exist. Don't upgrade to `automatic_and_manual` without a Tesla page.

## Table (grouped by shared basis)

| Variant / powertrain | Field | Value | Result | Evidence |
|---|---|---|---|---|
| 2020-23 Fremont LR AWD / Performance (8 ids: 2021/22/23-long-range-awd, 2020-performance-awd, 2021/22/23-performance) | gross | 78.1 est | ❌ basis | EV Database 1619 is the LG 5L NMC pack ("78.1 kWh", "LG 5L", built 2022-25). The same batch calls these cars Panasonic NCA. Batch's own ArenaEV page says "82 kWh total / 75 kWh usable". Different cell supplier = different pack, so rule 5 fails. |
| same | usable | 75 est | ⚠ | EV Database "75.0 kWh" (itself an estimate) and ArenaEV "75 kWh usable" agree. Hardware match to NCA cars unproven, so keep low-confidence. ArenaEV range starts 2021, so 2020 isn't covered. |
| same | chemistry | nca est | ✅ | InsideEVs: "2170-type NCA (main use: Model 3/Model Y from California)". Conflicts with OpenEV NMC on the 2024-25 Panasonic rows, see point 5. |
| same | voltage class | 400v est | ✅ | EV Database "400 V architecture", "357 V". ArenaEV "360V". |
| same | dc_max_kw | 250 est | ✅ | ArenaEV "Supercharger V3 250 kW max" (2021-2025). EV Database 250 kW. thechargeport: 250 kW for Premium/Performance. |
| same | ac_max_kw | 11.5 est | ✅ | Wikipedia "All variants support up to 11.5 kW AC charging". Note the batch's own thechargeport page says Standard trims are 7.7 kW, but these are LR/Performance (11.5 kW). |
| same | charge_port | nacs est | ✅ | Wikipedia NACS: "used it on all subsequent vehicles... Model Y". Canada not named, but a NA lineup fact. |
| same | supercharger_access | yes est | ✅ | thechargeport: "Every Model Y uses a native NACS port"; plugs straight into Superchargers. |
| same | preconditioning | automatic_with_navigation | ⚠ | See point 7. EV Database 1619 / 1183 "Automatically using Navigation: Yes". |
| 2021-standard-range | gross | 52.4 est | ⚠ weak | evspecifications db8ac6: 52.4 kWh, "without explicit clarification whether it is gross or net", "Not released to the market". The pack is 2,976 cells (the Model 3 SR+ pack). The batch labels the value gross without saying the page doesn't. Wall energy 393 km x 162 Wh/km = 63.7 kWh sits oddly with 50 usable. |
| 2021-standard-range | usable | 50.3 est | ❌ | 52.4 x 0.96, where 0.96 comes from the 75/78.1 ratio of a **different pack** (LG NMC LR). The researcher rule allows a ratio only from the same pack or same cell. The Model 3 batch has SR+ at 53.1 / 49.0 (0.92); the 2,976-cell match is the nearest sibling. |
| 2021-standard-range | chemistry | nca | ✅ | Page: "Lithium Nickel Cobalt Aluminium Oxide", NCR21700A. |
| 2021-standard-range | voltage class | 400v | ✅ | Page: 360 V pack. |
| 2021-standard-range | dc_max_kw | 170 | ⚠ | Page says 170 kW, but it is the only source and the page is self-contradicting. Matches Model 3 SR+, which is not proof. |
| 2021-standard-range | ac_max_kw | 11.5 | ❌ | Page says 11.5 kW. thechargeport says Standard-range trims are 7.7 kW. The sibling Model 3 batch uses 7.7 kW (service manual: 48 A only with the Long Range battery). Conflict unresolved. |
| 2023-long-range-awd-import (CA), 2024-long-range-awd-ca (CA), 2024-long-range-awd-i (US), 2023-performance-ca (CA), 2024-performance-import (CA) | gross / usable | 78.1 / 75 est | ⚠ | EV Database "78.1 / 75.0" for the LG 5L car. Basis "Canadian cars are China-built" is not on the cited InsideEVs page. For `-i` (US) the basis is wrong, since it is not Canadian. Sibling ids with identical ratings get 82/79, see point 2. |
| same | chemistry | nmc est | ⚠ | InsideEVs: LGES NCM "in China, mainly for the Tesla Giga Shanghai plant". Supports LG = NMC, not the country of build for these cars. |
| same | voltage / dc | 400v / 250 | ✅ | EV Database 1619 / 1183. |
| same | ac_max_kw | 11 est | ❌ market | EV Database "11 kW AC" is the EU 3-phase figure ("requires a 3-phase connection"). It is not a Canadian or US onboard-charger source (rule 2). Wikipedia says 11.5 kW for NA. |
| 2023-rwd (CA), 2024-rwd-ca | gross / usable | 60 / 57 est | ✅ | EV Database 1743: "60.0 kWh", "57.0 kWh (estimate)", CATL 6L LFP. Wall energy 68 kWh fits. Sold Nov 2022 - Oct 2024 matches the model years. |
| same | chemistry / dc / voltage | lfp / 170 / 400v | ✅ | Same page: "170 kW DC", "400 V". |
| same | ac_max_kw | 11 est | ❌ market | EU listing: "In practice charge power will often be 7.4 kW". Canadian LFP RWD is likely 7.7 kW (thechargeport: Standard RWD 7.7 kW). Needs a Canadian source or a different basis. |
| 2024-long-range-awd, 2025-long-range-awd, 2024-performance, 2025-performance | gross / usable / chemistry / dc / voltage | 82 / 79 / nmc / 250 / 400v (`manufacturer`) | ⚠ | OpenEV records exist for these (upstream tesla.com/modely): 82 / 79 nmc 250, markets CN,DE,FR,GB,JP,US (no CA). `manufacturer` is allowed for a relayed OEM figure. Conflict: ArenaEV 75 usable, and the batch itself said OpenEV's NMC conflicts with InsideEVs NCA. |
| same | ac_max_kw | 11 (OpenEV) + 11.5 (Wikipedia) | ✅ | Both stated. The existing Wikipedia value stands for NA. |
| 2024-long-range-rwd (US 2024; CA+US 2025) | gross / usable / chemistry / dc / voltage | 78.1 / 75 / nmc / 250 / 400v est | ❌ | The only evidence is EV Database 3363, **Premium RWD (Juniper), European listing, 2025-2026**. The page has 4,416 LG 5L cells and "78.1 / 75.0". This is not shown to be the US 2024 Long Range RWD. OpenEV says LFP 170, so sources conflict and basis is unproven. |
| same | ac_max_kw | 11.5 est | ✅ | Wikipedia. |
| 2026-standard-awd, 2027-awd, 2027-rwd | gross | 69 est | ✅ | ArenaEV 912: "69 kWh total", "AWD", "Released 2026, February". ArenaEV 857: "69 kWh total" (RWD, Oct 2025). Both US-labelled, no market field. The 2027 RWD relies on the 2025 page. |
| same | usable | 64.7 est | ⚠ | 69 x 60/64. The batch admits the pack match is unproven. EV Database's 64 is a CATL 6M EU car. Rated-energy check says about 62-65 for the US Standard, so plausible. |
| same | chemistry / voltage | lfp / 400v | ✅ | ArenaEV "LFP (400V type)", Wikipedia "Standard-range variants use LFP". |
| same | dc_max_kw | 225 est | ✅ | ArenaEV "Supercharger 225 kW max", thechargeport and Wikipedia too. EV Database EU 175 kW is a different market's car. |
| same | ac_max_kw | 11.5 est | ❌ | thechargeport (same page the batch uses for Supercharger): "7.7-11.5 kW... Standard RWD and AWD are at the 7.7 kW end". ArenaEV says "Type 2 11 kW" (EU plug). The 11.5 figure comes from Wikipedia "All variants", which conflicts with the US trim page. |
| 2026-premium-rwd, 2027-premium-rwd | gross / usable / chem / dc | 79 / 74 / nmc / 250 est | ❌ | EV Database 3595 (79.0 / 74.0, 4680, 828 cells) is a **European listing "available since April 2026"**. The US Premium RWD launched earlier. InsideEVs says 4680 chemistry is "undisclosed", so NMC is the site's word. US pack unproven. DC 250 is supported by thechargeport ("250 kW for the Premium"). |
| same | ac_max_kw | 11.5 | ✅ | thechargeport puts Premium at the 11.5 end. |
| 2027-performance, 2027-premium-awd | gross / usable / chem / dc / voltage | 82 / 79 / nmc / 250 / 400v est | ⚠ | Basis is OpenEV 2025 and existing 2026 rows. Wikipedia: refreshed Performance pack "5M", "around 82 to 84" usable, so 79 may be low. Same-generation carry-over is allowed but unproven for 2027. |
| 2027-l | usable | 83 est | ❌ mislabel | Not a Tesla App: "The U.S. version features an 83 kWh pack". It doesn't say usable. |
| 2027-l | chemistry | nmc est | ⚠ | Wikipedia: Model Y L uses "a nickel cobalt manganese (NCM)" battery (China/AU). The US pack isn't stated, and Fremont cars may be NCA. |
| 2027-l | dc_max_kw | 250 est | ✅ | Not a Tesla App: "250 kW at Superchargers". thechargeport: 250 kW for Model Y L. |
| 2027-l | voltage / ac | 400v / 11.5 | ✅ | Same platform; Wikipedia. thechargeport puts non-Standard trims at 11.5. |
| 2026-*-b (7 ids) | preconditioning only | automatic_with_navigation | ⚠ | See point 7. Existing OpenEV capacity / DC values on these are not touched. |
| all 35 | charge_port | nacs est | ✅ | Wikipedia NACS. Canada isn't named on that page. |
| all 35 | supercharger_access | yes est | ✅ | thechargeport. Source id exists in the repo (`--check` passes). |

## Required changes

1. **Fremont 2020-23 gross (8 ids).** Drop 78.1 from EV Database 1619 (LG NMC pack, cited for NCA cars). Use ArenaEV's "82 kWh total" (2021-2025) as the stated figure, or drop gross (it isn't a required field). Reconcile with the Model 3 batch, which has Fremont 2021-23 LR AWD / Performance at 82 / 76.
2. **Chemistry consistency.** Panasonic (Fremont) cars have NCA in the 2020-23 rows and NMC in the 2024-25 OpenEV rows. Pick one for the Fremont line, or note per year why they differ.
3. **Same-rating packs.** `2024-long-range-awd` (82/79) conflicts with `2024-long-range-awd-ca` / `-i` (78.1/75): identical rated range and consumption. The same goes for `2024-performance` vs `2023-performance-ca` / `2024-performance-import`. Give them one pack, or state the build/market difference the sources show.
4. **`2024-long-range-awd-i` (US).** Remove the "Canadian China-built" basis. Fremont/Panasonic-style values apply to a US car unless a page shows otherwise.
5. **AC onboard charger.** EU-sourced 11 kW on `2023-long-range-awd-import`, `2024-long-range-awd-ca`, `-i`, `2023-performance-ca`, `2024-performance-import`, `2023-rwd`, `2024-rwd-ca` needs a Canadian or US source (rule 2). For the LFP RWDs, thechargeport/Model 3 batch suggest 7.7 kW.
6. **Standard-range AC.** `2021-standard-range`, `2026-standard-awd`, `2027-awd`, `2027-rwd`: 11.5 kW conflicts with thechargeport (Standard RWD/AWD 7.7 kW) and the Model 3 batch's manual-based 7.7 kW. Use 7.7 (cite thechargeport, add the conflict in notes), or justify 11.5.
7. **`2021-standard-range`.**
   - Usable 50.3: remove the 0.96 ratio. Use the Model 3 SR+ 2,976-cell sibling ratio (49.0/53.1) only if you state the pack match, or mark both capacities as unknown-with-reason.
   - Gross 52.4: note the page doesn't say gross or net.
   - All of it stays `low_confidence`.
8. **2024-long-range-rwd.** The EU Premium RWD (Juniper, 2025-26) page doesn't show the US 2024 car's pack. Either find a US-market or OpenEV-compatible source, or keep as estimate with a basis that says only "same generation Long Range RWD", and add the OpenEV LFP conflict to the notes. Remove the uncited "ArenaEV LR RWD 2025" claim or add its source record and URL.
9. **2026-premium-rwd and 2027-premium-rwd.** The 4680 79/74 figure is from a European listing available since April 2026. Show the US car has this pack, or fall back to the LR AWD 82/79 sibling only if pack and motors match. State NMC as "per EV Database", since InsideEVs says undisclosed.
10. **2027-l.** Move 83 to `battery.capacity_gross_kwh` (estimated, basis: a bare pack figure is gross; Shanghai 88 kWh = Wikipedia gross 88.2). Usable can be estimated from the Wikipedia AU/NZ L ratio (about 84 / 88.2 = 0.95, giving about 79), noted as an estimate. Don't record 83 as usable.
11. **Chemistry basis note for China builds.** The InsideEVs page doesn't mention Berlin or Canada. Reword the notes.
12. **Preconditioning (all 35).** Keep `automatic_with_navigation`, estimated, low confidence. Add one line: scheduled precondition exists and one Teslabs comment says the app can start it. Do not claim a manual option without a Tesla page.
13. **Open owner decisions:** whether the existing OpenEV values on `2026/standard-b` and `2026/rwd-b` (78/75 LFP, 170 kW) should be overridden, since the evidence points against them; and how to treat the OpenEV 82/79 vs 78.1/75 conflict for 2024-25.

## No unknowns (rule 14)

All required fields are filled for every full powertrain. For `2027-l`, `battery.capacity_gross_kwh` is empty, which is not required. The 7 `2026-*-b` ids need only preconditioning, which is present. No required field is left empty. Several rest on estimates the points above would change.

## Other notes

- The batch's sources `src-thechargeport-tesla-model-y` and `src-openev-v1-24-0` are not in its `sources` list but exist in the repo, so `--check` passes.
- Estimated kind: values stated for the exact car on a spec site (ArenaEV 69 / 225 for the Standard AWD) are labelled `estimated`. That is conservative and acceptable.
- Existing-data fit: 2023 Performance-CA 78.1/75 vs OpenEV 2026 Performance-B 82/79 differ by 5.0-5.3 %.
- Not read: tesla.com pages (403, not worked around).
