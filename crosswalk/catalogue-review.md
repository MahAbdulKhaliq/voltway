# Catalogue review: wave 1

Generated 2026-11-19 by `npm run suggest:catalogue -- --wave 1` (B90, DESIGN-9 §2). **Nothing here is live.** Each proposal is one variant: a model year × pack × drivetrain × market edition. Rows from NRCan (Canada) and EPA (US) are paired when their trim words and drivetrain agree; otherwise each country gets its own variant (B91).

How to review: in `crosswalk/catalogue-review.csv`, set `approved` to `yes` on the rows to keep (all rows of a proposal), edit `trim_ca` / `trim_us` / `variant_id` / `powertrain` where they are wrong, then run `npm run suggest:catalogue -- --wave 1 --apply`. Flags: ⚠ code = NRCan letter code (plant or certification, not a trim name), ⚠ date = mid-year change, ⚠ pair = Canada/US pairing is a guess, ⚠ name = trim name needs a check.

56 proposals from 89 regulator rows (25 mapped models): 19 clean (no ⚠, `check` empty in the CSV), 37 to check.

## bmw/i4

- **2025 US: eDrive35 Gran Coupe** → `bmw/i4/2025/edrive40` [US] rwd · wheels 18/19″ · powertrain bmw/i4/2025-edrive40 · names: regulator wording · ⚠ existing: joins bmw/i4/2025/edrive40 by motor power (250 kW); names differ; powertrain: same name as bmw/i4/2024/edrive40; check the pack didn't change
  - **Recommend:** check: no researched trim name yet (round-2 research)
  - EPA: i4 eDrive35 Gran Coupe (18 inch Wheels)
  - EPA: i4 eDrive35 Gran Coupe (19 inch Wheels)
- **2026 US: eDrive35 Gran Coupe** → `bmw/i4/2026/edrive35-gran-coupe` [US] rwd · wheels 19″ · powertrain new · names: regulator wording
  - EPA: i4 eDrive35 Gran Coupe (19 inch Wheels)
## cadillac/lyriq

- **2024 CA: AWD · US: AWD** → `cadillac/lyriq/2024/awd` [CA, US] awd · powertrain cadillac/lyriq/2026-awd · names: regulator wording · ⚠ charger 11.5 kW on one row (trim onboard charger); charger 19.2 kW on one row (trim onboard charger); powertrain: same name as cadillac/lyriq/2023/awd; check the pack didn't change
  - **Recommend:** check: no researched trim name yet (round-2 research)
  - NRCan: LYRIQ AWD (11.5 kW Charger)
  - NRCan: LYRIQ AWD (19.2 kW Charger)
  - EPA: LYRIQ AWD
- **2026 US: PAWD** → `cadillac/lyriq/2026/pawd` [US] awd · powertrain new · names: regulator wording
  - EPA: LYRIQ PAWD
## chevrolet/equinox-ev

- **2024 CA: AWD · US: AWD** → `chevrolet/equinox-ev/2024/awd` [CA, US] awd · powertrain chevrolet/equinox-ev/2026-awd · names: regulator wording · ⚠ powertrain: same name as chevrolet/equinox-ev/2025/awd; check the pack didn't change
  - **Recommend:** check: no researched trim name yet (round-2 research)
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

- **2025 CA: Preferred Long Range RWD · US: Robo taxi** → `hyundai/ioniq-5/2025/preferred-standard-range` [CA, US] rwd · powertrain hyundai/ioniq-5/2025-preferred-standard-range · names: regulator wording · ⚠ pair: names differ, same motor power (168 kW)
  - **Recommend:** no: fleet robotaxi, not sold to the public
  - NRCan: IONIQ 5 Long Range
  - EPA: Ioniq 5 Robo taxi
- **2026 US: Limited Dual Motor AWD** → `hyundai/ioniq-5/2026/limited-dual-motor-awd` [US] awd · wheels 20″ · powertrain hyundai/ioniq-5/2025-limited-dual-motor-awd · ⚠ powertrain: same name as hyundai/ioniq-5/2025/limited-dual-motor-awd; check the pack didn't change
  - **Recommend:** yes: shares hardware with the same-named car of the same generation (pack not re-checked)
  - EPA: Ioniq 5 AWD (20inch Wheels)
