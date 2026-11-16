# Check: research/batch-2026-11-16-hw-toyota-nissan.json

**Verdict: FIX.** `--check` passes (84 variants, 114 sources). Arithmetic and most pages verify; two values need changes (bZ Limited AWD, bZ Woodland x2) and a few trim and source-type notes.

| Variant | Field | Value | Result | Evidence |
|---|---|---|---|---|
| toyota/bz/2026/standard | curb_weight_kg | 1840 | ✅ | Car Guide XLE FWD: "1,840 kg (4,057 lb)", 57.7 kWh, FWD. Granville Toyota (Canadian dealer) also 4,057 lb. Matches our variant (57.7 kWh FWD gross in repo). |
| toyota/bz/2026/awd | curb_weight_kg | 2025 | ✅ | Car Guide XLE AWD "2,025 kg (4,464 lb)", 77.0 kWh. Granville: XLE AWD 4,464 lb. 4,464 x 0.45359 = 2,025. |
| toyota/bz/2026/limited-awd | curb_weight_kg | 2065 | ❌ | Car Guide does say "2,065 kg (4,553 lb)", but Granville Toyota lists Limited AWD 4,464 lb (= 2,025 kg), and a search excerpt of the Toyota Canada BC sheet shows 2024.84 (4464). Two Canadian-Toyota-derived sources agree on ~2025; Car Guide is the outlier. The batch's own notes admit the conflict. |
| toyota/bz/2026/woodland-awd | curb_weight_kg | 2015 | ⚠ | Source PDF is image-only; WebFetch and my copy have no text. A search excerpt (same one the researcher used) quotes "2015 (4442.3)" for Woodland and Premium; I could not open the image. 4,442.3 x 0.45359 = 2,015 so the arithmetic fits. CAA Quebec range 2,015-2,040 kg (from search snippet) is consistent. Only reproducible via a search excerpt. |
| toyota/bz/2026/woodland-awd-all-terrain-tire | curb_weight_kg | 2015 | ⚠ | Same source and limits. The note says the sheet shows the same weight for both tire configurations; not verified by me. |
| toyota/c-hr/2026/standard | curb_weight_kg | 1900 | ✅ | Car Guide C-HR SE FWD "1,900 kg (4,189 lb)", FWD. Conversion fine (1,900 kg = 4,188.8 lb). Our variant is single FWD, so SE FWD is the only FWD. |
| toyota/c-hr/2026/awd | curb_weight_kg | 2000 | ✅ (trim caveat) | Car Guide XSE AWD "2,000 kg (4,409 lb)". Our AWD variant has 18" and 20" trims; 18" likely matches SE AWD, not XSE. The note says one figure covers both, but the page is for XSE only. The batch did not check an SE AWD page. Weight is probably a bit lower on 18" (US SE 4,322 vs XSE 4,366 lb, about 1 %), within tolerance. Keep, low_confidence is right. |
| subaru/solterra/2026/awd | curb_weight_kg | 2020 | ✅ | Lethbridge dealer page: base "AWD 4,453" lb; 4,453 x 0.45359 = 2,019.8. Other trims 4,486-4,575 lb (up to 2.7 % higher); our variant is a single "AWD" so the base trim is a defensible pick. Type community with kind manufacturer is OK (relay of OEM). |
| nissan/leaf/2026/s-plus | curb_weight_kg | 1899 | ✅ | cars.com page is S+ FWD "4,187 lbs", 214 hp. 4,187 x 0.45359 = 1,899.2. US spec; no sign the Canadian car differs. |
| nissan/leaf/2026/sv-plus | curb_weight_kg | 1919 | ✅ | cars.com /479564 is SV+ FWD "4,231 lbs". x 0.45359 = 1,919.2. |
| nissan/leaf/2026/platinum-plus | curb_weight_kg | 1982 | ⚠ | evspecifications.com page: "4,369.56 lb (1,982 kg)", 75.1 kWh usable / 79 gross, North America. The site does not say where specs come from (disclaimer; only top speed credited to the manufacturer), so it may be a relay or a model. The batch also cites cars.com/iSeeCars 4,369 lb for US Platinum+ but those URLs are not cited sources; I did not open them. Figure is consistent with the S+/SV+ progression (+138/+138 lb), plausible. |
| nissan/leaf/2026/platinum-plus | consumption_highway_wh_per_km | 222 | ✅ | InsideEVs: Platinum+, 19-inch alloys, ~38 F, constant 70 mph, 215 mi, "2.8 mi/kWh". 1000/(2.8 x 1.609344) = 221.9. Cross-check: 215 mi / 2.8 = 76.8 kWh vs car showing 76 kWh. Matches our variant (19" wheels in repo). Article does not say display vs wall; note says so correctly. Fit: NRCan highway 219 Wh/km, 1 % apart. Cold test, so the note is sensible. |

## Required changes
1. `toyota/bz/2026/limited-awd` `curb_weight_kg`: change 2065 to 2025 (4,464 lb, per Granville Toyota and the Toyota Canada BC sheet excerpt), or drop it. If you keep Car Guide's 2065, source and note must show the conflict; as-is it contradicts the dealer relay of Toyota's figure. The Car Guide page is a poor source for this trim. Better: cite Granville Toyota (https://www.granvilletoyota.com/showroom/new-2026-toyota-bz-vancouver-british-columbia-c1y2026m24mo1621d3745smo/) for 4,464 lb.
2. `toyota/bz/2026/woodland-awd` and `...woodland-awd-all-terrain-tire` `curb_weight_kg` 2015: not verifiable beyond a search-tool excerpt of an image PDF. Either drop both, or keep with `low_confidence: true` (already set) and state plainly in notes that the figure is read from a search excerpt and could not be opened. Preferred: find a text source (a Canadian dealer page such as Peace Country Toyota or Stampede Toyota "Base Curb Weight (lbs)") and re-cite. The all-terrain variant additionally lacks any tire-specific evidence.
3. `toyota/c-hr/2026/awd`: note should say the cited page is the XSE (20-inch) trim and that the 18-inch SE AWD was not checked.
4. `nissan/leaf/2026/platinum-plus` `curb_weight_kg`: optional; add the cars.com Platinum+ URL as the source if it shows 4,369 lb (not checked), since evspecifications.com doesn't show its provenance.

## Applied by the main session (2026-11-16)

1. `toyota/bz/2026/limited-awd`: 2065 → 2025 kg (4,464 lb), re-cited to the Granville Toyota showroom page (new source `src-granvilletoyota-bz-2026`, community); Car Guide Limited source removed.
2. Both Woodland values dropped (only a search excerpt of an image-only PDF; not reproducible). Source `src-toyota-ca-bz-woodland-summary-2026` removed. The two Woodland variants stay without a curb weight.
3. C-HR AWD note now says the cited page is the XSE (20-inch) trim and the SE AWD 18-inch wasn't checked.
4. LEAF Platinum+ weight kept (low_confidence); note says EV Specifications states no source. Not re-cited to cars.com (not opened).
5. LEAF highway 222: kept; note adds that it is a cold (≈3 °C) test to consider excluding in item 3.7.

## Owner decision B48 (2026-11-16, on PR #78)

The owner dropped every value marked "NOT FOR CALIBRATION" from the data (not from this batch file, which stays as the audit trail): tested consumption baselines must be mild-weather, near-standard tests. Removed from `data/variants/**`: IONIQ 5 long-range AWD (3 °C), EV6 Land AWD (0 °C), LEAF Platinum+ (~3 °C), Silverado EV LT ext range (cold + headwinds). Sources no longer cited (`src-insideevs-leaf-70mph-2026`, `src-insideevs-silverado-ev-lt-er-test-2025`) were deleted from `data/sources/`. Re-running add-facts on this batch would bring them back: don't.
