# Fact check: batch-2026-11-16-lyriq-tesla.json

**Verdict: FIX**

`npx tsx scripts/add-facts.ts research/batch-2026-11-16-lyriq-tesla.json --check` says: OK, valid (84 variants, 20 sources after applying), nothing written. The schema is fine. The problems are sourcing and scope.

No existing values for these fields exist in `data/variants/tesla/model-3|model-y/2026/*.json` (they hold only name, drivetrain and trims), so there was nothing to compare against.

## Sources reopened

| Source | Result |
|---|---|
| src-tesla-ca-supercharging-support | ⚠ unverifiable: WebFetch returned HTTP 403. The batch itself says it relied on a search snippet only. |
| src-thechargeport-tesla-model-y | Readable. Says "The standard heat pump helps but does not eliminate the cold-weather hit." Describes the **2027** Model Y (six trims, Standard RWD to L Premium). No per-trim or 2026 statement. |
| src-thinkev-tesla-model-3-2026 | Readable. "10-80% Time" = 25 min, next to 75 kWh NMC, 250 kW, NACS, 510 HP. No trim is named for that spec block. |

## Per-value table

| Variant | Field | Value | Result | Evidence |
|---|---|---|---|---|
| model-3 performance-awd, performance, premium-awd-i, premium-i | supercharger_access | yes (manufacturer) | ⚠ unverifiable | Tesla page 403. "Model 3 has a native NACS port" is not on the cited page and has no source in the batch. thinkEV does list "NACS" as the connector, but is not cited for this field. |
| model-3 performance-awd, performance | published_10_80_min | 25 min (community) | ⚠ weak, not mismatch | The page does say 10-80% = 25 min, but with no trim. The page also says Performance is the only orderable trim and lists Premium RWD and Premium AWD as separate trims. The Performance match is inference. It is low_confidence and the note says so. |
| model-y long-range-awd-b-pre-6-11-25, long-range-awd-b, long-range-awd-i, performance-b, premium-awd-b, rwd-b, standard-b | supercharger_access | yes (manufacturer) | ⚠ unverifiable | Tesla page 403. "Model Y has a native NACS port" comes from thechargeport ("Every Model Y uses a native NACS port"), which is a different, community source. |
| model-y (same 7 variants) | heat_pump (trims "*") | standard (community) | ⚠ weak | Only a passing "standard heat pump" phrase, on a US-oriented, 2027-model-year page. Nothing for 2026 or Canada, and nothing per trim. The Canadian Model Y trims here carry -B/-I suffixes (battery or market variants) and the page does not distinguish them. |

## Required changes

1. **Tesla Canada supercharging page cannot be verified.** Either re-source `supercharger_access` from a page that can be read (a Tesla Canada Model 3 or Model Y page, or the NRCan/OpenEV Data record) and say what it states, or drop these 11 `supercharger_access` entries. If kept, `kind: "manufacturer"` is not justified when the claim ("native NACS port") is not on the cited page. Use `community` with the thechargeport or thinkEV source, or find a Tesla page that states it.
2. **Fix the source notes.** `src-tesla-ca-supercharging-support` should keep its "via search result only" note, but the per-variant notes must not claim the page says Model 3/Y has a native NACS port.
3. **`published_10_80_min` on Model 3.** Apply it to `performance` only if the owner accepts the inference. Mark `performance-awd` and `performance` consistently (both are the same car under different names, so confirm only one is live, otherwise the same figure is recorded twice). Keep low_confidence and make the note state "trim not named by source".
4. **`heat_pump` for Model Y.** Note that the source describes the 2027 model year. Either find a 2026 or Canada-specific source (Tesla Canada Model Y page, or a Canadian owner's manual), or keep it as low_confidence with a note saying "2027 US-oriented page, 2026 assumed unchanged". Consider limiting it to variants where that assumption is plausible, and do not put the heat pump claim on `-I` or `pre-6-11-25` variants without a source.
5. No units or gross/usable issues found. `accessed_on` is set (2026-11-15) and the URLs are specific.
