# Fact-check: round 3 wheels, GM / Volvo / Nissan / Subaru / Toyota / Lexus / VinFast / Dodge / Jeep / Fisker / Mazda / Tesla / Rimac

Batch: `research/batch-2026-11-20-r3-wheels-gm-rest.json` (248 trims, 164 sources). Checked 2026-11-20.

**Verdict: FIX** (3 must-fix items, 3 smaller ones).

- `npx tsx scripts/add-facts.ts <batch> --check`: OK (1367 variants, 1453 sources after applying).
- Banned sources (iSeeCars, Tire Wheel Guide, Unplugged Performance, EVChargingStations.com): none. But Auto-Data is cited (item 3) and its terms bar reuse.
- About 55 pages reopened across all 13 makes. All Cars.com pages were readable; news.gm.com was not tried (403 per researcher, not worked around).
- Contradictions with round 2 wheels in `data/variants`: the Leaf 2024-25 SV 16 in (item 1). Lyriq 2025 `standard` already has 20 S, consistent, but see item 5.
- Variants that cover several maker trims with non-low entries: the ones I checked list sizes from two pages (LT and RS, Core and Ultra) or are single-trim variants. Volvo EX90 2026 single motor is a single trim (Plus only on Cars.com). No non-low multi-trim entry found that rests on one trim's page.

## Results

