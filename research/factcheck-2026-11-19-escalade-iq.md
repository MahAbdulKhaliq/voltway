# Fact-check: batch-2026-11-19-escalade-iq.json

**Verdict: FIX.** Most values are supported and fit existing data. Three values need changes (one estimated range, one source that does not say the value, trim AC labels). Several Canada values have no Canadian source.

Validity: `npx tsx scripts/add-facts.ts research/batch-2026-11-19-escalade-iq.json --check` gives "OK, batch is valid". Nothing was applied. cadillac.com and news.gm.com return 403; I did not work around that. Preconditioning could only be checked through a search excerpt.

## Powertrain `cadillac/escalade-iq/205-kwh-800v` and `cadillac/escalade-iql/205-kwh-800v`

| Variant / powertrain | Field | Value | Result | Evidence |
|---|---|---|---|---|
| IQ | usable kWh | 205 manufacturer | ⚠ label | Wards: "share a 24-module GM battery producing 205 kWh". The page does not say usable. GM TechLink says "more than 200 kWh of available energy". Weekly Driver: "GM does not say whether these figures are usable or total". Reading it as usable is plausible but unproven. Fits Silverado EV Max (204 kWh usable). |
| IQL | usable kWh | 205 manufacturer | ⚠ label | Same Wards quote. Cars.com IQL says the pack is "5 kWh more" than the IQ, which conflicts with Wards. Cars.com 2025 says the IQ has 200 kWh, so this is probably 200 vs 205 rounding. |
| IQ, IQL | chemistry | nmc estimated | ✅ | Weekly Driver: "NCMA (nickel-cobalt-manganese-aluminum)". Its pack-family heading names the Escalade IQ, but the vehicle list does not. Estimated is the right kind. Matches Silverado EV (nmc). |
| IQ | voltage class | 800v manufacturer | ✅ | GM TechLink: "enables 800-volt DC fast charging". Weekly Driver gives 350 V nominal, the same as the Silverado Max records (800v). |
| IQL | voltage class | 800v estimated | ✅ | Basis is the shared pack (Wards) plus the GM quote. |
| IQ, IQL | preconditioning | automatic_and_manual estimated | ⚠ unverifiable | cadillac.com support page 403. A search excerpt of Cadillac Canada's support page shows automatic preconditioning when routing with Google built-in navigation, and manual "Start DC Fast Charging battery conditioning ... (if equipped)". It is not Escalade-specific. The estimated label and "UNVERIFIED" note are honest. The "if equipped" wording means the feature is not confirmed for this car. |
| IQ | dc_max_kw | 350 manufacturer | ✅ | Consumer Guide: "Maximum Charge Rate: 350 kW"; "accepts charging at up to 350 kW". Also TechCrunch: "charge at 350 kW". Fits Silverado Max (350). |
| IQL | dc_max_kw | 350 estimated | ✅ (caveat) | The basis is the same pack and charger as the IQ (Wards). Charger hardware sameness is not stated, but 116 and 117 miles per 10 min agree. |
| IQ | ac_max_kw | 19.2 manufacturer | ❌ source | TechCrunch has "37 miles for each hour of Level 2" but no 19.2 kW figure and no 240 V / 80 A. The value is true per InsideEVs 2027 ("19.2 kW OBC"). Change the source to src-insideevs-escalade-iq-2027-nacs, or fix the notes. |
| IQL | ac_max_kw | 19.2 manufacturer | ✅ | Cars.com IQL: "11.5-kilowatt onboard charger" standard, a 19.2 kW unit optional. The powertrain maximum is correct. |

## Variants

