# Fact-check: research/batch-2026-11-20-r2-wheels-hmg.json

**Verdict: FIX.** `--check` passes (1404 variants, 1044 sources). About 60 entries were re-opened across Ioniq 5/6/9, Kona, Niro, Soul, EV3/EV4/EV6/EV9, G80, GV60 and GV70, in both markets. Nearly all sizes match their pages. There is one wrong value (GV70 2026 Standard AWD), several carry-overs from a stale year when the real year's page exists, and one source-licensing question for the owner.

## Source check: iSeeCars (about 125 of 179 wheel entries rely on it)
- **Provenance:** none. The pages say nothing about where the data comes from. They carry only a "(c) Copyright 2026 iSeeCars.com" footer and a generic compare line. Wheel sizes are unattributed, with no OEM link.
- **Blocked?** No. robots.txt (`User-agent: *`) does not disallow `/car/`. Named bots such as Bytespider get a blanket Disallow. Our fetch worked.
- **Terms** (`https://www.iseecars.com/Terms.jsp`, read through the search result):
  - They say not to "reproduce, transmit, display, distribute" the Materials without written authorization.
  - Copying is limited to "personal informational use".
  - Reproduction or distribution is "strictly prohibited without the express written consent of the owner".
  - They do not mention scraping.
  - Listing diameters in our open dataset is arguably reuse of their compilation. Individual facts are not copyrightable, but this is the same class of risk as the EVChargingStations.com ban in ROUND2-BRIEF.
- **Flag for the owner:** decide whether iSeeCars is acceptable. If it is not, the Guide Auto entries stay. Every Hyundai/Kia/Genesis US-only trim would need an OEM or press source (Hyundai and Kia USA media sites, Car and Driver). The values I checked are plausible against what I know of these cars. The question is licensing and provenance, not accuracy.
- `type: community` is acceptable for iSeeCars and Guide Auto. The Michelin tire-fitment page is typed community but is closer to a retailer or tire-maker lookup; harmless.

## Sample results

