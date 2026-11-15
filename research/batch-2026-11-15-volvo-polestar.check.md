# Check: batch-2026-11-15-volvo-polestar.json

**Verdict: FIX** (check script: valid. All page quotes found, but two mapping problems and one labelling issue.)

| Variant | Field | Value | Result | Evidence |
|---|---|---|---|---|
| volvo/ex40/2026/standard | charge_port | ccs1 | ⚠ weak | Page: "CCS stations that the EX40 natively uses". Says CCS only, not CCS1. Inferring CCS1 for Canada is reasonable, but not stated. |
| volvo/ex40/2026/standard | supercharger_access | via_adapter | ✅ | "gives EX40 owners access to over 18,000 Tesla Supercharger stations" |
| volvo/ex40/2026/standard | published_10_80_min | 28 min | ❌ trim mismatch | "up to 200 kW" and "approximately 28 minutes". Existing data has dc_max 150 kW for this variant (OpenEV). 200 kW / 28 min can't be assumed for it. |
| volvo/ex40/2026/twin | charge_port | ccs1 | ⚠ same as above | CCS only |
| volvo/ex40/2026/twin | supercharger_access | via_adapter | ✅ | same quote |
| volvo/ex40/2026/twin | published_10_80_min | 28 min | ✅ plausible | Page is model-wide; existing dc_max 150/205 kW (mixed sources). Fits the Twin better. |
| volvo/ex30/2026/single-motor-extended-range | published_10_80_min | 26 min (community) | ⚠ mapping inferred | "10-80% charge takes about 26 minutes at a compatible station"; "base Single Motor... 440 km range". Page never says "Extended Range". |
| volvo/ex30/2026/twin-performance | published_10_80_min | 26 min (community) | ✅ | "Twin Motor Performance at $55,950"; page states 153 kW, 69 kWh, and the 26 min is not split by trim. Existing dc_max 153 kW matches. |
| polestar/polestar-2/2025/single-motor | supercharger_access | via_adapter | ✅ | "Polestar 2... vehicles are compatible with the NACS adapter" |
| polestar/polestar-2/2025/dual-motor | supercharger_access | via_adapter | ✅ | same |
| polestar/polestar-2/2025/dual-motor-performance-pack | supercharger_access | via_adapter | ✅ | same |

## Your specific questions
- **EX40, one dealer article for port, Supercharger and 10-80%:** The page says all three, but it is a dealer blog (type `community` fits; `manufacturer` kind does not fit a dealer's own article). Kind should be `community` for all EX40 values, or the values should be re-sourced to Volvo Canada. The `low_confidence` flags and notes are fine. The 28 min is tied to "up to 200 kW", but our Standard EX40 has 150 kW in existing data, so applying it to Standard is unsupported.
- **EX30 26 min mapping:** The article covers "Single Motor" (440 km) and "Twin Motor Performance" (400 km) at one 69 kWh battery and 153 kW. Twin Performance is a direct match. Single Motor -> `single-motor-extended-range` is the only single-motor variant in our data (Cross Country is correctly excluded), so the mapping is the best available, but it is an inference; the notes should say so. Ours carries 153 kW from OpenEV (another source says 148), consistent with the article.
- **Polestar 2 via_adapter:** Supported by the Polestar Canada page. The page lists no model years or trims (it only says "Polestar 2"), so applying it to all three 2025 variants is a reasonable reading, but 2025 is not confirmed on the page. Kind `manufacturer` and `type: oem` are correct, and no `low_confidence` flag is set despite this: acceptable, but a note on the missing years would help.

## Required changes
1. Drop `published_10_80_min` for `volvo/ex40/2026/standard` (page says 200 kW; existing data says this trim is 150 kW), or keep it only if Volvo Canada confirms 28 min for this trim.
2. Change `kind` from `manufacturer` to `community` for all EX40 values (charge_port, supercharger_access, published_10_80_min) sourced from the dealer article, or replace the source with a Volvo Canada page.
3. EX40 `charge_port`: page says only "CCS". Either source a page saying CCS1 / Combo 1, or add a note that CCS1 is inferred from the North American market.
4. EX30 `single-motor-extended-range`: add a note that the article says "Single Motor" and not "Extended Range" (mapping inferred from the only single-motor variant). Keep `low_confidence`.
5. Polestar notes: say that the page names the Polestar 2 without model years.
6. Preconditioning and wheels: batch makes no claims about them (sources are silent), so nothing to check.

## Applied by the main session (2026-11-15)
1 done (EX40 standard 10–80 % dropped). 2 not done (researcher rule 5: manufacturer figures relayed by a dealer page stay `manufacturer`, source type `community`). 3, 4, 5 done (notes added).
