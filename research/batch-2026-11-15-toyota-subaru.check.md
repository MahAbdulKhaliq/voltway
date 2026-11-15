# Check: batch-2026-11-15-toyota-subaru.json

**Verdict: FIX** (3 values to drop or downgrade; the rest verified). `add-facts.ts --check`: OK, valid (84 variants, 23 sources), nothing written.

All four cited pages were readable.

## Results

| Variant | Field | Value | Result | Evidence |
|---|---|---|---|---|
| bZ standard (XLE FWD) | drivetrain | fwd | ✅ | Trim list "XLE, XLE AWD, Limited AWD"; 57.7 kWh XLE FWD. Existing data: `unknown`. |
| bZ all 5 | charge_port | nacs | ✅ | "NACS port" (bZ); Woodland "NACS port for Level 3 DC" |
| bZ all 5 | ac_max_kw | 11 kW | ✅ | "11 kW on-board AC charger" (both pages) |
| bZ all 5 | published_10_80_min | 30 min | ✅ (model-level) | "Around 30 minutes... under ideal conditions". Page is model-wide; 57.7 kWh FWD not separately stated. |
| bZ standard/awd/limited | battery.preconditioning | automatic_and_manual | ✅ | "pre-conditioning function... on all models"; manual or nav-destination automatic |
| bZ Woodland x2 | battery.preconditioning | automatic_and_manual | ✅ | Manual in settings, or automatic via nav destination. Caveat: automatic needs Drive Connect trial/subscription (add to notes). |
| C-HR standard, awd | battery.preconditioning | automatic_and_manual | ✅ | "start it manually, or... navigation destination" |
| Solterra awd | battery.preconditioning | automatic_and_manual | ✅ | "when you navigate to a charging station or driver activates" |
| bZ standard | wheels 18 in, standard | | ✅ | "XLE: 18-inch multi-spoke black/silver alloy" |
| bZ awd | wheels 18 in, standard | | ⚠ unverifiable | Page lists no wheel size for XLE AWD; batch itself says "assumed". |
| bZ limited-awd | wheels 20 in, standard | | ✅ | "Limited AWD: 20-inch black multi-spoke alloy" |
| bZ woodland-awd | wheels 18 in, standard | | ✅ (low_confidence ok) | "18-inch aluminum wheels with removable aero covers" |
| bZ woodland-awd-all-terrain-tire | wheels 18 in | | ⚠ unverifiable | Page: all-terrain option is on the Premium grade; says nothing about wheel size. Copy of base-Woodland value. |
| bZ standard/awd/limited | heat_pump standard | | ⚠ unverifiable per trim | Page lists a heat pump but names no trims. Already low_confidence; "standard" on the XLE FWD and Limited is an inference. |
| C-HR standard | wheels 18 in, standard | | ✅ | "SE has 18-inch wheels with black alloy inserts" |
| C-HR standard | drivetrain | fwd | ✅ | "SE is front-wheel drive (FWD), XSE is AWD". Existing: `unknown`. |
| C-HR all | charge_port / ac_max_kw / 10-80 | nacs / 11 kW / 30 min | ✅ | NACS; "11-kW on-board AC charger"; "about 30 minutes" |
| Solterra awd | charge_port | nacs | ✅ | "Standard NACS charging port" |
| Solterra awd | published_10_80_min | 35 min | ✅ | "About 35 minutes"; footnote says "best engineering judgement" (consider noting it is an estimate by the manufacturer; kind `manufacturer` is still right). |
| Solterra awd | supercharger_access | yes | ❌ | Footnote: "Anticipated in 2025, date to be determined." A future-tense claim, not confirmation. |

## Questions raised in the task

- **Preconditioning on all three:** both modes are supported by every page (bZ, Woodland, C-HR, Solterra). Not cabin preheating. OK.
- **bZ wheel mapping:** XLE = 18 in (verified); XLE AWD not stated (assumption); Limited AWD = 20 in (verified). Woodland 18 in (verified for the model); the all-terrain-tire variant's wheel is not stated.
- **fwd on two `standard` variants:** correct for bZ XLE FWD and C-HR SE. Both are currently `unknown` in the built data, so this is a fill, not a conflict.
- **Solterra Supercharger:** not supported as "yes" (see above).
- **10-80 as model-level:** each page states it once for the model; the batch labels it so in notes. The 57.7 kWh bZ FWD and the 77 kWh AWD get the same 30 min, which the page does not separate. Acceptable, but the notes flag it.
- **Gross kWh comparison:** no batch variant sets `capacity_gross_kwh` or `capacity_usable_kwh`, and every Toyota/Subaru 2026 built file has both as `null`. No conflict exists. For later: pages say 57.7 (bZ XLE FWD), 77 (bZ AWD/Limited, C-HR, Solterra 77.0), 74.7 (Woodland). Pages say "total capacity", so record as gross, never usable. The Woodland 74.7 differs from the bZ AWD 77 by 3.0 %, but those are different variants, not a same-variant conflict.
- **Other fit checks:** existing C-HR AWD already has trims `18-in-wheels` and `20-in-wheels` with NRCan wheel data. The batch adds no wheels for C-HR AWD, so no overlap. bZ trims use `*`, which matches the single `standard` trim each (the `awd` variant etc.).

## Required changes

1. Drop `supercharger_access` for `subaru/solterra/2026/awd`: page only says "Anticipated in 2025, date to be determined". Leave unknown, or re-source from a current Subaru Canada page that confirms access.
2. Drop `wheels` for `toyota/bz/2026/awd`: page gives no XLE AWD wheel size; it is an assumption.
3. Drop `wheels` for `toyota/bz/2026/woodland-awd-all-terrain-tire` (or confirm from a spec page): page does not say whether the option changes the wheel.
4. Heat pump on `toyota/bz/2026/standard`, `awd`, `limited-awd`: page names no trims. Drop, or keep only with `low_confidence: true` (already set) and a note that trim coverage is unconfirmed.
5. Woodland preconditioning notes: add that automatic start needs an active Drive Connect trial or subscription.

## Applied by the main session (2026-11-15)
1, 2, 3 done (values dropped). 4: kept as `low_confidence` with "trim coverage unconfirmed" note. 5 done (Drive Connect note on both Woodland variants).
