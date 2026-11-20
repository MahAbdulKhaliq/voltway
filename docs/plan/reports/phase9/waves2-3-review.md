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

## Still running

Spec research for the 912 new cars (11 groups) and the Escalade fact-check, then curve research. Validate fails on B96 for the new cars until those batches land.