- **2026 US: Robo taxi** → `hyundai/ioniq-5/2026/long-range` [US] rwd · powertrain hyundai/ioniq-5/2026-long-range · names: regulator wording · ⚠ existing: joins hyundai/ioniq-5/2026/long-range by motor power (168 kW); names differ
  - **Recommend:** no: fleet robotaxi, not sold to the public
  - EPA: Ioniq 5 Robo taxi
- **2027 US: Robo taxi** → `hyundai/ioniq-5/2027/robo-taxi` [US] rwd · powertrain new · names: regulator wording
  - EPA: Ioniq 5 Robo taxi
## hyundai/ioniq-6

- **2023 CA: Standard Range · US: SE Standard Range RWD** → `hyundai/ioniq-6/2023/standard-range` [CA, US] rwd · powertrain new · names: regulator wording
  - NRCan: IONIQ 6 Standard Range
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

- **2025 CA: Preferred** → `hyundai/kona-electric/2025/preferred` [CA] drivetrain ? · wheels 17″ · powertrain new
  - NRCan: Kona Electric (17" Wheels)
- **2025 CA: Standard** → `hyundai/kona-electric/2025/standard` [CA] drivetrain ? · wheels 19″ · powertrain hyundai/kona-electric/2026-standard · names: regulator wording · ⚠ name: no trim words in the regulator label; powertrain: same name as hyundai/kona-electric/2026/standard; check the pack didn't change
  - **Recommend:** check: no researched trim name yet (round-2 research)
  - NRCan: Kona Electric (19" Wheels)
## kia/ev6

- **2023 CA: Standard Range RWD · US: Light RWD** → `kia/ev6/2023/standard-range-rwd` [CA, US] rwd · powertrain kia/ev6/2022-standard-range-rwd · ⚠ pair: only one candidate each side, words differ; powertrain: same name as kia/ev6/2022/standard-range-rwd; check the pack didn't change
  - **Recommend:** check: Canada/US pairing is a guess (one candidate each side, words differ)
  - NRCan: EV6 Standard Range
  - EPA: EV6 Standard Range RWD
- **2026 US: AWD GT** → `kia/ev6/2026/gt-line-awd` [US] awd · powertrain kia/ev6/2026-gt-line-awd · names: regulator wording
  - EPA: EV6 AWD GT
- **2027 US: Long Range AWD** → `kia/ev6/2027/long-range-awd` [US] awd · wheels 19/20″ · powertrain new · names: regulator wording
  - EPA: EV6 Long Range AWD (19 inch Wheels)
  - EPA: EV6 Long Range AWD (20 inch Wheels)
## kia/ev9

- **2025 CA: Land · US: Land** → `kia/ev9/2025/land-gt-line` [CA, US] awd · powertrain kia/ev9/2024-land-gt-line · ⚠ existing: joins kia/ev9/2025/land-gt-line by motor power (282 kW); names differ; powertrain: same name as kia/ev9/2024/land-gt-line; check the pack didn't change
  - **Recommend:** yes: shares hardware with the same-named car of the same generation (pack not re-checked); becomes the US edition of a car we already have
  - NRCan: EV9 Land AWD
  - EPA: EV9 Long Range AWD
- **2026 US: GT** → `kia/ev9/2026/gt` [US] awd · powertrain kia/ev9/2026-gt · names: regulator wording
  - EPA: EV9 GT
## nissan/ariya

- **2026 US: e-4ORCE 63kWh** → `nissan/ariya/2026/platinum-plus-e-4orce` [US] awd · powertrain nissan/ariya/2026-platinum-plus-e-4orce · names: regulator wording · ⚠ powertrain: same name as nissan/ariya/2023/platinum-plus-e-4orce; check the pack didn't change
  - **Recommend:** check: no researched trim name yet (round-2 research)
  - EPA: ARIYA e-4ORCE 63kWh
- **2026 US: e-4ORCE 87kWh** → `nissan/ariya/2026/platinum-plus-e-4orce` [US] awd · powertrain nissan/ariya/2026-platinum-plus-e-4orce · names: regulator wording · ⚠ powertrain: same name as nissan/ariya/2023/platinum-plus-e-4orce; check the pack didn't change
  - **Recommend:** check: no researched trim name yet (round-2 research)
  - EPA: ARIYA e-4ORCE 87kWh
- **2026 US: FWD 63kWh** → `nissan/ariya/2026/sv` [US] fwd · powertrain nissan/ariya/2026-sv · names: regulator wording · ⚠ existing: joins nissan/ariya/2026/sv by motor power (160 kW); names differ
  - **Recommend:** check: no researched trim name yet (round-2 research)
  - EPA: ARIYA FWD 63kWh
- **2026 US: FWD 87kWh** → `nissan/ariya/2026/sl-plus` [US] fwd · powertrain nissan/ariya/2026-sl-plus · names: regulator wording · ⚠ existing: joins nissan/ariya/2026/sl-plus by motor power (178 kW); names differ
  - **Recommend:** check: no researched trim name yet (round-2 research)
  - EPA: ARIYA FWD 87kWh
- **2026 US: PLATINUM+ e-4ORCE 87kWh 19in. Wheels** → `nissan/ariya/2026/platinum-plus-e-4orce` [US] awd · powertrain nissan/ariya/2026-platinum-plus-e-4orce · names: regulator wording · ⚠ powertrain: same name as nissan/ariya/2023/platinum-plus-e-4orce; check the pack didn't change
  - **Recommend:** check: no researched trim name yet (round-2 research)
  - EPA: ARIYA PLATINUM+ e-4ORCE 87kWh 19in. Wheels
## polestar/polestar-2

- **2023 CA: BST edition 270 · US: BST edition 270** → `polestar/polestar-2/2023/bst-edition-270` [CA, US] awd · powertrain new · ⚠ existing?: same motor power as polestar/polestar-2/2023/dual-motor-performance-pack, but another 2023 row has it too
  - **Recommend:** check: several existing cars share its motor power and none is clearly the same name
  - NRCan: 2 BST Edition
  - EPA: 2 BST edition
- **2025 US: Dual Motor** → `polestar/polestar-2/2025/dual-motor` [US] awd · wheels 19/20″ · powertrain polestar/polestar-2/2025-dual-motor · names: regulator wording
  - EPA: 2 Dual Motor (19 Inch Wheels)
  - EPA: 2 Dual Motor (20 Inch Wheels)
- **2025 US: Single Motor** → `polestar/polestar-2/2025/single-motor` [US] rwd · wheels 19/20″ · powertrain polestar/polestar-2/2025-single-motor · names: regulator wording
  - EPA: 2 Single Motor (19 Inch Wheels)
  - EPA: 2 Single Motor (20 Inch Wheels)
## subaru/solterra

- **2026 US: Limited** → `subaru/solterra/2026/limited` [US] awd · powertrain subaru/solterra/2027-limited · ⚠ existing?: same motor power as subaru/solterra/2026/awd, but another 2026 row has it too; powertrain: same name as subaru/solterra/2027/limited; check the pack didn't change
  - **Recommend:** check: US trim lineup on Canadian hardware: research which Canadian car it matches, then pair (owner 2026-11-19)
  - EPA: Solterra 20 AWD
- **2026 US: Premium** → `subaru/solterra/2026/premium` [US] awd · powertrain subaru/solterra/2027-premium · ⚠ existing?: same motor power as subaru/solterra/2026/awd, but another 2026 row has it too; powertrain: same name as subaru/solterra/2027/premium; check the pack didn't change
  - **Recommend:** check: US trim lineup on Canadian hardware: research which Canadian car it matches, then pair (owner 2026-11-19)
  - EPA: Solterra AWD
## tesla/model-3

- **2018 CA: Long Range AWD · US: Long Range AWD** → `tesla/model-3/2018/long-range-awd` [CA, US] awd · powertrain tesla/model-3/2019-long-range-awd · names: regulator wording · ⚠ powertrain: same name as tesla/model-3/2019/long-range-awd; check the pack didn't change
  - **Recommend:** check: no researched trim name yet (round-2 research)
  - NRCan: Model 3 Long Range AWD
  - EPA: Model 3 Long Range  AWD
- **2020 CA: Long Range · US: Long Range** → `tesla/model-3/2020/long-range` [CA, US] rwd · powertrain tesla/model-3/2019-long-range · names: regulator wording · ⚠ existing?: same motor power as tesla/model-3/2020/standard-range-plus, tesla/model-3/2020/standard-range, but another 2020 row has it too; powertrain: same name as tesla/model-3/2019/long-range; check the pack didn't change
  - **Recommend:** check: no researched trim name yet (round-2 research)
  - NRCan: Model 3 Long Range
  - EPA: Model 3 Long Range
- **2020 CA: Mid Range · US: Mid Range** → `tesla/model-3/2020/mid-range` [CA, US] rwd · powertrain tesla/model-3/2019-mid-range · names: regulator wording · ⚠ existing?: same motor power as tesla/model-3/2020/standard-range-plus, tesla/model-3/2020/standard-range, but another 2020 row has it too; powertrain: same name as tesla/model-3/2019/mid-range; check the pack didn't change
  - **Recommend:** check: no researched trim name yet (round-2 research)
  - NRCan: Model 3 Mid Range
  - EPA: Model 3 Mid Range
- **2021 CA: Standard Range · US: Standard Range Plus** → `tesla/model-3/2021/standard-range-plus` [CA, US] rwd · powertrain tesla/model-3/2021-standard-range-plus · names: regulator wording
  - NRCan: Model 3 Standard Range
  - EPA: Model 3 Standard Range Plus RWD
- **2022 CA: Standard Range** → `tesla/model-3/2022/rwd` [CA] drivetrain ? · powertrain tesla/model-3/2022-rwd · names: regulator wording · ⚠ existing: joins tesla/model-3/2022/rwd by motor power (191 kW); names differ; powertrain: same name as tesla/model-3/2023/rwd; check the pack didn't change
  - **Recommend:** check: no researched trim name yet (round-2 research)
  - NRCan: Model 3 Standard Range
- **2025 CA: Long Range · US: Long Range RWD** → `tesla/model-3/2025/long-range` [CA, US] rwd · wheels 19″ · powertrain new · names: regulator wording · ⚠ code: NRCan "-I"
  - **Recommend:** check: no researched trim name yet (round-2 research)
  - NRCan: Model 3 Long Range-I
  - EPA: Model 3 Long Range RWD
  - EPA: Model 3 Long Range RWD-I (19in wheels)
- **2026 US: Performance** → `tesla/model-3/2026/performance-awd` [US] awd · powertrain tesla/model-3/2026-performance-awd
  - EPA: Model 3 Performance
## tesla/model-y

- **2020 CA: Long Range AWD · US: Long Range AWD** → `tesla/model-y/2020/long-range-awd` [CA, US] awd · powertrain tesla/model-y/2021-long-range-awd · names: regulator wording · ⚠ powertrain: same name as tesla/model-y/2021/long-range-awd; check the pack didn't change
  - **Recommend:** check: no researched trim name yet (round-2 research)
  - NRCan: Model Y Long Range AWD
  - EPA: Model Y Long Range AWD
- **2020 CA: Performance · US: Performance** → `tesla/model-y/2020/performance` [CA, US] awd · wheels 21″ · powertrain tesla/model-y/2021-performance · names: regulator wording · ⚠ powertrain: same name as tesla/model-y/2021/performance; check the pack didn't change
  - **Recommend:** check: no researched trim name yet (round-2 research)
  - NRCan: Model Y Performance
  - NRCan: Model Y Performance (21" Wheels)
  - EPA: Model Y Performance AWD
  - EPA: Model Y Performance AWD (21in Wheels)
- **2022 CA: AWD · US: Standard Range AWD** → `tesla/model-y/2022/long-range-awd` [CA, US] awd · powertrain tesla/model-y/2022-long-range-awd · names: regulator wording · ⚠ pair: names differ, same motor power (291 kW); existing: joins tesla/model-y/2022/long-range-awd by motor power (291 kW); names differ; powertrain: same name as tesla/model-y/2021/long-range-awd; check the pack didn't change
  - **Recommend:** check: no researched trim name yet (round-2 research)
  - NRCan: Model Y AWD
  - EPA: Model Y AWD
- **2022 US: RWD** → `tesla/model-y/2022/rwd` [US] rwd · powertrain new · names: regulator wording
  - EPA: Model Y RWD
- **2023 CA: AWD · US: Standard Range AWD** → `tesla/model-y/2023/awd` [CA, US] awd · powertrain new · names: regulator wording · ⚠ pair: names differ, same motor power (291 kW)
  - **Recommend:** check: no researched trim name yet (round-2 research)
  - NRCan: Model Y AWD
  - EPA: Model Y AWD
- **2023 CA: RWD** → `tesla/model-y/2023/rwd` [CA] rwd · powertrain new · names: regulator wording
  - NRCan: Model Y RWD
- **2024 CA: RWD · US: RWD** → `tesla/model-y/2024/rwd-ca` [CA, US] rwd · powertrain tesla/model-y/2024-rwd-ca · names: regulator wording
  - NRCan: Model Y RWD
  - EPA: Model Y RWD
- **2025 CA: Long Range · US: Long Range RWD** → `tesla/model-y/2025/long-range` [CA, US] rwd · powertrain new · names: regulator wording · ⚠ code: NRCan "-I"
  - **Recommend:** check: no researched trim name yet (round-2 research)
  - NRCan: Model Y Long Range-I
  - EPA: Model Y Long Range RWD
- **2027 US: AWD** → `tesla/model-y/2027/awd` [US] awd · powertrain new · names: regulator wording
  - EPA: Model Y AWD
- **2027 US: RWD** → `tesla/model-y/2027/rwd` [US] rwd · powertrain new · names: regulator wording
  - EPA: Model Y RWD
## toyota/bz

- **2023 CA: L · US: Limited FWD** → `toyota/bz/2023/l` [CA, US] fwd · powertrain new · ⚠ pair: names differ, same motor power (150 kW)
  - **Recommend:** check: paired only by motor power and the names differ: keep apart as a Canada car and a US car (owner rule)
  - NRCan: bZ4X
  - EPA: bZ4X LIMITED
- **2026 US: LIMITED energy capacity 191 Ah** → `toyota/bz/2026/limited-energy-capacity-191-ah` [US] fwd · powertrain new · names: regulator wording
  - EPA: bZ LIMITED (energy capacity 191 Ah)
## toyota/c-hr

- **2026 US: XSE** → `toyota/c-hr/2026/awd` [US] awd · powertrain toyota/c-hr/2026-awd · ⚠ existing: joins toyota/c-hr/2026/awd by motor power (254 kW); names differ
  - **Recommend:** yes: becomes the US edition of a car we already have
  - EPA: C-HR AWD 20inch
## volkswagen/id-4

- **2024 CA: S · US: S** → `volkswagen/id-4/2024/pro-s` [CA, US] rwd · powertrain volkswagen/id-4/2024-pro-s · names: regulator wording · ⚠ powertrain: same name as volkswagen/id-4/2025/pro-s; check the pack didn't change
  - **Recommend:** check: no researched trim name yet (round-2 research)
  - NRCan: ID.4 S
  - EPA: ID.4 S
- **2025 CA: S · US: S Limited** → `volkswagen/id-4/2025/pro-s` [CA, US] rwd · powertrain volkswagen/id-4/2025-pro-s · names: regulator wording · ⚠ powertrain: same name as volkswagen/id-4/2024/pro-s; check the pack didn't change
  - **Recommend:** check: no researched trim name yet (round-2 research)
  - NRCan: ID.4 S
  - EPA: ID.4 S
## volvo/ex40

- **2021 CA: Standard · US: AWD BEV** → `volvo/ex40/2021/standard` [CA, US] awd · powertrain new · names: regulator wording · ⚠ name: no trim words in the regulator label; pair: only one candidate each side, words differ
  - **Recommend:** check: no researched trim name yet (round-2 research)
  - NRCan: XC40 Recharge
  - EPA: XC40 AWD BEV
