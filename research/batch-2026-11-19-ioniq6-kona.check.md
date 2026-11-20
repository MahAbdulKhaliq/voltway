# Check: batch-2026-11-19-ioniq6-kona.json

**Verdict: FIX.** `--check` passes (490 variants, 167 sources after applying). All 21 powertrains fill every required field, so no unknowns are left. But about 8 values must change or be relabelled, and the Kona gen 2 pack match and Kona gen 1 `none` are systematic problems (details below).

The batch has no curves, wheels or `variants` entries, so checks 7, 8, 9 and 13 don't apply. I read every cited page again, except hyundai.com/uk Kona (read, see below). Nothing was blocked.

Values are grouped because the IONIQ 6 values repeat across 12 powertrains. Powertrain ids are abbreviated.

## IONIQ 6, 77.4 kWh pack (2023-2024, 10 powertrains: 2023-awd/rwd/se-long-range-awd/rwd/preferred-awd/rwd, 2024-awd/rwd/preferred-long-range/-awd)

| Field | Value | Result | Evidence |
|---|---|---|---|
| usable kWh | 74 est. (EVDB) | ✅ with a flag | EVDB page: "74.0 kWh usable", marked estimated; nominal 77.4. The same-pack, same-generation basis holds. The repo already has 72.6 (OpenEV, low conf.) on the 2025 Long Range, a 1.9 % gap, so within tolerance. The two figures are unreconciled across model years. |
| chemistry | nmc est. | ✅ | EVDB: NMC cathode. |
| voltage class | 800v | ✅ | LA release: "800-V charging capability as standard". |
| dc_max_kw | 233 est. | ❌ conflict | EVDB page says 233 kW. The repo's 2025 Long Range (same pack, 2025 powertrain `2025-long-range`) has 220 kW, a 5.9 % gap. EVDB also says "manufacturer claims 18 min at 240 kW maximum", which the batch doesn't mention. Same hardware would show two peaks across model years. |
| ac_max_kw | 10.9 | ✅ US cars; ⚠ CA cars | LA release: "standard 10.9 kW on-board charger". The CA cars (2023-preferred-*, 2024-preferred-long-range*) cite a US page, and the onboard charger needs a source for that market. The repo already holds `src-auto123-ioniq-6-2025` (Canadian site, 10.9) on the 2025 CA car. |
| published 10-80 min | 18 | ✅ | LA release: "10 percent to 80 percent in just 18 minutes" on 350 kW. |
| preconditioning 2023 (4 US, 2 CA) | automatic_and_manual, manufacturer | ✅ | LA release: heater starts when a charger is set as destination in navigation; also warmed via the MyHyundai app while plugged in. US-spec 2023 car; fine for CA by B94. |
| preconditioning 2024 (2024-awd, -rwd, -preferred-long-range, -awd) | automatic_and_manual, manufacturer, low conf. | ⚠ / 🏷 | CE1 2024 page: manual "select Battery Conditioning Mode" is stated. The navigation half is only conditional: "If you set the DC charging station as your destination while using the battery conditioning mode". It does not say that setting a destination starts the mode. The page names no model; the CE1 = IONIQ 6 mapping is not on the page (a search for the CE1 manual returns IONIQ 6 pages, so it is plausible). To support both halves you need the 2023 LA release plus the manual, so the kind should be `estimated` naming both. |
| charge_port / supercharger (US cars) | ccs1 / via_adapter | ✅ | Hyundai US FAQ: "22MY-25MY IONIQ 6" on the eligible list. |
| charge_port / supercharger (CA cars) | ccs1 / via_adapter, low conf. | ✅ | Hyundai Canada FAQ: "Hyundai EVs from 2025 and earlier" use CCS and can use an adapter; IONIQ 6 not named, so the inference is sound for MY2023-24 and low confidence is right. The CCS-vs-CCS1 distinction is the inference. |

## IONIQ 6, 53 kWh Standard Range (2024-se-standard-range-rwd, 2025-se-standard-range-rwd, US)

