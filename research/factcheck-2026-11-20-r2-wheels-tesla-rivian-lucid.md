# Fact-check: research/batch-2026-11-20-r2-wheels-tesla-rivian-lucid.json

Checked 2026-11-20. `npx tsx scripts/add-facts.ts <batch> --check`: **OK** (valid; nothing written).
The batch has 320 trims (NOTES.md says 325; stale count only). Every trim has a standard size and a note. All Tesla entries and most Rivian/Lucid carry-overs are `low_confidence`. Only 38 entries are not, and every one I opened was quoted correctly by its page.

## Verdict: FIX

The sizes the cited pages state are quoted correctly. The problems are in how those pages are applied to other trims, years and markets:

- Cars.com spec pages show wheel data for one default trim only.
- Several non-low-confidence "standard" flags rest on that single trim.
- Some Rivian "standard" flags are not stated by any source.
- The Model 3 Long Range and Cybertruck sets have errors that permitted sources contradict.

Blocking items are 1 to 6 in the fix list.

## Pages re-opened (33)

| Source | Result | Evidence |
|---|---|---|
| cars.com Model 3 2019 | ✅ for Standard Range RWD only | "18 X 8.5 in", P235/45WR18. Other 5 trims listed with no wheel data. |
| cars.com Model 3 2021 (418769) | ✅ | Performance AWD "20 X 8.5 in", P235/35YR20 |
| cars.com Model 3 2027 (489568) | ✅ | Premium AWD 18 X 8.5; RWD/Premium RWD/Premium AWD/Performance AWD listed |
| cars.com Model Y 2021 | ✅ | Standard Range RWD 19 X 9.5, P255/45WR19 |
| cars.com Model Y 2023 (434050) | ✅ | Performance AWD 21 X 9.5 front, 21 X 10.5 rear |
| cars.com Model Y 2026 | ✅ | RWD only: 18 X 9.5, P235/55HR18; other 5 trims no data |
| cars.com Model Y 2027 (490712) | ✅ | Performance AWD forged 21, 21 X 9.5 / 21 X 10.5 |
| cars.com Model S 2012 | ✅ | "245/45R19", width TBD. No optional wheels listed. |
| cars.com Model S 2016 | ✅ | "2016.5 4dr Sdn RWD 60", 19 X 8 |
| cars.com Model S 2022 | ✅ | AWD 19 X 9.5 / 19 X 10.5. Plaid shown with no wheel data. |
| cars.com Model X 2020 | ✅ | Long Range Plus only: 20 X 9 / 20 X 9.5. LR and Performance have no data. |
| cars.com Model X 2022 | ✅ for AWD only | 20 X 9 / 20 X 9.5. **Plaid has no wheel data**, but the batch assigns Plaid 20 from this page. |
| cars.com Cybertruck 2025 | ✅ | Long Range 4x2 "18 X 9 in", P285/65HR18. AWD and Cyberbeast have no data. |
| cars.com Lucid Air 2022 Dream (426190) | ✅ | 21 X 8.5 / 21 X 9.5 forged |
| cars.com Lucid Air 2022 GT (426189) | ✅ | 21 X 8.5 / 21 X 9.5. Performance package lists 21 inch Aero Sport. |
| cars.com Lucid Air 2022 Touring (426188) | ✅ | 20 X 8.5 / 20 X 9.5 |
| cars.com Lucid Air 2023 | ✅ | Pure RWD 19 X 8 only. The other four trims have no data. |
| cars.com Lucid Air 2024 Touring (453314) | ✅ | 19 X 8, P245/45YR19 |
| cars.com Lucid Air 2024 GT (453315) | ✅ | 20 X 8.5 / 20 X 9.5 |
| cars.com Lucid Gravity 2026 GT (469962) | ✅ | 20 X 8.5 front, 21 X 9.5 rear |
| cars.com Lucid Gravity 2026 Dream (470963) | ✅ | 22 X 9.5 front, 23 X 10 rear |
| lucidmotors.com/air-grand-touring | ✅ | "Comes standard with 20” Aero Lite wheels"; options 19 Aero Range, 19 Stealth, 20 Stealth, 21 Aero Sport Stealth |
| lucidmotors.com/air-pure | ✅ | Standard 19 Aero Range; options 19 Stealth, 20 Aero Lite Stealth |
| lucidmotors.com/air-touring | ✅ | Standard 19 Aero Range; options 19 Stealth, 20 Aero Lite, 20 Stealth |
| Lucid Sapphire / GT / Touring 2024 PDFs | ⚠ unverifiable | My fetch tool cannot decode the compressed streams. The researcher says they decoded them by raw-stream inflate. |
| CARB 2023 (term 42154 p17) | ✅ sizes, no standard stated | R1T 21; R1S 22, 21, 20 AT. Shows "R1S (22 inch wheels)" at $81,500 and "R1S 20 inch All-Terrain" at $82,300, the cheapest R1S listings. No 22 inch R1T row seen on this page. 2022: none. |
| CARB 2025 (glossary 2 p859) | ✅ | R1S Dual Standard 20 and 22; Tri Max 22 only; AT 20 on others |
| CARB 2026 (p3) | ✅ | R1S Dual Large 20 and 22; Tri Max 22 and AT 20; Dual Large Plus 20 only |
| CARB 2027 (p1) | ✅ | R1S Premium and Premium Long Range 22, 20, 20 AT; Quad 22, 22 UHP, 20 AT |
| CARB 2027 (p0, p2) | ✅ | p0: R1T Premium, Premium Long Range and Performance in 22, 20 and 20 AT. p2: R2 Performance AWD 21 and 20 AT. |
| KBB R1T 2027 tires | ✅ | 2026 "last year's standard 22-inch wheels"; 2027 20 inch standard; 22 inch $1,000; AT package $4,950. R1S: article silent. |
| SlashGear R1 2025 | ✅ but weak | "20-inch entry-level wheel and tire set". Does not say "standard". |
| Electrek 2018 Model S | ✅ | "The 21″ wheel package is still a $4,500 upgrade over the standard 19″ wheels." |
| tslna.com (src-tslna-model-y-price-canada-2026, an existing repo source) | ✅ | RWD 18 only; Premium AWD 19 standard, 20 +$2,600; Performance 21 Arachnid 2.0 |
| tesla.com/en_ca/modely | ⚠ not opened | 403. I did not work around it. |

