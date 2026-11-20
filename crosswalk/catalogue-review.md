# Catalogue review: wave 1

Generated 2026-11-20 by `npm run suggest:catalogue -- --wave 1` (B90, DESIGN-9 §2). **Nothing here is live.** Each proposal is one variant: a model year × pack × drivetrain × market edition. Rows from NRCan (Canada) and EPA (US) are paired when their trim words and drivetrain agree; otherwise each country gets its own variant (B91).

How to review: in `crosswalk/catalogue-review.csv`, set `approved` to `yes` on the rows to keep (all rows of a proposal), edit `trim_ca` / `trim_us` / `variant_id` / `powertrain` where they are wrong, then run `npm run suggest:catalogue -- --wave 1 --apply`. Flags: ⚠ code = NRCan letter code (plant or certification, not a trim name), ⚠ date = mid-year change, ⚠ pair = Canada/US pairing is a guess, ⚠ name = trim name needs a check.

27 proposals from 40 regulator rows (25 mapped models): 5 clean (no ⚠, `check` empty in the CSV), 22 to check.

## cadillac/lyriq

- **2026 US: AWD** → `cadillac/lyriq/2026/awd` [US] awd · powertrain cadillac/lyriq/2026-awd · ⚠ powertrain: same name as cadillac/lyriq/2025/awd; check the pack didn't change
  - **Recommend:** yes: shares hardware with the same-named car of the same generation (pack not re-checked)
  - EPA: LYRIQ PAWD
## chevrolet/equinox-ev

- **2024 CA: AWD · US: eAWD** → `chevrolet/equinox-ev/2024/awd` [CA, US] awd · powertrain chevrolet/equinox-ev/2026-awd · ⚠ pair: names differ, same motor power (247 kW); powertrain: same name as chevrolet/equinox-ev/2025/awd; check the pack didn't change
  - **Recommend:** check: paired only by motor power and the names differ: keep apart as a Canada car and a US car (owner rule)
  - NRCan: Equinox EV AWD
  - EPA: Equinox EV AWD
## chevrolet/silverado-ev

- **2024 US: AWD** → `chevrolet/silverado-ev/2024/awd` [US] awd · powertrain new · names: regulator wording · ⚠ name: no trim words in the regulator label
  - **Recommend:** check: no researched trim name yet (round-2 research)
  - EPA: Silverado EV
  - EPA: Silverado EV
## ford/mustang-mach-e

- **2024 CA: Rally · US: Rally** → `ford/mustang-mach-e/2024/rally` [CA, US] awd · powertrain ford/mustang-mach-e/2026-rally · ⚠ existing?: same motor power as ford/mustang-mach-e/2024/gt, but another 2024 row has it too; powertrain: same name as ford/mustang-mach-e/2026/rally; check the pack didn't change
  - **Recommend:** check: several existing cars share its motor power and none is clearly the same name
  - NRCan: Mustang Mach-E Rally
  - EPA: Mustang Mach-E Rally
- **2025 CA: Rally · US: Rally** → `ford/mustang-mach-e/2025/rally` [CA, US] awd · powertrain ford/mustang-mach-e/2026-rally · ⚠ existing?: same motor power as ford/mustang-mach-e/2025/gt, but another 2025 row has it too; powertrain: same name as ford/mustang-mach-e/2026/rally; check the pack didn't change
  - **Recommend:** check: several existing cars share its motor power and none is clearly the same name
  - NRCan: Mustang Mach-E Rally
  - EPA: Mustang Mach-E Rally
## hyundai/ioniq-5

- **2025 CA: Preferred Long Range RWD** → `hyundai/ioniq-5/2025/preferred-standard-range` [CA] rwd · powertrain hyundai/ioniq-5/2025-preferred-standard-range
  - NRCan: IONIQ 5 Long Range
- **2026 US: Limited Dual Motor AWD** → `hyundai/ioniq-5/2026/limited-dual-motor-awd` [US] awd · wheels 20″ · powertrain hyundai/ioniq-5/2025-limited-dual-motor-awd · ⚠ powertrain: same name as hyundai/ioniq-5/2025/limited-dual-motor-awd; check the pack didn't change
  - **Recommend:** yes: shares hardware with the same-named car of the same generation (pack not re-checked)
  - EPA: Ioniq 5 AWD (20inch Wheels)