| Field | Value | Result | Evidence |
|---|---|---|---|
| gross kWh | 53, manufacturer | 🏷 | EVDB page says "nominal 53.0", not a maker statement. The "Hyundai Europe press kit" in the notes isn't cited. Cite a Hyundai page or mark it estimated. |
| usable kWh | 50 est. | ✅ with a flag | EVDB: 50.0 usable. The batch notes the 53/54 conflict (a gap of about 6 %). Same pack on both markets is not proven, only assumed. |
| chemistry | nmc est. | ✅ | EVDB: NMC. |
| voltage class | 800v est. | ✅ | EVDB: "480 V (800 V architecture)". |
| dc_max_kw | 150 est. | ✅ with a flag | EVDB: 150 kW. No Hyundai US figure. |
| ac_max_kw | 10.9 est. | ⚠ | The 10.9 kW is for the 77.4 kWh US car. The "same charger across packs" is assumed. EVDB says 11 kW for the SR. Plausible but unproven. |
| published 10-80 min | 18, manufacturer | 🏷 | EVDB: 18 min is EVDB's own value (about 120 kW average), not stated as Hyundai's. The Hyundai LA release 18 min is for the 77.4 kWh pack at 350 kW. Make it estimated or drop it. |
| preconditioning | automatic_and_manual, manufacturer | ❌ / 🏷 | 2025 CE1 page: automatic "when the battery temperature is low during driving or when the scheduled air conditioner/heater is activated"; manual in EV Settings. The page does not say a DC station destination starts it. The note's "navigation trigger" is therefore not supported for 2025. Also "same feature for both packs assumed", and the page says it works "only in a vehicle equipped with a battery heater", which isn't shown for the SR. Should be `estimated`. |
| charge_port / supercharger | ccs1 / via_adapter | ✅ | Hyundai US FAQ, 22MY-25MY. |

## IONIQ 6 N 2027 (US)

| Field | Value | Result | Evidence |
|---|---|---|---|
| gross kWh | 84 | ✅ | Hyundai UK: "upgraded 84 kWh battery". Electrek: "84 kWh battery". |
| usable kWh | 80 est. | ✅ with a flag | EVDB: 80.0 (estimated), 84.0 nominal. Same-pack basis. |
| chemistry | nmc est. | ✅ | EVDB: NMC. |
| voltage class | 800v | ✅ | UK page: "800V battery system". |
| dc_max_kw | 240 | ✅ with a flag | UK page footnote: up to 240 kW in optimal conditions. Conflicts: CarExpert 260, EVDB 263 (8 to 10 % higher). UK-spec figure applied to the US car. Fine as low confidence. |
| ac_max_kw | 10.5 est. | ❌ | CarExpert (Australia) says "Onboard charger: 10.5 kW". The onboard charger varies by market (EVDB 11 kW, the US standard car 10.9). The basis ("same model, other market") is not allowed for AC. The batch notes it is "not confirmed for the US N". Needs a US source, or the owner decides to accept the 10.5 / 10.9 / 11 spread (under 5 % apart). |
| published 10-80 min | 18 | ✅ | Electrek: "10% to 80% in about 18 minutes using a 350 kW". |
| charge_port | nacs | ✅ | Electrek: "native NACS charging port and a CCS adapter". |
| supercharger_access | yes, manufacturer | ❌ | Electrek is silent on Supercharger access, and the batch's own note infers it from the port. Native NACS doesn't prove access. The IONIQ 9 in the repo has `yes` from a Hyundai CA page. Mark it estimated, or find a page. |
| preconditioning | automatic_and_manual est. | ⚠ | Rests on the CE1 2025 page, which does not show a navigation trigger, plus the UK page. The UK page says "Preconditions battery to optimal temperature to improve endurance", which is the N track battery feature, not charge preconditioning, and an upgraded coolant heater. Basis is thin. |

## Kona Electric gen 1 (2019-kona-electric, covers 2019-2023 CA+US)

| Field | Value | Result | Evidence |
|---|---|---|---|
| gross kWh | 67.5 est. | ⚠ | EVDB: 67.5 nominal / 64.0 usable. Hyundai and Weekly Driver say a bare "64 kWh", which the rules would treat as gross. The batch flags the conflict. |
| usable kWh | 64 est. | ✅ | EVDB 64.0 usable on both the MY20-21 and MY22-23 pages. |
| chemistry / voltage | nmc / 400v | ✅ | Weekly Driver: "NCM 622", "356 V". |
| dc_max_kw | 77, community | ✅ | Weekly Driver: "77 kW" peak, "based on Hyundai's 100 kW charger figure". EVDB also 77. Hyundai's marketed "100 kW" (xautoworld) is a charger rating, so recording 77 as `community` is right. I suggest adding the marketed 100 kW as a second value with a note (see required changes). |
| ac_max_kw | 7.2 | ✅ | xautoworld quoting Hyundai: "7.2 kW rate of charge". |
| charge_port | ccs1, community | ✅ | xautoworld: "SAE-Combo". The kind is `community` while the AC value from the same page is `manufacturer`, so one is inconsistent. |
| supercharger_access | via_adapter | ✅ | US FAQ lists "KONA Electric" with no year; Canada FAQ covers MY2025 and earlier. The year coverage for 2019 is not stated. |
| preconditioning | **none** est. | ❌ | EVDB (a European MY22-23 listing, not a manual or maker page) says "Preconditioning Possible: No". The estimate rule needs an owner's manual or maker page. An Electric Revs article about the 2019 car (2018 pre-launch) says Canadian versions get a 2 kW battery heater, and "Winter Mode" warms the pack "to allow... quicker fast DC charging". The US version has none. So `none` is contradicted for the CA cars, and the claim that the car "predates" Hyundai's feature isn't a launch date cited. |