Motor1 is not cited by this batch.

## Sample table (entries tested, by variant)

| Variant (trim `standard`) | Batch value | Result | Evidence / issue |
|---|---|---|---|
| model-3/2019/standard-range, standard-range-plus | 18 std | ✅ | cars.com 2019 SR RWD 18 |
| model-3/2019 long-range, long-range-awd, mid-range | 18 std, not low_confidence | ❌ | The page has no data for these trims. The Driven (2022-04-26): Long Range "had 19-inch sport wheels as standard"; 18 aero came back as standard in 2022 and 19 became a $2,200 option. |
| model-3/2020-2021 long-range-awd | 18 std (low_conf) | ❌ | Same: 19 Sport was standard until April 2022. |
| model-3/2021/performance | 20 std | ✅ | cars.com Performance AWD 20 X 8.5 |
| model-3/2025, 2027 performance | 20 std (carried from the 2021 page) | ⚠ | Highland is a different car, so this is a cross-generation carry. A web-search excerpt says 20 Warp is standard on the 2024+ Performance with 19 Nova optional (not a fetched page). Right size, weak basis. |
| model-3/2027 rwd, premium-rwd, premium-awd | 18 std | ✅ for Premium AWD; ⚠ others | Page is Premium AWD only. |
| model-y/2021/long-range-awd, standard-range | 19 std | ✅ | cars.com SR RWD 19 (SR OK; Long Range AWD is by carry) |
| model-y/2023/performance | 21 std | ✅ | cars.com 21 X 9.5 / 10.5. Front size recorded, rear in notes. |
| model-y/2025/performance | 21 std, from the 2027 page | ⚠ | Different body generation notes: 2025 is the Juniper launch, so a 2027 page is a carry. Marked low_confidence. |
| model-y/2026/standard-awd, 2027 awd, rwd | 18 std | ✅ for RWD | cars.com RWD 18 X 9.5. AWD is by carry, marked low_confidence. |
| model-y/2026/premium-rwd (US) | 19 std, "Estimated" | ⚠ | See carry-over section. |
| model-y/2026 long-range-awd-i, -b-pre-6-11-25 | 19 std, 20 opt, from a Canadian Premium AWD page | ⚠ | The page is for Premium AWD, not Long Range AWD or the import trim. The mapping is a guess. |
| model-s/2012-2020 | 19 std, 21 opt (Electrek 2018) | ✅ for 2018 | Electrek states the standard 19 and the 21 upgrade for 2018 only. Carrying to 2012-2017 and 2019-2020 is inference. The notes honestly say "that year was not opened". |
| model-s/2021-2026 | 19 std | ✅ for AWD 2022 | Plaid and 2023-26 are carried. The 21 option is dropped for these years. |
| model-x/2016-2026 | 20 std | ✅ for 2020 LR Plus and 2022 AWD | Plaid, LR and Performance trims are carried from one trim of one year. |
| cybertruck/2025 long-range-rwd | 18 std | ✅ | cars.com 18 X 9; electrive: "comes as standard with 18-inch wheels" |
| rivian/r1t, r1s/2023 (all) | 20/21/22, 21 std | ⚠ | Sizes ✅ (CARB). The standard flag is inferred and noted as such. Cheapest 2023 R1S rows are "22 inch wheels" and "20 inch All-Terrain", which cast doubt on 21 being standard everywhere. |
| rivian/r1s/2025 dual-standard | 20 std, 22 opt | ✅ sizes; ⚠ standard | CARB lists 20 and 22. SlashGear says only "entry-level". |
| rivian/r1s/2026 dual-large | 20 std, 22 opt | ⚠ | Standard "assumed as in 2025". KBB says 2026 R1T standard was 22. |
| rivian/r1t/2026 dual-large | 22 std, 20 opt | ✅ per KBB | Conflicts with the R1S 2026 flag above. |
| rivian/r1t/2027 performance | 20 std, 22 opt | ✅ | KBB: 2027 R1T 20 inch standard, 22 at $1,000 |
| rivian/r1s/2027 performance | 20 std | ⚠ | KBB is R1T only. Note says "R1S assumed the same" and the entry is low_confidence. |
| rivian/r1s,r1t/2025-27 tri/quad | 22 std, 20 AT opt | ⚠ | CARB shows 22 as the only road size (plus 22 UHP on Quad); nobody states "standard". Reasonable. |
| rivian/r2/2027 performance-awd | 21 std, 20 AT opt | ⚠ | CARB p2 lists 21 and 20 AT. The standard flag is guessed (the note admits it). |
| lucid/air/2022 dream (both), grand-touring | 21 std | ✅ | cars.com. For the GT, the "optional Performance package" also lists 21, so the base GT size is not independent of that package. |
| lucid/air/2023 touring | 20 std (carried from 2022) | ⚠ | 2022 Touring is 20, but the 2024 Touring is 19. The 2023 value is a guess in between. |
| lucid/air/2023 pure | 19 std | ✅ | cars.com Pure RWD 19 X 8. The AWD is assumed. |
| lucid/air/2023 grand-touring, -performance | 21 std (carried from 2022) | ⚠ | 2024 GT is 20 (cars.com). 2023 sits between a 21 and a 20, and is a coin toss. |
| lucid/air/2024 touring | 19 std, 20/21 opt | ✅ | cars.com 19; current page: 19 std, 20 Aero Lite optional. 21 comes from the PDF (unverifiable). |
| lucid/air/2024 grand-touring | 20 std, 19 and 21 opt | ✅ | cars.com 20 X 8.5 / 9.5; current page: 20 std |
| lucid/air/2024 sapphire | 20 front (21 rear) | ⚠ | PDF not readable by my tool. |
| lucid/air/2025-27 pure/touring/GT | std + options from current pages | ✅ for the page; ⚠ for 2025-26 | Marked low_confidence and note "assumed same as 2024 and the current lineup". Plausible. |
| lucid/air/2025-27 sapphire | 20 (carried from 2024) | ⚠ | Same PDF as above. |
| lucid/gravity/2026 dream, grand-touring, touring | 22 / 20 / 20 | ✅ | Cars.com, front size recorded and rear in notes. The Touring page is a general spec page with no trim label, so the mapping needs a one-line check. |
| lucid/gravity/2025, 2027 | carried from 2026 | ⚠ | low_confidence; plausible. |

