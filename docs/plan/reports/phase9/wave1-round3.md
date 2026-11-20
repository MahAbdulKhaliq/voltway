# Wave 1, round 3: trim names and what's left (2026-11-19)

The owner chose a third research pass for the 53 labels still unnamed. Three were the IONIQ 5 Robotaxi ratings, which were already out, so 50 went to researchers. Each researcher could only fill a name from a page it opened. Results are in `research/trim-names-r3-{tesla,hyundai-kia,others}.csv`, and 779 of 802 labels now have a name.

## Applied (owner's standing rule: approve named clean and "yes" proposals)

| Car | Name(s) |
|---|---|
| Model 3 2018 Long Range AWD | CA + US |
| Model 3 2025 Long Range RWD | CA + US ("-I" rating) |
| Model Y 2020 Long Range AWD, Performance AWD | CA + US |
| Model Y 2023 RWD | CA |
| Model Y 2024 RWD (`tesla/model-y/2024/rwd`) | CA + US. It is separate from the existing `rwd-ca`, which is the "(Import)" rating. |
| Model Y 2025 Long Range RWD | CA + US |
| Model Y 2027 AWD, RWD | US (Tesla dropped "Standard") |
| Kona Electric 2025 N Line Ultimate | CA, the 19″ rating |
| EV6 2027 Long Range AWD (19″: Light Long Range, Wind), GT-Line AWD (20″) | US |
| LYRIQ 2024 AWD | CA + US |
| XC40 Recharge 2021 P8 / P8 eAWD | CA + US |

## Owner questions

1. **Rated but never sold.** Researchers found pages saying these cars were rated by the regulator but not sold in that market and year. Options: leave them out, or add them marked as not sold.
   - Model 3 2020 Long Range RWD and Mid Range (CA + US). InsideEVs, Nov 2019.
   - Model Y 2022 US Standard Range RWD. InsideEVs, Dec 2021.
   - IONIQ 6 2023 CA Standard Range. Guide Auto: every Canadian car has the 77.4 kWh pack.
   - EV6 2026 US GT and EV9 2026 US GT. Kia: "delayed until further notice".
   - i4 2025 and 2026 US eDrive35. Not on the US configurator or in BMW's 2026 release.
   - ARIYA 2026 US, all five ratings. Nissan cancelled the 2026 car for the US.
   - Polestar 2 2025 US Single Motor and Dual Motor without the Performance Pack.
2. **Model 3 2021/2022 Canada "Standard Range"** (151 km / 146 km). This is a distinct, shorter-range car sold only in Canada. The suggester paired it with the US Standard Range Plus (2021) and with RWD (2022), and both pairings look wrong. Recommendation: make it its own Canada-only car.
3. **LYRIQ 2026 "PAWD"** (EPA #49635, 319 mi). The researcher matched it to the standard AWD, but we already link EPA #49948 "AWD" to that car. Recommendation: treat it as a double EPA rating and keep the newer one, as we did for the Model 3.
4. **bZ 2026 Limited.** EPA has two Limited FWD ratings, 200 Ah and 191 Ah. The researcher found that round 2 had the bZ packs backwards: 191 Ah is the big 74.7 kWh pack. Recommendation: recheck the bZ pack and name mapping before applying either rating.
5. **ID.4 2024 Canada "S".** AutoTrader.ca names it "ID.4 S (62 kWh)". The suggester proposed the id `pro-s` on the 77 kWh Pro S powertrain, which is wrong. Recommendation: make it a trim on the existing 62 kWh `standard-range` car, or its own car on that powertrain.
6. **Silverado EV 2024 (US).** EPA has two ratings, both labelled "Silverado EV": 393 mi (3WT) and 450 mi (4WT). They need splitting by range before they can be named.
7. **Still unnamed:**
   - IONIQ 9 2027 US AWD, AWD Performance and RWD. No 2027 US trim list is published yet.
   - ID.4 2025 Canada S. No reachable page lists it.
8. **Weak-pair "check" rows still open.** Under the owner's rule these are kept apart as a Canada car and a US car:
   - Equinox EV 2024 AWD/eAWD;
   - Model Y 2022 and 2023 AWD (Canada "AWD", US "Standard Range AWD");
   - bZ 2023 L / Limited;
   - EV6 2023 Standard Range RWD / Light RWD.

Still held from before: Kona 2025 CA Preferred, EV9 2025 Land, EPA #50036, IONIQ 5 and C-HR 20″ pairs, Solterra 2026 US ×2, and the legacy Mach-E links.
