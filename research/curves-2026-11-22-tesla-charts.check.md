# Check: curves-2026-11-22-tesla-charts.json

**Verdict: FIX.** `--check` passes ("batch is valid"). Cybertruck and SR+ curves are acceptable with note corrections. The Performance copies must change. One source note is wrong. I could not read the chart images, so pixel readings are unverifiable. Only the article text was checked.

| Variant / powertrain | Field / curve id | Value | Result | Evidence |
|---|---|---|---|---|
| src-insideevs-cybertruck-v3-2024 | notes | ~250 start, 220 @15 %, 125 @50 %, 70 @90 %, ~1.5 h, 122 kWh, V3, 2024-05-30 | ✅ | "peaked at around 250 kWs on the V3 Supercharger"; "down to 125 kW"; "around 70 kW"; "replenished 122 kWh"; dated May 30, 2024 |
| same | notes "Foundation Series" | trim name | ⚠ | Article text says only "a dual-motor Cybertruck"; Foundation Series not found in the text (may be in the title or captions) |
| same | notes "Launch-era software, before 325 kW V4 support (2024-12)" | | ⚠ | Article says nothing about software; this is the author's outside claim, so say so. As a caveat it is fair, since the test is 2024-05 on a V3 |
| cybertruck/2025-dual-motor-awd | stateofcharge-2024 peak | 252 kW | ✅ | Text ~250; the powertrain `dc_max_kw` is 250 (within 1 %) |
| same | 50 % / 90 % | 127.1 / 66.3 kW | ✅ | Text 125 / 70 (within 5 kW) |
| same | 15 % | 236.3 kW (221.4 at 16 %) | ⚠ minor | Text "had already dropped to 220 kW" at 15 %; the point is 7 % above. The knee is plausibly at 15-16 %, so the text is loose. Optionally move the 15 % point to ~225 |
| same | kind `tested`, `low_confidence` | | ✅ | Independent testing (State of Charge/InsideEVs). Pixel-read, so `low_confidence` is correct. Pixel values unverifiable |
| same | notes "10-80 % ≈ 38 min at 117 kWh usable" | | ⚠ | The 117 kWh usable on the powertrain is itself `estimated`/conflicting (ArenaEV says 111.9). Article gives 122 kWh added 0-100 %, which is not usable. Fine as a derived note, but the figure is uncertain |
| cybertruck/2025-long-range-rwd | borrowed-stateofcharge-2024 (`based_on` dual-motor-awd) | points equal the AWD curve | ✅ | The 28 points are identical to the source curve; its source is measured and `source_id` is the sibling's source |
| same | `kind: estimated`, `based_on` reason | | ⚠ match unproven | Both powertrains list 123 kWh gross, NMC, 800 V, 250 kW DC, years 2025-26. Usable is 117 on both, but the AWD one is `estimated` and ArenaEV conflicts (111.9 vs 117). Motor count differs (RWD single vs AWD dual) and the charger hardware is not stated on either. Gross/chemistry/voltage/peak pass the B95 criteria; usable and charger are unproven. Say so in the reason |
| same | year match | 2024 Foundation Series for 2025-26 cars | ⚠ | Same 4680 pack and the same 250 kW cap. Later software and V4 raised the cap, so a test on a 2024 truck is an older-software curve for 2025-26 cars. `low_confidence` plus the caveat are adequate |
| model-3/2021-long-range-awd | insideevs-nyland-2021 | 21 points, peak 250 | ⚠ | Article table: Nyland 2021 LR AWD peak 249, 20-80 % avg 94 kW, 82 kWh. Curve points are unverifiable (image). Implied energy 20-80 % ≈ 45.9 kWh / 94 kW ≈ 29 min, consistent with ~31 min for 10-80 % |
| src-insideevs-model3-lr-2021-nyland | notes "Cell supplier not stated" | | ❌ | Article says "supposedly equipped with a 82 kWh battery (Panasonic cells)". Change to "Panasonic cells (the article's wording: 'supposedly')". It does **not** state where the car was built, and the article mentions a possible LG Energy Solution test later. The notes' "average-power matrix that agrees (20-25 % avg 217, 50-55 % avg 89)" is not in the article text (the matrix is an image), so it is unverifiable |
| same | Europe test on NA powertrains | | ⚠ acceptable with caveat | Cells are Panasonic per the article, matching the repo's Fremont NCA 82/76 kWh powertrain. Build location is not stated, so a Shanghai or LG possibility isn't excluded. Pack matches (82 gross/76 usable, repo and article). The US Moloughney test (InsideEVs 506520, "tesla-model-3-v3-supercharging-test") agrees on the hold: "reached it at about 9 % ... until about 17 %", "32 minutes to reach 80 %" from 0. But it is faster in the average: 106 kW 20-80 % vs Nyland 94 kW (~12 %). Fix the note: it agrees on shape, but Nyland's car is ~10 % slower overall |
| same | cited URL for 506520 | `insideevs.com/news/506520/` | ⚠ | Not a real path for fetching; the working slug is `/tesla-model-3-v3-supercharging-test/`. Moloughney's article states no cell supplier or build location (so "US" is by the author's location only) |
| model-3/2022-long-range-awd, 2023-long-range-awd | insideevs-nyland-2021 `tested` | same points | ⚠ | `tested` is a stretch for a different model year, but 2021→2022 has "no pack change found" in the repo. **2023-long-range-awd**: the repo has an open DOUBT that the 2023 pack may be LG NMC 78.1/75 (range 576→536 km; EPA 358→333 mi) and the powertrain is itself unproven. Do not put the 2021 Panasonic curve on 2023 as `tested`. Drop it for 2023, or make it `estimated` with `based_on` and a note on the unresolved pack. 2022 may carry it as `estimated`/borrowed (`based_on` 2021) |
| model-3/2021-performance, 2022-performance, 2023-performance | insideevs-nyland-2021 `tested` | the LR AWD points copied | ❌🏷 | The same article gives Nyland's separate Performance test: peak 233 kW (vs LR 249, 6 % lower), 20-80 % avg 90 kW (vs 94). This is not an LR measurement, so labelling it `tested` is wrong. Peak differs >5 %, so `based_on` fails the B95 peak criterion. Better: read the article's own 2021 Performance chart for the 2021 Performance (tested). Do not use `estimated`+`based_on` for the 2022-23 Performance, because the repo notes that EU 2022-23 Performance used the LG 78.1 kWh pack, unverified for NA. Drop them for 2023 |
| model-3/2021-standard-range-plus | insideevs-nyland-2021 | 17 points, peak 156.6 at 11 % | ⚠ | Article: "159 kW" peak from ~10 % SoC, 55 kWh total / 50.9 usable, Panasonic NCA (with "not 100 % sure"), 20-80 % avg ~64 kW. Repo: 55 gross / 51 usable NCA, `dc_max_kw` 170. Pack matches (50.9 vs 51, within 1 %). Peak 156.6 vs 159 is within 5 %. Implied avg: 30.5 kWh / 64 kW ≈ 29 min, consistent with the note's 10-80 % ≈ 31 min |
| src-insideevs-model3-srp-2021-nyland | notes | "50.9 kWh usable, Panasonic NCA not 100 % sure; charger not stated" | ✅ | The article says the cells were likely made "at the Tesla Gigafactory in Nevada" but isn't 100 % sure. The notes say "US-built", which isn't quite what the article says, since it is only about the cells. Soften to "cells likely Nevada-made per the article" |
| SR+ curve | `conditions` | `preconditioned: unknown`, no `charger_kw` | ✅ | Charger type is not stated in the article, so omitting `charger_kw` is right. The curve peaks 156.6 vs `dc_max_kw` 170 (8 % below); fine for a measured curve |
| SR+ | `kind` `tested`, `low_confidence` | | ✅ | Nyland's independent test, pixel-read |