## Terms of reuse (item 2)

- **cars.com** (`/about/terms/`): bars "any automated mechanism" to "collect information or scrape data from the Site". "Reproduction, redistribution, publication, display" of its Software is prohibited. Any use of the Site on another website needs "prior written permission". It does not specifically address reusing individual spec facts, but it **forbids automated collection**. The whole Tesla and Lucid base set rests on cars.com, so the owner should decide whether to accept it. The batch was read by page fetch, not bulk extraction. If the owner treats this as a forbidden source, about 150 Tesla/Lucid entries lose their source.
- **KBB** (`kbb.com/company/terms-of-service`): "you may not store or migrate any of the Information", no "systematic extraction of data or data fields", and no storing or copying material from KBB.com without written consent. This clause is aimed at valuation data, but the wording is broad. KBB supplies only 5 Rivian "standard" flags (the 2026 R1T and 2027 R1T/R1S entries). Flag as a risk; those flags are replaceable by Rivian's own pages.
- **SlashGear, Electrek, Motor1:** terms pages not retrievable (404 or socket error on the URLs I tried). **Unverifiable.** Motor1 is not used here. Electrek and SlashGear are editorial, and only one claim each is relied on. Do not assume they are free to reuse.
- **CARB DriveClean:** government listings; no restriction seen.
- **lucidmotors.com:** manufacturer pages; fine.
- **tslna.com (existing repo source):** terms not checked; this is a third-party fan site, and the batch labels it `community`.

