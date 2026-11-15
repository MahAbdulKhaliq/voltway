# Check: batch-2026-11-15-precondition-wheels.json

**Verdict: FIX.** The batch passes `add-facts.ts --check` (84 variants, 26 sources, nothing written). Several values claim more than their pages say. The GM adapter values and the two Model Y wheel entries hold up (with caveats).

## Results

| Variant(s) | Field | Value | Result | Evidence |
|---|---|---|---|---|
| kia/ev6/2025 light, wind, land-awd | battery.preconditioning | automatic_and_manual | ❌ (overclaims; each citation supports only half) | Kia UK: EV3/EV6/EV9 "manually activate battery pre-conditioning" via infotainment/app (manual half OK, UK market). The Kia manual page names no model: "set a DC charging station as a destination or waypoint", plus an on/off switch, "only … equipped with the battery heater". Neither cited source supports the full value for the EV6 in Canada. |
| kia/ev9/2026 light, wind, land-awd, land-awd-gt-line, gt | battery.preconditioning | automatic_and_manual | ❌ (same, weaker) | ManualsLib 2024 EV9 p.22: DC-charger destination "reduce the charging time by raising the battery temperature". The page has no manual on/off (the checker's fetch found none; page 21 "EV Settings" may). The manual half rests on the UK page (UK market, EV9 named). The model year is 2024, not 2026. The page says the mode needs a battery heater, and no trim-level check was made. |
| tesla (all 11 variants: model-3 x4, model-y x7) | battery.preconditioning | automatic_with_navigation | ❌ (claims more than the page) | Article: "selecting a Supercharger as your destination". It describes no manual control, and it names no model for navigation preconditioning. Its only model statement is about Supercharger pre-heating on "Standard Range, Rear-Wheel Drive" cars, which is a different feature. |
| chevrolet blazer-ev x3, equinox-ev x2, silverado-ev x7; cadillac lyriq x3 | supercharger_access | via_adapter | ✅ (with caveats) | Guide Auto, 18 Sep 2024, names Blazer EV, Equinox EV, Silverado EV and "Cadillac Lyriq". Canada: "$310 at their local GM dealer". The article is 2024 and says nothing about 2026 trims or port changes. A trade article carries the manufacturer's announcement, so `kind: manufacturer` is acceptable but borderline. The source `type: community` is odd for a news article. |
| chevrolet/blazer-ev/2026/ss-awd, trim standard | wheels 22 in, is_standard true | ❌ (is_standard unsupported) / ⚠ (market) | iSeeCars: SS 22.0 in, "AWD SS" only. The page says nothing on standard vs optional. It is a US listing, not a Canadian page. It is a US-market auto-listing aggregator, not the manufacturer. |
| tesla/model-y/2026/performance-b, trim standard | wheels 21 in, std | ✅ (mapping assumed) | tslna: Performance "21-inch Arachnid 2.0" standard, none optional. Canadian page. |
| tesla/model-y/2026/premium-awd-b, trim standard | wheels 19 in std; 20 in optional | ✅ (mapping assumed) | tslna: Premium AWD 19 in standard, "20-inch, +$2,600". Exactly one standard size. |

## Notes on the points raised

- **Kia, market.** A UK article is weak evidence for a Canadian car. A software feature may be similar, but a UK page doesn't prove it. The model year also differs (2024 manual used for a 2026 car). The batch notes admit this. The generic manual page names no model, so it can't back an EV6 value. Each entry repeats the value `automatic_and_manual` as if that source alone proved it, which is misleading. Evidence is split across sources and the combination is inferred, not stated by either page.
- **Tesla, silence.** The value `automatic_with_navigation` is mutually exclusive in the schema with `automatic_and_manual`. Recording it says "no manual control". The page is silent, and Tesla cars can do manual preconditioning in some software versions. So the value asserts more than the source supports. The article is also not the manufacturer, so `kind: manufacturer` is questionable. The batch notes say "page is silent", but the stored value does not carry that. The article also says nothing about the Model 3 or about any specific variant.
- **GM.** Each of the four models is named in the article, so the 14 variants are covered at the model level. This is model-level evidence, and all 2026 trims are assumed the same. The batch carries `low_confidence` and a note, which is adequate.
- **Blazer SS.** The page shows the SS has 22 in, but does not say it is the only or the standard size. The sizes are for US trims. The existing variant file has one trim ("SS AWD") with no wheels, so adding a single standard size would be consistent if sourced. There are no Canadian sources.
- **Model Y.** The mapping of "Performance" to `performance-b` and "Premium AWD" to `premium-awd-b` is assumed from names (the batch says so). tslna says it was not checked against the Tesla configurator. Each trim has one standard size. This is acceptable as low confidence.
- **Fit with existing data.** No existing preconditioning, wheels or conflicting supercharger_access values on the files checked (Model Y variants already have `supercharger_access: yes`, which is a different state from the GM ones). No conflicts over 5 %.

## Required changes

1. Kia EV6 (3 variants) and EV9 (5 variants): either drop `battery.preconditioning`, or record a value each page actually supports. For example, do not assert `automatic_and_manual` from two sources that each only show half. If kept, state in the notes that the combination is inferred, keep `low_confidence`, and consider `kind: manufacturer` only for pages the manufacturer wrote for this model. Better: find a Canadian kia.ca or EV6/EV9 owner's manual page naming the model that shows both the navigation trigger and the manual switch.
2. Tesla (all 11 variants): drop `battery.preconditioning` unless a page shows both the navigation trigger and whether manual control exists (the Tesla owner's manual for Model 3/Y would settle it). Do not store `automatic_with_navigation` on the strength of a page that is silent on manual control. If kept at all, change the kind to `community` and name the model.
3. Blazer SS `trims.standard.wheels`: drop it, or support `is_standard: true` and the Canadian trim from a Canadian GM or Chevrolet page. The iSeeCars US page does not state standard vs optional.
4. GM supercharger_access: optional, change source `type` from `community` to something like `news` if the schema allows it, and keep the 2024 date in the notes.
5. Model Y wheels (`performance-b`, `premium-awd-b`): keep; the "assumed mapping" note must stay.

Unverifiable items: none. All seven pages loaded. The Kia manual manual-switch wording for the EV9 could not be confirmed from page 22 (the page showed no switch text); that page is therefore not a source for the manual half.

## Applied by the main session (2026-11-15)
1, 2, 3 done (Kia and Tesla preconditioning and Blazer SS wheels dropped). 4 not done (no news source type in the schema; press is `community`). 5 kept.
