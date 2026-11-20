# Check: research/curves-2026-11-19-nissan-kona-niro.json

**Verdict: FIX.** Every point of every curve matches Fastned's embedded `chargeGraph` data exactly (7 distinct series, 0 mismatches). Required changes: remove the two curves on no-DC-port Leaf powertrains, correct the Ariya second-source claim, and fix the source URLs. A few matches are unproven (listed below). `--check` passes ("491 variants, 347 sources, nothing written").

## How checked
I curled the public Fastned pages (HTTP 200; robots.txt is `Allow: /`; no bot block). The plain brand pages `/en/brands-overview/{nissan,hyundai,kia}` carry only the Ariya 87 kWh, Inster and e-Niro 39/64 kWh graphs. The Leaf, Kona 65 kWh and Niro EV 64 kWh series are only on the model pages: `?model=Leaf`, `?model=KONA%20Electric`, `?model=Niro%20EV` (also `?model=Kona` and `?model=e-Niro`). I parsed `chargeGraph` per page and compared every batch point (tolerance 0.06 kW).

## Curve groups (one per hardware generation, copied to each powertrain)

| Group / powertrains | Fastned entry (id) | Points checked | Result | Evidence |
|---|---|---|---|---|
| Leaf 24 kWh: `2016-s-24-kwh` | Leaf 24 kWh (2011-2018), id 99 | all 22 | ✅ | 1:40.39 ... 21:46.36 (peak) ... 97:7.81. Matches. Peak 46.4 vs dc_max 46. |
| Leaf 24 kWh: `2013-s`, `2014-s` | same | all 22 | ❌ | Powertrains have `dc_max_kw` 0 (no quick-charge port in Canada). A DC curve must not be on them. |
| Leaf 30 kWh: `2016-sv-30-kwh`, `2017-s` | Leaf 30 kWh (2015-2018), id 101 | all 19 | ✅ | 6:41.77 ... 79:47.3 (peak) ... 90:29.26. Matches. Peak 47.3 vs dc 47, pack 28/30 kWh NMC, so right hardware. |
| Leaf 40 kWh: `2018-s`, `2019-s`, `2019-sv`, `2022-s`, `2022-sv`, `2023-s`, `2024-s`, `2024-sv`, `2025-s`, `2025-sv` | Leaf 40 kWh (2018-2024), id 100 | all 18 | ✅ with caveats | Points match (17:42.2 ... 57-60:45.6 ... 92:19.12). Fastned's years end 2024, so 2025 is an extension (pack 39/40, dc 50, same as 2024 in the repo). Peak 45.6 is 8.8 % under dc_max 50 (B95 asks within 5 %); the EverTV page says 47 kW peak, so the shape is fine. See change 5. |
| Ariya 87 kWh: 14 powertrains | ARIYA 87 kWh (2022+), id 369 | 16 of 79 | ✅ points, ❌ second-source note | 16:128.99 ... 32:131.5 ... 80:56.5 ... 85:46.12. Peak 131.5 vs dc 130 is within 5 %. |
| Kona gen 1: `hyundai/kona-electric/2019-kona-electric`; Niro gen 1: `kia/niro-ev/2019-niro-ev` | Kona 64 kWh (2018-22) id 87, Kona Electric 64 kWh (2022-2023) id 613, e-Niro 64 kWh id 91: identical series | all 18 | ✅ | 10:71.4 ... 40:76.68 (peak) ... 55:57.2 ... 80:25.4 ... 95:10. Peak vs dc 77: 0.4 %. Pack 64 kWh, 400 V NMC on both. |
| Kona gen 2: `2024-kona-electric`, `2024-long-range`, `2025-long-range`, `2025-n-line`, `2026-standard` | KONA Electric 65 kWh (2023+), id 819 | all 21 of 93 | ✅ points; ⚠ 2026 match unproven | 8:91.8 ... 61:104.77 (peak) ... 62:79.76 ... 100:10.38. Real, not a batch artefact (see below). Peak 104.8 vs dc 102 (+2.7 %). |
| Niro EV gen 2: `2023-niro-ev`, `2026-standard` | Niro EV 64 kWh (2022+), id 611 | all 20 | ✅ points; ⚠ 2026 | 7:80.7 ... 28:83.92 (peak) ... 80:45.4 ... 91:26.07. Peak is within 1.3 % of the 85 kW estimated dc_max. The repo also holds a 94 kW community value; the curve supports 85. |

## Points raised by the requester

- **Ariya 7-15 % omission.** The source starts at 7 % (144.5 kW) and rises to 148.67 kW at 15 %, then drops to 128.99 at 16 %. These sit 11-14 % above Nissan's 130 kW rating, so the linter would reject them. Dropping them is disclosed in the notes and is the less bad option (the batch does not clamp or invent values). Result: the curve begins at 16 % and loses the first third of the usual 10-80 % window. Acceptable, but see changes 3 and 4 below.
- **Leaf 30 kWh rising shape.** Source-faithful: 41.77 at 6 %, 47.3 at 79 %, 47.2 at 80 %, 41.1 at 85 %, 29.3 at 90 %. Single source and the notes say "unconfirmed". I found no second source. Acceptable as a labelled single-source curve; consider `low_confidence: true`.
- **Kona gen 2 rising to 105 kW at 61 %.** Source-faithful (rises from 91.8 at 8 % to 104.77 at 61 %, then steps 79.8, 63.9, 48.9, 41, 33, 25.5). The 95 %-of-peak window is about 21 % wide, under the 25 % limit for a 400 V NMC car. Single source.
- **2026 Kona and Niro reuse.** Kona 2026-standard has `dc_max_kw` and usable kWh unset (only gross 64.8) and voltage unset. Niro 2026-standard has the same pack values but all `estimated`. The "same hardware" claim is therefore **unproven** for both. The note on the Niro ("assumption that the pack is unchanged") is honest about it. The Ariya 2026 `sl-plus` and `sl-plus-e-4orce` (dc, usable, voltage unset; gross 91) are also unproven on peak DC.
- **Leaf 2013-S and 2014-S.** The batch does put a curve on both (`nissan/leaf/2013-s`, `nissan/leaf/2014-s`), and both have `dc_max_kw` 0 in `data/powertrains/`. Remove them.

