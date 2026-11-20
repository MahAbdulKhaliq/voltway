# Fact-check: batch-2026-11-20-r2-gaps.json

**Verdict: FIX.** `--check` passes ("batch is valid, 1362 variants, 988 sources"; nothing written). Several groups of values should be dropped or relabelled. The batch is not ready to apply as it stands.

Pages reopened 2026-11-20. Two pages timed out three times (Rolls-Royce US charging page, Toyota TZ press release PDF). Both PDFs (Kia manual, Toyota PR) came back as raw binary, so the Kia and Toyota quotes were not re-verified.

## Findings by group

| Group | Field / value | Result | Evidence |
|---|---|---|---|
| Audi e-tron 2019-23 (12 ids) | preconditioning `manual_only`, manufacturer | 🏷 mislabel, ❌ weak | The page footer reads "Independent fan site. Not affiliated with AUDI AG." The batch calls it `type: oem` / `kind: manufacturer`. The page says preconditioning "climatizes the interior of the vehicle before departure", and external charging can supply the energy to warm the battery. It describes no DC-stop battery conditioning and no manual control for the battery. This is cabin preheating plus a statement about energy source. It does not show `manual_only`. |
| Audi Q8 / SQ8 2024-25 (10 ids) | preconditioning `manual_only`, estimated | ❌ basis | The notes themselves say the Q8 has a "larger pack" (114 vs 95 kWh gross in the repo data; chemistry differs too). That is not the same pack. Rule 5 requires the same pack, motors and charger hardware. It also rests on the fan-site source above. |
| Spectre 2024-26 (6 ids) | preconditioning `manual_only` | ⚠ unverifiable | The RR US page timed out three times. The batch note says it names no model year and no navigation trigger, and recommends preconditioning plugged in with a departure plan in SPIRIT/Whispers. That does not prove the car has no navigation trigger. `manual_only` is a stretch from a page that is silent on navigation (rule 6: silence on one half doesn't prove it). |
| Spectre 2027 (2 ids) | preconditioning `manual_only`, `low_confidence: false` | ❌ | Same page with no model year. The 2024-26 entries are `low_confidence: true`, yet the 2027 entries are marked false. The batch's reasoning is only that "the menu lists Series II", which does not tie the text to Series II. |
| Spectre 2027 (2 ids) | `dc_max_kw` 195 kW, manufacturer | ❌ | Search results show the RR page's 195 kW / 34 min matches the pre-update (Series I) car. Series II charges up to 14 % faster, and Electrive says RR has published no Series II peak kW or 10-80 % time. EV Database's 195 kW is a manufacturer claim. The batch's own notes admit the Series II figure is not stated. A figure from a page with no model year, kind `manufacturer`, is not shown for the 2027 car. The repo's 2027 car has a larger 112 kWh usable pack, so "same peak" is unproven. |
| Kia Soul EV 2020-23 CA (4 ids) | preconditioning `none`, estimated | ❌ | The cited manual (not re-readable here) reportedly describes a high-voltage battery warmer that operates when the charging connector is connected. The researcher rule allows `none` only where the manual describes charging "without any battery-warming feature". A warmer exists, so `none` contradicts that rule, and the batch notes call it "arguable". Also, only the 2023 manual was read, not 2020-22. Do not record `none`. Leave unknown, or ask the owner for an enum value for plug-in-only warming. |
| Genesis G80 2023-25 (3 ids) | chemistry `nmc`, community | ⚠ | Korea Times quotes verified: "SK Innovation's NCM811 batteries" and "SK's 87.2 kWh battery pack", published 2021-04-20. The source is anonymous ("industry official") and pre-launch. Corroboration is for the 94.5 kWh facelift pack, a different pack, as the batch admits. It is plausible and labelled `community` with `low_confidence`. Acceptable, but only just. Ask for the owner's call or a Hyundai/Genesis page. |
| Lordstown Endurance | voltage class `400v`, community | ✅ | "The hub motors operate on 370V nominal"; "109-kWh battery pack". Note: the 370 V is stated for the motors, not explicitly the pack. Plausible, `low_confidence` is right. |
| Lexus RZ 550e F Sport / TZ Premium | usable 73.1 kWh, estimated | ❌ | The ratio comes from the 74.7 kWh bZ4X pack (71.0 / 74.7). The 76.96 kWh pack is a different pack. The notes admit EV Database lists 72.0 kWh for the 550e (snippet, not opened). Rule 5 rejects different-pack estimates. 73.1 is 1.5 % above the 72.0 that the batch itself cites. Drop both. |
| TZ Touring | voltage class `400v`, community | ✅ | Auto-Data page: "Battery voltage: 385 V", "Gross battery capacity: 95.82 kWh". |
| TZ Touring | chemistry `nmc`, estimated | ⚠ | GreenCars: Highlander EV 95.8 kWh, LG Energy Solution "new pouch cells", "similar nickel-manganese-cobalt-aluminum cathode" to Ultium. The statement that Lexus and Toyota share the same pack comes from the Toyota PR PDF, which could not be re-read. Motors and charger hardware were not compared. "Similar to Ultium" is not a statement of NMC for this pack. Weak but arguable as `estimated` with `low_confidence`. Prefer a one-line owner decision. |
| Lotus Eletre CA (4 ids) | supercharger_access `no`, community | ❌ | The Lotus CA specs page lists "350kW CCS DC Fast Charger" and no Tesla/NACS mention, so absence is confirmed. Absence of evidence is not a source for `no`. The batch notes say so too. Also an InsideEVs list that omits Lotus is a list of who *has* access. `no` should be an estimate at most, or left unknown. |

## Rules of reuse (terms)
- Audi fan site (electrichasgoneaudi.net): no terms section, copyright notice only, independent fan site.
- Korea Times: "All rights reserved"; the terms pages were not opened.
- Auto-Data.net, GreenCars, SAE/Mobility Engineering Tech, Rolls-Royce, Lotus, Kia, Toyota: terms pages not found at the guessed URLs (404) or not read. **Unverified.** Auto-Data.net already appears as a source elsewhere in the repo (`src-autodata-*`), so this is not a new risk.
- None of the four banned sites is cited. No 403/bot-wall workaround was used.

## Fix list
1. Audi e-tron (12 ids): change the source `type` to `community` (fan site), and either drop `battery.preconditioning` or record it as `estimated` with the fan page named. As it stands the page does not show `manual_only` or any battery-conditioning statement.
2. Audi Q8 / SQ8 (10 ids): drop. A larger pack and updated software is not the same hardware.
3. Rolls-Royce Spectre preconditioning (8 ids): reopen the page. If it is silent on navigation triggers, drop or mark `estimated` with a named basis. Set `low_confidence: true` for 2027 like the others.
4. Spectre 2027 `dc_max_kw` 195 (2 ids): drop. The page's 195 kW / 34 min is the Series I spec, and Series II is stated to be faster with no published peak.
5. Kia Soul EV `none` (4 ids): drop. A plug-in battery warmer exists, which contradicts the rule for `none`. Ask the owner about the enum.
6. Lexus RZ 550e and TZ Premium usable 73.1 (2 ids): drop (different pack; own notes cite 72.0 from EV Database).
7. Lotus Eletre `supercharger_access` `no` (4 ids): drop (absence of evidence), or make it `estimated` only if the owner accepts that.
8. G80 NMC (3 ids): keep as `community` / `low_confidence` only if the owner accepts an unnamed-source claim from 2021, or find an OEM page for the 87.2 kWh pack.
9. TZ Touring chemistry nmc: keep only as `estimated`; list which hardware was compared (motors, charger).
10. Lordstown 400 V: fine; note that the 370 V figure is for the motors.
