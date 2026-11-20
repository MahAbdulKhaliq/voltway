# Fact-check: batch-2026-11-20-evcs-replace.json

**Verdict: FIX** (small). `--check` passes ("batch is valid, 1367 variants, 1290 sources"; nothing written). Coverage is complete: the 38 data files that cite the banned EVChargingStations sources (14 powertrains, 24 variants) are all in the batch, field for field.

## Sources reopened

| Source | Result | Evidence |
|---|---|---|
| src-r3-electrek-blazer-2027-nacs | verified | 2027 Blazer EV "will feature a North American Charging Standard (NACS) port", replacing CCS on earlier models. No Canada mention. |
| src-r3-electrek-gm-2027-nacs | verified | Lists Blazer EV, Silverado EV, Lyriq; "will come with a native North American Charging Standard". Tesla-only caveat is Electrek's own wording. Presented as GM's plan. |
| src-r3-gcn-gm-2027-nacs | verified | "Most 2026 GM electric vehicles still use the CCS1 connector"; Optiq and Bolt are the exceptions; all 12 2027 EVs incl. Blazer, Silverado, Lyriq get NACS. |
| src-r3-insideevs-silverado-2027-nacs | verified, but note | "all 2027 Silverado EV models now come from the factory with a NACS charging port"; "without needing an adapter". No "GM order guide" statement found. It only says "as with all 2027 General Motors EVs". |
| src-r3-insideevs-lyriq-fast-charge-2022 | verified | "Cadillac states that the Lyriq has a maximum DC fast charge rate of 190 kW". Model year not stated on the page. No AC or voltage. |
| src-r3-greencars-lyriq | verified | "built on a 400 V architecture ... up to 11.5 kW AC (19.2 kW optional) and 190 kW DC"; "CCS Type 1". |
| src-r3-greencars-lyriq-v | verified | Same sentences on the Lyriq-V 2025 page. |
| src-electrek-2027-lyriq-nacs (existing) | partly | "now has a built-in NACS port"; GM spokesperson "all of our 2027 models will be updated with native NACS ports"; "102 kWh" (single-motor RWD); "up to 190 kW". The 190 kW is Electrek's own text, not attributed to GM or Cadillac. The page is about the Lyriq, not the Lyriq-V. |

## Values

| Variants / fields | Result | Evidence |
|---|---|---|
| Blazer EV 2027 awd/fwd/ss `charge_port` nacs, `supercharger_access` yes (manufacturer) | ✅ | Electrek x2, relaying GM's announcement. The "manufacturer" label is acceptable. All three variants are US-only, so the market is right. |
| Silverado EV 2027 (4 variants) nacs + yes (manufacturer) | ✅ with a wording fix (fix 3) | InsideEVs says the same for 2027. The "reporting GM order-guide information" phrase isn't on the page. |
| Blazer EV 2024-2025 (8 variants) ccs1, estimated | ✅ | Electrek: "the CCS connector used on earlier models". No port change is known between 2024 and 2026. |
| Blazer EV 2026 (3 variants) ccs1, estimated | ✅ | GCN names only Optiq and Bolt as NACS-native for 2026. It is an inference, so `estimated` is right. |
| Silverado EV 2026 (6 variants) ccs1, estimated | ✅ | Same GCN basis. |
| Canadian cars (2024/2025 rs-rwd are CA-only; several others CA+US) | ⚠ weak but acceptable | The notes cite Guide Auto for Canada. The page lists Blazer, Silverado and Lyriq among Canadian owners who can buy the GM CCS-NACS adapter. It never says Canadian cars have CCS1. Keep `estimated` and `low_confidence`. |
| Lyriq 2023-rwd `dc_max_kw` 190 (manufacturer) | ✅ | InsideEVs relays Cadillac's figure. The test year is not shown on the page, so this is correct but loosely tied to 2023. |
| Lyriq 2027-rwd `dc_max_kw` 190 (manufacturer) | ❌ label | The Electrek 2027 article gives 190 kW in its own voice, with no GM or Cadillac attribution. |
| Lyriq-V 2027 `dc_max_kw` 190 (manufacturer) | ❌ wrong car and label | The Electrek article covers the Lyriq (102 kWh RWD) only, and doesn't name the Lyriq-V. |
| Lyriq 2024/2025/2026 and Lyriq-V 2026 `dc_max_kw` 190 (estimated) | ✅ | GCN states 190 kW for the same model. InsideEVs 2023 and Electrek 2027 agree, and no hardware change is known. |
| Lyriq / Lyriq-V `ac_max_kw` 11.5 (estimated) | ✅ | GCN: "11.5 kW AC (19.2 kW optional)". The 19.2 kW trims are handled per trim. The 2027 Lyriq-V powertrain has no AC entry in the batch and the data shows 19.2 kW from another source, so there is no conflict. |
| Lyriq / Lyriq-V `nominal_voltage_class` 400v (estimated) | ✅ | GCN says "400 V architecture". The basis (same 102 kWh pack for 2023-2027) holds. The Lyriq-V page is for 2025 but the pack is the same. |
| Blazer EV 102 kWh powertrains `nominal_voltage_class` 400v (estimated, from the Lyriq) | ⚠ plausible, thin basis | See "Blazer pack as a Lyriq sibling" below. |

