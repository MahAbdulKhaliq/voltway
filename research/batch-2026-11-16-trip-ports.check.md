# Check: batch-2026-11-16-trip-ports.json

**Verdict: FIX.** `--check` passes ("batch is valid, 84 variants, 141 sources"). Nine of the 12 values stand as written. Three are weak or contradicted: the three EX30 `supercharger_access` values.

| Variant | Field | Value | Result | Evidence |
|---|---|---|---|---|
| bmw/i4/2026 edrive40 | supercharger_access | via_adapter | ✅ (low_confidence correct) | BMW Canada page: "must only use the approved Lectron Vortex Plus NACS-to-CCS DC adapter". The text names no models, only "nearly all BMW and MINI BEVs" except the original i3 and Cooper SE (F56). BMWBlog Canada (2026-04-08) names the i4 only as "We already tested this firsthand with the BMW i4 at a Tesla Supercharger." US BMWBlog lists the i4. So the i4 is covered by the general rule plus a Canadian firsthand test. |
| bmw/i4/2026 xdrive40 | charge_port | ccs1 (estimated) | ✅ basis acceptable | thinkEV states CCS1 in the eDrive40 spec table. The page gives xDrive40 and M60 only a range line. Same model, generation and year, no port change within a model year, and neither the BMW Canada nor the BMWBlog native-NACS list includes the i4. This meets rule 5. The note's claim that the page "covers the range" for the port is an overstatement. |
| bmw/i4/2026 xdrive40 | supercharger_access | via_adapter | ✅ | Same as eDrive40. |
| bmw/i4/2026 m60 | charge_port | ccs1 (estimated) | ✅ basis acceptable | Same basis. |
| bmw/i4/2026 m60 | supercharger_access | via_adapter | ✅ | Same as eDrive40. |
| volvo/ex30/2026 cross-country | charge_port | ccs1 | ✅ | Motor Illustrated: "the crossover features a CCS1 charge port." The review covers "Core, Plus, Plus AWD, Ultra, Ultra AWD and Cross Country AWD". The port is a model-level statement. Kind `manufacturer` is fine for a relayed spec. |
| volvo/ex30/2026 single-motor-extended-range | charge_port | ccs1 | ✅ | Same page, model-level statement. |
| volvo/ex30/2026 twin-performance | charge_port | ccs1 | ✅ | Same page, model-level statement. |
| volvo/ex30/2026 (all three) | supercharger_access | via_adapter | ❌ not established for Canada | The dealer page (Colorado, US) says "Add the included NACS Fast Charging Adapter and you can access 23,000+ additional DC fast chargers." That is US-only. The Volvo Canada NACS page returns 403 to us, so it is unverifiable. Canadian reports from Oct 2024 (Guide Auto, "Availability of adapters for the EX30 will be announced later") exclude the EX30, and the EX30 is Canada-sold. I found no Canadian source confirming EX30 adapter availability. The batch's own note says inclusion in Canada is not confirmed. |

## Answers to the riskiest points
1. **i4 CCS1 as `estimated`:** acceptable. A better source would be a BMW Canada or BMW US spec page for each trim stating CCS1. I found none readable. Keep it `estimated` and `low_confidence`, and correct the note: the thinkEV page states the connector only in the eDrive40 table.
2. **i4 via_adapter:** acceptable. The release does not name the i4, but it covers nearly all BMW BEVs with CCS ports. BMWBlog Canada names the i4 in a firsthand Supercharger test. Add `src-bmwblog-nacs-access-2025-12` and the BMWBlog Canada URL (https://www.bmwblog.com/2026/04/08/bmw-mini-canada-tesla-supercharger-access-shell-recharge/) as supporting sources, or note them in the field notes. Keep `low_confidence`.
3. **EX30:** the port is fine for all three trims. The Supercharger access is not well enough sourced for Canada.

## Required changes
- Drop `supercharger_access` for all three `volvo/ex30/2026/*` variants. The only readable source is a US dealer page. The only Canadian reporting found says EX30 adapter availability was "announced later", and the Volvo Canada page can't be read. Re-add it only when a Canadian Volvo page (or a Volvo Canada press release) naming the EX30 can be read. If the owner prefers to keep it, use `low_confidence`, drop `kind: manufacturer` in favour of the weaker evidence, and say in the notes that the 2024 Canadian release excluded the EX30.
- Also drop the unused source `src-volvo-ca-nacs-page` unless re-cited. Reword the notes to say "unverified, page blocked".
- Fix the thinkEV wording in both i4 estimate notes: the page states CCS1 in the eDrive40 table only; the range is given for the other trims.
- Optional: cite the BMWBlog Canada article for the i4 supercharger_access fields.

## Applied by the main session (2026-11-16)

- Dropped `supercharger_access` for all three `volvo/ex30/2026/*` variants (no readable Canadian source; the 2024 Volvo Canada release excluded the EX30). The CCS1 port alone still gives the trip planner a plug rule.
- Removed the now-unused sources `src-volvo-dealer-ex30-2026-nacs-adapter` and `src-volvo-ca-nacs-page`.
- Reworded the i4 xDrive40 / M60 `charge_port` estimate notes: thinkEV states CCS1 in the eDrive40 spec table only.
- Not done: adding the BMWBlog Canada article as an extra source (optional; the BMW Canada release stays the cited source, low confidence).
