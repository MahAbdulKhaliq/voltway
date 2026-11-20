# Waves 2–3: every other BEV make and model — owner review (2026-11-19)

**State:** local only; nothing pushed.

## Catalogue

- **Mapped:** 99 new models across the new makes. All 2,911 NRCan/EPA ratings are mapped to a model (`npx tsx research/catalogue-coverage.ts`).
- **New cars:** 912. They were applied under your standing rule (named, clean proposals plus "yes" recommendations), so the crosswalk notes say "Approved by the owner 2026-11-20 (B90 wave 1)".
  - That wording comes from the apply script. These rows are standing-rule approvals and still need your review.
  - The site now has 1,403 cars.
- **Escalade IQ and IQL (B97):** 5 cars built from GM's figures, with no regulator rating.
  - GM's own pages block fetches, so most values come from GM figures relayed by Wards, Cars.com, Consumer Guide and others. All are marked low confidence.
  - The IQL is its own model, because Cadillac sells it as a separate nameplate. Keep it that way, or make the IQL a set of IQ trims?
- **Held, not applied** (`docs/plan/reports/phase9/w2-held-rows.csv` and `crosswalk/catalogue-review.csv`):
  - 18 proposals that need checking:
    - CA/US pairs matched only by motor power: Equinox 2024 AWD, Prologue 2024, bZ 2023 L, ID. Buzz 2025, Uncharted 2026 FWD;
    - Mach-E Rally 2024/25;
    - Polestar 2 BST 270;
    - Solterra 2026 US trims;
    - Tesla 3/Y/S rows with no researched name.
  - Lucid Gravity wheel and seat options: 20 EPA ratings for different wheels and 2- or 3-row seating. The scripts don't read "w/20F21R" as a wheel size. Each Gravity trim currently carries its base rating only.
  - 7 ratings whose proposed id clashed with an existing car. Their trim names suggest a different car from the one their powertrain points to (e.g. an IONIQ 5 "Preferred Long Range" rating on the Standard Range powertrain):
    - Lyriq 2026 PAWD;
    - IONIQ 5 2025;
    - EV9 2025 Land;
    - Model 3 2026 Performance;
    - bZ 2026 Limited FWD;
    - ID.4 2024 and 2025 S.
- **Dropped as not sold to the public** (`crosswalk/not-sold.csv`):
  - BYD e6 (US fleet only);
  - Scion iQ EV (carsharing);
  - VinFast VF 6 2025 US;
  - BMW ActiveE (field trial);
  - 2026 Acura ZDX (cancelled);
  - US 2020 Soul EV;
  - Genesis Electrified G80 US 2026;
  - Volvo EC40 US 2025;
  - Ioniq 5 robotaxi;
  - EV6 and EV9 2026 GT (delayed).

## Trim names

- **Named:** 2,754 of 2,808 labels.
- **Thinly sourced:** many waves 2–3 names. Audi, Mercedes, Porsche and the misc group rest mostly on Wikipedia or on rules applied without opening a page. They are marked "UNSURE" in `crosswalk/trim-names.csv`; a quick scan of the Cars page is the fastest way to spot wrong ones.

## Decisions for you

1. **bZ4X naming.** The 2023–25 cars show as "bZ", and the Cars page defaults to the newest two years. Use a per-year model name ("bZ4X" up to 2025)?
2. **Heavy trucks no regulator lists** (Hummer EV pickup 2022–23, Sierra EV 2024 Denali Edition 1): should B97 cover them like the Escalade IQ?
3. **Model splits:**
   - 2027 Bolt as its own model, or a generation of the Bolt EV?
   - Optiq-V: separate model, or kept apart from the Optiq?
   - C40/EC40 combined;
   - e-tron and Q8 e-tron combined;
   - iX4 separate;
   - `bmw/i3-sedan` (the China i3) kept?
