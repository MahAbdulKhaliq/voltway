# Fact-check: round 3 wheels, BMW / MINI / Mercedes / Rolls-Royce / Maserati / Jaguar

Batch: `research/batch-2026-11-20-r3-wheels-bmw-mb.json` (169 variants, 154 sources). Checked 2026-11-20.

**Verdict: FIX** (4 items; everything else I opened matches).

- `npx tsx scripts/add-facts.ts <batch> --check`: OK (1367 variants, 1441 sources after applying).
- Banned sources (iSeeCars, Tire Wheel Guide, Unplugged Performance, EVChargingStations.com): none. Domains cited: Cars.com 143, newsroom.bmwgroup.com 4, guideautoweb 2, driveclean.ca.gov 2, mbusa 1, greencars 1, bmwblog 1.
- No variant in this batch has more than one maker trim in `data/variants`, so the "one trim's page read for a multi-trim variant" check finds nothing here.
- No contradiction with wheels already in `data/variants` (none of these trims had round 2 wheels). Contradictions with regulator rows are in the fix list (items 2 and 3).
- About 48 pages reopened. All Cars.com pages were readable.

## Results

| Variant | Field | Value | Result | Evidence |
|---|---|---|---|---|
| bmw/i3/2017/i3-60-ah | wheels | 19 S | ✅ | "Front wheel size: 19 x 5 in", trim 60 Ah, MY2017 |
| bmw/i3/2019/i3s-120-ah | wheels | 20 S | ✅ | "20 x 5.5 in" front, trim s 120 Ah |
| bmw/i4/2023/edrive40 | wheels | 18 S, 19 o | ✅ | 18 x 7.5 std; M Sport Package 19" |
| bmw/i4/2023/m50 | wheels | 19 S | ✅ | "19 x 8.5 in"; page lists no 20 in option (regulator row adds 20 o) |
| bmw/i4/2024/m50 | wheels | 19 S, 20 o | ✅ | 19 x 8.5 std; Cooling & High Performance Tire Package 20" |
| bmw/i4/2024/edrive35 | 19 o | bmwblog | ✅ | "ships from the factory with 18-inch wheels"; 18/19 on eDrive40 |
| bmw/i4/2026/edrive40-gran-coupe | wheels | 18 S | ✅ | "18 x 7.5 in", MY2026 eDrive40 |
| bmw/i5/2026/xdrive40 | wheels | 19 S | ✅ | "19 x 8.5 in", xDrive40 Sedan 2026 |
| bmw/i7/2024/m70-xdrive | wheels | 21 S | ✅ US | "21 x 9 in" (see item 3, regulator conflict) |
| bmw/i7/2025/xdrive60 | wheels | 20 S | ✅ US | "20 x 9 in" (see item 3) |
| bmw/i7/2027/50-xdrive | wheels | 20 S, 21 o | ✅ | 50 xDrive 20 x 9; M Sport Professional "21" Star-Spoke" |
| bmw/i7/2027/60-xdrive | wheels | 20 S, 21 o | ✅ | 60 xDrive page, same packages |
| bmw/ix/2023/xdrive50 | wheels | 20 S, 21 o | ✅ | 20 x 8.5; Sport Package 21" |
| bmw/ix/2023/m60 | 21 S | ✅ | "21 x 9 in" |
| bmw/ix/2023/m60 | 22 o | ✅ | CA newsroom: "22-inch aerodynamic wheels ... are optional"; the Cars.com page lists no option |
| bmw/ix/2024/m60 | wheels | 21 S | ✅ | "21 x 9 in" |
| bmw/ix/2023/xdrive40 | wheels | 20 S low | ✅ | Guide Auto 2023: "P235/60R20" |
| bmw/ix/2024, 2025 xdrive40 | wheels | 20 S low | ⚠ unverifiable | cited Guide Auto 2025 page: tire line not shown in my read; already low_confidence |
| bmw/ix4/2027/50-xdrive | 20 S, 21 o, 22 o | ✅ | newsroom: "20-inch M alloy wheels"; "ranging in size from 20 to 22 inches" (21 is inferred) |
| bmw/ix5/2027 | 21 S, 22/23 o low | ✅ low | X5 statement only; "no iX5-specific line", low_confidence correct |
| bmw/i3-sedan/2027 | 19 S, 21 o low | ✅ low | "comes standard with 19-inch"; 21 is lineup-wide ("19 to 21 inches") |
| mini/cooper-se/2021 | 16 S, 17 o | ✅ | 16 x 6.5; Signature Plus/Iconic 17" |
| mini/countryman-se/2026 | 18 S, 19 o | ✅ | 18 x 7.5; JCW Style package 19" |
| mercedes/eqs/2025 sedan 580 | 21 S | ✅ | sedan page "21 X 9.5 in" |
| mercedes/eqs/2026 sedan 580 | 20 S | ✅ | page: "20 x 8.5 in", MY2026 sedan; MBUSA EQS sedan page: "Standard 20-inch wheels" (not trim-specific) |
| mercedes/eqs/2022 AMG EQS | 21 S | ✅ | "21 X 10 in" |
| mercedes/eqs-suv/2023 580 | 21 S | ✅ | "21 x 9.5 in" |
| mercedes/eqs-suv/2024 450 | 21 S | ✅ | "21 x 9.5 in" |
| mercedes/eqs-suv/2025 580 | 21 S | ✅ | "21-inch aluminum, 9.5-inch wide" |
| mercedes/eqs-suv/2025 Maybach 680 | 21 S | ✅ | "21 x 9.5 in" |
| mercedes/eqe/2024 350 sedan | 20 S | ✅ | "20 x 9 in" |
| mercedes/eqe/2023 350 | 19 S low | ✅ low | "19 x 8 in" (page is the 2023 index) |
| mercedes/eqe-suv/2025 AMG | 21 S | ✅ | "21 x 9.5 in" |
| mercedes/eqb/2024 350 | 19 S | ✅ | "19 x 7.5 in" |
| mercedes/cla/2026 350 | 18 S, 19 o | ✅ | front 18 x 7.5; Launch Edition 19" |
| mercedes/g-580/2026 | 20 S | ✅ | "20 x 8.5 in" |
| mercedes/glc/2027 400 | 20 S | ✅ | "20 x 8 in" front |
| mercedes/amg-gt-4-door/2027 55, 63 | 20 S low, 21 o low | ❌ | MBUSA: "20-inch and forged-alloy 21-inch designs"; says nothing on which is standard. See item 1 |
| rolls-royce/spectre/2024/spectre | 22 S, 23 o low | ✅ | 2024 page "22 x 8.5 in"; 2025 page Enhancement Package "23" Wing Spoke" |
| rolls-royce/spectre/2026-27/spectre | 22 S, 23 o | ✅ | 2027 page: 22 std, Enhancement Package 23" |
| rolls-royce/spectre/2025 BB (source for 2024 BB) | 23 | ✅ | 2025 Black Badge page "Front: 23 in" |
| rolls-royce/spectre/2027/black-badge | 23 S | ✅ | BB 2027 page "23 in, forged" (EPA row says 22 S, see item 2) |
| rolls-royce/spectre/2024/black-badge | 23 S, 22 o | ⚠ | DriveClean: both a 22 in and a 23 in BB exist for 2024 and 2025; neither page says which is standard. See item 2 |
| maserati/granturismo-folgore/2025 | 20 S | ✅ | front "20 x 9.5 in" (rear 21) |
| jaguar/i-pace/2019/ev400 | 18 S, 20 S | ✅ | S AWD 18 x 7.5; SE AWD 20 x 8 (spans S and SE, so both standard is right) |