| Variant(s) | Value | Result | Evidence |
|---|---|---|---|
| ioniq-5 2022 awd; 2024 awd; 2025 dual-motor-awd / limited; 2026 limited; 2027 dual-motor-awd / limited | 19 std, 20 opt (Limited AWD 20) | ✅ | iSeeCars: "AWD Limited 20.0"; SE/SEL AWD 19 |
| ioniq-5 2022/2024/2025/2026/2027 rwd, se-standard-range | 19 | ✅ | SE, SEL, Limited RWD all 19 |
| ioniq-5 2025/2026/2027 xrt | 18 | ✅ | "AWD XRT 18.0" |
| ioniq-5 2025 n | 21 | ✅ with caveat | Row is unlabeled "AWD 4dr Crossover 21.0". N inferred by elimination, and it is the real N size. Canadian N assumed (flagged) |
| ioniq-5 2022 preferred-long-range-awd (CA) | 19 | ✅ | Guide Auto 2022: "P235/55R19" |
| ioniq-5 2023 preferred-long-range-awd, with Ultimate | 19 / 20 opt | ✅ | Guide Auto: P235/55R19; Ultimate "P255/45R20" |
| ioniq-5 2024 preferred-long-range-awd | 19 std (carried), 20 opt | ✅ / carry | Michelin CA: "255/45R20/XL 105V" for 2024 Ultimate. Guide Auto 2024/2025 pages 404 |
| ioniq-6 2023 preferred-awd / preferred-rwd / Ultimate | 18 / 18 / 20 opt | ✅ | Guide Auto P225/55R18; P245/40R20 |
| ioniq-6 2023/2024 awd, rwd, se-* | 18 std, 20 opt | ✅ | SE 18; SEL/Limited 20 (RWD Limited 20 too) |
| ioniq-6 2025 long-range, long-range-awd, se-standard-range-rwd | 18 | ⚠ not re-opened | 2025 table not opened; same trims as 2024 |
| ioniq-6 2027 n | 20 | ✅ (inferred) | OEM page "275/35R20"; N Performance 20-in wheel "1.5 kg lighter than the original equipment wheels". No 21 in anywhere on the page |
| ioniq-9 2026 awd / awd-performance | 19 + 20 opt / 21 | ✅ | SE 19, SEL 20, Performance Calligraphy / Limited 21 |
| ioniq-9 2027 s-rwd, se-awd, performance-awd | 19 / 19 / 21 | ⚠ carry | 2027 page 404 (I could not open it either). 2026 values only |
| ioniq-electric 2017, soul-ev 2015, niro-ev 2019 / 2023 | 16 / 16 / 17 / 17 | ✅ | Tables as batch |
| kona-electric 2020, 2024, 2025 (SE, Long Range) | 17 | ✅ | All trims 17 (2020 page exists and says 17, so the 2020 carry-over was unnecessary) |
| kona-electric 2025 n-line | 19 | ✅ | "N Line 19.0". The CA "N Line Ultimate" mapping is assumed (flagged) |
| kona-electric 2026 | 17 | ⚠ carry | 2026 page 404 |
| kia ev3 2027 (light, long-range-fwd, long-range-awd, gt) | 17 / 17+19 opt / 19 / 19 | ✅ | Light 17; Wind 17; Land FWD 19; AWD Wind 19; GT 19 |
| kia ev4 2026 (4 trims) | 17/17/19/19 | ✅ | Autotrader.ca: "Light and Wind... 17-inch"; "Wind Premium and GT-Line... 19-inch" |
| kia ev6 2022-2027 (Wind, Light, LR, GT-Line AWD 20, GT 21) | per batch | ✅ | 2022-2027 tables agree (2022 has no GT; 2026-27 have no GT, and the batch has none) |
| kia ev6 2022 long-range-awd (CA) | 19 std | ✅ | Guide Auto: "P235/55R19" |
| kia ev6 2024 wind-rwd (CA) | 19 | ✅ | Guide Auto P235/55R19 |
| kia ev9 2024 light-rwd, wind-rwd, land-gt-line; 2025 all; 2027 gt-line-awd, light-* | 19 / 21 | ✅ | Tables as batch |
| kia soul-ev 2020 premium / limited; 2022 limited | 17 | ✅ | Guide Auto "P215/55HR17"; 2022 "P215/55R17" |
| genesis g80 2023 / 2024 / 2025 | 19 | ✅ | 2023, 2024 and 2025 tables all exist and say 19 (not "only 2023 opened") |
| genesis gv60 2023 advanced-awd (CA) | 20 | ✅ | Guide Auto "P255/45R20" |
| genesis gv60 2024 / 2025 / 2026 (Standard 19, Advanced 20, Performance 21) | per batch | ✅ | iSeeCars 2024, 2025, 2026 |
| genesis gv70 2023 / 2024 / 2025 awd | 20 | ✅ / ⚠ | 2024 and 2025 tables: Advanced and Prestige 20. 2023 not opened |
| **genesis gv70 2026 standard-awd** | **20** | **❌** | **2026 table: "AWD Standard 19.0". 2027 table also 19** |

## Question-by-question

**3. Carry-overs.** All carry-overs are `low_confidence` with a note. Plausibility:
- Ioniq 5 2025 refresh (CA Preferred, Preferred LR AWD, Preferred Standard Range and Ultimate 20 in): plausible and unchanged on the US 2025-27 tables, but the batch has no Canadian 2025 source. Guide Auto 2024/2025 404 and Michelin is 2024 only. Keep as is.
- Ioniq 9 2027: plausible, no contradicting data, unverifiable (404). Keep, flagged.
- Kona 2026: fine, unverifiable.
- GV70 2026 Standard AWD: **wrong**, see fix 1.
- Other GV70 carry-overs are unnecessary. 2026 and 2027 iSeeCars pages exist and should be cited. The note "no later table opened" is a workflow miss, not a wrong value, for `electrified-gv70-awd` 2025-27.
- GV60 2027: the 2027 iSeeCars page exists (Standard 19, Prestige 20, Magma 21). See fixes 2 and 3.
- G80 2024-25: 2024 and 2025 pages exist (Advanced 19). Cite them instead of the 2023 table.

**4. Known conflicts.**
- **EV9 2024 Land AWD:** the batch records US 20 as standard and CA 19 as an optional size. That is mislabeled. P255/60R19 is the Canadian standard tire for that trim, not an option. The variant covers both markets and the trim name differs (CA "Land AWD", US "AWD"). The US "AWD" label also spans Wind AWD (19) and Land (20). A US-only list of 20 std and 19 opt would show Wind-sized wheels as an option on Land. Fix 4.
- **Ioniq 6 N, 20 vs 21 in:** the OEM page says "275/35R20", the 20-in forged parts are 1.5 kg lighter than "the original equipment wheels", and 21 appears nowhere. The batch's 20 is the better-supported value. Keep it (diameter is inferred from the tire code and an OE-wheel comparison; the note says so). I found no source for 21.

