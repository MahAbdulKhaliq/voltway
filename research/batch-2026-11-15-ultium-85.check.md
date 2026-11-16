# Check: research/batch-2026-11-15-ultium-85.json

**Verdict: FIX.** The `--check` validity run passes (84 variants, 69 sources). The curve is the main problem: three of its seven points are not in the cited article. The three `borrowed-equinox-fwd-2026` curves inherit that and must go with it. Most of the scalar fields hold up.

## Table

| Variant | Field / curve | Value | Result | Evidence |
|---|---|---|---|---|
| equinox standard | curve `evchargingstations-2024` | 7 points | ❌ mismatch | See the curve section. The article has no 10-80 run and no 35 % / 125 kW point. |
| equinox standard | pt 0 % | 132 kW | ✅ | "350 kW start: 132 kW (496 A at 267 V)", 0-100 run |
| equinox standard | pt 7 % | 150 kW | ✅ | "150 kW at 7% SOC ... 498 A at 301 V", 0-100 run |
| equinox standard | pt 18 % | 154 kW | ✅ | "350 kW at 18% SOC: 154 kW", the session peak |
| equinox standard | pt 35 % | 125 kW | ❌ | Not in the article. The same run has 25 % = 75 kW and 29 % = 63 kW. |
| equinox standard | pt 60 % | 70 kW | ⚠ approximate | The 20-80 run says "less than 70 kW" at about 55-65 %. The 0-100 run was already at 63 kW by 29 %. |
| equinox standard | pt 80 % | 72 kW | ✅ | "Power at 80% SOC: 72 kW on both", 20-80 run |
| equinox standard | pt 100 % | 20 kW | ✅ | "below 20 kW" at 100 %. It is a ceiling, so ~19 kW is more honest. |
| equinox standard | `battery.chemistry` | nmc, manufacturer | 🏷 unproven | The page says NCMA and covers 2024-2025 only. It does not say GM states it. |
| equinox awd | `battery.chemistry` | nmc, manufacturer | 🏷 unproven | Same page and same issue. |
| equinox standard | `battery.preconditioning` | automatic_and_manual | ⚠ unverifiable | The quick-start guides are blocked. Only search summaries were seen. |
| equinox awd | `battery.preconditioning` | automatic_and_manual | ⚠ unverifiable | Same as above. |
| equinox awd | curve `borrowed-equinox-fwd-2026` | copy of the FWD points | ❌ | Same pack, 400 V and 150 kW peak hold. The sibling curve is not a faithful measured curve, so the borrow fails. |
| blazer standard | `dc_max_kw` | 150 kW | ✅ | "LT and RS trims feature an 85 kWh battery with up to 150 kW DC", Jim Ellis. EVCS says "maximum charging power of an 85-kWh battery is 150 kW". The Coughlin sticker says "Up to 150 kW DC fast-charging capable". |
| blazer standard | `capacity_usable_kwh` | 80, estimated | ⚠ weak basis | No page gives it. The pack is the same as the Equinox (Weekly Driver lists both). The rule asks for same motors too, and that is unproven. |
| blazer standard | `nominal_voltage_class` | 400v, estimated | ✅ | Weekly Driver says 336 V for the 85 kWh pack, which is 400 V class. |
| blazer standard | `battery.preconditioning` | automatic_and_manual | ⚠ unverifiable | Blocked page. The source URL looks wrong (see required changes). |
| blazer standard | `ac_max_kw` | 11.5, estimated | ✅ with better source | The EVCS 2027 article says "onboard charger of 11.5-kW" for LT/RS in FWD and AWD. That covers the FWD, so cite it instead of the RS AWD sticker. A search found no 19.2 kW Blazer onboard option. |
| blazer standard | `charge_port` | ccs1, manufacturer | ✅ (indirect) | "previous model years, which relied on the CCS1 charging port"; "outgoing 2026 model year". It does not literally say "2026 has CCS1". The sentence "unchanged compared to the 2026 model year" supports the inference. |
| blazer standard | curve `borrowed-equinox-fwd-2026` | copy of the FWD points | ❌ | The sibling curve fails (see below). Variant data otherwise fits: 85 kWh gross, 400 V, nmc, 150 kW once applied. Usable is unknown until the batch's own 80 is applied. |
| blazer lt-rs-awd | `dc_max_kw` | 150 kW | ✅ | Coughlin RS AWD sticker: "Up to 150 kW DC fast-charging capable". |
| blazer lt-rs-awd | `battery.preconditioning` | automatic_and_manual | ⚠ unverifiable | Blocked page. |
| blazer lt-rs-awd | curve `borrowed-equinox-fwd-2026` | copy of the FWD points | ❌ | The sibling curve fails. The variant also currently holds gross 102, usable 97 and dc_max 195 (OpenEV), none of which the batch fixes. |
| blazer ss-awd | `battery.preconditioning` | automatic_and_manual | ⚠ unverifiable | Blocked page. |

