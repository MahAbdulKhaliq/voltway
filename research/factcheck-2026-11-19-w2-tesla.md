# Fact-check: batch-2026-11-19-w2-tesla.json (Model S, Model X, Cybertruck)

**Verdict: FIX.** `--check` passes, all 113 gap ids are covered, every required field is present, and no existing data conflicts (powertrain files hold no figures yet). The ArenaEV and EVSpecifications pages mostly say what the batch says. The problems are labelling (other-year pages tagged `community`), several estimates whose basis fails, the Cybertruck 325 kW `tested`, and Model X values borrowed from Model S pages that the X pages contradict.

service.tesla.com was denied by the permission layer in this session, so the VIN page is **unverifiable** from here.

## Spot-check table

| Group (ids) | Field | Batch value | Result | Evidence |
|---|---|---|---|---|
| S 85/P85 (2012-16) | gross 85 | 85 c | verified | ArenaEV: "85 kWh total", nominal, 350 V |
| S 85 | usable 81 | est | basis weak | Ratio 81.8/85.8 from the X 90D page (page says it). The 85 and 90 packs are not same-cell (older vs newer 18650 cells), only same cell count. See fix 5. |
| S 2012 | dc 90 | c | verified | EVSpec 2012 Signature 85: "DC 90 kW" (the same page's AC is 11.5 kW) |
| S 2013 85/P85 | dc 120 c | | kind wrong | Cited page is MY2014. 2012 was 90 kW, so 2013 is unproven. See fix 4. |
| S 2014 85 | dc 120 | c | verified | EVSpec MY14 85 RWD: "Up to 120 kW" |
| S 2012-13 | ac 10 m | | unverifiable | VIN page not readable. EVSpec 2012 page says 11.5 kW. Search shows a dual charger (about 19 kW) existed on early cars; trim mapping unproven. |
| S 2014-15 | ac 10 est | | contradicted by cited-family page | EVSpec MY14: AC 11.5 kW (240 V, 48 A). The 10 kW rests only on the 2012-13 VIN codes carried forward. Basis is thin. |
| S 2013-40 | 60 gross / 40 usable est | | verified (as limit) | Wikipedia: "60 kWh pack ... limited to 40 kWh via software". 40 is a cap, not measured usable. |
| S 60 (2013-15) | usable 57.5 est | | basis fails | Ratio from the X 60D page, which is a software-limited 75 kWh pack (a different pack). Rule: no estimates from a different pack. |
| S 70/70D | usable 67.8 est | | weak | ArenaEV 70D: "70 kWh total", no net. Ratio 72.6/75 from the 75 page. Same-pack-hardware claim not shown. |
| S 75/75D/X 75D | 75 / 72.6 | c | verified | ArenaEV S 75 and X 75D: "72.6 kWh usable" |
| X 60D, S 2016-17 60/60D | 61 / 58.5 | | verified for X | ArenaEV X 60D: "61 kWh total", "58.5 kWh usable". S ids cite the X page but are labelled `community` (see fix 7). |
| S 90 / X 90 | gross | S 90, X 85.8 | inconsistent | ArenaEV S 90D: 90 nominal; X 90D page: 85.8 total, 81.8 usable. The same pack carries two gross values (usable/gross 0.909 vs 0.953). |
| S 100D, P100D, X 100D | 100 / 95 | c | verified | ArenaEV: "95 kWh usable, 100 kWh total" (S 100D, X 100D) |
| S/X 2017-19 pre-Raven | dc 120 | c | partly | S: EVSpec 2018 compare 75D/100D/P100D = 120 kW (verified). X P100D on the same page = "DC 145 kW", but the batch writes 120 for X. 90/85-pack ids cite a compare page that lacks those packs. |
| X 2016-19 | ac 11.5 | | mismatch | EVSpec X P100D lists AC up to 17.28 kW and no 11.5 kW. ArenaEV X: 11 kW or 16.5 kW. 11.5 is not on any X page. |
| S 2019 LR/Perf | dc 200 est | | ok | InsideEVs: "previous maximum value for the Raven version was 200 kW". The page gives no 2019 date, and ArenaEV 2019 LR page says 250 kW. |
| X 2019 LR/Performance | Raven 200 kW, usable 95 est | | unproven | Nothing cited shows a Raven X in 2019. ArenaEV X LR page (2019-21): 100 kWh, V2 150 kW, no net. See fix 6. |
| S/X 2020-21 Raven | dc 250 m | | kind and year | InsideEVs: 250 kW is for "newly ordered" cars (the page doesn't give a date; the batch says July 2020). Electrek and InsideEVs show 200 then 225 on earlier 2020 cars. Recording all 2020 as 250 `manufacturer` over-claims. Page isn't Tesla's. |
| S 2020 | usable 94 | c | verified | ArenaEV LR+ 2020: "94 kWh" net |
| S/X Palladium | gross 100 / usable 92.3 | | verified for Plaid | ArenaEV Plaid 2021: "92.3 kWh usable, 100 kWh total". LR/AWD ids and X ids use the Plaid page: needs `estimated` (S LR/AWD marked `community`). |
| S/X 2021 Plaid and 2022 | dc 250 est | | cited page lacks it | InsideEVs 2021: gives 250 kW for Raven LR only; none for Plaid or Palladium. EVSpec 2021 Plaid says 200 kW. |
| S 2023+ | dc 250, ac 11.5 | c | verified | EVSpec MY23/25 S Plaid: 11.5 kW (240 V, 48 A); DC lists 150 and 250 |
| X 2023+ | ac 11.5 | | mismatch | EVSpec X Plaid MY23: AC "7.4 kW and 16.5 kW", DC 250. No 11.5. Batch cites the S page. |
| Standard Range 2019-20 | 75 / 72.6 est / dc 120 est | | ok, low | ArenaEV SR: "75 kWh total", V2 150 kW. The 72.6 is borrowed from the 75 page (same size); fine as an estimate. 2020 SR exists only as a gap id. |
| Preconditioning S/X | automatic_with_navigation est | | partial | Electrek: "when you navigate to a Supercharger, your car will condition its battery". Page gives no model years and is silent on manual. 2012-2017 cars are not covered (see fix 3). |
| Cybertruck | gross 123 / 800v / nmc | | accepted | Battery passport, iFixit and EPA articles are cited; not re-opened except ArenaEV and GCC below |
| Cybertruck | usable 117 est | | label | GCC page states "117 kWh" for the Long Range RWD, so it is `community` there. ArenaEV Dual Motor AWD says 111.9. The 5 % spread is a real conflict for the AWD ids. |
| Cybertruck | dc 325 tested | | 🏷 mislabel | See below |
| Cybertruck | ac 11.5 | c | verified | GCC "11.5 kW"; ArenaEV lists only "Type 2" |
| Cybertruck | preconditioning | est | partial | Notebookcheck: Trip Planner starts the warm-up (Cybertruck named in passing, not as the subject). "No manual control" is unproven (source silent). |
| All | port nacs / Supercharger yes | | ok | EVSpec MY23 pages list NACS / J3400; `src-wikipedia-nacs` exists in `data/sources` |

## Cybertruck 325 kW as `tested`

Not a valid test basis. The InsideEVs article reports one video session, recorded by an owner (TesLatino) at a Los Gatos V4 site and posted on X. The article says the peak was "recorded at 18% SOC", from a clip that ends at about 21 %. A Tesla engineer is quoted calling it "a trial on a few different V3+ stations", so it is not available at every site. The article says the earlier observed peak was 255 kW and Tesla's spec is 250 kW. Green Cars Compare's 325 figure just repeats it. The source record is typed `testing_org` and should not be. An owner-posted clip is `community` at most. Because `dc_max_kw` drives 10-80 % times and the map, record a charger-independent value (250 kW, Tesla spec, `manufacturer`, relayed by ArenaEV's 2026 page) or keep 325 only as `community` with the trial-station caveat. The owner should choose.

## Fix list

1. Cybertruck `dc_max_kw` (6 ids): change `tested` to `community` (single owner clip, trial stations), change source type `testing_org` to `community`, and preferably record 250 kW `manufacturer` (ArenaEV 2026 page), noting 325 as a trial observation.
2. Cybertruck `battery.preconditioning`: "no manual control" is unproven. Either say so in the notes and keep it low-confidence `estimated`, or find a source that settles manual control. Also reword the basis: Notebookcheck names the Cybertruck only in passing.
3. Preconditioning for 2012-2017 (MCU1) Model S/X: the Electrek release note is 2020 software; the batch itself says earlier cars "may not run it". Rule 6 requires the value to match the sources, so do not record `automatic_with_navigation` for these ids on that basis. Find a manual or launch cite for `none` (the researcher rules allow `none` for cars that predate the maker's first launch), or restrict the estimate to cars on 2020+ software.
4. `dc_max_kw` for 2013 S (13-40, 13-60, 13-85, 13-p85): 2012 is 90 kW (EVSpec) and 2014 is 120 kW (EVSpec); 2013 is unknown. Relabel `estimated`, say which year is carried over, and drop the "nothing shows a change" wording. Also: every `community` dc/ac value for 2015-2018 Model S that cites a page for another year or a pack the page doesn't list (the 2018 compare page has no 85/90 pack; the 2014 page is 85 only) should be `estimated` with the years named, or cite the compare page that lists the pack (the 2017 compare page lists 90D and 75D).
5. S 85 and S 60 usable: the 85 ratio comes from a different-cell 90 pack and the 60 ratio from a software-limited 75 pack. Both fail the same-pack/same-cell rule. Find a page that states usable for the 85 and 60 (EV Database was 429), or keep as `estimated`, low-confidence, with notes that say the basis is not same-cell. S 70/70D: say whether 70 and 75 share the 5,880-cell hardware or flag as weak.
6. Model X 2019 Long Range / Performance: Raven X (200 kW, 94 usable) is not shown for 2019 by any cited page; ArenaEV's X LR page lists 150 kW V2 and no net figure. Either cite a page that dates the X Raven refresh, or put these ids on the pre-Raven hardware (95 kWh, X 145 kW).
7. Model X on Model S pages: (a) X `dc_max_kw` 2016-2019 on pre-Raven 100 kWh packs should be 145 kW (EVSpec 2018 compare X P100D "DC 145 kW", the same page the batch cites), not 120; (b) X `ac_max_kw` is 11.5 in the batch but X pages show 11/16.5 (ArenaEV) and 17.28 (EVSpec), and X Plaid shows 7.4/16.5 kW; pick a standard figure from an X page and note the option; (c) X ids that take values from an S page (gross 75 on X SR 2019, S 2016-17 60/60D gross 61, X Plaid DC/AC) need `estimated` plus a named sibling basis, or an X-page cite.
8. S 90 vs X 90 gross: the same pack is recorded 90 (S) and 85.8 (X). Pick one gross and keep usable/gross consistent, or explain the difference.
9. S 2020-21 Raven `dc_max_kw` 250 `manufacturer`: InsideEVs says 250 kW is for "newly ordered" cars; earlier 2020 cars were 200 or 225 kW (Electrek says "very recent" cars only). Use `estimated`, low-confidence, with a date, or cite the Tesla design-studio page. 2020 cars from before July 2020 may be 225.
10. S/X 2021 Plaid and 2022 `dc_max_kw` estimate: InsideEVs 2021 lists 250 kW for the Raven LR only. Re-cite the EVSpec 2023 Plaid page (same hardware, other year) for 2021 and 2022, and note the EVSpec 2021 page says 200 kW.
11. Palladium LR/AWD (S 2021 LR, 2022-26 AWD; X all): usable 92.3 comes from a Plaid page. Mark all `estimated` (same pack as Plaid, Palladium sibling), not `community`.
12. 2012-15 AC 10 kW: the VIN page was unreadable here. If the researcher did read it, quote the phrase in the notes. The 2014-15 ids ride on a page that has no 2014+ codes, while EVSpec MY14 says 11.5 kW; the dual charger (about 19-20 kW) was an option on early cars. Keep `estimated` for 2014-15, low confidence, and say the 2012-13 single charger is the standard option and not a Signature-specific finding.
13. Cybertruck usable 117: kind should be `community` where GCC states it for the Long Range RWD; for the AWD ids note the ArenaEV 111.9 conflict (4.5 % apart).
14. Required fields: all 113 powertrains have usable, chemistry, voltage, preconditioning, dc, ac; `charge_port` and `supercharger_access` are present as variant fields. No unknowns left. (The 2016 S 60 ids are applied as a software-limited 75 pack; the early-2016 60 may be the real 60 pack, so note it.)
