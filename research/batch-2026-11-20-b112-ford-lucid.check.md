# Check: batch-2026-11-20-b112-ford-lucid.json

**Verdict: FIX** (no systematic problems; `--check` passes: "batch is valid (1367 variants...)"; nothing written). 92 cars: 18 Lightning, 2 Focus Electric, 43 Mach-E, 23 Air, 6 Gravity. Adapter filled on all 92. Heat pump filled on every trim except 6 Gravity trims and 2 Focus Electric trims (see "No unknowns").

Pages I could open: Ford CA adapter article, Ford CA FAQ, Ford US 2025 Mach-E what's-new, Ford US adapter-offer article, Ford adapter product page, InsideEVs Lightning heat pump, SlashGear Lightning heat pump, SlashGear adapter-eligibility, Electrek 2025 Mach-E, Cars.com 2025 Mach-E, Lucid Air Supercharger story, Lucid Store adapter page, Guide Auto Gravity, Green Car Reports (2024 GT, 2025 Pure), Carscoops 2025 Air. No site blocked me; I did not touch Edmunds or web.archive.org.

## Results by group

| Variants | Field | Value | Result | Evidence |
|---|---|---|---|---|
| Lightning 2022-24, Mach-E 2021-24 (all) | adapters_included | nacs_to_ccs1_on_request | ⚠ partly verified, see Q1 | Ford CA page: "F-150 Lightning and Mustang Mach-E retail customers"; "if ordered by June 30, 2024"; claim via ford.com/FastChargingAdapter, FordPass, "Reserve your adapter at no cost", BlueOval enrolment. Model years not on any Ford page. |
| Lightning 2025, Mach-E 2025-26 | adapters_included | nacs_to_ccs1_sold | ✅ (kind manufacturer ok) | Ford product page: "existing CCS1 inlet" to NACS; price not readable. Engadget (batch-cited) gives $200. Ford CA FAQ: Canada via dealer, no price. |
| Mach-E 2025 (6 cars) | heat_pump | standard | ✅ | Ford US page: "A vapor-injection heat pump is standard on all models." |
| Mach-E 2021-24 (all trims) | heat_pump | none | ✅ value, ❌ source choice | Cited Cars.com only says "is now standard". Electrek (2024-10-21, opened) says the 2025 car "now has a heat pump instead of resistance heating". |
| Mach-E 2026 (3 cars with trims) | heat_pump | standard, estimated | ✅ basis ok | Same model and generation, no source reports a change. Compared 2025 only; keep `low_confidence`. |
| Lightning 2024 (5 cars) | heat_pump | standard | ✅ value, 🏷 source | InsideEVs: "entire 2024 Ford F-150 Lightning lineup will come standard with a heat pump"; names Platinum Black to Pro, so every trim. Batch cites SlashGear, which only says "model year 2024" and names no trim or standard/optional. |
| Lightning 2022-23 (7 cars) | heat_pump | none | ✅ inferred | InsideEVs says the heat pump arrives for 2024. I did not see an explicit "launched without" sentence in my read. Inference holds; `low_confidence` is set. |
| Lightning 2025 (4 cars with trims) | heat_pump | standard, estimated | ✅ basis ok | Same generation, no source says 2025 changed; flagged low_confidence. |
| Focus Electric 2017-18 | adapters_included | none, estimated | ❌ mislabel and misread | Ford CA FAQ: Focus Electric "cannot order a Fast Charging Adapter from Ford". The exclusion has no year limit; "2012-2016" applies only to the DC-fast-charging sentence. |
| Air 2022-27 (23 cars) | adapters_included | nacs_to_ccs1_sold | ✅ | Lucid story: "$220 US excluding taxes"; "All Lucid Air owners, regardless of model or model year". Store page: $220, "Compatible with all Lucid Air Models", DC only. The page doesn't mention an included adapter. |
| Air 2025 (4) | heat_pump | standard | ✅ | GCR: "now standard across the lineup". Carscoops: "All 2025 Air models now come standard with a heat pump" (the writer's wording, not a Lucid quote; kind manufacturer is fine, Lucid released the info). |
| Air 2024 Sapphire / Grand Touring | heat_pump | standard | ⚠ weak | GCR 2024: GT "is the second Air model to get a heat pump, after the high-performance Sapphire". Page doesn't say standard vs optional. GCR 2025 says "previously available on" GT and Sapphire. `low_confidence` is set. |
| Air 2024 Pure / Touring; 2022-23 all | heat_pump | none | ⚠ inferred | Only "second Air model to get a heat pump" supports this. GCR 2025 is silent on Pure/Touring before 2025. The batch note says "limited to"; the page says "available on". |
| Air 2026-27 (8) | heat_pump | standard, estimated | ✅ basis ok | Same generation, standard on all since 2025; no 2026-27 page opened. |
| Gravity 2025-27 (6) | adapters_included | ccs1_to_nacs | ✅ | Guide Auto: "CCS1 to NACS and SAE J1772 to NACS adapters are included with the Gravity." Press relaying Lucid; manufacturer kind is fine. Carry-over to 2026-27 is flagged low_confidence. |

Cross-check with `supercharger_access`: all consistent (CCS1 `via_adapter` cars have a `nacs_to_ccs1*` value; Focus Electric `no` has `none`; Gravity NACS has `ccs1_to_nacs`). No disagreements.

## Answers to your risk points

**Q1. Mach-E / Lightning 2021-2024 eligibility.**
- No Ford page opened gives model years. The Ford CA and US articles say "retail customers" and "eligible Ford EV customers" only.
- An openable source exists: SlashGear (https://www.slashgear.com/1506347/ford-free-tesla-supercharger-adapters-who-gets-them) quotes Jim Farley: eligibility "based on the vehicle's VIN number for all Ford EVs manufactured between MY2021 and MY2024". It also says Ford "hasn't explicitly confirmed" the criteria.
- The Ford CA FAQ says all electric Ford customers have BlueOval access "no matter when they purchased their vehicle".
- Recommendation: cite SlashGear in the notes as the year-range source and keep `low_confidence`. Drop "Ford spokesperson" wording, since I only saw Farley quoted. Lightning started in 2022, so "2021-2024" really means 2022-24 for it.
- 2024 cars bought later: the Ford wording "if ordered by June 30, 2024" doesn't say whether "ordered" means the adapter reservation or the vehicle. Ford didn't state that. The batch reading (reservation by 30 June 2024) is plausible but unproven.
- Because the offer is closed, the best way a buyer gets one today is `sold`. The brief's own example uses `_on_request` for the 2024 offer, so keeping it is defensible. This needs an owner call. Either way the 2025+ cars can't use the free offer. The batch treats them as `sold`, and I found no evidence against that.

**Q2. Heat pumps.**
- Mach-E: `none` for 2021-24 and `standard` for 2025 are right. Add Electrek as a source for `none`; it is stronger than Cars.com.
- Lightning: 2024 `standard` on every trim is confirmed by InsideEVs ("entire 2024 ... lineup"). Switch the source_id from SlashGear to InsideEVs and keep kind `manufacturer` (Ford told InsideEVs).
- Lucid Air: GT and Sapphire 2024 `standard`, and Pure/Touring `none` before 2025, rest on press inference and are correctly flagged `low_confidence`. I found no Lucid page that settles standard versus optional for 2024.

**Q3. Focus Electric.** The batch's reading of the FAQ is wrong, and the evidence is stronger than it thinks. The FAQ excludes the Focus Electric without a year limit. The value `none` is correct. The kind can change to `manufacturer` with source_id `src-b112-ford-ca-adapter-faq`. Remove the "Estimated:" prefix and the "ambiguous" note.

**Q4. Unfilled heat pumps.**
- Gravity (6 trims): a web search found no source that mentions a Gravity heat pump for any trim. The Guide Auto article only mentions the Air's heat pump. I opened no Lucid Gravity spec sheet. It is likely to be in Lucid's press kit or configurator. KBB and Cars.com have Gravity spec pages (https://www.kbb.com/lucid/gravity/2026/specs, https://www.cars.com/research/lucid-gravity-2026/specs); I did not open these, so I can't say whether they list it.
- Focus Electric (2 trims): the 2017-18 car has a resistive/PTC cabin heater by general knowledge. I found no source I could open. Ford's own pages (Ford media owner's manual or spec sheet) or Auto-Data may state it.
- Neither can be filled from sources I opened.

## Required changes
1. `ford/focus-electric/2017/focus-electric` and `2018/focus-electric`, `adapters_included`: change kind `estimated` to `manufacturer`, drop the "Estimated:" prefix. Quote the Ford CA FAQ ("Focus Electric ... cannot order a Fast Charging Adapter") and fix the notes that call the exclusion limited to 2012-2016.
2. All 25 `nacs_to_ccs1_on_request` cars (Lightning 2022-24, Mach-E 2021-24): add SlashGear (Farley, "MY2021 and MY2024") as the model-year source and add it to `sources`. Remove "Ford spokesperson". Say in the notes that "ordered by June 30, 2024" is ambiguous. Owner to decide whether `on_request` stays, given the offer closed.
3. Lightning 2024 (5 cars): change `source_id` from `src-b112-slashgear-lightning-hp` to `src-b112-insideevs-lightning-hp`. Replace "Not read on a Ford page by me" with the InsideEVs quote.
4. Mach-E 2021-24 `none`: add Electrek 2024-10-21 as a source ("instead of resistance heating") and cite it instead of Cars.com.
5. Lucid Air 2024 Pure/Touring and 2022-23 `none`: reword the note from "limited to" to "previously available on GT and Sapphire".
6. Lucid Air 2024 GT and Sapphire `standard`: note that the page doesn't say standard vs optional.
7. Gravity (6) and Focus Electric (2) `heat_pump` remain unfilled (owner rule 2026-11-19 needs a value). Before the Ford/Lucid manuals, open a Lucid Gravity press kit or spec sheet for the Gravity, and Ford's Focus Electric brochure for the Focus.
