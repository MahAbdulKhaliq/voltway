# Check: batch-2026-11-20-b113-volvo-others.json (heat pumps, 41 trims)

**Verdict: FIX.** `--check` passes (1367 variants, 1817 sources). 28 entries can stay (some with note edits), 13 need a drop or a rework. No bot walls were hit: no Volvo, Polestar, Edmunds, J.D. Power or evkx pages were fetched. Where only those sites could settle a point I say so. No heat_pump values exist yet on any of these cars (all null), so there is no 5 % fit issue to check.

Repo facts used: each variant has exactly one trim (`standard`; Cross Country uses `18-in-wheels`), so Volvo Core/Plus/Ultra levels are not separate trims. For those, `optional` means "package on lower levels, standard on the top level"; every such note should say so.

## Answers to the riskiest points
1. **Polestar 2 Launch Edition `none`: keep, but swap the source.** Electrek alone does not say the Launch Edition lacks it (the fetch confirms the page is silent: heat pump comes "with the Plus Pack"). Polestar's own MY2022 release does: PR Newswire 301354549 says the Plus Pack "debuts a mechanical heat pump" for "model year 2022". That meets the brief's rule ("a press article saying the heat pump arrived in a later year") and is stronger than Electrek. Use that URL as the source and keep `estimated` + low_confidence. Add that source to the batch; it is not there now.
2. **EX90 2026-27 `estimated` (6 entries): drop.** The repo's own data shows the hardware changed after 2025. 2025 Twin Motor is 107 kWh, 400 V, 250 kW DC. 2026 Twin Motor is 102 kWh, 800 V, 350 kW. 2026 Single Motor is 88 kWh, 310 kW. Rule 5 needs "no relevant change in between (pack, motors, charger…)". The Cision release was opened: it says nothing about a heat pump, so "mentions no change" is not evidence. The Single Motor is a new 2026 trim with no 2025 relative; the ArenaEV Single Motor sheet is a European 101 kWh 400 V car. There is no 2027 page of any kind.
3. **EX30 market split: needed for 2025.** Canada: Auto123 (verified) says "The system includes a heat pump and battery pre-conditioning". US: the batch's own note says US Climate-package pages list heated seats and wheel only. The Cision Canada release and Guide Auto (opened) mention no heat pump at all. Jalopnik (US 2026 Single Motor RWD) lists "a heat pump" among standard items, yet its test car also had a $500 Climate Package. A search summary suggests the US Volvo spec page lists a heat pump under "Climate", but I did not open Volvo's site. So US 2025 EX30 is unproven (possibly optional) while Canada reads standard. The brief wants CA/US editions where values differ. Either record Canada only with the US named as unconfirmed, or find a US page that names the trim. US 2026 Single Motor is verified by Jalopnik. US 2026 Twin Performance is not.
4. **EX60 2027: keep, low_confidence.** The ArenaEV P6 and P10 sheets verify "Heat pump: Yes". They are EUR/GBP sheets, and the cars here are US only. The pages say nothing about standard vs optional. KBB's EX60 article and Cars.com's EX60 page do not mention it. This is weak but is a positive statement for the exact variants; list it as unconfirmed for the US market.
5. **EC40/EX40 2026 Canada from Villa blogs.** The EC40 quote is verified: "Both trims include a heat pump", for Core and Black Edition Ultra. **But the page says both trims are Twin Motor**, so it does not cover `ec40/2026/single-motor-extended-range` (drop). The EX40 trim guide is verified for Core: "heat pump (optional)". Plus, Ultra and Black Edition are silent on the page. All Canadian 2026 EX40 trims are Twin Motor AWD, so the 2026 CA "EX40" RWD `standard` variant has no matching trim (drop).
6. **Fisker Ocean Sport `none`: keep.** ArenaEV FWD page is verified: "Heat pump: No", 205 kW, 80 kWh LFP. It is a positive statement, so the brief's rule is met. Keep low_confidence. Ultra from KBB: the quote "An added heat pump should make the battery more efficient in cold weather" is verified. "Added" does not say standard vs optional.
7. **Tesla North EX40 2021: keep `manufacturer`.** The page quotes "Energy-saving heat pump ($450)" as a single option and attributes the pricing to a Volvo Canada press release. Rule 4 allows `manufacturer`. This covers Canada only. The 2021 variant is CA+US and the US half is unverified.

## Table