## Kona Electric gen 2 (2024-kona-electric CA, 2024/2025-long-range US, 2025-n-line CA+US, 2026-standard CA chemistry + preconditioning only)

| Field | Value | Result | Evidence |
|---|---|---|---|
| usable kWh | 65.4 est. | ❌ | EVDB EU: 65.4 usable, 68.5 nominal, **399 V**. The NA car is 64.8 kWh, **358 V** (evspecs, Weekly Driver). The voltage differs by 11 %, so the same-pack basis fails. 65.4 usable also exceeds the NA 64.8 label that the repo stores as gross. The 2026-standard CA car on the same pack already has usable 58 (OpenEV), which is 12 % lower. Gross or net for 64.8: unknown; no page says. Drop this value, or find an NA-sourced one. |
| chemistry | nmc, community | ✅ | evspecs: "NCM (NMC)" for SEL/Limited. |
| voltage class | 400v, community | ✅ | Weekly Driver: "358 V". |
| dc_max_kw | 102, manufacturer | ⚠ | Hyundai UK: "102 kW DC fast charging station" for the 65.4 kWh pack. Pack match unproven (voltage), but NA sources say 100 (evspecs, Weekly Driver): within 2 %. Fine as low confidence. |
| ac_max_kw | 10.8, community | ✅ | evspecs: "10.8 kW". Other sources 10.5 (UK) and 11 (US autoevolution). All within 5 %. |
| preconditioning | automatic_and_manual, manufacturer | 🏷 | SX2EV 2025 page: "automatically operate the function by setting a DC charging station as a destination or a waypoint", plus manual Activate. Clear. But the page doesn't name the model (SX2 = Kona gen 2 is not on the page). It is a 2025 manual used for the 2024 cars, and for the CA 2024 and 2026 cars the notes add UK/Canada pages. A combination or other-year basis should be `estimated`. The 2026-standard note itself says the Canada page only says the battery "pre-warms while plugged in". |
| charge_port / supercharger | ccs1 / via_adapter | ✅ | US FAQ lists KONA Electric; Canada FAQ names "the 2026 KONA Electric" and MY2025 and earlier. |
| **SE** (2024-se, 2025-se) usable | 48.4 est. | ❌ | EVDB EU: 48.4 usable, 51.0 nominal, **295 V**. NA SE: 48.6 kWh, **269 V** (evspecs). Different voltage (9 %), so pack match is unproven. NA 48.6 may be gross. |
| SE dc_max_kw | 75 est. | ❌ | EVDB EU: 75 kW. evspecs (the batch's own NA source) lists 100 kW for the SE too. The batch keeps 75 because "43 min fits it", but the 43 min is Hyundai US's claim for the Kona and does not identify the SE's peak. The match is unproven and the NA source disagrees. Hyundai US gives no SE peak. |
| SE preconditioning, chemistry, voltage class, AC | as above | see above | Same notes as the gen 2 rows. |

## Fit with existing data (check 11)
- IONIQ 6 LR dc_max 233 vs repo 220 (5.9 %): see above.
- Kona 2026-standard (not changed on usable, dc or AC) keeps usable 58 / 48.4 and DC 100 / 75. The batch's 65.4 and 75 for the same hardware generation would conflict with it.
- Kona gen 1: no existing values.

## Required changes
1. IONIQ 6 77.4 kWh powertrains: reconcile `dc_max_kw` 233 with the repo's 220 on `2025-long-range` and `2025-long-range-awd`. Say which source wins and note EVDB's "manufacturer claims 240 kW". Both model-year families should end up with one figure.
2. IONIQ 6 CA powertrains (`2023-preferred-awd/rwd`, `2024-preferred-long-range`, `-awd`): cite `src-auto123-ioniq-6-2025` or another Canadian page for `ac_max_kw`.
3. IONIQ 6 2024 and 2025 `battery.preconditioning`: relabel `estimated` with both sources named (LA release for the navigation trigger, CE1 manual for manual control), or find a page that states the trigger. For the 2025 SR the 2025 CE1 page does not state the navigation trigger at all.
4. IONIQ 6 SR (both): `capacity_gross_kwh` and `published_10_80_min` should not be `manufacturer` when citing EVDB. Use `estimated`, or cite a Hyundai page. Preconditioning: `estimated`, and give a basis for the SR having a battery heater.
5. IONIQ 6 N: drop or re-source `ac_max_kw` 10.5 (an Australian figure; AC is market-specific). Mark `supercharger_access` as `estimated` (native NACS port) or cite a page that states access. Strengthen the preconditioning basis.
6. Kona gen 1: drop `battery.preconditioning` `none`, or support it with a Hyundai manual or maker page for that year. The Canadian car has a battery heater and Winter Mode (Electric Revs), so `none` is wrong there. Consider a second `dc_max_kw` of 100 (manufacturer marketing, xautoworld) with a note that the car peaks at 77. Make the port kind consistent with the AC value from the same page.
7. Kona gen 2 LR/N Line/2024: drop `capacity_usable_kwh` 65.4 (EU pack at 399 V vs NA 358 V; 65.4 exceeds the stored 64.8 gross). Find an NA-sourced usable figure or a gross-to-usable ratio from a same-pack page. Also reconcile with the 58 kWh already on 2026-standard.
8. Kona gen 2 SE: drop `capacity_usable_kwh` 48.4 and `dc_max_kw` 75 (EU 295 V vs NA 269 V; the NA source says 100 kW), or find NA-sourced figures.
9. Kona gen 2 `battery.preconditioning` (all 8): use `estimated` where the 2025 SX2EV manual is carried to 2024 or combined with other pages (2024 cars, 2026-standard). For 2025 cars it is the same year, so `manufacturer` with low confidence is acceptable if you accept the unnamed SX2EV code.
10. No curves, wheels or `based_on` in this batch; nothing to check there. Required-field coverage (check 14): all 21 powertrains have all eight required fields, but items 3 to 8 above will reopen some of them.

## Applied by the researcher (2026-11-19)
`--check` passes again (491 variants, 188 sources). Changes to the batch:
1. **IONIQ 6 DC:** one figure, 233 kW (estimated, EVDB 1718 + Wikipedia infobox), now also written to `2025-long-range` and `2025-long-range-awd`; the notes record OpenEV's 220 (low confidence, no basis) and EVDB's "manufacturer claims 240 kW". OpenEV 220 will still show as an imported value until the main session decides precedence.
2. **Canadian AC:** `2023-preferred-awd/rwd` now cite `src-auto123-ioniq-6-2025` (estimated, 2025 Canadian page carried back); the two 2024 preferred-long-range powertrains carry the US release plus the auto123 value.
3. **IONIQ 6 preconditioning 2024 and the SR:** relabelled `estimated`, two entries naming both sources (LA release for the navigation trigger, CE1 manual for manual control). The 2025 SR note no longer claims the manual states the navigation trigger; it says the manual does not, and that a battery heater on the SR is assumed. 2023 stays `manufacturer` (LA release).
4. **SR labels:** gross 53 and 10-80 % 18 min are now `estimated` (EVDB basis).
5. **IONIQ 6 N:** AC changed from 10.5 (Australian) to 10.9 estimated from the US IONIQ 6 (CarExpert 10.5 and EVDB 11 noted); Supercharger access `estimated`; preconditioning basis restated (standard IONIQ 6 LA release + CE1 manual, N track mode excluded).
6. **Kona gen 1 preconditioning:** `none` replaced by `manual_only`, estimated, from Electric Revs (Canadian 2 kW battery heater and driver-selected Winter Mode, no navigation trigger; US cars have no battery heater, so `none` fits the US cars; the powertrain is shared, so the Canadian behaviour is recorded). Port kind changed to `manufacturer` to match the AC value. I did not add the marketed 100 kW as a second DC value: a `manufacturer` 100 would out-rank the 77 kW the car actually peaks at.
7. **Kona gen 2 usable:** 65.4 and 48.4 (European packs, different voltage) removed. Replaced by estimates from the NA gross figures with the EVDB same-generation usable/nominal ratio: 64.8 x 0.955 = 61.9 kWh and 48.6 x 0.949 = 46.1 kWh. The repo's OpenEV 58 for the 2026 Canadian car is 6 % lower and left unreconciled (the 2026 powertrain itself has no usable value in the batch).
8. **Kona gen 2 SE DC:** 75 replaced by 100 kW (evspecs NA, community, low confidence); EVDB's 75 noted.
9. **Kona gen 2 preconditioning:** `estimated` for the 2024 cars and 2026-standard (2025 manual carried); 2025 cars stay `manufacturer`, low confidence (SX2EV code unnamed).