## Blazer pack as a Lyriq sibling

- **What the data shows.** Both cars carry 102 kWh gross, both are NMC (Ultium), and both peak at 190 kW (Blazer RS RWD 190, Blazer SS 195 from OpenEV). I did not reopen `src-insideevs-blazer-ev-epa-2024`.
- **What the rules ask for.** The brief requires the same pack, motors and charger hardware. The notes compare only capacity and peak kW. They don't compare motors or module count.
- **Verdict.** Calling the 102 kWh Blazer a 400 V-class sibling of the LYRIQ pack is reasonable. It is the same Ultium pack family, and the lower-capacity 85 kWh pack is already 400 V class at about 288 V nominal. Keep it `estimated` and `low_confidence`, and name the missing comparison in the notes (fix 4).
- **Other Blazer powertrains.** The 85 kWh Blazer powertrains do not cite the banned source in their voltage field. Their voltage notes were not reopened, so I make no claim about them.

## GreenCarsCompare

- **Terms.** `/terms` returned 403, which I did not work around. The Lyriq and Lyriq-V pages and the home page show only a copyright line ("© 2026 Green Cars Compare Inc. All rights reserved.") and Privacy and Cookie policy links. There is no terms-of-use, licence or API link and no reuse statement.
- **What this means.** Reuse permission is unverified, and silence is not permission. The brief says to check any other spec aggregator's terms before citing it. The batch does not record that check.
- **Precedent.** 11 existing source files in `data/sources` cite greencarscompare. NOTES also records GCN as "skipped as modelled" for the Tesla batch and used as the checker-suggested source for smart. This is an owner call (fix 1).
- **Artefact.** Both pages show "This car does not support DC fast charging" next to "190 kW DC", and "not sold in the USA and therefore not compatible with US charging stations". The Lyriq is sold in the US, so this is a locale and region artefact. The batch correctly ignores it. Note it in the source notes so nobody trusts the "no DC" line.
- **Other limits.** The pages have no model-year split, and the figures are unattributed. That is why `estimated` is the right kind.

## Fix list

1. **Owner decision, GreenCarsCompare.** Ask the owner whether GCN is allowed before applying. If not, the Lyriq/Lyriq-V voltage class and AC (about 20 entries) need another source or must be left out. The 190 kW DC entries have other support (InsideEVs, Electrek). If allowed, add to the two GCN source notes: "terms page not readable (403), no reuse statement on site; page shows 'does not support DC fast charging' for the US locale, ignore".
2. **`cadillac/lyriq/2027-rwd` `dc_max_kw`:** change `kind` from `manufacturer` to `estimated`. The Electrek page gives 190 kW unattributed. Basis: same model and pack since 2023, with GM-attributed 190 kW in InsideEVs and GCN. Alternatively keep `manufacturer` but cite the InsideEVs Cadillac statement.
3. **`cadillac/lyriq-v/2027-lyriq-v` `dc_max_kw`:** the Electrek Lyriq article doesn't cover the Lyriq-V. Change it to `estimated`, source `src-r3-greencars-lyriq-v`, and reuse the Lyriq-V 2026 note ("same pack and charger hardware 2023-2027"), model year 2027. Don't cite the Lyriq article as `manufacturer`.
4. **Silverado 2027 notes (4 variants, charge_port):** delete "reporting GM order-guide information". The InsideEVs page doesn't say it. Replace with: "InsideEVs: 'as with all 2027 General Motors EVs', native NACS". The Electrek 2026-08-14 attribution to GM supports `manufacturer`.
5. **Blazer EV 102 kWh voltage notes (6 powertrains):** add to the basis that the comparison covers only capacity and peak kW. Say motors, module count and charger were not compared, or add them from a source. Keep `low_confidence`.
6. **`chevrolet/blazer-ev/2026-ss-awd` powertrain `nominal_voltage_class`:** this entry sits beside an existing `manufacturer` 400v (OpenEV). Confirm the replacement doesn't become the winning value. Otherwise drop it from the batch.
7. **Leftover mentions after applying.** Some Blazer notes still name EVChargingStations in text, for example the 2026-standard voltage note ("288 V per EVChargingStations") and the 85 kWh-pack voltage records. Scrub these when the old entries are deleted.
8. **Retest.** After the edits, rerun `npx tsx scripts/add-facts.ts research/batch-2026-11-20-evcs-replace.json --check`.