| Variant | Value | Result | Evidence |
|---|---|---|---|
| cadillac/celestiq/2025-26 | 22 S low | ⚠ | Guide Auto: "P285/40R22", no wheel line. GM press (news.gm.com, not opened) reportedly says 23 in; search shows GM launch release "23-inch" and a Cadillac accessory "22x9-Inch Forged" wheel, so both exist. Left as low, see item 6 |
| cadillac/escalade-iq/2026 premium-luxury | 24 S | ✅ | "Front wheel size: 24 x -TBD- in", Premium Luxury 2026 |
| cadillac/escalade-iql/2027 premium-sport | 24 S | ✅ | "24-inch aluminum", Premium Sport |
| cadillac/lyriq/2024 | 20 S, 22 S low | ✅ | Sport w/1SK "22 x -TBD- in", 275/40R22 |
| cadillac/lyriq/2026 | 20 S, 22 S | ✅ | Signature Sport "22-inch" |
| cadillac/lyriq-v/2027 | 22 S | ✅ | "22 x -TBD- in" |
| cadillac/optiq/2026 | 20 S low | ✅ | Sport "20 x -TBD- in" |
| cadillac/optiq-v/2026 | 21 S | ✅ | "21 x -TBD- in", V |
| cadillac/vistiq/2026 | 21 S, 22 S | ✅ | Platinum "22 x -TBD- in", 295/40R22 |
| chevrolet/blazer-ev/2024 awd | 19 S, 21 S | ✅ | RS "21 x -TBD- in"; 19 from LT page |
| chevrolet/blazer-ev/2024 rwd, rs-rwd | 21 | ✅ | RWD RS "21" |
| chevrolet/blazer-ev/2026 ss-awd | 22 S | ✅ | AWD SS "22-inch" |
| chevrolet/blazer-ev/2026 lt-rs-awd | 19, 21 | ✅ | RS "21-inch"; LT 19 |
| chevrolet/blazer-ev/2026/standard `22-in-wheels` | 22 S low | ⚠ accepted | 22 in is page-verified for the SS only; the trim is a regulator row named "(22" Wheels)" and no page ties it to a trim. low_confidence correct. See item 6 |
| chevrolet/bolt/2027 | 17 S | ✅ | "17 x -TBD- in", 215/50R17 |
| chevrolet/equinox-ev/2026 | 19 S, 21 S | ✅ | RS "21 x -TBD- in" |
| chevrolet/silverado-ev/2025 lt-rst-er | 18 S, 24 S | ✅ | RST "24 x 9.0 in" |
| chevrolet/silverado-ev/2026 extended-range | 18 S, 24 S | ✅ | RST "24 x 9 in" |
| chevrolet/spark-ev/2015 | 15 S | ✅ | "15 x 6 in" front |
| gmc/hummer-ev-pickup/2024 3x | 22 S | ✅ | "22 x 9.5 in" |
| gmc/hummer-ev-suv/2025 3x | 22 S | ✅ | "22 x 9.5 in" |
| gmc/sierra-ev/2026 standard-range | 18 S, 22 S | ✅ | Denali "22 x 9 in" |
| volvo/ex40/2021/p8 | 19 S | ✅ | "19 x 7.5 in", P8 Pure Electric |
| volvo/ec40/2025 single-motor-er | 19 S | ✅ | RWD Core "19 x 7.5 in" |
| volvo/ex40/2026 single-motor-er-rwd | 19 S | ✅ | Plus "19 x 7.5 in"; page does not give the other trims' wheels |
| volvo/ex90/2026/single-motor | 20 S | ✅ | Single Motor Plus "20 x 8.5 in"; the only single-motor trim listed |
| volvo/ex30/2026 | 19 S low | ✅ | Core "19 x 8 in" |
| nissan/leaf/2016/sv-30-kwh | 17 S | ✅ | "17 x 7 in" |
| nissan/leaf/2022/sv | 17 S | ✅ | "17 x 6.5 in" |
| nissan/leaf/2024, 2025 sv | 16 S, 17 S (both low) | ❌ | see item 1 |
| subaru/solterra/2023, 2025 limited | 20 S | ✅ | "20 x 7.5 in" |
| subaru/trailseeker/2027 premium-awd | 18 S | ✅ | "18 x 7.5 in" |
| subaru/uncharted/2027 gt-awd | 20 S | ✅ | "20 x 7.5 in" |
| toyota/bz4x/2025 nightshade | 20 S | ✅ | "20 x 7.5 in" |
| toyota/bz/2027 limited-awd | 20 S | ✅ | "20 x 7.5 in" |
| lexus/rz/* luxury / signature | see item 2 | ❌ | wrong mapping |
| lexus/rz/2026 rz-350e-signature-fwd | 18 S low | ✅ | RZ 350e Premium "18 x 7.5 in" |
| vinfast/vf-7/2025, 2027 plus | 19 S low | ✅ low | vinfastauto.id: "With 19-inch alloy wheels, the VF 7 Plus ..." (Indonesian market) |
| vinfast/vf-8/2024 plus | 20 S | ✅ | "20 x 8 in" |
| vinfast/vf-9/2024 plus | 21 S | ✅ | "21-inch" |
| dodge/charger-daytona/2026 r-t | 18 S, 20 o low | ✅ | R/T 18 x 8.5; Performance Handling Group "20 x 11 in" |
| jeep/wagoneer-s/2024 | 20 S | ✅ | Launch Edition "20 x 8.5 in" |
| fisker/ocean/2023 extreme | 20 S | ✅ | "20 x 7.5 in" |
| mazda/mx-30/2024 (CA) | 18 S low | ✅ low | US 2022 FWD "18 x 7 in"; the CA 2024 car is a carry, low is right |
| tesla/cybertruck/2026 dual-motor | 18 S | ✅ | "18 x 8.5 in" |
| tesla/cybertruck/2026 premium-awd | 20 S low | ✅ | "20 x 9 in" |
| tesla/model-y/2027/l | 19 S | ⚠ | page "19 x 9.5 in" (Premium Launch Series AWD); merged data has EPA row 20 S. See item 4 |
| rimac/nevera/2024, 2025 | 20 S low | ❌ | Auto-Data page says "275/35 R20" / "315/35 R20" but its terms bar reuse. See item 3 |

## Weak spots you asked about

- **Celestiq:** the tire code supports 22 in, GM's launch material says 23 in, and an accessory 22x9 forged wheel exists. Unresolved, low_confidence is right. See item 6.
- **Rimac Nevera / Auto-Data:** terms of use (https://www.auto-data.net/en/terms-of-use) bar "copy, download in bulk, reproduce", automated collection and extraction of "a substantial part" of the database, and AI use, without written permission. Treat as banned like iSeeCars.
- **VF 7:** Indonesian page does state "19-inch alloy wheels" for the Plus. Wheels may differ by market, so low_confidence is right. OK.
- **Lexus RZ mapping:** wrong, see item 2.
- **Leaf 2024-25 SV:** wrong, see item 1.
- **Blazer EV 2026 "22-in-wheels":** accepted as low (see table).
- **Spectre, EQS, AMG GT, iX M60:** in the BMW/MB check file.

## Fix list

1. **Nissan Leaf 2024 and 2025 `sv`:** drop the 16 in entries. The 16 x 6.5 steel wheel is the S trim (page: "2024 Nissan Leaf S Hatchback ... 16 x 6.5 in, steel"), and `nissan/leaf/2024/s` and `2025/s` already carry 16 S from round 2. The `sv` variant's trims are CA "SV" and US "SV PLUS". Cars.com has US SV PLUS pages for both years (`nissan-leaf-2024/specs/442396/`, `nissan-leaf-2025/specs/454225/`, already cited by the `sv-plus` variants). Use those for the 17 in entry instead of the 2022 SV page, and remove the "this SV is not listed" note. Check the 17 in on the SV PLUS pages before dropping `low_confidence`.
2. **Lexus RZ 2023-26 (`rz-450e-luxury-awd`, `rz-450e-signature-awd`):** the batch's mapping is reversed against `data/variants`. The data says Signature = US "RZ 450e Premium AWD" (CA Signature), Luxury = Luxury. The Luxury page (452533 / 482178) shows 20 x 8 front / 20 x 9.5 rear. So:
   - `luxury-awd`: 20 S only (drop the 18 S taken from Premium).
   - `signature-awd` (US Premium): 18 S, with 20 as an option (the page lists "Premium AWD with 18" wheels" and "Premium AWD with 20" wheels" at different prices). The NRCan row in the merged data already says 18 S for Signature.
   - The 2026 `rz-350e-signature-fwd` entry already uses the Premium page (18 S), which is consistent with this mapping and inconsistent with the 450e Signature entries.
   Keep `low_confidence`.
3. **Rimac Nevera 2024 and 2025:** remove both entries (and the `src-r3w-autodata-nevera` source). Replace with a non-restricted source (Rimac press kit, Wikipedia, or a press review stating the wheel sizes). Separately, tell the owner that `src-autodata-*` sources already in `data/sources` (b-class-ed, equinox-ev-89, i4-edrive35, lyriq-102, spark-ev-19, and others) have the same terms problem; that is outside this batch.
4. **Tesla Model Y L 2027:** Cars.com page shows 19 in only (Premium Launch Series AWD), but the merged data has an EPA row 20 S. Add a note (or a 20 o entry if a page states 20 in is available) so the car does not end up with two standards.
5. **Lyriq 2025 `awd` / `rwd`:** the batch adds 20 S and 22 S (low) only to the `19-2-kw-charger` trim, while the `standard` trim keeps the round 2 20 S only. Both trims map to the same maker trims; add the 22 in entry (same source, low) to `standard` for consistency, or the two trims will show different wheel lists. Same pattern: Fisker Ocean 2024 regulator rows list 22 o that neither the batch nor Cars.com shows (no action required).
6. **Celestiq 2025 and 2026 (optional):** keep 22 S low. Add to the notes that GM's launch release (read via a search snippet, not opened) says 23 in and that a Cadillac accessory 22x9 forged wheel exists, so the true standard size is open. If a readable GM or press page confirms 23 in, add it.