## Carry-overs and inferences (item 3)

- **Tesla years carried from one cars.com year per body style:** the notes say so honestly and mark them `low_confidence`, but the chain is longer than it looks. Cars.com shows one trim per year, and the batch applies it to every trim. Plausible for Model Y, X and S, **wrong for Model 3 Long Range / Long Range AWD / Mid Range 2018-early 2022**, where 19 Sport was standard. Plausible for Model 3 Performance 20 (all years), but 2024-27 relies on a different generation.
- **Model Y US 2026/2027 Premium estimated from the Canadian page:** same Juniper hardware, so the 19 inch Premium estimate is plausible. Weaknesses:
  - The source is a third-party fan site, not Tesla.
  - The Canadian page is Premium AWD; the batch uses it for Premium RWD, and for Long Range AWD import and pre-6-11-25 trims.
  - 2027 premium-awd/rwd copies 2026 with no year evidence.
  - These are marked `low_confidence` with notes.
- **Rivian Gen 1 standard of 21:** inferred, `low_confidence`, and the notes say "no allowed source states it". Counter-evidence is in the 2023 CARB rows above. Keep the sizes; consider dropping `is_standard` (see fix 5).
- **Lucid 2025-27:** carried from the 2024 PDFs and current pages. Plausible and `low_confidence`. The 2023 Air carries are weaker (the neighbours disagree).

## Known gaps and conflicts (item 4)

Permitted sources I found for the dropped options:

| Option | Permitted source that states it? |
|---|---|
| Model 3 19″ | Yes. Electrek 2017/2019 (via search excerpt): 18 aero standard, 19 Sport $1,500 option. The Driven 2022-04-26 (opened): 19 Sport $2,200 option on Long Range; before that 19 was standard on Long Range. |
| Model Y 20″ / Performance 21″ | 20 inch: tslna.com (already in the repo, opened): Premium AWD 19 std, 20 +$2,600. Performance 21 Arachnid 2.0 std on the Canadian page. cars.com states Performance 21. For 2020-2024, no opened permitted page states 20 Induction. Search-result excerpts from fan blogs say it, but I did not open them. |
| Model X 22″ | Teslarati article (opened; editorial site with a store section): 20 standard, 22 Turbine $4,500. Terms not checked. |
| Model S 21″ | Yes; already in the batch (Electrek 2018). |
| Cybertruck 20″ | electrive.com (opened): Long Range RWD "comes as standard with 18-inch wheels", 20-inch Cyber Wheels +$3,500. AWD "includes 20-inch wheels in its standard configuration". |

