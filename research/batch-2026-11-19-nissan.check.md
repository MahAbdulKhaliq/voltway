# Check: batch-2026-11-19-nissan.json

**Verdict: FIX.** The batch is valid (`--check` passes) and every required field is filled for every Nissan powertrain (46 powertrains, 5 per-car overrides; no gaps against `research/powertrain-gaps.json`). Most values are backed by the pages cited. A short list of values needs changing; the main ones are the 24/30 kWh DC peak citation, the Ariya preconditioning label, the FWD Ariya 10-80 times, and the mislabelled gross value on the 2023-2025 SV PLUS. Nothing needs REJECT.

Limits of this check: the two Ariya owner's manual PDFs (nissanusa.com) and the DOE sheet PDF could not be read by the fetch tool, so they are marked unverifiable. The DOE chemistry was confirmed from search-result extracts of the same sheet. Existing merged data: only the Ariya 2026 Canadian cars and the 2026 Leaf (OpenEV) had any values; no Leaf 2011-2025 or Ariya 2023-2025 car has anything to conflict with.

## Answers to the flagged risks

| Risk | Finding |
|---|---|
| 2011/2012 Leaf SV `dc_max_kw` 0 + `j1772` | **Supported.** US 2012 kit: SL "Standard Quick Charge Port", SV "-". Canada 2012 specs (canada.nissannews.com) and Canada 2011 kit also show SV "-" (SL optional). So CA and 2011 are covered too, but only by pages the batch does not cite. Add those two as sources. |
| S trims 2013-2018 as CHAdeMO although optional | Page facts are right (2013/2014/2016/2017/2018 kits: optional on S). Recording `chademo` is the "can have" reading and notes say so. Acceptable, but it is a judgement the owner should know about: a base S has no DC port. Also note S 2019-2023 (2019 kit: "optional on S") and 2020-2023 are not sourced for those years. Only the 2024 kit (both trims have the port) supports 2024-2025. |
| 24 kWh chemistry `other` (LMO) | DOE/INL 2013 sheet does say LMO ("Lithium-Ion (LMO) ... Lithium-Manganese Oxide / Carbon", 192 cells 2P96S). OK for 2013 S (kind manufacturer is acceptable, specs supplied by Nissan). For 2011, 2012, 2014, 2015, 2016 the batch itself says "not checked for cathode tweaks between years", so the estimate basis (no change between years) is unproven. See required change 5. EV Database lists NMC for the same pack (conflict is disclosed). |
| 30 kWh NMC from EV Database only | EVDB 30 kWh page: "Cathode Material: NMC". Nissan only says "revised chemistry" (2017 kit). Labelled community + low_confidence. OK as recorded. |
| 62 kWh DC peak 100 kW vs EVDB 46 kW | 100 kW is on the 2019 kit ("standard new 100kW capacity quick charging system"), so kind manufacturer is right. But EVDB gives 46 kW max / 44 kW 10-80 average, and the same kit gives 80 % in 45 min (about 40 kW average). 100 kW is not plausible as a usable peak. Also the batch note says EVDB "measure[s]" 46 kW; the page does not say measured. Owner decision needed; see required change 6. |
| Ariya preconditioning `manual_only` | **Not proven.** Manual PDFs unreadable. EVDB Ariya 87 kWh MY23-24 says "Automatically using Navigation: No", but EVDB Ariya 63 kWh MY26 (Europe) says it can start automatically via navigation. Because the claim rests on a manual's silence plus EVDB, rule 6 applies. See required change 3. |
| Ariya 10-80 % times 35/40 | Press kit: "The FWD spec sheet lists 20-80%, and the e-4ORCE sheet lists 10-80%". So the FWD figures are 20-80 %. Nissan Canada page text did not show the times when fetched, so the batch's "Nissan Canada says 10 % to 80 %" could not be confirmed. See required change 4. |
| Trim-to-pack mapping 2024/2025 | 2023 kit gives the mapping explicitly. Car Guide (Canada 2026) maps SV FWD and SL e-4ORCE to 63, SL FWD, SL+ e-4ORCE, Platinum+ e-4ORCE to 87. Applying that to 2024/2025 by renaming (Engage=SV, Evolve=SL) is a reasonable inference, flagged low_confidence in the batch. Not proven for 2024/2025 US "Evolve e-4ORCE" (63) specifically. Accept as low confidence. |
| Canadian 2026 Ariya corrections | **Verified.** Car Guide lists 63 (SV FWD, SL e-4ORCE) and 87 (SL FWD, SL+ e-4ORCE, Platinum+ e-4ORCE); Nissan Canada specs: "66 kWh (63 usable) and 91 kWh (87 usable)". OpenEV's 63/63 on SL+, SL+ e-4ORCE and Platinum+ is wrong for 87-kWh trims; gross 63 = usable on all five is wrong. One caveat: the Car Guide says "SL FWD" while the data car is `sl-plus` (FWD); the 87 value matches Evolve+ FWD in 2023-2025, so fine. |
| Leaf Supercharger `no` | Electrek: "Only the Ariya gets Supercharger access ... Leaf uses a CHAdeMO connector". Estimate basis (CHAdeMO, excluded from the programme) holds. OK. |