## hyundai/ioniq-6

- **2023 US: SE Standard Range RWD** → `hyundai/ioniq-6/2023/se-long-range-rwd` [US] rwd · powertrain hyundai/ioniq-6/2023-se-long-range-rwd
  - EPA: Ioniq 6 Standard Range RWD
## hyundai/ioniq-9

- **2027 US: AWD** → `hyundai/ioniq-9/2027/awd` [US] awd · powertrain hyundai/ioniq-9/2026-awd · names: regulator wording · ⚠ powertrain: same name as hyundai/ioniq-9/2026/awd; check the pack didn't change
  - **Recommend:** check: no researched trim name yet (round-2 research)
  - EPA: Ioniq 9 AWD
- **2027 US: AWD Performance** → `hyundai/ioniq-9/2027/awd-performance` [US] awd · powertrain hyundai/ioniq-9/2026-awd-performance · names: regulator wording · ⚠ powertrain: same name as hyundai/ioniq-9/2026/awd-performance; check the pack didn't change
  - **Recommend:** check: no researched trim name yet (round-2 research)
  - EPA: Ioniq 9 AWD Performance
- **2027 US: RWD** → `hyundai/ioniq-9/2027/rwd` [US] rwd · powertrain new · names: regulator wording
  - EPA: Ioniq 9 RWD
## hyundai/kona-electric

