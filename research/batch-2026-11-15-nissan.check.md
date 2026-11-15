# Check: research/batch-2026-11-15-nissan.json (2026-11-15)

Saved by the main session from the `data-fact-checker` reply (the checker returned it without writing the file).

**Verdict: FIX.** All values found on the cited pages; `add-facts --check` OK.

| Variant | Field | Value | Result | Evidence |
|---|---|---|---|---|
| s-plus, sv-plus, platinum-plus | dc_max_kw | 150 kW | ✅ (model-wide) | Spinelli: "can charge at up to 150 kW" |
| s-plus, sv-plus, platinum-plus | charge_port | nacs | ✅ | Spinelli; Drive Tesla Canada |
| s-plus, sv-plus, platinum-plus | supercharger_access | yes | ✅ | Spinelli: access to Tesla Superchargers across Canada |
| s-plus, sv-plus, platinum-plus | published_10_80_min | 35 min | ✅ value, ❌ note | "(75 kWh pack)" in the note was not on the page |
| s-plus, sv-plus, platinum-plus | heat_pump | standard | ✅ (model-wide) | Drive Tesla Canada: "A standard heat pump and battery heater" |
| sv-plus | wheels | 18 in standard | ✅ | Spinelli |
| platinum-plus | wheels | 19 in standard | ✅ | Spinelli |
| all | kind | manufacturer | 🏷 questioned | Dealer/news pages relaying Nissan figures |

## Required changes and what was done
1. Reword the 10–80 % notes: **done** ("Model-wide figure; pack/trim not stated on the page").
2. `kind` on dealer/press pages: **kept `manufacturer`**, per the researcher rule 5 (figures the manufacturer states stay `manufacturer` even when a press or dealer site reports them; the source `type` is `community`).
3. Model-wide values on every trim: **kept**, already `low_confidence` with "not per trim" notes.