| Variant | Field | Value | Result | Evidence |
|---|---|---|---|---|
| IQ 2025 | charge_port | ccs1 manufacturer | ⚠ market | TechCrunch (US): "launch with CSS charging". There is no Canadian source, but the batch says "Canadian car assumed". Port needs a source for that market. |
| IQ 2025 | supercharger_access | via_adapter estimated | ⚠ market | autoevolution (US/NA): models of 2026 or earlier "still need an adapter" except the Optiq. Guide Auto Canada does not list the Escalade. The CA claim is unproven. |
| IQ 2025 | luxury-1, sport-1 ac_max 11.5 | manufacturer | ✅ | Cars.com 2025: lower trims get an "11.5-kilowatt onboard charger". Cars.com lists Luxury 1 and Sport 1 as the base trims. Canada is not stated. |
| IQ 2025 | range 740 km | manufacturer | ✅ | GM TechLink: "Cadillac-estimated 460 miles" (740 km). Auto123 Canada: "in excess of 700 km". |
| IQ 2026 | charge_port | ccs1 manufacturer | ✅ (US) | Consumer Guide: "Charging Standard: CCS". Canada is assumed with no source. |
| IQ 2026 | supercharger_access | via_adapter estimated | ⚠ market | Same as 2025. |
| IQ 2026 | luxury, sport ac_max 11.5 | manufacturer | ✅ | InsideEVs: 11.5 kW on Luxury and Sport, 19.2 kW on Premium Luxury and Premium Sport. |
| IQ 2026 | range 748 km | manufacturer | ✅ | CarGurus.ca: "up to 748 kilometres". Carvana: "from 460 to 465 miles". |
| IQ 2027 | charge_port | nacs manufacturer | ✅ | autoevolution: "finally getting the NACS charging port for the 2027 model year". InsideEVs: "native Tesla-style NACS connector". |
| IQ 2027 | supercharger_access | yes manufacturer | ✅ | InsideEVs: "removes the need for a CCS-to-NACS adapter at Tesla Superchargers". The 2027 car is US only. |
| IQ 2027 | range 748 km | manufacturer | ⚠ | News Wheel: "advertises a driving range of 465 miles". It is a news story, not 2027-specific spec. Low-confidence flag is right. |
| IQL 2026 | charge_port | ccs1 manufacturer | ⚠ | autoevolution does not name the IQL as CCS1. It only says models of 2026 or earlier need an adapter and the IQL gets NACS in 2027. This is an inference, so the kind is borderline. Canada is assumed. |
| IQL 2026 | supercharger_access | via_adapter estimated | ⚠ market | Same as the IQ. |
| IQL 2026 | luxury, sport ac_max 11.5 | manufacturer | 🏷 | The notes say "assumed 11.5 like the 2026 IQ". Cars.com says only that 11.5 kW is standard and 19.2 kW is optional, and does not assign it to trims. Relabel as estimated, or drop. |
| IQL 2026 | range 740 km | manufacturer | ✅ | Wards: "460 miles (741 km)". CarGurus.ca: "up to 740 kilometres". |
| IQL 2027 | charge_port nacs, supercharger yes | manufacturer | ✅ | autoevolution: "The list includes the Cadillac Escalade IQ and IQL". |
| IQL 2027 | range 740 km | estimated | ❌ | The rules say never to estimate a rated range. News Wheel gives 465 miles "for the vehicle" and does not name the IQL. |

## Other checks
- Fit with existing data: nothing is on the Escalade cars yet. The values match Silverado EV Max (nmc, 800v, 204 kWh, 350 kW, 19.2 kW).
- Source quality: URLs are specific and `accessed_on` is set. `low_confidence` is on every value, as required. `src-cadillac-dc-fast-charging-support` is the existing source record in `data/sources/`.
- No unknowns: every required field is covered for both powertrains and all five variants. Gross kWh and published 10-80 time are not stated anywhere, so they are correctly absent.
- Not checked in this batch: wheels (the researcher brief says wheels are not needed in this round).
- The catalogue says CA trim names are "assumed same as US". CA trims 2025 (Luxury 1/2, Sport 1/2) are supported by Auto123. The CA 2026 trim names (Luxury, Sport, Premium Luxury, Premium Sport) are not shown on a Canadian page. Carvana covers the US.

## Required changes
1. Drop `range_km` for `cadillac/escalade-iql/2027/awd` (kind estimated is not allowed for range). Re-add as `manufacturer` only if a page states a 2027 IQL figure.
2. `cadillac/escalade-iq/205-kwh-800v` `ac_max_kw`: TechCrunch does not state 19.2 kW. Cite src-insideevs-escalade-iq-2027-nacs, or src-cars-escalade-iql-2026 for the IQL, and remove "240 V, 80 A" from the notes.
3. `cadillac/escalade-iql/2026/awd` trims luxury and sport `ac_max_kw` 11.5: relabel as `estimated`, or drop. The source does not assign 11.5 kW per trim.
4. Canada: `charge_port` (IQ 2025, IQ 2026, IQL 2026) and `supercharger_access` for CA have no Canadian source. Either find a Canadian page, or split the claim to US only and mark the CA case as an estimate with basis, or state the gap.
5. IQL 2026 `charge_port` ccs1: relabel as `estimated` (basis: GM says the 2026 and earlier models use an adapter, so are CCS1), or find a page for the IQL.
6. Usable kWh: add to the notes that Wards does not say "usable". The kind is acceptable only if the owner accepts "available energy" as usable.
7. Preconditioning remains unverifiable. The owner should know the evidence is a search excerpt, and that "if equipped" appears in Cadillac's wording.
