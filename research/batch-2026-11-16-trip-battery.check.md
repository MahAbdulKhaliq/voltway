# Check: research/batch-2026-11-16-trip-battery.json

**Verdict: FIX.** The `--check` run is valid (OK, 84 variants, 138 sources). Seven of the 13 values are verified, the Silverado estimates are judgment calls, and one value should be dropped (bZ `dc_max_kw`).

| Variant | Field | Value | Result | Evidence |
|---|---|---|---|---|
| leaf s-plus / sv-plus / platinum-plus | `capacity_usable_kwh` (x3) | 75.1 kWh, manufacturer | ✅ verified | Global kit table labels the rows "Usable capacity": 52.9 kWh for the 52 kWh pack, 75.1 kWh for the 75 kWh pack. The US kit says "new 75-kWh ... pack paired with a 214-horsepower electric motor" and lists 75 kWh for S+/SV+/Platinum+. 214 hp = 160 kW matches the global 75.1 kWh / 160 kW column. NRCan ranges on the cars (488/463/417 km) fit the large pack. The global page is not Canada-specific, so `low_confidence` is right. |
| silverado wt-std-range | `dc_max_kw` | 220 kW, manufacturer | ✅ verified | I read the GM PDF with pdftotext. Charging table: "4WT STANDARD RANGE: 475 volt, up to 220 kW"; 5WT Extended "670 volt, up to 300 kW"; 8WT Maximum "800 volt, up to 350 KW". Feature text: "DC FAST CHARGING 475V up to 220kW on 4WT (14MOD)". It belongs to Standard Range. |
| silverado wt-std-range | `nominal_voltage_class` | 400v, manufacturer | ✅ verified (with a caveat) | The PDF says "475 volt" for the Standard pack. The "475 V" is a charging voltage and the 400v/800v class rule isn't in the repo, so the mapping to 400v is a judgment. It is reasonable: 800 V × 14/24 ≈ 467 V, so 14 modules in series give about 475 V. The PDF does not call it a "nominal" voltage. Keep it, but state the mapping in the notes. |
| silverado wt-std-range | `capacity_usable_kwh` | 119 kWh, estimated | ⚠ basis is borderline | The GM PDF gives module counts (4WT 14, 5WT 20, 8WT 24) and no kWh. InsideEVs: "Reported Usable Capacity 204 kWh", "Total Module Count 24" (RST 2024). 204 × 14/24 = 119.0. The basis is a different (smaller) pack, which the checker rule (5) normally rejects. It is still sound by module scaling: 800 V × 14/24 ≈ 475 V, and the 213.7 kWh calculated pack × 14/24 = 124.7 kWh, which matches the "125 nominal" the batch cites. Nothing in the PDF shows modules are the same 8S3P type in every pack. The third-party "119 usable" corroboration was not opened (search results only). Keep as `estimated`, `low_confidence`, with the owner's explicit OK, or drop. |
| silverado lt-std-range | `capacity_usable_kwh` | 119 kWh, estimated | ⚠ borderline | The same module-scaling basis as WT. The PDF covers WT only. The claim that the LT Standard Range shares the pack rests on the 283 vs 286 mi EPA ranges, and no cited page says so. Plausible (same model, same generation). Same recommendation as WT. |
| silverado lt-std-range | `dc_max_kw` | 220 kW, estimated | ⚠ acceptable | The GM page states 220 kW for the Standard Range pack on WT. LT is the same model and generation with a presumed identical pack and charger. The notes give the basis. |
| silverado lt-std-range | `nominal_voltage_class` | 400v, estimated | ⚠ acceptable | Same basis as LT `dc_max_kw`. |
| toyota bz 2026 standard | `dc_max_kw` | 150 kW, estimated | ❌ weak, recommend drop | The InsideEVs article says the bZ "is still capped at 150 kilowatts" at model level. The chief engineer (Daisuke Ido) does not say that. He only says that faster charging "we have to upgrade to an 800-volt system", so the notes misattribute the cap to him. The article never mentions the 57.7 or 74.7 kWh packs and says only that the AWD went from 100 to 150 kW for 2024. Nothing states the figure for the 57.7 kWh FWD pack. Toyota Canada says only "10-80% in around 30 min". The supporting EVKX page is a model, not a measurement. |

## Required changes

1. **Drop `dc_max_kw` for `toyota/bz/2026/standard`.** The source speaks at model level only, never names the 57.7 kWh pack, and the cited engineer quote is not about a 150 kW cap. A different pack is not an allowed estimate basis. If the owner wants a model-level cap anyway, the note must remove the chief-engineer claim and quote "still capped at 150 kilowatts" instead.
2. **Silverado Standard Range `capacity_usable_kwh` (WT and LT):** the owner must decide. The estimate is scaled from a different pack, so it is technically outside the rule. It is numerically well supported by the 14/24 module scaling. If kept, say in the notes that the GM PDF does not state kWh, and drop the "third-party tables" claim because it was not seen on a readable page.
3. **Silverado `nominal_voltage_class` WT:** add the sentence "475 V is the max charge voltage; mapped to 400v class". Otherwise it is fine.
4. **LT std notes:** the LT sharing the pack is unsourced. Say so plainly (it is inferred) rather than "is sold with the same Standard Range battery".
5. **Nissan:** no change. Optional: add the US source id to the notes for the Canadian-equals-US assumption, as already done in the text.

## The researcher's suspicion about other Silverado variants

The suspicion is correct for the 170 kWh Extended Range figures, and for the existing std-range notes that cited "gross 119".

- InsideEVs gives 204 kWh as usable and 213.7 kWh as calculated total. 204 × 20/24 = 170.0 exactly, so the 170 kWh Extended figure stored as `capacity_gross_kwh` (wt-ext, lt-ext, trail-boss-ext) is a usable-scale figure. The same logic applies to 119 (usable-scale). The calculated gross for 20 modules would be about 178 kWh and for 14 modules about 125 kWh.
- Those fields' own notes say "bare capacity, treated as gross", which breaks rule 3 (bare capacity must not be called usable) in the other direction. Clearing `capacity_gross_kwh` and storing 170 as estimated usable, or leaving it with a clearer label, is for a later batch, since the `src-insideevs-silverado-test` page was not checked here.
- Also, wt-max-range already holds usable 204, which fits.
- Existing 350 kW and 800v on wt-ext-range, lt-ext-range and trail-boss-ext-range **contradict the GM PDF**, which gives the Extended Range 670 V / up to 300 kW. They need correction too, but not by this batch. The batch corrects only the Standard Range.

Files: `G:\Work\EV Charging App\.claude\worktrees\strange-chaplygin-2c29dd\research\batch-2026-11-16-trip-battery.check.md`

## Applied by the main session (2026-11-16)

- Dropped `dc_max_kw` 150 for `toyota/bz/2026/standard` (unproven for the 57.7 kWh pack; standing call: drop unproven estimates). The bZ standard stays unplannable.
- Silverado Standard Range usable 119 kWh (WT, LT): **kept as `estimated`, low confidence, flagged for the owner** in the PR body. The PR is the owner's decision point; drop it there if the cross-pack module scaling is not acceptable. Removed the unseen "third-party tables" claim from the notes.
- WT voltage note now says 475 V is the max charge voltage, mapped to the 400v class.
- LT notes now say the shared pack is inferred.
- Nissan: no change.
- Not done here: the Extended Range Silverado variants (170 kWh stored as gross looks like usable; 350 kW / 800v contradicts GM's 300 kW / 670 V). Out of this batch's scope; listed as a follow-up in the PR.