## Weak spots you asked about

- **iX M60 22 in option:** verified for Canada 2023 (BMW Canada newsroom: "22-inch aerodynamic wheels ... are optional"). OK.
- **EQS 580 2026 at 20 in:** the 2026 sedan page lists 20 x 8.5 and MBUSA's EQS sedan page says "Standard 20-inch wheels". Accept. The note already records the 21 in on earlier years. No change needed.
- **AMG GT 4-Door 20 in standard:** not supported (item 1).
- **Spectre Black Badge 2024:** see item 2.

## Fix list

1. **AMG GT 4-Door, both variants (`amg-gt-55-4matic-plus-4-door-coupe`, `amg-gt-63-...`):** the 20 in standard flag is an assumption. MBUSA only says AMG wheels come "in a range of 20-inch and forged-alloy 21-inch designs", GreenCars says nothing about standard, and a search turned up a report of 19 to 21 in. The 63 and 55 may differ. Drop the entries until a trim page or press kit states the standard size. If the owner wants a value for "no unknowns", keep them as `low_confidence` but reword the notes to say "standard size not stated".
2. **Spectre Black Badge 2024 (`black-badge-spectre`):** DriveClean confirms that two BB configurations exist (22 in and 23 in) for 2024 and 2025, but not which is standard. Cars.com says 23 in only for the 2025 page. The NRCan row already in the merged data says 22 S / 23 o. Make the notes say that the standard size is not stated and that the 23 in comes from the 2025 Cars.com page. Keep both `low_confidence`. Also, for `2027/black-badge-spectre` (23 S from the BB 2027 page, correct), the merged data still has an EPA row 22 S, so the car will show two standard sizes. Add a note or a 22 o entry.
3. **i7 xDrive60 and M70, 2024-26 (6 variants):** the batch says 20 S (xDrive60) and 21 S (M70) from the US pages (correct for the US). Merged data has NRCan rows 19 S, 20 o, 21 o (xDrive60) and 20 S, 21 o (M70). The "Canadian car assumed same as US" note therefore contradicts Canadian data. Mark these `low_confidence` and name the conflict in the notes, or add the Canadian sizes. The merged car will otherwise show two standards.
4. **Grecale Folgore 2026-27:** batch 20 S (page-verified for 2026); EPA rows in merged data are 19 S, 20 o, 21 o. Same two-standards issue; add a note. The `2027` entry is a carry, already low.

Other notes, no action needed:
- Batch omits 22 o for iX M60 2024-25 and some i5 / i4 options that regulator rows already provide; they stay as options.
- Source ids on Guide Auto iX 2024-25 point at the 2025 page, which I could not confirm shows a wheel or tire line. Low confidence already covers it.