## Required changes
1. Source `src-insideevs-model3-lr-2021-nyland` notes: replace "Cell supplier not stated" with "Panasonic cells per the article ('supposedly'); build location not stated". Remove or mark as unverifiable the sentence about the average-power matrix values (217 / 89 kW), since the article text gives only the peak and the 20-80 % average (94 kW).
2. `tesla/model-3/2021-performance`, `2022-performance`, `2023-performance`: remove the LR-AWD copy labelled `tested`. For 2021, read the article's own Performance chart (peak 233, 20-80 % avg 90 kW) as its own tested curve. For 2022-23, either drop them or add them as `estimated` only if the pack (Panasonic 76 vs LG 75) is first settled. Today they fail the B95 criteria (peak 249 vs 233, a 6 % gap).
3. `tesla/model-3/2023-long-range-awd`: remove the curve, or make it `estimated` with `based_on` the 2021 LR AWD plus the unresolved pack doubt. The repo says the 2023 pack may be LG NMC 78.1/75, not Panasonic NCA.
4. `tesla/model-3/2022-long-range-awd`: relabel as `estimated` + `based_on` the 2021 curve (with `source_id` Nyland), noting no pack change found 2021→2022, rather than `tested`.
5. Curve notes for Model 3 LR: change "Moloughney ... agrees with the shape" to "agrees on the 250 kW plateau (~9-17 %) and ~32 min to 80 %, but Moloughney's 20-80 % average is 106 kW vs Nyland's 94 kW (Nyland ~12 % slower)". Use the working URL `https://insideevs.com/news/506520/tesla-model-3-v3-supercharging-test/`.
6. Cybertruck notes: drop "Foundation Series" or attribute it, since the article says "dual-motor"; mark the V4 2024-12 and "launch-era software" lines as the researcher's context, not the article's. Optionally lower the 15 % point to ~225 kW to match "220 kW at 15 %".
7. `borrowed-stateofcharge-2024` reason: state that gross (123), chemistry, voltage class and peak (250) match but the usable figure is `estimated` and conflicting (117 vs ArenaEV 111.9), and the RWD charger hardware is unconfirmed. The match is unproven on those points.
8. SR+ note: "US-built" should read "cells likely made in Nevada per the article".

## Items not verifiable here
All pixel-read point values on the four distinct curves (images couldn't be read). Only the peak, the 15 %/50 %/90 % Cybertruck anchors and the 20-80 % averages were cross-checked against text.

Warnings: `off_template` is expected for Tesla curves.

## Applied by the main session (2026-11-22)
1. LR source note: "supposedly" Panasonic cells, build location not stated; matrix figures kept but marked as read from an image (not text-verifiable).
2. Performance: 2021 now has its own tested curve, read from the black line of the article's comparison chart (peak ~230 kW, matches the text's 233). 2022 and 2023 Performance dropped.
3. 2023 Long Range AWD dropped (possible LG pack).
4. 2022 Long Range AWD is now `estimated`, `based_on` the 2021 LR AWD.
5. Moloughney line reworded (106 vs 94 kW 20-80 % average), working URL used.
6. Cybertruck: "Foundation Series" attributed to the chart title; V4 / launch-era lines labelled as researcher context; the mid-step 15 % point removed (16 % = 221 kW kept).
7. Borrowed RWD reason rewritten: gross, chemistry, voltage and peak match; usable kWh and RWD hardware unproven.
8. SR+ notes: "US-built" replaced by "cells likely made in Nevada, per the article".
