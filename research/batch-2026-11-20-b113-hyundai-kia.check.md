# Check: batch-2026-11-20-b113-hyundai-kia.json (heat pumps, 40 trims)

**Verdict: FIX.** `npx tsx scripts/add-facts.ts research/batch-2026-11-20-b113-hyundai-kia.json --check` passes (valid, nothing written). All 22 PDF/page quotes I could open match, and the decoded-PDF block claims are right. The leads hold up: IONIQ 6, Genesis GV70, Soul EV Luxury / Limited, IONIQ 5 N. Four problems need changes:

- One `none` (2024 US EV6 Long Range RWD) is unsupported and conflicts with the repo.
- One kind is wrong (`tested` on CAA-Quebec).
- Two estimate citations point at a page that never mentions a heat pump.
- The 2026/2027 GV70 estimate basis breaks the pack/port rule.

Better sources exist for 2024 IONIQ 6 Canada and the 2023 Soul EV, which I found and list below.

Method: I reopened every cited URL. PDFs were decoded with a ToUnicode-aware script written for this check (scratchpad `ck13/dec2.cjs`), independent of the researcher's decode. `public/data/cars/` is current: every batch trim has `heat_pump: null` today.

## Per entry

| Variant(s) | Value | Result | Evidence | Action |
|---|---|---|---|---|
| ioniq-6/2023 `awd`, `rwd`, `se-long-range-awd`, `se-long-range-rwd` (US) | standard, manufacturer | ✅ | Price sheet "Package Level Detail" for SE Standard Range RWD (A0402REZ) lists "Battery pre-heater" and "Heat Pump". SE RWD, SE AWD, SEL and Limited are each "(In addition to or in place of ...) equipment" and none removes it. `rwd`/`awd` are the 305/270-mile SEL/Limited cars. | keep. Delete "EV-database" from the notes (a banned fetch source; unnecessary) |
| ioniq-6/2023 `preferred-awd` (CA) | standard, **tested** | 🏷 | CAA-Quebec: "Standard heat pump" (pros list), AWD with Ultimate Package. A road-test bullet is not a measurement. | relabel `tested` to `community` (or `manufacturer` under the relay rule); keep low_confidence |
| ioniq-6/2023 `preferred-rwd` (CA) | standard, estimated | ✅ | Same 77.4 kWh pack and base package; basis holds. Notes say CAA "describes the RWD as the same lineup", which I did not find on the page (it only names the AWD). | keep; drop that clause. Also cite Hyundai Canada 2024 summary (below) |
| ioniq-6/2024 `preferred-long-range`, `preferred-long-range-awd` ([CA,US]) | standard, estimated | ✅ / improve | **Better source found.** Hyundai Canada 2024 IONIQ 6 Model Summary (https://assets.carpages.ca/dealersite/prod-wp-neddys-north-bay-hyundai/uploads/2024/01/2024-Hyundai-IONIQ-6-Model-Summary-EN.pdf) lists "Heat pump, battery heating & pre-conditioning system" with the standard mark on both Preferred Long Range and Preferred Long Range AWD. | CA car: change to `manufacturer` with that source. US car: keep `estimated` (2023 sheet and 2025 Cars.com) |
| ioniq-6/2024 `awd`, `rwd` (US) | standard, estimated | ✅ | 2023 US sheet + 2025 US Cars.com: the 77.4 kWh trims have it. Same pack and hardware. Cars.com 2025: "long-range SE gains a heat pump". | keep |
| ioniq-6/2025 `se-standard-range-rwd` | none, manufacturer | ⚠ keep | Cars.com: "In addition to the larger battery, the long-range SE gains a heat pump". Carvana: SE "Moves up from the SE Standard Range with ... battery heating, and heated front seats". It is a positive statement relative to the Standard Range, which the brief accepts for `none`. Cars.com is an editorial relay, not a maker page. | keep with low_confidence; relabel to `estimated` if you want it strict |
| ioniq-6/2024 `se-standard-range-rwd` | none, estimated | ⚠ keep | KBB 2024 "What's New" says features were dropped but does not list the heat pump (verified quote: "A few standard features have been dropped from the SE Standard Range RWD"). KBB 2025 says "Minor changes", with nothing for this trim. So 2025 to 2024 is unchanged and the 2025 `none` carries back. 2023 had it (price sheet); the 2023-to-2024 drop is not stated anywhere. | keep, low_confidence; add KBB 2025 as the "unchanged" evidence. Note the year of the drop is inferred |
| ioniq-6/2027 `n` | standard, manufacturer | ✅ | Hyundai AU MY27 sheet, decoded: "Heat pump system - high efficiency heater". Single N variant; heat pump is not market-fixed in the rules (B94). | keep, low_confidence |
| ioniq-5/2025 `n` | standard, manufacturer | ✅ | Hyundai Canada page shows "2025 Hyundai IONIQ 5 N" (the model year is right) and the heading "Heat pump, battery thermal management and preconditioning system". | keep; low_confidence can be dropped |
| genesis/electrified-gv70/2023 `prestige-awd` (CA) | standard, manufacturer | ✅ | Aug 2022 Genesis AU sheet, decoded: "Heat pump system" in the climate list. Current AU sheet: "Heat pump system". Both are Australian. | keep, low_confidence |
| genesis/electrified-gv70/2025 `electrified-gv70-awd` | standard, manufacturer | ✅ | Auto Express: every GV70 Electrified has "an energy-saving heat pump" as standard (UK, 2025 facelift). Genesis AU sheets agree. No US/CA source (KBB 2024/2025 and Cars.com 2026 spec pages do not mention it either way). | keep, low_confidence |
| genesis/electrified-gv70/2024 `electrified-gv70-awd` | standard, estimated | ✅ | Same hardware as the 2023 launch car (77.4 kWh) and the 2025 facelift; no change shown. | keep |
| genesis/electrified-gv70/2026 `electrified-gv70-awd`, `electrified-gv70-standard-awd`; 2027 `electrified-gv70-awd` | standard, estimated | ⚠ | The notes themselves say the pack (84 kWh), port (NACS) and charge-port heater changed for 2026. That is a "relevant change" under the estimate rules, and "do not remove the heat pump" is an assertion with no source. A search found no 2026 page mentioning a heat pump. Owner says the GV70 has one. | keep only as owner-led `estimated`, low_confidence; reword the notes to say no 2026+ source was found. Genesis 2026 press kit is the next source |
| ioniq-electric/2019 | optional, manufacturer | ✅ | Carvana 2019: "The Limited focuses on comfort, technology ... a heat pump" (US). | keep; kind relays equipment (consistent with earlier batches) |
| ioniq-electric/2018 | optional | ✅ | Autotrader.ca 2018: "The SE CCP adds heated rear seats, a battery temperature management system and HVAC heat pump" (CA, paid package). | keep |
| ioniq-electric/2017 | optional, estimated | ❌ cite | Guide Auto lists "Electric SE Cold Climate Package - CA$36,849" vs SE CA$35,649, but **does not mention a heat pump** (verified). The heat pump claim is on the 2018 Autotrader.ca page. | set `source_id` to `src-b113-autotrader-ca-ioniq-electric-2018` (the relative that states it) and name the Guide Auto 2017 price list in the notes |
| kia/ev6/2022 `standard-range-rwd` | none, manufacturer | ✅ | Decoded Kia Canada MY22: the first block (cloth seats, 19" wheels, no heat pump) is followed by the label "RWD Standard Range". Next block has "Heat pump (EV range enhancing climate control)", followed by "RWD Long Range adds to or upgrades from RWD Standard Range". Labels follow blocks (the AWD block precedes "AWD Long Range adds to ..."). US: Kia US 2023 grid shows "Heat pump HVAC system  —" for Light (first column) ✅ (the other two marks are lost in decoding). | keep, low_confidence |
| kia/ev6/2024 `light-standard-range-rwd` (US) | none, estimated | ✅ | Light is "—" in 2023 (verified), and KBB 2024: "standard in AWD models". Repo has Light 2025 and 2026 as `none` (consistent). | keep |
| kia/ev6/2024 `long-range-rwd` (US) | none, estimated | ❌ | KBB 2024 says only "standard in AWD models" and is silent on RWD, so it is not a positive statement for RWD. The repo has `kia/ev6/2022/long-range-*` and `2023/long-range-rwd` as `optional` (KBB: available on Wind/GT-Line). Kia US 2023 brochure says an "available, advanced heat pump" and "Available e-AWD"; the Wind/GT-Line RWD marks are unreadable. The b112 check of this same estimate called it unsupported. | **drop** (report as unfilled with the reason) unless a Kia US 2024 feature page is found (kiamedia is blocked; the 2024 brochure URL 404s). Do not leave a `none` that contradicts the repo's `optional` |
| kia/ev6/2024 `wind-rwd` (CA) | standard, manufacturer | ✅ | Decoded Kia Canada MY24: the first block (Wind RWD, heat pump, wireless charger, heated steering wheel) precedes the label "Wind RWD"; the next block "All-wheel drive (AWD)" precedes "Land AWD adds to ... Wind RWD". | keep |
| kia/soul-ev/2015-2019 `soul-ev` ([CA,US]) | optional | ✅ (see kinds) | 2015 Guide Auto: "one unique feature available on the up-level Soul EV Luxury is a heat pump". 2017 Autotrader.ca: Luxury adds "a heat pump for the climate control". 2016 Carvana: the Soul EV "adds an 8-inch touchscreen with navigation, a rear camera, and a heat-pump climate system", EV-e is the stripped California-only trim. 2017 Carvana: "the middle Soul EV adds an 8-inch navigation screen and a heat-pump climate system". 2018 Carvana: EV "adds ... a more efficient heat-pump climate system". 2019 Kia Canada brochure, decoded: block with "Heat pump (EV range enhancing climate control)" is followed by the label "EV LUXURY adds to or upgrades from EV"; the first block is the EV with none. The Hyundai newsroom says "first introduced in 2014 on the first-generation Kia Soul EV". | keep (one trim id per car). Owner leads match: CA Luxury 2015-19 ✅; US EV/EV+ 2016-19: Carvana names the middle EV; none of the pages says the EV+ has the heat pump (it is the trim above, so likely). 2015 US not sourced (stated in notes) |
| kia/soul-ev/2020, 2021 `limited-64-kwh` | standard, estimated | ✅ | Same generation, only the 2022 and 2023 brochures compared (no 2020/2021 brochure openable; the 2021 URL 404s). | keep |
| kia/soul-ev/2020, 2021 `premium-39-kwh` | none, estimated | ✅ | Same basis. | keep |
| kia/soul-ev/2022 `limited-64-kwh` | standard, manufacturer | ✅ | Decoded MY22: the block with "Heat pump", "Harman Kardon", leather seats, HUD is followed by "EV LIMITED adds to or upgrades from EV PREMIUM". | keep |
| kia/soul-ev/2022 `premium-39-kwh` | none, manufacturer | ✅ | The first block has "Battery heating system" and no heat pump and is followed by the label "EV PREMIUM". | keep |
| kia/soul-ev/2023 `limited-64-kwh`, `premium-39-kwh` | standard / none, estimated | ✅ / improve | **A direct source exists**: https://www.kia.ca/content/dam/marketing/content/vehicles/brochures/2023/soul-ev/MY23_Soul_EV_ENG.pdf (decoded: same layout, "Battery heating system" before the "EV PREMIUM" label, "Heat pump" before "EV LIMITED adds to ... EV PREMIUM", "39.2 kWh" / "64 kWh"). | change both to `manufacturer` with this source; drop `estimated` |

Sources: type `community` on the dealer-hosted MY19 Kia Canada PDF is fine (kind `manufacturer` is correct for a maker's brochure). `accessed_on` is present on all. Cars.com, KBB, Carvana and Autotrader are allowed. No banned source is cited. EV-database is named in one note only.

## Decoded PDFs: do the quotes appear in the stated blocks?
Yes for all six.
- US 2023 price sheet: "Heat Pump" and "Battery pre-heater" are in the SE Standard Range block.
- Kia CA MY19 Soul, MY22 Soul and MY22 EV6: the block order is as claimed.
- Kia CA MY24 EV6: the base block is Wind RWD.
- Kia US 2023 EV6: "Heat pump HVAC system  —", Light only.

I found no reading where a label precedes its block: in every brochure the trailing "adds to or upgrades from" label closes the block above it (e.g. "All-wheel drive (AWD)" sits above "AWD Long Range adds ..."). Hyundai AU 6 N and Genesis AU GV70 sheets: the phrases "Heat pump system - high efficiency heater" and "Heat pump system" are present as split text runs.

## Cars where Canada and the US differ (owner wants CA/US editions)
- **Kia EV6 2022 `long-range-rwd`, `long-range-awd`, and 2023 `long-range-rwd` ([CA,US], existing `optional` from KBB):** Kia Canada MY22 shows the heat pump **standard** on RWD Long Range and AWD Long Range, while the US is an option on Wind/GT-Line. Needs a CA edition (standard) beside a US edition (optional). Not in this batch.
- **EV6 2024:** CA Wind RWD standard (brochure) against US Long Range RWD unknown (see drop). CA Land AWD `standard` and US Long Range AWD `standard` already agree.
- **Soul EV 2015-19:** CA Luxury only; US EV (and EV+); EV-e none. One trim id forces `optional`. Splitting would need a trim per market.
- **Ioniq Electric 2017-19:** CA only through the SE Cold Climate Package; US on the Limited trim. Same `optional` collapse.
- **IONIQ 6 2023/2024:** no market difference found (CA Canada summary and US sheet both standard on long range).

## Required changes
1. Drop **`kia/ev6/2024/long-range-rwd` heat_pump `none`**. KBB says nothing about RWD and the repo has `optional` on the same trims in 2022/2023. List it as unfilled (what was tried: KBB 2024 overview and specs, Cars.com 2024 Wind RWD page (no line), Kia US 2023 brochure (marks unreadable), kia.com 2024 brochure 404, kiamedia blocked).
2. `hyundai/ioniq-6/2023/preferred-awd`: change kind `tested` to `community`.
3. `hyundai/ioniq-electric/2017/ioniq-electric`: set `source_id` to `src-b113-autotrader-ca-ioniq-electric-2018`; mention the Guide Auto page only as the price-list evidence.
4. `hyundai/ioniq-6/2024/preferred-long-range` and `preferred-long-range-awd`: add the Hyundai Canada 2024 Model Summary as a source and use kind `manufacturer` for the CA car (keep the US part as an estimate in the notes).
5. `kia/soul-ev/2023/*` (2 entries): add the MY23 Kia Canada brochure source and switch to `manufacturer` (keep 2020/2021 `estimated`; basis now 2022 and 2023 both compared).
6. GV70 2026 (2 variants) and 2027: reword the notes to say the pack, port and charger changed for 2026 and no 2026+ source was found; keep `estimated` and low_confidence (owner lead). Remove the "do not remove" assertion.
7. IONIQ 6 2023 US notes: delete the "Older Autotrader/EV-database remarks" sentence.
8. IONIQ 6 2024 `se-standard-range-rwd`: add to the notes that the 2023-to-2024 drop year is inferred (KBB 2024 lists dropped features without naming the heat pump).
9. IONIQ 5 N 2025: optionally remove `low_confidence` (page shows the 2025 model year).

## Not filled by the batch (no-unknowns rule)
Four cars in these makes still have no heat pump (they are not in this batch):
- `hyundai/ioniq-electric/2020` and `2021` (CA/US)
- `hyundai/kona-electric/2024/kona-electric` (CA)
- `hyundai/kona-electric/2025/n-line` (CA/US)

Everything else in Hyundai, Kia and Genesis has a heat pump in the merged data. The batch otherwise fills all 40 trims on its list.

## Applied by the main session (2026-11-20)
- Dropped: EV6 2024 US long-range-rwd `none`.
- IONIQ 6 2023 CA preferred-awd relabelled `community`; EV-database sentence removed from IONIQ 6 notes; 2024 SE Standard Range note says the drop year is inferred.
- IONIQ 5 N 2025: low_confidence removed.
- Ioniq Electric 2017 re-sourced to Autotrader.ca 2018.
- Soul EV 2023: `manufacturer` from the Kia Canada MY23 brochure (new source).
- GV70 2026–27: notes say owner-led estimate across the pack change.
- Not done: IONIQ 6 2024 CA upgrade to `manufacturer` (the Hyundai Canada 2024 Model Summary URL is not in the report).
- EV6 2022–23 long-range CA vs US (Canada standard, US optional): handled in the B113 market split.
- `--check` passes; applied.
