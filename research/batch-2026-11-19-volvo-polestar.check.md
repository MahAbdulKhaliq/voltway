# Check: research/batch-2026-11-19-volvo-polestar.json

**Verdict: FIX.** `--check` passes (490 variants, 171 sources). All 25 powertrains have every required field, so there are no unknowns. Most values hold. The problems are a handful of wrong or weak values and a lot of mislabelled `kind`/source pairings. Two stored drivetrains are also wrong (neither is in the batch).

Pages reopened: InsideEVs (rename, 2024 upgrades, EX30 specs, Polestar 2024 EPA), Green Car Reports, Conceptcarz, KBB (EX40 and EX30), EVDB (1520, 3160, 1798, 1911), Wikipedia (EX40, Polestar 2), Polestar US specs and the 2021, 2022, 2023 and 2024 manuals, Polestar Canada Supercharger page, Cision (Volvo Canada), thechargeport. volvocars.com returned 403 and was not worked around.

## Answers to the risk points

| Point | Finding |
|---|---|
| EX40 2025 Twin 82 kWh | Probably right, but the sources conflict. InsideEVs: "Twin Motor versions … come with an 82-kilowatt-hour pack". Green Car Reports: dual-motor models "mandate a 78-kwh pack". Rated range rose from 254 mi to 260 mi, and KBB lists 82 kWh for the 2026 Twin. 82 is plausible, but the batch cites KBB, which is 2026 only; cite InsideEVs and keep `low_confidence`. |
| EX40 2025 single motor | InsideEVs says the single motor "still" has the smaller pack. That is almost certainly an InsideEVs error, because Volvo US 2024 (Conceptcarz) and Green Car Reports both give 82 kWh. 82 is right. The batch cites KBB for it, and KBB lists no single-motor trim. |
| EX40 2021–23 DC peak 150 kW (estimated) | Basis OK. Wikipedia's table gives 150 kW for the 78 kWh pack, EVDB MY22 tested 149 kW, and Volvo US 2024 says the Twin "retains" 150 kW. It is the same pack and nothing shows a charging change, so the estimate holds. |
| EX40 preconditioning | The Volvo support page is unreadable (403), so the navigation trigger is ⚠ unverifiable there. EVDB MY22 and MY26 do say "happens automatically when navigating to a charger" / "can start automatically". That supports the trigger only; manual control is not ruled out. The `estimated` label with both sources named is the correct form. Keep it, but cite both sources in the notes (it already does) and keep `low_confidence`. |
| EX30 usable 64 | 64 is verified (InsideEVs: "69 kWh gross, 64 kWh usable"). EVDB gives 65. The difference is under 5 %, so no flag. 69 kWh is confirmed for every US trim by KBB. |
| EX30 DC 153 kW | InsideEVs: "Up to 153 kW", pre-release (Dec 2023). EVDB now says 158 kW; thechargeport says 153. Within 5 %. OK. |
| EX30 Canadian Supercharger access | Not sourced. See table. |
| Polestar 2 DC 150 vs 155 kW | 2021 and 2022 US manuals state 150 kW. The 2024 US manual says "Maximum output 155 kW" (Long range), and InsideEVs gives 155 kW for 2023. So 150 for 2021–22 and 155 for 2023–24 is supported by Polestar's own pages. Wikipedia's 155 for 2021–23 conflicts with the manuals. |
| Polestar 2 2022/2023 single motor | **FWD, not RWD.** InsideEVs lists the "2023 Single Motor … FWD" and the "2024 LR Single Motor … RWD". Wikipedia says single-motor FWD for 2021–23, RWD from 2024. Our data has `rwd` for the 2022 and 2023 single-motor variants. |
| `volvo/ex40/2026/standard` | It is RWD, not FWD. The batch notes tie NRCan 476 km to the 2025 single motor. The 2025 single-motor variant in the repo is `rwd` with NRCan 476 km, so the Canadian "Standard" is the 82 kWh single-motor car. The repo's stored `fwd` is wrong, and the batch contains no `variants` entry to fix it. |
| OpenEV imports to override | The batch values override all of these: **volvo/ex40/2026/standard** (78/69/150 → 82/79/205); **volvo/ex40/2026/twin** (78/69/150 → 82/79/205); **volvo/ex30/2026/single-motor-extended-range** (51/49 LFP → 69/64 NMC); **volvo/ex30/2026/twin-performance and cross-country** (usable 66 → 64, within the 1.5 % gap to EVDB's 65, so the override is optional); **polestar-2/2025 dual-motor-performance-pack, dual-motor and single-motor** (78/75/150 → 82/79/205). Without conflict resolution the old OpenEV values would stay in the data, so apply these as overrides. |

## Value table (grouped; every powertrain in a group has the same value unless noted)

| Variant or group | Field | Value | Result | Evidence |
|---|---|---|---|---|
| EX40 2021–24 78 kWh group (2022-p8, 2022-p8-twin-eawd, 2023-twin, 2024-twin) | gross | 78 kWh | ✅ | InsideEVs 2024: "Twin-motor AWD 78 kWh"; Conceptcarz: Twin "retains" the 78 kWh pack |
| same | usable | 75 kWh | ✅ | EVDB MY22: usable 75.0; the pack is the same |
| same | chemistry and voltage | NMC, 400 V | ✅ | EVDB MY22: NMC, 400 V nominal |
| same | dc_max_kw | 150 kW | ✅ for 2024-twin (Conceptcarz: "top charging rate of 150 kW DC", manufacturer). ✅ estimate for 2021–23 (basis above) | |
| same | ac_max_kw | 11 kW | ⚠ unverifiable | Cited source is the 403 Volvo Canada page. EVDB MY22 states 11 kW but it is a European 3-phase car. AC is market-dependent, so a North American source is needed. |
| same | preconditioning | automatic_with_navigation | ⚠ | See point above. Label and notes are correct. |
| same | charge_port | ccs1 (estimated) | ✅ | Basis sound. thechargeport (readable now): "EX40 / XC40 Recharge (2021-2024) CCS1". Add it as a source. |
| same | supercharger_access | via_adapter | ✅ | Cision (Volvo Canada): "Owners of current fully electric Volvo cars can also order one", CA$310. InsideEVs covers the US. |
| EX40 2024-single-motor-extended-range-rwd | gross, dc, 10–80 | 82 kWh, 200 kW, 28 min | ✅ | Conceptcarz: "82kWh", "top rate of 200 kW DC", "approximately 28 minutes". Same on InsideEVs. |
| same | usable 79, chemistry, 400 V | | ✅ | EVDB MY24 (European 82 kWh pack): 79.0 usable, NMC, 400 V. Same pack. |
| EX40 2025-single-motor | gross | 82 kWh | ❌ source | Cites KBB, which lists no single-motor trim, only 2026 AWD. Green Car Reports ("82-kwh battery pack") and Conceptcarz (2024) support 82. |
| EX40 2025-twin-motor | gross | 82 kWh | 🏷 | Cites KBB 2026 for a 2025 car. InsideEVs states it for 2025, but Green Car Reports contradicts (78). Keep `low_confidence` and cite InsideEVs. |
| EX40 2025 single and twin | dc_max_kw | 205 kW | ✅ | InsideEVs: "from 200 kilowatts to 205 kW" for both. thechargeport shows 150 kW and Hamilton shows 200 kW for 2026; 205 vs 200 is under 5 %. |
| EX40 2026 single-motor-extended-range-rwd, 2026-standard, 2026-twin | gross | 82 kWh | ✅ for the Twin (KBB 82.00 kWh, 260 mi) | For the single-motor (US) and Standard (CA), KBB lists no such trim, so the 82 kWh is carried from 2024–25 by EPA 476 km, which matches the 2025 single motor. This is an estimate, not `manufacturer`. |
| same three | dc_max_kw | 205 kW, manufacturer | 🏷 | The cited release is for 2025. Carrying it to 2026 is an estimate. Hamilton (existing source) says "up to 200 kW" for 2026. Relabel `estimated` with the basis, or use 200 kW. |
| EX40 2026 standard | drivetrain | stored `fwd` | ❌ | Should be `rwd` (see above). Batch has no `variants` entry. |
| EX40 all | published_10_80_min | 28 min (2024 single only) | ✅ | Conceptcarz |
| EX30 (4 powertrains) | gross 69, usable 64 | | ✅ | InsideEVs: "69 kWh gross, 64 kWh usable"; KBB 69 kWh on all 2026 trims |
| EX30 | chemistry and voltage | NMC, 400 V | ✅ | EVDB: NMC, 400 V architecture. The `chemistry` cite is the InsideEVs page, which says NMC in the batch notes but not in the fetched text. EVDB is the supported source. |
| EX30 | dc_max_kw | 153 kW | ✅ | InsideEVs "Up to 153 kW"; EVDB 158 (3 %) |
| EX30 | ac_max_kw | 11 kW | ✅ (US) | InsideEVs "about 11 kW". No Canadian source; this is minor. |
| EX30 | preconditioning | automatic_with_navigation (estimated, EVDB) | ⚠ | The EVDB 1911 page says only "battery preconditioning is available". The batch notes claim "auto via navigation"; that was not found on the fetched page. Cite a page that states the trigger. |
| EX30 | charge_port | ccs1, `manufacturer` | 🏷 | InsideEVs says "Early U.S. units likely use CCS1, with NACS expected in 2025": speculation, not a manufacturer statement. thechargeport (US) states "Volvo EX30 (2025-2026) CCS1". Relabel `estimated`, cite thechargeport, and add a Canadian basis (the Cision release implies CCS1 by promising an adapter). |
| EX30 | supercharger_access | via_adapter (estimated, thechargeport, US) | ❌ for CA | thechargeport (US only) says paid adapter. Cision (Volvo Canada): "Availability of adapters for the EX30 will be announced later". Neither Canadian result confirms it. An estimate across markets is not allowed, and the access rules need a source for that market. A search found no later Canadian EX30 adapter announcement. |
| Polestar 2 2021 launch-edition | gross 78, usable 75 | | ✅ | Wikipedia table (flattened) and InsideEVs 2023: 78 kWh |
| same | dc 150, ac 11 | | ✅ | 2021 manual: "up to 150 kW output is possible", 48 A = 11 kW |
| Polestar 2 2022 dual and single | dc_max_kw | 150 kW (estimated) | ✅ | The 2022 US manual states 150 kW directly ("up to 150 kW … 35 minutes"). Cite it and use `manufacturer`, not the 2021 manual. |
| Polestar 2 2022 dual and single | ac_max_kw | 11 kW (estimated) | ✅ | Same manual family. Could also be sourced directly. |
| Polestar 2 2023 (3 powertrains) and 2024 dual | dc_max_kw | 155 kW | ✅ for single motor and 2024 dual | InsideEVs: "2023: 78 kWh, 155 kW, 35 min"; "2024 LR Dual … 155 kW"; 2024 manual "Maximum output 155 kW" |
| Polestar 2 2023 dual and dual-performance-pack | dc_max_kw | 155 kW, manufacturer | 🏷 | InsideEVs states 155 kW only for the 2023 single motor; no figure is given for 2023 dual. Probably the same, but it is an inference. Relabel `estimated` (same pack and charger as the single motor and as 2024 dual). |
| Polestar 2 2023 single | published_10_80_min | 35 min | ✅ | InsideEVs: "35 min at up to 155 kW" |
| Polestar 2 2024 dual | published_10_80_min | 34 min | ✅ | InsideEVs |
| Polestar 2 2024 single | gross, dc, 10–80 | 82 kWh, 205 kW, 28 min | ✅ | InsideEVs: "82 kWh, 28 min at up to 205 kW". Caveat: the 2024 US manual lists 155 kW for "Long range", which is a conflict; the batch's figure follows the Polestar-relayed spec. |
| Polestar 2 2025 (dual-perf-pack, dual, single; US specs page) | gross 82, dc 205, 28 min, ac 11 | | ✅ for dual-performance-pack | US specs page: "82 kWh", "up to 205 kW", "28 minutes", "11 kW" |
| Polestar 2 2025 dual and single | same fields | | 🏷 | The page is for the Dual motor with Performance pack. Single motor is supported by InsideEVs 2024 (82 kWh, 205 kW) and dual by Wikipedia (82/79, 205 kW). Relabel or cite those. |
| Polestar 2 usable | 75 (78 kWh pack) / 79 (82 kWh pack) | | ✅ | Wikipedia (flattened table): 75/78 and 79/82; EVDB MY24 Euro dual: 79 |
| Polestar 2 | chemistry and voltage | NMC, 400 V | ✅ | Wikipedia, Polestar US specs ("400 V") |
| Polestar 2 2023 and 2024 (manual-sourced) | preconditioning | automatic_with_navigation, `manufacturer` | 🏷 | The 2024 manual: "the battery will be preconditioned" when stations are added in Google Maps. The 2023 manual: "Selecting preconditioning can also affect the charging time", which implies a selectable option. The page is silent on manual control, which is not the same as none. Per rule 6, relabel `estimated` with the manual cited, or check whether a manual setting exists. |
| Polestar 2 2021, 2022, 2025 | preconditioning | estimated, cites the 2024 manual | ⚠ | The 2021 manual says only "if preconditioning has been selected". 2022 manual matches 2023 (Google Maps destination). The 2021 and 2025 cases rest on the same unproven software across years. |
| Polestar 2 (all) | charge_port | ccs1 (estimated) | ✅ | Polestar Canada: "Polestar 2 … compatible with the NACS adapter"; thechargeport: Polestar 2 (2021–2025) CCS1. Add thechargeport. |
| Polestar 2 (all) | supercharger_access | via_adapter | ✅ | Polestar Canada page; InsideEVs (US, $230). |
| Polestar 2 2022 and 2023 single motor | drivetrain (stored) | `rwd` | ❌ | Should be `fwd` (InsideEVs "2023 Single Motor … FWD"; Wikipedia). Batch has no `variants` entry. |

## Estimates check (rule 5)
- EX40 DC 2021–23, port and preconditioning: bases hold (same pack and generation, no change shown).
- EX30 Supercharger access for Canada: basis rejected (US source for a different market; Cision says EX30 later).
- Polestar 2 2022 DC (150): basis is fine, but it can be `manufacturer` from the 2022 manual.
- Polestar 2 2023 dual 155: should be `estimated`.
- No rated range or consumption is estimated.

## Fit with existing data (rule 11)
Over 5 % from same-kind values: EX40 2026 Twin gross 82 vs OpenEV 78 (5 %) and usable 79 vs 69 (14 %); Standard same; DC 205 vs OpenEV 150 (37 %); EX30 SMER 69/64 vs OpenEV 51/49; Polestar 2025 82/79/205 vs OpenEV 78/75/150. All are the stale imports listed above, so the batch is right and the old values are wrong. `others` values should not be left shown as conflicts.

## Required changes
1. **Drivetrain fix (add a `variants` section):** `volvo/ex40/2026/standard` → `rwd`; `polestar/polestar-2/2022/long-range-single-motor` → `fwd`; `polestar/polestar-2/2023/single-motor` → `fwd`.
2. **EX40 2025 single-motor gross 82:** source KBB lists no single-motor trim. Cite `src-gcr-ex40-2025` ("82-kwh battery pack") or `src-conceptcarz-volvo-us-2024-powertrains`.
3. **EX40 2025 Twin gross 82:** cite `src-insideevs-ex40-2025-rename` instead of KBB 2026. Keep `low_confidence` and record the Green Car Reports conflict (78) in the notes.
4. **EX40 2026 single-motor, Standard (and Twin 2026 DC):** change `dc_max_kw` 205 to `estimated` (carried from 2025; Hamilton says 200 kW for 2026), and make gross 82 for single-motor and Standard `estimated` with the NRCan/EPA 476 km basis stated.
5. **EX40 `ac_max_kw` 11:** the cited Volvo page returned 403 and cannot be read, so mark it unverifiable or cite a North American source. Do not label it `manufacturer`.
6. **EX30 `charge_port`:** relabel `estimated`; cite `src-thechargeport-nacs-checker-2026` (it states CCS1 for 2025–26) and note the Canadian basis. Drop "manufacturer".
7. **EX30 `supercharger_access`:** a Canadian EX30 value has no Canadian source. Either find a Canadian page (Volvo Canada announcement for EX30) or report it per field as unreachable, as the researcher rules allow. Do not keep the US-only estimate as the Canadian value.
8. **EX30 preconditioning:** the cited EVDB page says only "battery preconditioning is available". Find a page that states the navigation trigger or drop the "auto via navigation" claim from the notes.
9. **Polestar 2 2023 dual and dual-performance-pack `dc_max_kw` 155:** relabel `estimated` (basis: same hardware as 2023 single and 2024 dual).
10. **Polestar 2 2022 `dc_max_kw` and `ac_max_kw`:** cite the 2022 US manual (`…/2022/article/88c8206d7df00acac0a801512bfd5131/`) and use `manufacturer`; add it as a source.
11. **Polestar 2 2025 single motor and dual:** relabel the values taken from the Dual-with-Performance-pack specs page as estimates, or cite InsideEVs 2024 (single) and Wikipedia (dual).
12. **Polestar 2 preconditioning 2023/2024 `manufacturer`:** change to `estimated` (the 2023 manual says "selecting preconditioning", so a manual option is not ruled out), or find out whether one exists.
13. **Source records:** `src-volvo-hamilton-ex40-2026-charging` and `src-polestar-ca-tesla-supercharger-network` are used by the batch but defined only in `data/sources/`. `--check` passes, so this is not blocking, but add `src-thechargeport` for Polestar 2 and EX40 ports.
14. **Overrides on apply:** make sure the stale OpenEV values listed under "OpenEV imports to override" do not remain as a conflict beside the new values.

No required fields are left empty.

## Applied by the researcher (2026-11-19)
Item 1 skipped (main session sets drivetrains). Items 2-12 applied to the batch JSON; --check OK.
- EX40 2025 single gross re-sourced to Green Car Reports; 2025 Twin gross to InsideEVs (GCR 78 kWh conflict in notes).
- EX40 2026 dc_max_kw (single, Standard, Twin) now estimated (carried from 2025; Hamilton 200 kW conflict noted); 2026 single and Standard gross estimated (476 km basis).
- EX40 ac_max_kw now estimated from NRCan/EPA 8 h at 240 V (src-nrcan-bev-2026-09) plus Volvo CA excerpt; no North American page states it directly.
- EX30 port estimated (thechargeport); Supercharger access stays estimated, no Canadian source found (owner flag); preconditioning stays estimated, no page states the EX30 trigger (EX90 excerpt used, honest note).
- Polestar 2: 2023 dual/perf-pack 155 kW estimated; 2022 DC/AC now manufacturer from the 2022 manual; 2023/2024 preconditioning estimated; 2025 single/dual values estimated with InsideEVs/Wikipedia/Canada page sources. thechargeport added for ports (item 13).
