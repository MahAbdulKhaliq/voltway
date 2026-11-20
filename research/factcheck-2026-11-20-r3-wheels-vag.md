# Fact-check: research/batch-2026-11-20-r3-wheels-vag.json

Verdict: **FIX** (no systematic problems; 6 specific fixes, 2 of them judgement calls for the owner)

`npx tsx scripts/add-facts.ts research/batch-2026-11-20-r3-wheels-vag.json --check` -> OK (1367 variants, 1364 sources after applying; nothing written).

## Scope and method
- All 80 cited Cars.com pages that are used were reopened (more than the 30 required, which covers every non-`low_confidence` entry, all makes, all years 2020-2027). The 81st source (`src-cars-porsche-macan-2027-489385`) is not cited by any entry (see fix 6). Every page returned its trim and wheel sizes. Cars.com was fetched normally, no 403s or bot walls hit.
- Banned domains: none. All 81 sources are cars.com URLs.
- Every non-LC entry has a source whose year equals the variant year; no cross-year carries sit outside `low_confidence`. Every `low_confidence` entry names a Cars.com page in its notes.
- Overlap with round 2: none. The 17 Porsche/Audi/VW variants from `batch-2026-11-20-r2-wheels-german.json` (applied in `data/variants/`) have no variant id in this batch, so nothing is overwritten. Cross-check of same hardware: Macan Turbo 20 in standard agrees with round 2 (20S); Cayenne S round 2 (21S, 20 option) agrees with the batch's S Coupe carry; Taycan 4/4S/GTS 19/20 in agree.

## Weak spots
| Item | Result | Evidence |
|---|---|---|
| Taycan Turbo S Cross Turismo 2021 (20 in, read) | ✅ page, ⚠ doubtful | Cars.com 2021 page (420601): "20 X 9 in" / "20 X 11 in". Porsche configurators (Cyprus, China) list 21-inch Aero Design as standard for Turbo S CT, and the sedan is 21. Cars.com may be wrong or the markets differ. |
| Taycan Turbo S Cross Turismo 2022-2026 (20 in, carried, LC) | ✅ labelled | LC and names the 2021 page. Same doubt as above; see fix 1. |
| Taycan Turbo CT carried from the Turbo sedan (20 in, LC) | ✅ | Porsche vehicle sheet lists 20-inch Turbo Aero standard on Turbo CT. |
| Macan Electric Turbo 20 in standard (2026) | ✅ | Page 481063: "20 X 7.5 in", "20 X 10 in". Same figures as the Macan 4, so the Cars.com page may be a copy of the base trim, but Porsche configurator text says 20-inch Turbo wheels standard; round 2 also has 20S. 21/22 in options are in round 2 but missing here (fix 4). |
| ID.4 Pro S AWD 2025-26 21 in marked standard | ❌ | Page 464034 is "Pro S Plus AWD": "21 X 8.5 in". The variant's trim is named "Pro S AWD" (CA and US), not Pro S Plus. Also the 20 in entry is carried from a Pro S RWD page. Two standard sizes, both LC. See fix 2. |
| Cayenne S Electric (21 in std, 20 in option) carried from Electric Coupe AWD | ✅ labelled | LC, notes say Cars.com does not list the S. Pages 487222/483285 show 21 x 9.5 and a $0 "Range Setup" with "20" Cayenne Aero". Edmunds says 21 standard in US, but Porsche European material lists 20 in standard for the S, so a market difference is possible. Matches round 2. |