## Riskiest points

**1. Blended Equinox curve.**
- The article reports a 0-100 run (350 kW and 150 kW chargers) and a 20-80 run. It has no 10-80 run. A search for "10-80", "125" and "35%" found nothing.
- The 35 % / 125 kW point has no basis. The 0-100 run actually shows 154 kW at 18 %, 75 kW at 25 % and 63 kW at 29 %. The 20-80 run held over 150 kW until about 55 %, then fell below 70 kW.
- The batch's own notes admit the runs disagree and call the result a blend. That is not a faithful `tested` record, so reject the blend. Use one run only.
- The most defensible option is the 0-100 run on the 350 kW charger: (0, 132), (7, 150), (18, 154), (25, 75), (29, 63), (100, about 19), with `charger_kw` 350. The gap from 29 % to 100 % is large, and the "falls from roughly 80-90 kW after 75-80 %" text is vague.
- The alternative is the 20-80 run: about 20 % at 150 kW (it held 150+ and peaked at 157), about 60 % at under 70 kW, and 80 % at 72 kW. That gives only 3-4 points.
- Either way, keep `low_confidence`. The article gives no ambient temperature or preconditioning state, so `preconditioned` stays unknown. If neither single run gives enough points, drop the curve.

**2. Borrowed curves.**
- The Blazer 85 kWh match is shown by third-party pages only. Weekly Driver lists the Blazer LT and RS (85 kWh) on the same 10-module pack and says 150 kW peak. EVCS gives 85 kWh and 150 kW for LT/RS. The dealer page and the sticker give the same.
- Against the repo data the match is not proven. The Blazer `standard` variant has no usable kWh until the batch applies its own estimate of 80. `lt-rs-awd` holds 102 gross and 97 usable, against the Equinox's 85 and 80.
- The borrow is therefore contradicted by the stored data until `lt-rs-awd` is corrected.
- Equinox AWD vs FWD matches on gross 85, usable 80, 400 V and 150 kW peak. The motors differ (the rule asks for same motors). The AWD trim 1 also has an optional 19.2 kW AC charger, which does not affect DC.
- Keep the Equinox AWD borrow only if the FWD curve is replaced by a valid single-run curve. The sibling curve is not measured until then.

**3. Blazer DC 150 kW vs stored 190/195 kW.**
- The evidence supports 150 kW for the 85 kWh LT and RS.
- 190 kW is the 102 kWh SS. The dealer page says "SS trim upgrades to a 102 kWh battery with up to 190 kW", and EVCS says the same.
- The thinkEV 190 kW on `standard` is wrong.
- OpenEV's 102 / 97 / 195 on `lt-rs-awd` is a wrong match to the SS pack. The same variant carries 85 kWh from thinkEV, and the sources show LT and RS use the 85 kWh pack.
- The batch fixes `dc_max_kw` but leaves capacity_gross 102 and usable 97 on `lt-rs-awd`. That is inconsistent.
- The batch should add `capacity_gross_kwh` 85 (Coughlin sticker, "85 kWh Battery rated energy") and `capacity_usable_kwh` 80 (estimated, as for `standard`) for `lt-rs-awd`. Or the owner should fix the crosswalk. I did not touch the crosswalk.

**4. Blazer estimates.**
- Usable 80 is acceptable as an estimate with the pack-sibling basis. The strict rule also wants the same motors, and nothing checks that. Keep it `low_confidence`.
- Voltage 400v is fine.
- AC 11.5 kW holds. Cite the EVCS article, which says 11.5 kW for FWD and AWD LT/RS, rather than a single RS AWD sticker. That also lets the kind be `manufacturer`, since it relays the GM figure. Keep `estimated` if you stay with the Coughlin source.
- Port ccs1 from the 2027 article is acceptable (see the table).