| Variant | Value | Result | Evidence |
|---|---|---|---|
| polestar-2/2021/launch-edition | none, estimated | ⚠ keep, swap source | Electrek silent on Launch Edition; PR Newswire 2022 release "debuts a mechanical heat pump" for MY2022 |
| polestar-2/2024/long-range-single-motor | optional | ✅ keep | KBB: "optional heat pump", trim list includes it; notes cite Auto123/Drive Tesla Canada and Carvana, which are not sources and I did not open them |
| fisker/ocean/2023/extreme | standard | ⚠ keep, low_confidence | ArenaEV AWD 415 kW: Yes (no trim named; standard vs optional not stated). KBB puts the heat pump only in the Ultra section. |
| fisker/ocean/2024/extreme | standard | ⚠ same | same; the 2021 ArenaEV sheet is not year-specific |
| fisker/ocean/2023/ultra | standard | ⚠ keep | KBB "An added heat pump"; CA only |
| fisker/ocean/2024/ultra | standard, community | 🏷 relabel | carry-over 2023 to 2024 with no source saying unchanged: make it `estimated`, notes start "Estimated: " |
| fisker/ocean/2024/sport | none | ✅ keep | ArenaEV FWD 275 hp: "Heat pump: No" |
| ex90/2025/twin-motor, twin-motor-performance | standard | ✅ keep | InsideEVs: "In all trims, the Volvo EX90 to be equipped as standard with a heat pump". US pre-launch article; Canada not confirmed |
| ex90/2026 single, twin, twin-perf; 2027 single, twin, twin-perf (6) | standard, estimated | ❌ drop | Pack/voltage/DC changed 2025 to 2026 (107 kWh/400 V/250 kW to 102 kWh/800 V/350 kW). No 2027 source. Cision release has no heat pump text |
| ex60/2027/p6, p10-awd | standard | ⚠ keep, low_confidence | ArenaEV "Heat pump: Yes", European sheet; US not confirmed |
| ex30/2025/single-motor-extended-range | standard | ⚠ rework | Only a European ArenaEV sheet for this trim. Canada: Auto123 names no trim. US 2025 unproven. Add Auto123 as a second source and mark market |
| ex30/2025/twin-motor-performance | standard | ✅ CA / ⚠ US | Auto123 (CA) verified; US unproven (see point 3) |
| ex30/2026/cross-country | standard | ✅ US / ⚠ CA | GearJunkie: "only sold in Ultra trim" and "a heat pump"; Canada assumed |
| ex30/2026/single-motor-extended-range | standard | ✅ US / ⚠ CA | Jalopnik: standard "heat pump" US; Canada rests on ArenaEV Euro and Auto123 2025 |
| ex30/2026/twin-performance | standard, estimated | ⚠ keep, low_confidence | Auto123 2025 CA, 2025 to 2026, no change shown; US not confirmed |
| ec40/2022/twin-motor | standard | ✅ CA / ⚠ US | Autotrader.ca: "The C40 comes standard with a heat pump". US 2022 not opened |
| ec40/2023/twin-motor | optional, estimated | ⚠ keep | Same 75 kWh/400 V/150 kW as XC40 twin. Carvana 2023 C40 (opened): heat pump only on the top trim. Canada unconfirmed |
| ec40/2024/single-motor-er, twin-motor | optional, estimated | ⚠ keep | Carvana 2024 C40: heat pump on Ultimate only. Same sibling basis; Canada unconfirmed |
| ec40/2025/single-motor-er, twin-motor (CA only) | optional, estimated | ❌ change | Villa EC40 2026 CA says both trims, Core included, have a heat pump. The same-model same-market evidence contradicts the EX40 sibling basis. Use `standard`, estimated from Villa EC40 2026 (2025 to 2026 unchanged unproven, low_confidence), or drop |
| ec40/2026/twin-motor | standard | ✅ CA / ⚠ US | Villa verified, Twin Motor only. US not confirmed |
| ec40/2026/single-motor-extended-range | standard | ❌ drop | Villa says both Canadian trims are Twin Motor, so this page does not cover a single-motor car |
| ex40/2021/p8 | optional, manufacturer | ✅ CA / ⚠ US | Tesla North quotes "Energy-saving heat pump ($450)" from Volvo Canada release. The Cars.com US claim in notes could not be confirmed |
| ex40/2022/p8 (CA) | optional | ✅ keep | CanadaDrives: "$1,000 Climate Package that adds … heat pump". The "Autotrader.ca C$1,500 / standard on Ultimate" in notes is uncited and unopened |
| ex40/2022/p8-twin-eawd (US) | optional, estimated | ❌ drop | KBB 2022 (opened) lists the Climate Package without a heat pump; Carvana 2022 only says the top trim has one. "Optional on Core/Plus" is unsupported, and the 2022 vs 2023 basis is contradicted |
| ex40/2023/twin, 2024/twin, 2024/single-motor-er-rwd | optional | ✅ US / ⚠ CA | KBB 2023 and 2024: "optional bundle for the Core and Plus models … standard with the Ultimate". Canada is a carry-over from 2022 with no source saying unchanged (already low_confidence) |
| ex40/2025/single-motor, twin-motor | optional | ✅ US / ⚠ CA | KBB 2025 verified. No Canadian 2025 page |
| ex40/2026/single-motor-er-rwd (US) | optional, estimated | ⚠ keep, low_confidence | KBB 2025 carry-over; heat pump packaging, no hardware change shown |
| ex40/2026/standard (CA "EX40", RWD) | optional, estimated | ❌ drop | Villa: every Canadian 2026 EX40 trim is Twin Motor AWD, so the trim cannot be mapped. The basis is a Twin Plus listing |
| ex40/2026/twin | optional | ✅ CA / ⚠ US | Villa Core "heat pump (optional)"; Autotrader.ca Plus listing: "la pompe à chaleur haute performance" with Ensemble Climat. US 2026 is a carry-over |

