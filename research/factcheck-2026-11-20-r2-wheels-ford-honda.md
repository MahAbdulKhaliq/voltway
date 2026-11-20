# Fact-check: batch-2026-11-20-r2-wheels-ford-honda.json (B105 wheels)

**Verdict: FIX** (one rule breach affecting about 30 entries, which has a ready replacement source; plus a handful of wrong values). `npx tsx scripts/add-facts.ts research/batch-2026-11-20-r2-wheels-ford-honda.json --check` passes ("batch is valid", nothing written). All 81 todo variants (Ford 58 incl. Focus, Honda 11, Acura 3 plus Lightning/Mach-E) are covered; no extras. Each trim has exactly one standard wheel except `honda/prologue/2024/touring-awd` (two).

## Method
Re-read the Ford 2025 Mach-E, 2025 Lightning, 2022 Lightning (Motor1) and 2024 Lightning (forum) PDFs with `pdftotext`. Also pulled Ford's 2022 and 2023 Mach-E and 2023 Lightning PDFs (the URLs are already in `batch-2026-11-19-ford.json`). Re-opened all iSeeCars pages, Tire Wheel Guide (TWG) 2026, Cars.com 2016, Honda US/CA/Info Center pages, Acura and Ford.ca Premium. 20 or more distinct sources and about 45 entries checked.

## Sample table

| Variant / source | Value | Result | Evidence |
|---|---|---|---|
| Mach-E 2025 (5 variants), Ford 2025 PDF | 19 std; GT 20 std | ✅ | Select/Premium "19" Machined-Face... (std.)"; GT "20" Monochromatic... (std.)" |
| Mach-E 2025 ER RWD Premium | 19 std | ✅ | Premium column lists 19" std and two 19" options |
| Mach-E 2021-2024 (about 30 variants), iSeeCars | 18/19/20 | ❌ source barred | ROUND2-BRIEF line 8: "Never cite iSeeCars" |
| Mach-E 2022 / 2023 values | Select 18, Route 1 18, Premium 19, GT 20 | ✅ values match Ford's own 2022 and 2023 sheets | 2022: "18" Carbonized Gray... (std)"; 2023: "19" Machined-Face... (ER)" |
| Mach-E 2024 Select 19 | 19 | ⚠ unverifiable | iSeeCars shows 19, but 2023 Ford sheet shows Select 18; no 2024 Ford source |
| Mach-E 2026 ER RWD | 18 std, 19 optional | ❌ | Ford.ca Premium: "19" Bright Machined-Face" std, no 18; Ford 2025 sheet 19 std |
| Mach-E 2026 ER AWD, SR AWD, SR (4 variants) | 19 std, 21 optional | ❌ 21 | TWG: 21 appears only on GT/Rally rows; Select/Premium options are 18 or 19 and 20 |
| Lightning 2022 XLT 18 std, 20 opt, Lariat 20, Platinum 22 | | ✅ | 2022 PDF: 18 "S O"; 20 "O S"; 22 platinum "S" |
| Lightning 2022 Pro 18 | 18 | ❌ not on cited sheet | Notes admit "Pro not on the sheet"; source_id is the Ford sheet, real source is iSeeCars |
| Lightning 2023 (5 variants) | cites 2022 sheet | 🏷 wrong source | The 2023 Ford PDF exists (Pro/XLT 18 S, XLT 20 O, Lariat 20 S, Platinum 22 S). Cite that, not a carry-over |
| Lightning 2024 (5 variants), forum PDF | 18 Pro; 20 XLT/Flash/Lariat; 22 Plat + 22 matte black opt | ✅ values | PDF: "22-inch matte black wheels ... O" under Platinum |
| Lightning 2024 SR: XLT 20 `is_standard:false` | | ❌ label | 20 in is "S" on XLT in 2024; it is only "not the base trim's size" |
| Lightning 2025 (5 variants), Ford PDF | 18 Pro/XLT; 20 Flash/Lariat; 22 Plat | ✅ | PDF wheel block as batch says |
| Lightning 2025 ER 123 kWh: 20 `false` | | ❌ label | Sheet: 18 on Pro/XLT, 20 standard on Flash/Lariat; no 20 option on XLT |
| Focus Electric 2016, Cars.com | 17 | ✅ | "17 x 7 inches"; "P225/50HR17" |
| Focus Electric 2012-15, 17, 18 | carried from 2016 | ⚠ | Plausible (search shows P225/50R17 for 2012), but the batch cites no source saying "unchanged" |
| Prologue 2024 US, Honda US release | 19 EX/Touring, 21 Elite | ✅ | Table: "Touring AWD 19 x 8.5; Elite 21 x 9.5" |
| Prologue 2024 CA, Honda CA | EX-L AWD 19, Touring AWD 21 | ✅ | CA table: "Touring (AWD) 21 x 9.5" |
| Prologue 2025 / 2026 Info Center | 19 FWD, 19 Touring, 21 Elite | ✅ | Both pages list EX/Touring 19x8.5, Elite 21x9.5 |
| Clarity Electric 2017 / 2018 / 2019 | 18 | ✅ | "18 x 8J aluminum alloy"; "18-inch aluminum-alloy wheels" |
| ZDX 2024 A-Spec 20, Type S 22 | | ✅ | "20 x 9.0 Berlina Black"; "22 x 9.5 Berlina Black" |

