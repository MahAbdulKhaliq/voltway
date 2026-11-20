# Check: research/curves-2026-11-19-gm-ford.json

**Verdict: FIX.** `add-facts.ts --check` passes. The curve points match the InsideEVs table exactly, so the 2021 Extended Range eAWD curve is fine. The same points on California Route 1 and GT are borrowed curves filed as `tested`, and nothing in the repo proves those cars share the pack or hardware.

`npm run data:build` printed its summary lines (491 cars). An early run also hit an `rm` error on `public/data` (a file lock), and the rerun was clean.

## Table

| Variant / curve | Field | Value | Result | Evidence |
|---|---|---|---|---|
| extended-range-eawd `insideevs-2021` | points 5/10/20/30/40/50/60/70/80/90/100 % | 145/106/107/106/97/78/79/80/74/12/2 kW | ✅ verified | The page table gives 145, 106, 107, 106, 97, 78, 79, 80, 74, 12 and 2 kW. All 11 rows match, including the peak. |
| same | car, pack | Launch Edition AWD ER, 98.8 kWh gross / 88 kWh usable | ✅ | The page says Launch Edition AWD, Extended range, 99 kWh total, 88 usable, on an Electrify America charger. |
| same | kind `tested`, conditions unknown | | ✅ | An independent measured session. Ambient temperature is not stated, so "unknown" is right. |
| same | shape cross-check (second source) | | ✅ | The second page says 159 kW at the start, about 112 kW at 7-10 %, 106-107 kW at 11-27 %, 95-97 kW at 31-37 % and 76-80 kW at 40-77 %. Above ~80 % it says about 12 kW. All of this matches the batch notes. |
| same | `valid_from` 2021-03-08 | | ⚠ unverifiable | Neither page gives this date. The first article is dated 2021-04-27. |
| same | note "21P22 update lifted >80 % to 40-45 kW" | | ⚠ unverifiable | Neither cited page says it. Remove it or cite a source. |
| california-route-1 `insideevs-2021` | identical 11 points | | ❌ borrowed curve labelled `tested` | The curve was measured on a different car (Launch Edition AWD). It should be a `based_on` curve (rule 9). Repo data for `california-route-1` and `california-route-1-e` has capacity, voltage, chemistry and `dc_max_kw` all null, so the match is unproven. The variants are RWD (single motor), while the test car is AWD, and no source states the charger hardware. The notes' "150 kW" has no citation. |
| gt `insideevs-2021` | identical 11 points | | ❌ borrowed curve labelled `tested` | Same problem. `gt` and `gt-e` have all pack and DC fields null in the repo. The GT has different motors, and nothing cited supports "same pack, 150 kW". `low_confidence` is set, but that does not fix the labelling. |
| all three | curve plausibility (rule 13) | | ⚠ partly | There are 10 points below 100 % and the largest gap is 10 %. The peak is 145 kW at the first point. Repo `dc_max_kw` is null for all three powertrains, so "peak within 5 % of `dc_max_kw`" cannot be checked. Ford's 150 kW is in the notes only. The second source sees 159 kW (6 % above 150). |
| all three | fit with existing data (rule 11) | | ⚠ nothing to compare | No existing curves or pack figures exist for these cars. |
| all three | source quality (rule 10) | | ✅ | The URLs are specific, `accessed_on` is set and the type is `testing_org`. |

## Required changes

1. For `ford/mustang-mach-e/2021-california-route-1` and `ford/mustang-mach-e/2021-gt`, do not publish the points as an independent `tested` curve. Either drop them, or add the pack, DC peak and hardware facts first. Those facts need sources, for example the Ford 2021 spec for 98.8/88 kWh and 150 kW on the GT and Route 1. Then express the curve as `based_on` the eAWD curve with the sibling's `source_id`. Without that proof, drop them.
2. On the eAWD curve, remove or source the `valid_from: 2021-03-08` date and the "21P22 update ... 40-45 kW" claim.
3. Note the 159 kW start from the second source in the curve notes. The batch already does this, and the 145 kW table peak is fine for a tested curve.
4. Rule 14 (no unknowns): the three powertrains still have `capacity_usable_kwh`, `dc_max_kw`, `chemistry`, `nominal_voltage_class`, `charge_port`, `ac_max_kw`, `supercharger_access` and `preconditioning` all empty. This is per `research/powertrain-gaps.json`. The batch only adds curves and fills none of these. The curve implies 88 kWh usable and 98.8 kWh gross for the eAWD, and these still need sourced entries (the gaps file also covers the `-e` RWD variants).

## EVChargingStations (evchargingstations.com) in `data/curves/`

- **No curve file in `data/curves/` cites that site.** `data/curves/` holds only 7 files (Hyundai, Kia, Subaru, Toyota). Their source ids are InsideEVs and Evercars only.
- The Silverado `statecharge-rst-2024` and LYRIQ `statecharge-2024` curves from the 2026-11-15 ultium-large batch were dropped in that batch's fix round. See `research/batch-2026-11-15-ultium-large.check.md`, line 60. The `NOTES.md` line at about 143 is stale. The Silverado and LYRIQ curve files do not exist in `data/curves/`.
- The site does appear as non-curve sources, which is a separate question for the owner:
  - `data/sources/src-evchargingstations-2027-blazer-ev-nacs.json`, cited by `data/variants/chevrolet/blazer-ev/2026/standard.json` (`charge_port` ccs1).
  - `data/sources/src-evcs-2027-silverado.json`, cited for `charge_port` ccs1 in `data/variants/chevrolet/silverado-ev/2026/`: `lt-ext-range`, `lt-std-range`, `trail-boss-ext-range`, `wt-ext-range`, `wt-max-range` and `wt-std-range`.
- These are single facts read from news articles. Whether they count as "compiling a database" under Sections 2 and 7 of the terms is the owner's call. I did not fetch the terms page.
- The Nissan batches also matched a "state of charge" grep, but that is generic text, not this site.