## Required changes
- Drop (no supporting source or basis): the six EX90 2026-27 entries; `ec40/2026/single-motor-extended-range`; `ex40/2022/p8-twin-eawd`; `ex40/2026/standard`. List them as unfilled in the report.
- `ec40/2025/single-motor-extended-range` and `ec40/2025/twin-motor` (CA only): change to `standard`, kind `estimated`, source `src-b113-villa-ec40-2026`, notes "Estimated: …", low_confidence. Or drop.
- `polestar/polestar-2/2021/launch-edition`: add source `https://prnewswire.com/news-releases/2022-polestar-2-electric-car-features-increased-range-bespoke-options-and-best-in-premium-segment-pricing-301354549.html` (type press/manufacturer relay, accessed_on 2026-11-20) and cite it. Keep `none`, `estimated`. Rewrite the notes to say the maker's MY2022 release says the heat pump "debuts" then.
- `fisker/ocean/2024/ultra`: relabel to `estimated` with "Estimated: " notes. For both Extreme entries, add to the notes that KBB's "added heat pump" wording is ambiguous and ArenaEV names no trim.
- EX30 2025 (both variants): record the market split. Canada has an Auto123 statement that the system includes a heat pump. The US 2025 value is unproven because US Climate-package pages show only seats/wheel. State this in the notes, or find a US page that names the trim. Do not use Edmunds or the Volvo site.
- All Volvo `optional` entries: say "standard on Ultra/Ultimate" in the notes (EX40 2022-2026, EC40 2023-25).
- Remove or cite the unopened claims in the notes: Autotrader.ca C$1,500 and Ultimate-standard (`ex40/2022/p8`), Auto123/Drive Tesla Canada and Carvana 2024 (Polestar 2024), Cars.com 2021 US (`ex40/2021/p8`), the Cision release (EX90).
- Minor: every source has `type: community`, including Electrek, InsideEVs, KBB and the Polestar and Volvo press relays. Check that the allowed `type` list has a better fit for press articles.

## Item 14 (no unknowns)
After the drops above, these 41-trim cars have no heat pump value: EX90 2026 (3) and 2027 (3), EC40 2026 single motor, EX40 2022 US P8 Twin eAWD, EX40 2026 CA "EX40". Unfilled needs: a 2026 or 2027 EX90 page stating the heat pump, a Canadian 2026 EC40 single-motor page, a US 2022 XC40 page naming Core/Plus equipment, and a Volvo Canada page naming the 2026 "EX40" trim. The Volvo sites are bot-walled, so these were not attempted.

## Applied by the main session (2026-11-20)
- Polestar 2 Launch Edition `none`: source is now Polestar's MY2022 release (PR Newswire); still `estimated`.
- Dropped: EX90 2026–27 (6, new pack), EC40 2026 single motor, EX40 2026 CA "EX40", EX40 2022 US Twin eAWD.
- EC40 2025 (CA): `standard`, estimated from the dealer's 2026 EC40 page.
- Fisker Ocean 2024 Ultra `estimated`; Extreme notes name the trim ambiguity.
- Volvo `optional` notes explain "package on lower trims, standard on top trim"; ArenaEV values carry the standard-or-optional caveat. All low_confidence.
- EX30 2025: to be split by market (CA keeps the value, US left empty) in the B113 market split.
- Not done: removing mentions of unopened pages from notes (left as context).
- `--check` passes.