## The seven questions

1. **Sample and forum-hosted PDF.** About 45 entries re-opened; the Ford-sheet and Honda/Acura entries are right. The 2024 Lightning PDF is a forum attachment: its text reads as an authentic Ford sheet (Ford title, "2024 F-150 Lightning Flash", the same layout as Ford's 2023 and 2025 sheets, with values consistent between them). I cannot prove it matches Ford's own file, because Ford's 2024 PDF is not reachable (the 11-19 notes say 401/404). Acceptable only if marked `low_confidence`, and it is. Keep the note "copy on F150LightningForum". Better: use Ford's 2023 and 2025 sheets for 2023-25 and leave a 2024 entry that rests on the forum copy flagged. The Motor1 copy of the 2022 sheet is the same: fine, low_confidence set.
2. **Terms.**
   - **iSeeCars: not allowed.** The brief (line 8, added 2026-11-20) forbids it. Its Terms.jsp bars "reproduce, transmit, display, distribute ... any Materials". The batch still cites it in 6 source records, and 5 of those back about 30 Mach-E entries. This is the main fix.
   - **Tire Wheel Guide: not allowed as used.** `tirewheelguide.com/info/terms/` bars "Use bots, scrapers, or other automated tools to copy or bulk-download our content" and "Copy, reproduce ... substantial portions of our database", but permits "brief excerpts". One page of facts is not bulk, but the site's terms are against automated tools, and the brief says to check terms before citing. It is used for 5 variants of the 2026 Mach-E. I recommend dropping it, since Ford.ca is readable and gives Ford's own figure. The owner decides if single-page TWG use is acceptable.
3. **Spanning trims, "standard = base trim, higher trim's size as an option".** Not a fair record as written. It states false facts: Lariat's 20 in is standard (not optional) on Lightning 2022-25; XLT 20 in is standard on 2024 XLT; Flash 20 in is standard on 2025. Where Mach-E sizes are the same (2025: all 19) it is fine. Recommendation: (a) where the trims differ, use `is_standard:false` only for sizes that really are options on the base trim; (b) otherwise tell the owner the model cannot hold "differs by trim", and split the variant (new_trims) or accept a note. Owner decision. Also, 2021-2023 "Extended Range RWD / eAWD" are listed as "Select (base) 18 + Premium 19", but Ford's 2022 sheet shows the ER RWD only on Premium (19) and Route 1 (18). So 18 is the wrong standard for those variants.
4. **Mach-E 2026 ER RWD.** The batch's 18 std contradicts Ford. The Ford 2025 sheet and the readable 2026 Ford.ca Premium page both give 19 std, with no 18. TWG (an aggregator, 272 hp RWD, 18x7) is the only source for 18. Record 19 as standard (cite Ford.ca Premium, https://www.ford.ca/suvs/mach-e/models/premium/, with the 2025 sheet). Drop 18, or keep it as optional with low_confidence.
5. **Prologue 2024 Touring AWD.** Both sources check out (US 19, CA 21), but two `is_standard:true` on one trim breaks one-standard-per-trim. The schema has no market key. Options: (a) as the variant covers CA and US, put 21 std, 19 `false`, and say so in notes, or (b) split by market. Owner decision. The Prologue Touring also needs its note to say "US 19 / CA 21" as the front of notes.
6. **Carry-overs.**
   - Focus Electric 2012-15/2017-18: plausible, `low_confidence`, but rule 21 of the brief needs a source that says the year is unchanged. Cars.com has per-year pages (e.g. `/research/ford-focus_electric-2012/specs`) which should be cited instead of copying 2016. Notes say "nothing seen showing a wheel change", which is not a source. Canadian years 2013-18 rest on a US page (flagged).
   - Lightning 2023 from 2022: unnecessary, since the 2023 Ford PDF exists; also dropped pro 18 comes from a barred source.
   - Canadian cars on US sizes: flagged `low_confidence` in all Ford/Acura cases. Prologue CA and Honda entries use the Canadian source, correct. The Ford CA-only 2026 pages should be re-sourced from Ford.ca (readable).
   - Missing `low_confidence`: Mach-E 2025 `extended-range-eawd-us`, `extended-range-eawd-e`: US/CA mix, fine. `ford/mustang-mach-e/2021/gt` etc. are flagged.
7. **Missing options.**
   - Mach-E 2026 (non-GT): TWG lists 19 optional alternates and 20 in, plus 18 on SR RWD; the batch has 21 instead of 20.
   - Mach-E 2025 optional wheels (19 monochromatic black, 19 Sinister Bronze; GT 20 machined, 20 Bronze): recorded only in notes, not as wheels entries. The size is the same as standard, so no new diameter is lost.
   - Lightning 2024 Platinum matte black is 22 in; also in notes only, the same diameter. Lightning 2022-23 XLT 20 option is recorded.
   - Mach-E Rally 2025 (19 std, sheet column) has no entry; 2025 `gt` variant carries only 20. If the variant includes the Rally trim, a 19 in is missing (the 2025 `gt` variant lists one trim, "GT").

## Numbered fix list

1. Remove every iSeeCars citation (sources `src-iseecars-mache-2021/2022/2023/2024-wheels`, `src-iseecars-lightning-2022/2023-wheels` and the notes that name it). Re-source Mach-E 2022 from `https://www.fromtheroad.ford.com/content/dam/fordmediasite/us/en/library/2022/specs/2022-Ford-Mustang-Mach-E-Technical-Specifications.pdf` (Select 18, Premium 19, Route 1 18, GT 20) and 2023 from the 2023 Mach-E PDF at the same path pattern (Select 18; Premium SR 19; ER 19; Route 1 18; GT 20). The values already in the batch hold. Both PDFs are already in the 11-19 Ford batch.
2. Mach-E 2021 and 2024: no Ford sheet found. Either drop to "leave out and list in report" (brief rule line 10) or find an allowed source. Do not copy the 2022/2025 sheet without a source stating no change. 2024 Select 19 conflicts with 2023 Ford 18.
3. Mach-E 2022-2023 ER RWD/eAWD variants (`california-route-1-rwd-e`, `extended-range-eawd`, `extended-range-rwd`, etc.): 2022 Ford sheet has ER RWD only on Premium (19 std) and ER AWD on Premium/Route 1; "Select 18 std" is wrong for these. Re-derive per pack.
4. Mach-E 2026 `extended-range-rwd`: set 19 `is_standard:true` (Ford.ca Premium + Ford 2025 sheet); drop or demote 18.
5. Mach-E 2026 `extended-range-awd`, `extended-range`, `standard-range-awd`, `standard-range`: replace the 21 in option with 20 (TWG lists 21 only for GT/Rally). Preferably re-source all 2026 entries from Ford.ca and drop TWG (terms bar automated copying).
6. Lightning 2023 (5 variants): re-source to `https://www.fromtheroad.ford.com/content/dam/fordmediasite/us/en/library/2023/specs/2023-Ford-F-150-Lightning-Technical-Specifications.pdf` and drop the "carried from 2022" and iSeeCars notes. Pro 18 can then be cited from that sheet. 2022 Lightning Pro 18 (standard-range 2022): either drop Pro from the notes or re-source; it is not on the 2022 sheet.
7. Lightning sizes that are standard on their own trim must not be labelled `is_standard:false` without saying so: 2022/2023 ER (Lariat 20), 2024 SR (XLT 20), 2025 ER 123 kWh (Flash/Lariat 20). Per question 3, owner to decide the convention; at least fix the notes. Remove the claim "optional" for 2025 XLT 20 (the sheet shows none).
8. `honda/prologue/2024/touring-awd`: only one `is_standard:true`. See question 5 for options; owner decides.
9. Focus Electric 2012-2018: cite Cars.com per-year pages (2012 page exists) instead of "carried from 2016"; keep `low_confidence` for CA years.
10. Optional: add 2025 Mach-E Rally 19 in if the `gt` variant includes the Rally; check which trims the `2025/gt` variant covers.
11. Leave unchanged (verified): Mach-E 2025 (all), Lightning 2024 (sizes), Lightning 2025, Prologue 2025/2026, Prologue 2024 (each market), Clarity Electric 2017-19, ZDX 2024.

Nothing was edited except this file. No site was circumvented.

---

## Re-check 2026-11-20 (after rework)

**Verdict: OK**, with minor notes. `npx tsx scripts/add-facts.ts research/batch-2026-11-20-r2-wheels-ford-honda.json --check` passes (1362 variants, 994 sources after applying). All 81 todo variants are filled. There are 23 sources: Ford, Honda and Acura official pages and PDFs, plus Cars.com for Mach-E 2024 and Focus Electric.

**Banned sources.** None remain. A search of the batch for iSeeCars, Tire Wheel Guide, Unplugged Performance and EVChargingStations finds no match.

**Earlier fixes**
1. iSeeCars removed: done. Mach-E 2022 and 2023 now cite Ford's own PDFs. I re-downloaded the 2021, 2022 and 2023 Mach-E sheets, and the Select, Premium, Route 1 and GT wheel columns match the batch.
2. Mach-E 2021: done. It now cites Ford's 2021 sheet (Select 18, Premium and First Edition 19, Route 1 18, GT 20). Mach-E 2024: done. It cites the Cars.com 2024 Select AWD page ("19 X 8 in") and the GT AWD page (20), rather than a copy of another year. The 2024 Select 19 conflicts with the 2023 Ford sheet's Select 18, but Cars.com is the 2024 source, so I accept it as `low_confidence`.
3. ER RWD and eAWD in 2022-23: done. They are now Premium 19 (Route 1 18 where applicable).
4. Mach-E 2026 ER RWD: done. It is 19 standard, backed by the Ford.ca Premium page ("19" Bright Machined-Face").
5. Mach-E 2026 others: done. The 21 in option is gone, TWG is dropped, and all five variants cite Ford.ca.
6. Lightning 2023: done. It cites Ford's 2023 PDF (Pro and XLT 18 S, XLT 20 O, Lariat 20 S, Platinum 22 S). Lightning 2022 Pro is dropped from the notes.
7. `is_standard` labels: done. XLT 20 in 2024, Flash and Lariat 20 in 2025, and Lariat 20 in 2022-23 are now `true`, which matches the sheets. I re-read the four Lightning PDFs (2022, 2023, 2024 forum copy, 2025), and the 2025 sheet has no 20 in option on XLT.
8. Prologue 2024 Touring AWD: US 19 and CA 21, both `true`, markets named in the notes, 19 first. This follows the brief's market rule, so it is accepted.
9. Focus Electric: done. It cites the Cars.com 2017 and 2018 pages ("17 x 7 in", "P225/50HR17"). The 2012-16 variants are not in the batch.
10. Mach-E 2025 Rally: handled. The note says the 2025 `gt` variant is GT only and the Rally has no variant.

**Entries reopened:** about 45 (the Ford PDFs for 2021, 2022, 2023 and 2025, Lightning 2022, 2023, 2024 and 2025, both Cars.com Mach-E 2024 pages, the Focus 2017 and 2018 pages, and the Ford.ca page). Honda and Acura are unchanged from the earlier check, where they were verified. All changed entries match. Sizes carried to Canada or between trims are `low_confidence`, and I found none missing the flag in the changed entries.

**Remaining fixes (minor)**
1. Source `type` is `oem` for the Motor1-hosted 2022 Lightning sheet and the F150LightningForum 2024 sheet. They are third-party copies of Ford's PDFs. Consider `community`, or keep `oem` and leave the "copy on ..." note. All their entries are `low_confidence`.
2. The four Mach-E 2026 entries (`extended-range-awd`, `extended-range`, `standard-range-awd`, `standard-range`) rest on the Premium page alone. The notes say "2026 Select not read separately", but they also say "Source is a US page; Canadian trim assumed the same", which is wrong for the Ford.ca source and can be deleted. Also, the Ford.ca Premium page does not cover SR Select, so keep `low_confidence`.
3. Mach-E 2021 GT and 2022-23 GT lack `low_confidence` on the US-only variants. That is fine, since the source is the official Ford sheet for the same market.