**5. Preconditioning sources.**
- The chevrolet.com and chevrolet.ca pages stayed blocked. Search summaries repeat the same two facts. Navigation: "if you are using the built-in Google maps ... preconditioning will begin automatically". Manual: "tap the Settings menu ... select the Fast Charge Prep option".
- AutoTrader's 2024 Blazer EV first-drive review (https://www.autotrader.ca/editorial/20231213/2024-chevrolet-blazer-ev-first-drive-review-and-video) is a possible readable second source for the navigation trigger. I did not fetch it.
- Search results also show Chevrolet.ca pages for "DC fast charging" and the in-vehicle charging app. These are not readable by me either.
- The batch's Blazer URL `/support/blazer-ev-quick-start-guides/navigation` does not match the URL surfaced by search, `/support/quick-start-guides/blazer-ev/navigation`. Correct it or re-verify it.
- Because both halves (auto and manual) come from two pages, a combined value belongs under `estimated` with both pages named, unless one page states both. Today's `manufacturer` labelling is not proven.
- Mark these values unverifiable until someone can read the pages.

**6. Chemistry nmc via Weekly Driver.**
- The page says NCMA for the 85 kWh pack and lists the Equinox EV and Blazer EV LT/RS for 2024-2025 only (not 2026).
- The page is a spec site that gives no GM citation. Whether GM states NCMA is not shown. `manufacturer` is allowed only if the figure is a manufacturer statement relayed by the site, and that is not demonstrated here.
- Either find a GM source for the cell chemistry or relabel as `estimated`, with the 2024-2025 same-pack basis noted. Keep `low_confidence`.
- The thinkEV Blazer data already has `nmc` as manufacturer, which is consistent.

## Required changes

1. **Curve `evchargingstations-2024` (Equinox standard):** drop the blended curve. The 35 % / 125 kW point and the 10-80 run are not in the article. Replace it with a single-run curve (see point 1 above) or remove it.
2. **Curves `borrowed-equinox-fwd-2026` (Equinox AWD, Blazer standard, Blazer lt-rs-awd):** drop until the sibling is a valid measured curve. Then re-add with an unchanged `source_id`.
3. **Blazer lt-rs-awd:** add `capacity_gross_kwh` 85 and `capacity_usable_kwh` 80. The stored 102 / 97 / 195 are the SS pack. This is a precondition for any borrow.
4. **Blazer standard `dc_max_kw`:** keep 150 (verified). Remove the claim that the batch's own page says "same wording" for the 2027 article, which says 85 kWh peak 150 kW. Citations are fine as is.
5. **Blazer standard `ac_max_kw`:** re-cite to the EVCS 2027 article (11.5 kW, LT/RS FWD or AWD), or keep `estimated` with the RS AWD sticker.
6. **Chemistry (Equinox standard, awd):** relabel `estimated`, or cite a GM page. Do not leave `manufacturer` on a spec-site relay with no GM statement.
7. **Preconditioning (all five variants):** fix the Blazer nav URL. Label as `estimated` with both pages named, or mark as unverifiable until the pages are read. Do not describe the pages as read; they were seen only in search summaries.
8. **`charge_port` ccs1 (Blazer standard):** acceptable. Optionally quote "previous model years, which relied on the CCS1 charging port" in the notes, since the article does not name the 2026 model directly.

## Applied by the main session (2026-11-15)
Done:
- Dropped the blended Equinox curve `evchargingstations-2024`, because it mixed runs and included a point that isn't in the article. A single-run replacement wasn't used: the 0–100 run derated early and jumps from 29 % to 100 %, and the 20–80 run has only 3–4 points. The three `borrowed-equinox-fwd-2026` curves were dropped with it.
- Dropped preconditioning on all five variants: the GM pages were never read (only search summaries), so there is no readable source. Next time, try the AutoTrader.ca 2024 Blazer EV review.
- Chemistry relabelled `estimated`, with its basis (spec site, NCMA → nmc).
- Kept Blazer DC 150 kW (lt-rs-awd, standard), usable 80 (estimated), 400v (estimated), AC 11.5 kW (estimated from the RS AWD sticker), and port ccs1.
Not done:
- Gross 85 / usable 80 for `lt-rs-awd` were not added. Its OpenEV match (102/97 kWh, 195 kW) is the SS pack, so the right fix is a crosswalk change, which is an owner decision (B8/B9). Raised with the owner.