## Other checks

| Item | Result | Evidence |
|---|---|---|
| Kind `tested` for Fastned | ⚠ judgement | Fastned is an independent network operator, so not `manufacturer`. The page says only "charging behaviour ... optimal conditions (around 30 °C)"; no sessions or method stated, and the batch itself says "not independently verified method". Acceptable as `tested`; suggest `low_confidence: true` for the single-source odd shapes (Leaf 30 kWh, Kona gen 2). |
| Conditions | ✅ | battery_temp 30 and charger_kw (50/150/300/400) match Fastned's recommended-charger key. |
| Second source: EverTV Leaf | ✅ | "peak of 47 kW by the 16% mark", "By 65%, we were already down to 35 kW", 25 kW at 80 %, 37 min 38 s. No per-SoC table. |
| Second source: Ariya "State Of Charge ... EVgo 325 kW ... 130 kW held 3-56 %, 10-80 % in 31.5 min" | ❌ not found | The cited evchargingstations.com 2025 Ariya Platinum+ page is a range test: "about 40 minutes at a power of up to roughly 130 kW", and says DC test results come later. No EVgo 325, no 31.5 min. Also the site's ToS forbids data extraction (research/NOTES.md, 2026-11-19 GM/Ford entry). Delete this "cross-check". |
| Second sources for Kona/Niro (InsideEVs 25 kW at 80 %, Car and Driver 10-90 % in 65 min, 74 kW) | ⚠ unverifiable | Not reopened (no URL in the batch). Fastned's own e-Niro 64 kWh series gives 25.4 kW at 80 %, consistent. |
| Source record | ❌ minor | URL is the Nissan brand page only. The Leaf data is not on it; it lives at `?model=Leaf` etc. Use model-specific URLs (one source per page, or list all in notes). `accessed_on` present. |
| Gaps (rule 14) | ⚠ | No curve for these powertrains and none in batch notes beyond the Kona SE line: Leaf 2011-sv, 2012-sv (dc 0, correctly none); Leaf 62 kWh `2019-s-plus`, `2019-sv-plus`, `2022-s-plus`, `2022-sv-plus`, `2023-sv-plus`, `2024-sv-plus`, `2025-sv-plus` (Fastned 62 kWh graph is null); 3rd-gen `2026-s-plus`, `2026-sv-plus`, `2026-platinum-plus`; Ariya 63 kWh (Fastned graph null) `2023-engage-e-4orce`, `2023-engage-fwd`, `2024-engage-fwd`, `2024-evolve-e-4orce`, `2025-engage-fwd`, `2025-evolve-e-4orce`, `2026-sl-e-4orce`, `2026-sv`; Kona `2024-se`, `2025-se` (48 kWh, Fastned graph null). The NOTES section should list each as "no curve found" and say why. |
| Validity (`--check`) | ✅ | OK, nothing written. |

## Required changes
1. Remove the `curves` entries for `nissan/leaf/2013-s` and `nissan/leaf/2014-s` (dc_max_kw 0, no DC port).
2. In the notes of all 14 Ariya curves, delete the "Cross-check: State Of Charge ... EVgo 325 kW ... 31.5 min" sentence. The cited page does not say it and the site's terms forbid data use. Keep or replace with a verifiable second source.
3. Ariya curves: keep the 7-15 % omission but state in the notes that Fastned's own series peaks at 148.7 kW at 15 %, above Nissan's 130 kW, and that the curve therefore starts at 16 %.
4. Source: change `url` (or add sources) to the model pages: `https://www.fastnedcharging.com/en/brands-overview/nissan?model=Leaf`, `...?model=ARIYA`, `...hyundai?model=KONA%20Electric` and `?model=Kona%20Electric` (gen 1 is on `?model=Kona`), `...kia?model=Niro%20EV` and `?model=e-Niro`.
5. Leaf 40 kWh (peak 45.6 vs dc 50, 8.8 % under): add a note that the series peak is below the 50 kW CHAdeMO rating and that EverTV saw 47 kW. Optionally also say 2025 is an extension beyond Fastned's "2018-2024".
6. 2026 reuse (Kona 2026-standard, Niro 2026-standard, Ariya 2026 SL Plus and SL Plus e-4ORCE): either confirm the DC peak, pack and voltage once the 2026 spec facts exist or add `low_confidence: true` and a note that the hardware match is unproven. Not blocking.
7. Set `low_confidence: true` on the single-source odd shapes (Leaf 30 kWh, Kona gen 2) as a reviewer's choice.
8. List the uncovered powertrains above as "no curve found" in the NOTES section for this batch.