## Per-page results (all ✅ unless noted)
| Source (Cars.com id) | Page trim, wheel read | Batch use |
|---|---|---|
| porsche-cayenne-2026 487222 / 483285 / 487224 / 483286 | Electric Coupe / Electric / Turbo Coupe / Turbo, all 21x9.5 / 21x11.5; 20 in only as $0 Range Setup (487222, 483285) | 21S; 20 option listed only on 487222-based entries. 483285 (Electric AWD) also shows the 20 in Range Setup but the batch omits it (fix 4) |
| porsche-macan-2026 481061 / 481062 / 481064 / 482888 / 481063 | 4, 4S, RWD all 20x7.5/20x10; GTS 21x8.5/21x10.5; Turbo 20x7.5/20x10 | OK |
| porsche-macan-2027 489385 | RWD 20x7.5/20x10 | cited by notes only, no `source_id` (fix 6) |
| taycan 2020: 411636 4S 19; 411235 Turbo S 21; 411234 Turbo 20 | matches | OK |
| taycan 2021: 420599 4S CT 19; 418547 Turbo 20; 418548 Turbo S 21; 420601 Turbo S CT 20 | matches | see weak spot |
| taycan 2022: 426770 GTS 20; 424744 Turbo S 21 | matches | OK |
| taycan 2024: 444608 4 CT 19; 444253 GTS ST 20; 444597 4S 19; 444599 Turbo 20; 444598 GTS 20; 444600 Turbo S 21 | matches | OK |
| taycan 2025: 460897 / 460896 Turbo GT 21; 455182 Turbo S 21 | matches | OK |
| taycan 2026: 475669 4 19; 475670 GTS 20; 475667 Turbo GT 21; 475666 Turbo S 21 | matches | OK |
| audi a6/s6 e-tron 473264 (Prestige RWD 20), 473173 (S6 20), 483050 (2027 RWD 20) | matches | OK |
| audi e-tron: 415231 Sportback 2020 20; 416242 / 416326 2021 20; 421672 2022 Premium 20; 421674 2022 Chronos 21x9.5; 424951 e-tron S 20x10; 428424 2023 Chronos 21 | matches | OK |
| audi q8 / sq8: 437884 Premium 20; 437886 Prestige 20 (Launch Edition / Black Optic packages list 21 in); 445866, 459560 SQ8 20 | matches | OK |
| audi e-tron GT: 419764, 419703, 443825, 467477 all 20; 466799 S e-tron GT 20 with 21 in $2,000 package | matches | OK (RS GT performance page 467477 also offers a 21 in package, not listed here, fix 4) |
| audi q4: 425581 50 quattro 19 (S line Plus 20); 425583 Sportback 20; 425579 40 RWD 19; 452313 2024 19 (21 / 20 packages); 479437 2026 45 19; 479435 2026 55 19 (21, 21, 20 packages) | matches | OK |
| audi q6: 465467 19 (20 package); 465464 RWD 19; 471662 Sportback 19; 465468 SQ6 20x8.5/20x10; 483042 2027 19 (20 package) | matches | OK |
| vw e-golf 378528 / 404321 / 404734 | SE 16x6.5 (2016, 2018, 2019) | 16S OK for SE only (fix 3) |
| vw id.4 2021: 418042 Pro RWD 19; 418045 Pro AWD 19; 418043 Pro S RWD 19; 418046 Pro S AWD 19 (Gradient Package lists 20 in) | matches | OK |
| vw id.4 2022: 426753 Pro RWD 19; 426754 Pro S RWD 19 | matches | OK |
| vw id.4 2023: 430892 Pro S RWD 20; 430896 S RWD 20; 430895 Standard 19 | matches | OK |
| vw id.4 2024: 451427 Pro S RWD 20; 451424 Standard 19 | matches | OK |
| vw id.4 2025/26: 464031 Pro S RWD 20; 470263 Limited RWD 19; 481602 2026 Pro RWD 19; 464034 Pro S Plus AWD 21 | matches | see weak spot |
| vw id.buzz 469213 | "2025 Volkswagen ID. Buzz Pro S Plus 4MOTION", 20x8 front and rear | 20S read; see fix 5 |

Sampled `low_confidence` carries (Taycan 2023-27, Audi e-tron Sportback 2022-23, Audi GT 2023-27, Q4 2023-26, Q6 2025/2027, ID.4 2022-26) follow the compared page's figure; none contradict a page read.

## Fix list
1. **Taycan Turbo S Cross Turismo (2021 read, 2022-2026 LC carry, 20 in).** Cars.com shows 20 in but Porsche configurators list 21-inch Aero Design as standard for the Turbo S CT, and the sedan is 21. Owner call: either keep 20 in with `low_confidence: true` on the 2021 entry too and a note about the conflict, or add 21 in (is_standard per a Porsche spec sheet). Do not leave the 2021 entry as a confident standard.
2. **ID.4 Pro S AWD 2025 (`volkswagen/id-4/2025/pro-s-awd`).** The 21 in entry comes from the 2025 "Pro S Plus AWD" page, but the variant's trim is "Pro S AWD". Either confirm the variant covers Pro S Plus (then keep it) or set it `is_standard: false` or drop it. Also reword the 20 in note: the 2025 AWD page was not read for 20 in; the 20 in comes from a Pro S RWD page.
3. **e-Golf 2016/2018/2019 (and `audi/e-tron/2020/e-tron-sportback-55-quattro`).** The pages are SE (or Prestige) only. The 2018 note says "SEL and SEL Premium 2018 pages not read" and the 2020 Sportback note says "Premium Plus page not read", yet entries are not `low_confidence`. Per the spanning-trim rule, mark those sizes LC (or open the other trim pages).
4. **Missing options (not wrong, but inconsistent with round 2 and the pages).** The pages show optional wheels the batch omits: Cayenne Electric / Electric Turbo "Range Setup" 20 in (483285; omitted on the non-coupe entries), Macan Electric 21/22 in (round 2 lists both), Taycan GTS 21 in (round 2 lists it for 2025), RS e-tron GT performance 21 in package (467477), Q6/Q8 20/21 in packages. List them as `is_standard: false` (LC where carried) so the same car has the same wheel list in rounds 2 and 3.
5. **ID. Buzz 2025 `pro-4motion`.** The page trim is "Pro S Plus 4MOTION", while the variant is "Pro 4MOTION" (CA) / "4MOTION" (US). Add the trim mapping to the note. The note "the Pro S RWD page also shows 20" refers to an ID.4 page, which is misleading for a Buzz; delete that clause.
6. **Orphan source.** `src-cars-porsche-macan-2027-489385` is not used by any `source_id` (2027 Macan RWD page, 20x7.5). Either point `macan-electric/2027/macan-electric` at it (it is a direct read for the RWD, so no longer a carry) or drop the source.