4. **Jaguar I-PACE 2021 US:** EPA lists it, but reports say the 2021 model year was skipped. Kept as sold for now.
5. **Lordstown Endurance 2023:** fleet-focused. Kept as sold for now.
6. **Tesla Model S 2021** straddles the Raven/Plaid change, so that powertrain's generation is left unset.
7. **EQE/EQS SUV mapping** depends on fragile label prefixes. Q4 e-tron 2024 mixes launch and update hardware.
8. The B96 decisions in `b96-review.md` still stand.

## Specs (11 groups + Escalade IQ, applied)

Every group was fact-checked, fixed and then applied. Fields with no allowed basis (same hardware elsewhere, same-pack sibling, same-cell ratio, lineup-wide feature) were left empty for you; validate fails on those cars until you decide (list in `research/powertrain-gaps.json`).

**Questions from the spec batches:**
1. **AC charger, standard vs optional:** Porsche (9.6 vs 11 kW Cayenne; 11 vs 19.2/22), Tesla, Audi, Maserati (11 vs 22). We store the standard unit. OK?
2. **Chemistry `nmc` estimates** where no page names it (Audi e-tron/Q8/GT, e-Golf, older Hyundai/Kia/Genesis, Mercedes EQB/G 580/B-Class/smart). Keep as low-confidence estimates or leave empty?
3. **Peak figures that disagree:** Cybertruck 325 kW display vs 250 kW stated; Stellantis 183 vs 203 kW; Rivian R2 217 vs 229; Rivian Max 210; Gen 2 Large 220 vs 215.
4. **Supercharger access:** `no` set where a car is absent from Tesla's NACS table; pre-2025 Audi `via_adapter` vs `no`; Canadian evidence is thin.
5. **Labels:** `other` for LMO cells (early Leaf/i-MiEV); Mercedes bare pack figures read as usable; i3 preconditioning `manual_only` vs `none`; Tesla MCU1 preconditioning.
6. **Hardware calls:** 2025 Hummer SUV 3X pack; Celestiq estimates; Polestar 3 2026 800 V and the CA/US split (repo 2026 data is itself inconsistent: gross 106, usable 107); 2026 i5 NACS build-date cut; Q8 NCA from one source.

## Curves (3 batches, applied: 3f2d149, ad1a18d, 3df32cd)

Fastned graphs (read with curl, robots allows), InsideEVs and Out of Spec. All points were re-fetched by the fact-checker and match.
- **Borrowed, low confidence:** Q4 e-tron (Fastned's graph is a copy of the ID.4), Macan (copy of Q6), EQS SUV (copy of EQS sedan), EQE SUV, A6. Same series shown on two pages, marked low confidence: Polestar 3/EX90 2025, GV60/GV70, Ioniq 38/Soul 39, RZ 450e/Solterra/bZ4X.
- **Held for you:**
  7. **Model S/X (23 cars):** Fastned's only curve peaks at 218 kW, the EU CCS2 cap; the cars do 250 kW here. Use it anyway (low confidence) or keep the estimate?
  8. **Polestar 4:** Fastned peaks at 212.6 kW and lists 210; Polestar US/CA states 200. Raise dc_max_kw to Fastned's 210 (measured) so the full curve passes, or keep 200 and hold the curve?
  9. **2027 Bolt:** a sparse Out of Spec curve (8 points, 22 % gaps). Show it or keep the estimate?
  10. **2017–19 Bolt:** the curve peaks at 46 kW; our dc_max_kw is a 55 kW estimate, other sources say 50. Change to 50?
- **Dropped:** Plaid and Air Dream merges (too few true measurements), Sapphire borrowing the 2021 Dream test, Polestar 3 2026 and RZ 300e (pack mismatch), e-tron 2019/20/23.
- 11. **Fastned reuse terms** are unconfirmed. Needed before any push.

## Still open

- Gap-fill research for the empty required fields is running; its batch gets fact-checked before it's applied.
- Full checks (validate, tests, build) run once that lands.