## Value table (grouped; every powertrain checked for the pattern shown)

| Variant / powertrains | Field | Value | Result | Evidence |
|---|---|---|---|---|
| leaf 2011-sv, 2012-sv | dc_max_kw | 0 | ✅ | 2012 kit SV quick charge "-"; Canada 2011/2012 pages SV "-" |
| leaf 2011-sv, 2012-sv | charge_port | j1772 | ✅ | same pages |
| leaf 2011-sv, 2012-sv | ac_max_kw | 3.3 | ✅ | 2012 kit "3.3 kW onboard charger"; Canada 2011/2012 "3.3 kW" |
| leaf 24 kWh (2011-2016) | gross 24 | 24 | ✅ | kits: "Laminated 24 kWh lithium-ion ... 192 cells" |
| leaf 24 kWh | usable | 21.4 | ✅ | Wikipedia "assessed usable 21.381 kWh" (community, low_conf) |
| leaf 24 kWh | chemistry | other (LMO) | ✅ 2013 S; ⚠ other years | DOE sheet LMO via search extract; no-change basis unproven for 2011/12/14/15/16 |
| leaf 24 kWh | nominal_voltage_class | 400v | ✅ | DOE 2P96S, about 365 V (the 364.8 figure is 96 x 3.8 V; INL test report says 360 V). 400v class as sub-400 V pack is consistent with the 30/40/62 entries |
| leaf 24 kWh (2013-2016 S) | dc_max_kw | 50 | ❌ | Cited EVDB 24 kWh MY14-17 page says "46 kW"; the 50 kW claim is on the 40 kWh page. 46 vs 50 is 8 %. |
| leaf 24 kWh | ac_max_kw 3.6 (S, 2013-2016) | 3.6 | ✅ (note) | 2013/14/16 kits "3.6 kW ... 3.3 kW output". Mixed basis: 2011/2012 SV recorded as 3.3 for the same charger. Pick one convention. |
| leaf 24 kWh S | charge_port | chademo | ⚠ | optional on S (kits); recorded as max capability |
| leaf 24 kWh | preconditioning | none (estimated) | ✅ | EVDB: not supported; kits describe only cabin pre-heat; first nav-linked heater on 3rd gen. Basis acceptable |
| leaf 24 kWh | supercharger_access | no (estimated) | ✅ | Electrek |
| leaf 2016-sv-30-kwh, 2017-s | gross 30, ac_max (6.6 SV / 3.6 S), port | | ✅ | 2016/2017 kits |
| leaf 30 kWh | usable 28, chemistry nmc, 400v | | ✅ (low_conf) | EVDB 30 kWh: usable 28 est., "NMC", "Architecture 400 V" |
| leaf 30 kWh | dc_max_kw | 50 | ❌ | Cited EVDB 30 kWh page says "47 kW"; 50 kW not on that page (6 % off) |
| leaf 2018-s, 2019/22/23/24/25 S & SV (40 kWh) | gross 40, usable 39, NMC, 400v | | ✅ | EVDB 40 kWh: "NMC532", "350 V", "39.0"; kits "40 kWh" |
| leaf 40 kWh | dc_max_kw | 50 | ✅ | EVDB 40 kWh page: Nissan claimed 50 kW, measured 46 kW. Kind is "community" but the figure is Nissan's claim; acceptable either way |
| leaf 40 kWh | ac_max_kw 6.6 | 6.6 | ✅ | 2018/2019/2024 kits (US). CA unproven but 2019 kit covers "all trims" |
| leaf 40 kWh S | charge_port | chademo | ⚠ | 2018/2019 kits: optional on S. 2020-2023 not sourced (2022/2023 powertrains cite the 2024 kit) |
| leaf 62 kWh (S PLUS, SV PLUS 2019-2025) | gross 62, usable 59, NMC, 400v | | ✅ | EVDB e+: "62 kWh nominal, 59 usable", "NMC532", "288 cells", "Nominal 350 V, Architecture 400 V" (the batch's "96S" note should read 96S3P; trivial) |
| leaf 2023/2024/2025 sv-plus | gross 62 | 62, kind manufacturer | 🏷 | Source is EV Database (nominal) and the 2024 kit prints "60 kWh". Kind should be community. The note text ("Press kit says 62 kWh") contradicts the source. |
| leaf 62 kWh | dc_max_kw | 100 | ⚠ | Kit says "standard new 100kW capacity quick charging system" (2019). EVDB 46 kW max, 44 kW 10-80. Kit also says 80 % in 45 min. See change 6 |
| leaf 62 kWh | ac_max 6.6, port chademo | | ✅ | 2019 and 2024 kits (US). 2024 kit: "High output quick charge port" both trims |
| leaf 2024 kit note | source notes | "10-80 % about 40 min (S) / 60 min (SV PLUS)" | ❌ (note only) | The kit gives "80 %" times, not 10-80. Fix the source note; no value uses it |
| leaf 2026 s-plus, sv-plus, platinum-plus | chemistry nmc, 400v | | ✅ | EVDB 75 kWh MY26: "NMC", "400 V" |
| leaf 2026 | ac_max_kw 7.2 | 7.2 | ✅ US / ⚠ CA | Electrek table 7.2 kW for S+/SV+/Platinum+. Nissan Canada lists "7 kW and 11 kW" unmapped; CA trim mapping unproven |
| leaf 2026 | preconditioning automatic_and_manual (estimated) | | ⚠ | Malta ZE2 manual: AUTO "only during route guidance", manual ON/OFF; global release: nav-linked conditioning "on applicable grades". EVDB 75 kWh: auto via navigation "Yes". Basis (same generation, other market) is allowed, but the S+ may lack the navigation grade; basis for S+ unproven. Combination of two sources should name both (the batch names both in notes but cites only Malta) |
| ariya 2023 (6 powertrains), 2026 platinum-plus | usable/gross 63/66 or 87/91 | | ✅ | 2023 kit trim table (Engage 63; Venture+/Evolve+/Platinum+ 87) |
| ariya all | dc_max 130, ac_max 7.2 | | ✅ | kit "130 kW"; "7.2 kW" ; Canada page 7.2 kW. Existing CA OpenEV 7.4 is within 3 % |
| ariya | chemistry NMC, voltage 400v | | ✅ (low_conf) | EVDB 87: "NMC", "355 V", "400 V"; EVDB 63: "NMC", "352 V" |
| ariya 2023 engage-e-4orce, engage-plus-e-4orce | published_10_80_min 35 / 40 | | ✅ | kit e-4ORCE sheet 10-80 % |
| ariya FWD (2023 engage, evolve-plus, venture-plus; 2024/2025 FWD) | published_10_80_min 35 / 40 | | ❌ | kit: "The FWD spec sheet lists 20-80%". Nissan Canada times could not be confirmed |
| ariya 2023 (6) | preconditioning manual_only, kind manufacturer | | ⚠ unverifiable / 🏷 | Manual PDF unreadable. A manual that says nothing of navigation does not show there is no navigation trigger (rule 6). Needs the EVDB "not automatic via navigation" too, so kind should be estimated, naming both. |
| ariya 2024, 2026 | preconditioning manual_only estimated from 2023 manual | | ⚠ | Same issue; for 2026, EVDB Ariya 63 kWh MY26 (Europe) says automatic via navigation, which conflicts |
| ariya 2025 (6) | preconditioning manual_only, kind manufacturer, 2025 manual | | ⚠ unverifiable / 🏷 | same |
| ariya all | charge_port ccs1 | | ✅ | 2023 kit "CCS"; Car Guide 2026 says no NACS port; Canada page mentions NACS only for the 2027 refresh |
| ariya all | supercharger_access via_adapter | | ✅ | Electrek: "$235 ... Ariya"; Car Guide: "adapter ... $309.99"; Nissan Canada $317 adapter kit |
| ariya CA 2026 sv, sl-e-4orce | usable 63 / gross 66 | | ✅ | Car Guide, Nissan CA |
| ariya CA 2026 sl-plus, sl-plus-e-4orce, platinum-plus-e-4orce | usable 87 / gross 91 | | ✅ | Car Guide, Nissan CA. Corrects existing 63/63 |
| 2024/2025 Ariya pack-by-trim | usable 63/87 | | ⚠ | inferred from 2023 kit plus 2026 Car Guide; low_conf, no 2024/2025 page |

## Source quality
All sources have specific URLs and `accessed_on`; types sensible (EVDB and Wikipedia as community; DOE as testing_org). `low_confidence` used correctly except where noted. The Car Guide article is a journalist's trim list, recorded as `manufacturer` for trim-pack figures; acceptable because Nissan Canada's page backs the pack sizes, but only the trim mapping comes from the article.

## Required changes

1. **dc_max_kw for 24 kWh powertrains** (2013-s, 2014-s, 2016-s-24-kwh): cited page (EVDB 24 kWh MY14-17) says 46 kW, batch says 50. Use 46 with EVDB, or cite a Nissan page that states 50 kW for the 24 kWh pack.
2. **dc_max_kw for 2016-sv-30-kwh and 2017-s**: cited EVDB 30 kWh page says 47 kW, batch says 50. Same fix. (If the owner prefers the 50 kW "Nissan claim", cite the EVDB 40 kWh claim table and say it is borrowed from another pack; that is a weaker basis.)
3. **Ariya `battery.preconditioning` (all 22 powertrains)**: manuals unreadable here and silent on navigation; EVDB 87 kWh MY23-24 says not automatic via navigation, EVDB 63 kWh MY26 (Europe) says automatic via navigation. Relabel the 2023 and 2025 entries (now `manufacturer`) as `estimated`, naming the manual and EVDB 1305 together, keep low_confidence, and note the MY26 EVDB conflict. Re-open the manuals and quote the "Battery Heater" text before this goes live.
4. **Ariya FWD `published_10_80_min`** (2023-engage-fwd 35, 2023-evolve-plus-fwd 40, 2023-venture-plus-fwd 40, 2024/2025 engage-fwd 35, evolve-plus-fwd 40, venture-plus-fwd 40): the 2023 kit labels FWD times 20-80 %. Drop these, or keep only with a page that states 10-80 % for FWD (the Nissan Canada page's times were not visible when fetched).
5. **24 kWh chemistry for 2011-sv, 2012-sv, 2014-s (and 2015), 2016-s-24-kwh**: the estimate says cathode tweaks between years were not checked. Either find a page showing the 2014-2016 24 kWh pack kept the same cell (check whether the "Lizard"/revised 24 kWh pack changed the chemistry) or keep `other` flagged as unproven. Do not present as established.
6. **62 kWh `dc_max_kw` 100** (2019-s-plus, 2019-sv-plus, 2022-*-plus, 2023-sv-plus, 2024-sv-plus, 2025-sv-plus): value matches the kit, but EVDB shows 46 kW max and 44 kW 10-80 average, and the kit's own 45 min to 80 % does not fit 100 kW. Owner decision: record 100 as manufacturer, or 46 as the usable peak. Either way correct the note, since EVDB does not say its 46 kW is measured.
7. **2023-sv-plus, 2024-sv-plus, 2025-sv-plus `battery.capacity_gross_kwh`**: source is EV Database, kind says `manufacturer`. Set to `community`, and fix the note that says "Press kit says 62 kWh" (the 2024 kit says 60 kWh).
8. **Leaf 2026 S+ preconditioning**: confirm the S+ has the navigation grade ("applicable grades"), or mark it `manual_only` / drop it. For SV+ and Platinum+ the estimate is acceptable.
9. **Source note for `src-nissan-usa-leaf-2024-press-kit`**: says "10-80 % about 40 min (S) / 60 min (SV PLUS)"; the kit says 80 % in 40 / 60 min. Fix the note.
10. **Add sources** for the 2011 SV and CA 2012 SV port claim: https://canada.nissannews.com/en-CA/releases/ca-2011-nissan-leaf-press-kit and https://canada.nissannews.com/en-CA/releases/2012-nissan-leaf-specifications-3 (both show SV quick charge port "-" and 3.3 kW). Use them for the 2011-sv and 2012-sv port, dc_max and ac_max values.
11. **Consistency**: AC 3.3 kW (2011/2012 SV) versus 3.6 kW (2013+ S, nameplate with 3.3 output) for the same charger. Pick one convention and say which in the notes.
12. **Market caveat for Leaf CA cars** (2012 sv, 2013-2016, 2019-2025 powertrains listing CA): port and onboard-charger values rest on US kits only. 2011/2012 are covered by the Canada pages above; the rest are unproven for CA (accepted as low confidence if you want to keep them).

## Rule 14 (no unknowns)
No required field is empty for any covered powertrain. Fields where the value is carried only as a low-confidence estimate are listed above (Ariya preconditioning; 24 kWh chemistry; Leaf supercharger).