**5. Trim mapping.**
- Several Canadian trim names get US sizes: `ioniq-5/2026/long-range-awd` (CA "Long Range AWD" mapped to US SE/SEL AWD 19), `kia/ev6/2025/land-awd` (CA "Land AWD" mapped to US Wind / Light LR AWD 19), `kia/ev6/2023/gt-awd`, `kia/ev6/2024/gt`, `kona 2024` CA trims, `ioniq-5/2025/xrt` CA, and `kona 2025 n-line` (CA "N Line Ultimate"). All carry `low_confidence` and a note, and none contradicts what I saw. They are only inferred from the US table. Acceptable, but call it out for the owner.
- `kia/ev9/2027/awd` (US "AWD") records only 20. The 2027 table has AWD Wind 19 and AWD Land 20, and the variant likely covers both. See fix 5.
- `ioniq-5/2022/awd` and the other multi-trim US variants record the 19 std and 20 opt combined ("SE/SEL 19, Limited 20"). That is a reasonable way to show an optional size.

**6. Missing optional sizes.**
- `genesis/gv60/2027/magma-awd`: left out because it had "no source", but the iSeeCars 2027 page lists "AWD Magma 21.0". Add it (fix 3).
- `kia/ev6/2026` and `2027` have a GT-Line RWD 19; the AWD GT-Line trim was mapped correctly at 20.
- Ioniq 5 2024 Disney100 edition (20) is not in the todo, ignore.
- iSeeCars lists standard wheels only. The researcher said so in the notes, so I do not flag the other optional sizes.

**Other checks.**
- `low_confidence: true` is set on all 179 wheel entries, which is conservative but fine.
- Every source is used and every entry has a `source_id`.
- The Ioniq 5 2025 N row is unlabeled on the page ("AWD 4dr Crossover"). The inference is right but should be described as an inference.

## Numbered fix list
1. **`genesis/electrified-gv70/2026/electrified-gv70-standard-awd`:** change 20 to **19** in. Cite a new source for `https://www.iseecars.com/car/2026-genesis-electrified_gv70-wheel-rim-size` (page: "AWD Standard 19.0"). Remove the "carried over" note.
2. **`genesis/electrified-gv70/2025/2026/2027 electrified-gv70-awd`:** cite the 2025, 2026 and 2027 iSeeCars pages directly (all say Advanced and Prestige 20). Drop the "carried over" notes. If the 2027 variant covers Standard, add 19 (2027 table: "AWD Standard 19.0").
3. **GV60 2027:** cite the 2027 iSeeCars page (`https://www.iseecars.com/car/2027-genesis-gv60-wheel-rim-size`) instead of the 2026 carry-over. The page says Standard 19, Prestige 20, Magma 21. Add `genesis/gv60/2027/magma-awd` = 21 in (currently unfilled), and check that the 2027 "advanced-awd" variant maps to the page's "Prestige 20". The page has no "Advanced" row, so say so in the note.
4. **`kia/ev9/2024/land-awd`:** make the market split explicit instead of "19 optional". Either record 20 std (US) and 19 std (CA, Guide Auto P255/60R19) with notes naming the market, or if the schema has no per-market field, keep 20 as standard, mark 19 `is_standard: false` with a note that it is the Canadian standard, and have the lead decide. Do not present 19 as an option.
5. **`kia/ev9/2027/awd`:** check whether the variant also covers Wind AWD. The 2027 table has AWD Wind 19 and AWD Land 20. If it does, record 19 as well as 20 and state which is standard per trim.
6. **G80 2024 / 2025:** cite the 2024 and 2025 iSeeCars pages (both: "AWD Advanced 19.0") rather than the 2023 table. The value is unchanged.
7. **Kona 2020:** the 2020 iSeeCars page exists and says 17 (Limited, SEL, Ultimate). Cite it. The value is unchanged. Optionally also check 2022.
8. **Ioniq 5 2025 N:** reword the note to say the row is unlabeled and is attributed to the N by elimination, and that no Canadian N source was read.
9. **Owner decision on iSeeCars** (not a batch edit): the terms bar reproduction and distribution without written consent, and the pages give no provenance. Decide before applying. If iSeeCars is not allowed, about 125 entries need replacement sources.