- **2026 R1T standard, 22 (KBB) vs 20:** KBB explicitly says "last year's standard 22-inch wheels". That supports the batch's R1T 22. It does not cover R1S, so the R1S 2026 entries (20 standard) are inconsistent with the R1T entries. SlashGear's 2025 "entry-level 20" shows Rivian changed the standard between 2025 and 2026 (or that SlashGear's "entry-level" wording is not "standard"). The conflict is not resolved by any source; the batch should say so on both vehicles.
- **Cybertruck 18 vs 20:** both are right for different trims. LR RWD 18 standard, 20 optional. AWD 20 standard per electrive (2025), though a 2026 source via search says Standard AWD 18 (not opened). The batch has only the LR RWD variants, and misses the 20 inch option.

## Staggered Lucid fitments (item 5)

✅ Front diameter is recorded, with the rear in notes:
- Sapphire front 20 (rear 21 in notes).
- Gravity GT and Touring front 20 (rear 21).
- Gravity Dream front 22 (rear 23).
- Air 2022 GT / Dream (21/21), Touring (20/20) and Air 2024 GT (20/20) have equal diameters; widths are in notes.
- Model Y Performance rear in notes.

## Source quality

All source records have `url`, `accessed_on` 2026-11-20 and a sensible `type`: cars.com, Electrek, KBB and SlashGear as `community`, CARB as `regulatory`, Lucid as `oem`. `src-r2w-carscom-model-x-2022` is noted as "read from a search excerpt of the page"; I re-opened it and confirm the AWD sizes. The source note for `src-r2w-carb-rivian-2024` quotes glossary pages 823-824 that shift between fetches; the researcher already warned about this, but a stable `taxonomy/term/42154?page=N` URL is better.

## Numbered fix list

1. **Model 3 Long Range, Long Range AWD and Mid Range, 2018 to early 2022** (`model-3/2017-2022/long-range*`, `mid-range`; 2019 ones are not low_confidence): the cited cars.com page lists only Standard Range RWD, and The Driven says Long Range was 19 Sport standard until April 2022. Mark these `low_confidence`, set 19 standard with 18 optional (or drop the entries). For 2022 the batch's 18 has "back as standard" support from The Driven. `model-3/2019/*` entries other than Standard Range/Plus must not be presented as verified by the 2019 page.
2. **Trims that borrow a base-trim page.** The cars.com page for Model 3 2019, Model Y 2026, Model X 2020/2022, Model S 2022 and Lucid Air 2023 shows one trim only. Every entry that cites such a page for another trim (Model X Plaid, Model S Plaid, Lucid Air 2023 AWD, Model Y AWD) needs `low_confidence` and a note naming the trim the page shows. That includes the entries that currently lack the flag (the 38 not low_confidence, e.g. `model-3/2019/*`, `model-y/2021/*`, `model-x/2022/*`).
3. **Cybertruck:** add 20 inch as a non-standard option on `cybertruck/2025/long-range-rwd` and `2026` (source: electrive, +$3,500). Note that AWD trims are left unfilled because the cars.com page has no AWD data. electrive states AWD 20 standard; add it if the owner wants it.
4. **Rivian 2026 R1S vs R1T:** make the standard flag consistent. KBB supports 22 for the R1T only. Either set R1S 2026 `is_standard` to 22 with a note "R1T per KBB, R1S assumed the same", or drop `is_standard` on both. Say in the notes that SlashGear says 20 entry-level for 2025 and KBB says 22 standard for 2026, and that CARB states neither.
5. **Rivian `is_standard` flags that no source states:** Gen 1 21 (2022-24), 2025 20 (SlashGear says "entry-level", not "standard"), 2025-27 Tri/Quad 22, R2 21. Keep the sizes. Each note should say "standard inferred" and no `is_standard: true` entry should be presented as `manufacturer`/stated fact. The brief requires every trim to have a standard size, so keep the flag but retain `low_confidence`. Add the 2023 CARB counter-evidence ("R1S (22 inch wheels)" at the lowest price) to the 21 inch notes.
6. **Model Y 2026-27 Premium (US) and Long Range AWD import/pre-6-11-25:** the Canadian page is for Premium AWD only. Change the notes to say so ("Canadian Premium AWD; mapped to this trim by assumption"). For Long Range AWD import / pre-6-11-25, either drop the entries or mark them clearly as unmapped. 2027 Premium AWD/RWD: say that no 2027 source was opened.
7. **Lucid Air 2023 Touring (20) and Grand Touring (21):** the neighbouring years disagree (2022 Touring 20 vs 2024 Touring 19; 2022 GT 21 vs 2024 GT 20). Keep `low_confidence`, and add that the 2023 value could be either the 2022 or the 2024 size.
8. **Model 3 Performance 2022-27:** add a note that 2024+ is the Highland redesign (a different car) and the 20 inch carry rests on the 2021 page. Optionally add the 19 inch Nova option, with Electrek/The Driven only if the owner approves them as sources.
9. **Optional sizes (item 4):** add Model 3 19 (Electrek/The Driven), Model X 22 (Teslarati, after its terms are checked), and Model Y 20 (tslna.com, already in the repo, for 2026 Premium AWD only; 2020-24 and Performance variants have no opened permitted page).
10. **Terms:** cars.com (automated collection forbidden) and KBB (storage and reproduction of "Information" barred; wording aimed at values) need an owner decision. SlashGear and Electrek terms could not be read. Until decided, do not apply the batch.
11. **Unverifiable:** Lucid Sapphire, Grand Touring and Touring 2024 PDF claims (Sapphire 20/21 staggered; 19 and 21 options). Keep them `low_confidence`; Sapphire 2024 is not currently marked, so add it.
12. **Housekeeping:** fix the NOTES.md count (320, not 325) and replace the shifting glossary-page URL for the CARB 2024/2025 sources with the stable `taxonomy/term/42154?page=N` form.