- **2025 CA: Preferred** → `hyundai/kona-electric/2025/n-line` [CA] drivetrain ? · wheels 17″ · powertrain hyundai/kona-electric/2025-n-line · ⚠ existing: joins hyundai/kona-electric/2025/n-line by motor power (150 kW); names differ
  - **Recommend:** yes: becomes the US edition of a car we already have
  - NRCan: Kona Electric (17" Wheels)
## kia/ev6

- **2023 CA: Standard Range RWD · US: Light RWD** → `kia/ev6/2023/standard-range-rwd` [CA, US] rwd · powertrain kia/ev6/2022-standard-range-rwd · ⚠ pair: only one candidate each side, words differ; powertrain: same name as kia/ev6/2022/standard-range-rwd; check the pack didn't change
  - **Recommend:** check: Canada/US pairing is a guess (one candidate each side, words differ)
  - NRCan: EV6 Standard Range
  - EPA: EV6 Standard Range RWD
## kia/ev9

- **2025 CA: Land · US: Land** → `kia/ev9/2025/land-gt-line` [CA, US] awd · powertrain kia/ev9/2024-land-gt-line · ⚠ existing: joins kia/ev9/2025/land-gt-line by motor power (282 kW); names differ; powertrain: same name as kia/ev9/2024/land-gt-line; check the pack didn't change
  - **Recommend:** yes: shares hardware with the same-named car of the same generation (pack not re-checked); becomes the US edition of a car we already have
  - NRCan: EV9 Land AWD
  - EPA: EV9 Long Range AWD
## polestar/polestar-2

- **2023 CA: BST edition 270 · US: BST edition 270** → `polestar/polestar-2/2023/bst-edition-270` [CA, US] awd · powertrain new · ⚠ existing?: same motor power as polestar/polestar-2/2023/dual-motor-performance-pack, but another 2023 row has it too
  - **Recommend:** check: several existing cars share its motor power and none is clearly the same name
  - NRCan: 2 BST Edition
  - EPA: 2 BST edition
## subaru/solterra

- **2026 US: Limited** → `subaru/solterra/2026/limited` [US] awd · powertrain subaru/solterra/2027-limited · ⚠ existing?: same motor power as subaru/solterra/2026/awd, but another 2026 row has it too; powertrain: same name as subaru/solterra/2027/limited; check the pack didn't change
  - **Recommend:** check: US trim lineup on Canadian hardware: research which Canadian car it matches, then pair (owner 2026-11-19)
  - EPA: Solterra 20 AWD
- **2026 US: Premium** → `subaru/solterra/2026/premium` [US] awd · powertrain subaru/solterra/2027-premium · ⚠ existing?: same motor power as subaru/solterra/2026/awd, but another 2026 row has it too; powertrain: same name as subaru/solterra/2027/premium; check the pack didn't change
  - **Recommend:** check: US trim lineup on Canadian hardware: research which Canadian car it matches, then pair (owner 2026-11-19)
  - EPA: Solterra AWD
## tesla/model-3

- **2021 CA: Standard Range · US: Standard Range Plus** → `tesla/model-3/2021/standard-range-plus` [CA, US] rwd · powertrain tesla/model-3/2021-standard-range-plus
  - NRCan: Model 3 Standard Range
  - EPA: Model 3 Standard Range Plus RWD
- **2022 CA: Standard Range** → `tesla/model-3/2022/rwd` [CA] drivetrain ? · powertrain tesla/model-3/2022-rwd · ⚠ existing: joins tesla/model-3/2022/rwd by motor power (191 kW); names differ; powertrain: same name as tesla/model-3/2023/rwd; check the pack didn't change
  - **Recommend:** yes: shares hardware with the same-named car of the same generation (pack not re-checked); becomes the US edition of a car we already have
  - NRCan: Model 3 Standard Range
- **2026 US: Performance** → `tesla/model-3/2026/performance-awd` [US] awd · powertrain tesla/model-3/2026-performance-awd
  - EPA: Model 3 Performance
## tesla/model-y

- **2022 CA: AWD · US: Standard Range AWD** → `tesla/model-y/2022/long-range-awd` [CA, US] awd · powertrain tesla/model-y/2022-long-range-awd · ⚠ pair: names differ, same motor power (291 kW); existing: joins tesla/model-y/2022/long-range-awd by motor power (291 kW); names differ; powertrain: same name as tesla/model-y/2021/long-range-awd; check the pack didn't change
  - **Recommend:** check: paired only by motor power and the names differ: keep apart as a Canada car and a US car (owner rule)
  - NRCan: Model Y AWD
  - EPA: Model Y AWD
- **2023 CA: AWD · US: Standard Range AWD** → `tesla/model-y/2023/awd` [CA, US] awd · powertrain new · ⚠ pair: names differ, same motor power (291 kW)
  - **Recommend:** check: paired only by motor power and the names differ: keep apart as a Canada car and a US car (owner rule)
  - NRCan: Model Y AWD
  - EPA: Model Y AWD
## toyota/bz

- **2023 CA: L · US: Limited FWD** → `toyota/bz/2023/l` [CA, US] fwd · powertrain new · ⚠ pair: names differ, same motor power (150 kW)
  - **Recommend:** check: paired only by motor power and the names differ: keep apart as a Canada car and a US car (owner rule)
  - NRCan: bZ4X
  - EPA: bZ4X LIMITED
- **2026 US: Limited FWD** → `toyota/bz/2026/limited-fwd` [US] fwd · powertrain toyota/bz/2026-limited-fwd · ⚠ powertrain: same name as toyota/bz/2027/limited-fwd; check the pack didn't change
  - **Recommend:** yes: shares hardware with the same-named car of the same generation (pack not re-checked)
  - EPA: bZ LIMITED (energy capacity 191 Ah)
## toyota/c-hr

- **2026 US: XSE** → `toyota/c-hr/2026/awd` [US] awd · powertrain toyota/c-hr/2026-awd · ⚠ existing: joins toyota/c-hr/2026/awd by motor power (254 kW); names differ
  - **Recommend:** yes: becomes the US edition of a car we already have
  - EPA: C-HR AWD 20inch
## volkswagen/id-4

- **2024 CA: S · US: S** → `volkswagen/id-4/2024/pro-s` [CA, US] rwd · powertrain volkswagen/id-4/2024-pro-s · ⚠ powertrain: same name as volkswagen/id-4/2025/pro-s; check the pack didn't change
  - **Recommend:** yes: shares hardware with the same-named car of the same generation (pack not re-checked)
  - NRCan: ID.4 S
  - EPA: ID.4 S
- **2025 CA: S · US: S Limited** → `volkswagen/id-4/2025/pro-s` [CA, US] rwd · powertrain volkswagen/id-4/2025-pro-s · names: regulator wording · ⚠ powertrain: same name as volkswagen/id-4/2024/pro-s; check the pack didn't change
  - **Recommend:** check: no researched trim name yet (round-2 research)
  - NRCan: ID.4 S
  - EPA: ID.4 S