Not blocking: Ioniq 9 2027 and Kona 2026 carry-overs (pages 404, values plausible, flagged), and the Ioniq 6 2025 and GV70 2023 tables I did not re-open.

---

## Re-check 2026-11-20 (after rework)

**Verdict: OK.** `npx tsx scripts/add-facts.ts research/batch-2026-11-20-r2-wheels-hmg.json --check` passes (1362 variants, 1107 sources after applying). The batch now has 162 wheel entries and all 162 variants are filled. Every entry has `low_confidence: true` and a source id that resolves.

**Banned sources.** None remain. A case-insensitive search of the batch for iSeeCars, Tire Wheel Guide, Unplugged Performance and EVChargingStations finds no match. The 129 sources are cars.com (111), guideautoweb.com (15), michelin.ca, hyundai-n.com and autotrader.ca. Cars.com is allowed under B108, so I did not flag its terms.

**Earlier fixes**
1. GV70 2026 Standard AWD: done. It is 19 in, citing the Cars.com 2026 page ("19" AWD", "19 X 8 in").
2. GV70 2025/26/27 AWD: done. They cite their own year's Cars.com pages with no "carried over" note. 2027 lists 19 and 20.
3. GV60 2027: done. It cites the 2027 pages, `magma-awd` is added at 21 in ("Magma AWD ... 21 x 8.5 in"), and the Advanced-to-Prestige mapping is stated in the notes.
4. EV9 2024 Land AWD: done. Both sizes are standard and the markets are named. 19 is the Canadian standard (Guide Auto P255/60R19); 20 is the US Land size. This follows the spanning-trim rule, with 19 listed first.
5. EV9 2027 AWD: done. It lists 19 (Wind AWD) and 20 (Land AWD).
6. G80 2024 and 2025: done. They cite their own year's Cars.com pages (2024: "Advanced Sedan 19 x 8.5").
7. Kona 2020: done. It cites its own year's Cars.com page.
8. Ioniq 5 2025 N: done. The Cars.com page is labelled "N AWD" and shows 21 x 9.5. The note says no Canadian N source was read.
9. iSeeCars decision: moot. It is removed and replaced with Cars.com, Guide Auto, Michelin Canada and Autotrader.

**Pages reopened (about 25 of the reworked entries), all matching the batch**
- Ioniq 5: 2022 SEL AWD 19, 2025 SEL AWD 19, 2027 Limited AWD 20, 2025 N AWD 21.
- Ioniq 6: 2024 SE AWD 18, 2024 SEL RWD 20, and the 2027 N page ("275/35R20", "-1.5kg ... compared to the OE", no 21 in).
- Ioniq 9 2026: SEL AWD 20, S RWD 19, Performance Limited 21.
- Ioniq EV 2017 16, Kona 2025 N Line 19, Kona 2025 SE 17, EV3 2027 Land FWD 19.
- EV6 2023 GT 21, EV9 2024 Land AWD 20, EV9 2027 Wind AWD 19.
- Guide Auto EV9 2024 Land AWD (P255/60R19), Autotrader EV4 ("Light and Wind ... 17-inch"; "Wind Premium and GT-Line ... 19-inch").
- GV70 2026 (19" AWD 19 x 8), GV60 2027 Magma 21, G80 2024 Advanced 19.
- Niro EV 2026 Wind 17, Soul EV 2015 16.

**Carried values.** All are `low_confidence` with a note: Ioniq 5 Canada 2024-25 (from the 2023 Guide Auto pages and the 2024 Michelin fitment), Ioniq 9 2027 (from 2026), Kona 2026 (from 2025), GV70 2023-25 Prestige (assumed the same as Advanced), and Canadian trims mapped to US pages.

**Remaining fixes (minor, none blocking)**
1. The Ioniq 9 2027, Kona 2026 and Ioniq 5 CA 2024-25 carry-overs rest on no source saying the year is unchanged (ROUND2-BRIEF line 21 asks for one). They are flagged `low_confidence` and noted. Either accept them as flagged, or drop them and list them as unfilled.
2. The GV70 2026-27 20 in values for Advanced and Prestige come from the trim names only ("Advanced 20" AWD"). The Cars.com index page gives measured data only for the 19" AWD. They are flagged, and the note says so. Accept as `low_confidence`.
3. Optional sizes are largely missing, because Cars.com shows only the standard wheel for each trim. This is already said in NOTES.
