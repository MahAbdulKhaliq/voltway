# Check: batch-2026-11-15-ford.json

**Verdict: FIX**

`add-facts.ts --check`: OK (84 variants, 23 sources after applying; nothing written). No existing heat_pump or wheels values on these variants, so there is nothing to compare for fit.

| Variant | Field | Value | Result | Evidence |
|---|---|---|---|---|
| mach-e 2026 gt | heat_pump | standard | ✅ | GT page: "Vapor Injection Heat Pump" listed above Optional |
| mach-e 2026 gt | wheels 20 in std, 245/45R20 | standard | ✅ | "20" Monochromatic High-Gloss Black-Painted", 245/45R20 all-season |
| mach-e 2026 gt | wheels 20 in optional, 245/45R20 | optional | ✅ | Optional "20" Machined-Face ... Carbonized Grey" with summer tires |
| mach-e 2026 rally | heat_pump | standard | ✅ | Rally page: "Vapor Injection Heat Pump" under Handling |
| mach-e 2026 rally | wheels 19 in std, 235/55R19 | standard | ✅ | "235/55R19 Michelin CrossClimate2" |
| mach-e 2026 rally | wheels 19 in optional | optional | ✅ | Optional "19" High-Gloss Oxford White"; no tire size listed |
| mach-e 2026 standard-range | heat_pump | standard | ⚠ unverifiable | Premium page says standard; page does not say Select has it. Variant-to-trim mapping unconfirmed |
| mach-e 2026 standard-range-awd | heat_pump | standard | ⚠ unverifiable | Same as above |
| mach-e 2026 extended-range | heat_pump | standard | ⚠ unverifiable | Same as above |
| mach-e 2026 extended-range-awd | heat_pump | standard | ⚠ unverifiable | Same as above |
| f-150-lightning 2025 platinum | wheels 22 in optional | optional | ⚠ unverifiable (market) | Quote: "comes with 22-inch black painted wheels" (Dark Elements, $1,000). Article never names a market (dollar prices only); no Canadian source |

Source notes:
- Premium page (cited for the four variants): confirms "Vapor Injection Heat Pump" and 73/88 kWh packs. It mentions Select only in a range footnote, and says nothing about Select's heat pump. The page text was truncated, so more may exist.
- Rally URL has no trailing slash; it loads fine.
- Kinds (`manufacturer`) are right for the OEM pages. The InsideEVs source is typed `community`; it is really press (US), but the low_confidence flag and note are present.
- accessed_on is set on every source.

## Required changes
1. Drop `heat_pump` for `standard-range`, `standard-range-awd`, `extended-range` and `extended-range-awd`. The Premium page does not show it for Select, and the batch admits the mapping is unconfirmed. Re-add only after reading the Ford Canada Select page (and confirming which trim each variant maps to). If kept as is, they stay low_confidence and unverifiable, which is not enough to import.
2. Lightning Platinum 22 in optional: drop, or re-source from the Ford Canada F-150 Lightning page or Canadian build-and-price. The cited article is not shown to be Canadian, and Canadian Dark Elements availability is not confirmed. If kept, mark the market clearly in the note (US press article) and keep low_confidence.
3. Optional: add the standard Platinum wheel size (not found) when a Canadian source is read. Not required.
4. GT and Rally wheels, and GT/Rally heat pumps: no changes needed.

## Applied by the main session (2026-11-15)
1 done (four Mach-E heat pumps dropped). 2 done (Lightning Platinum 22 in optional dropped: an optional-only list would also become the trim's baseline wheel on the Charging tab). 3 left for a later lookup.
