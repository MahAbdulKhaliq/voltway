# Outside temperature and range (B116)

Status: **proposed 2026-11-20, built locally for the owner's review (not pushed).** Decision row: [gaps-and-questions.md](gaps-and-questions.md) B116. Build plan: [`docs/plan/DESIGN-temperature.md`](../plan/DESIGN-temperature.md).

This follows up Q-V4 ("later: a rough % range loss from temperature and battery chemistry"), for the Charging page only. **One change from that plan:** the research (§2) shows that heat pump vs. none, not chemistry, drives the range difference. So the curves split on `trims[].heat_pump`, and chemistry only adds a note.

## 1. What it does

The Charging page's curve controls get an **Outside temperature** field with a **°C / °F** switch. It sits in the empty cells under **Range basis** and **Wheels**. Like the Wheels picker (B13), it changes the energy per km that the page uses, so the **range** tile, the **consumption** figures, **km added** and **km per 10 min** all follow it. Under the field, a short note gives the range change, e.g. "Range −25% vs. mild weather".

- The default is **20 °C (68 °F)**, where the factor is 1, so nothing changes until the visitor picks another temperature.
- Temperatures are kept in **°C** internally. °F is only for display and input (CLAUDE.md "metric internally"), with °F = °C × 9/5 + 32.
- The °C/°F choice is remembered in the browser (`voltway.tempUnit`). With no saved choice, it follows the distance switch: miles → °F, km → °C.
- The temperature itself is not remembered. Each visit starts at 20 °C, so a stale winter setting can't change the figures unnoticed.
- The adjusted figures are **estimated** values (`kind: "estimated"`). Their source is the temperature model's study list (§5), and their badge note explains the model. This follows the "no bare numbers" rule.
- Derived only: nothing is stored in car data. The model is a fixed table in `src/lib/temperature-effect.ts`.

## 2. What the research says

The baseline throughout is range in **mild weather** (about 20–25 °C), meaning the car's best real-world range.

| Finding | Figure | Source |
|---|---|---|
| Fleet, with vs. without heat pump, at 0 °C | **83 %** of mild-weather range with a heat pump, **75 %** without (18,000+ cars, 20 models). Model 3: 87 % vs. 79 %; Model S: 88 % vs. 77 %. | Recurrent, reported by InsideEVs, 2025-01-15 [R1] |
| Fleet average, all cars | **78 %** at 0 °C, **69 %** at −7 °C (59,000+ cars, 43 models). Heat pumps add "up to 8 %" at 0 °C, and the benefit shrinks toward −18 °C. | Recurrent, 2025-11-19 [R2] |
| Heat pump benefit | **+8–10 %** range near −1 °C. Heat pumps lose their edge at very low temperatures. | Recurrent heat-pump study, 2024-11-25 [R3] |
| Lab (dynamometer), cabin at 22 °C | Range **−41 %** at −7 °C and about **−50 %** at −18 °C (city −59 %, highway −39 %). A heat pump cut HVAC power **38 %** at −7 °C, but at −18 °C the heat-pump car ran mostly on its resistive heater. Range **−14 %** at 35 °C. | US DOE / Argonne, 2024-09-12 [R4] |
| Lab, AAA 2019 | −41 % at −7 °C with heat (−12 % with no heat); −17 % at 35 °C with AC (−4 % with none). | AAA, 2019-02-07 [R5]; fueleconomy.gov [R6] |
| Lab, AAA 2026 | −39 % at −7 °C; −8.5 % at 35 °C. | AAA, 2026-05-01 [R7] |
| Fleet temperature curve | Range peaks at **115 % of rated** at 21.5 °C, stays at or above 100 % of rated from 10–31 °C, and falls to **54 % of rated at −15 °C** (4,200 EVs, 5.2 M trips). | Geotab, 2025-10-30 [R8] |
| Hot weather (fleet) | **−5 % at 32 °C, −15 % at 38 °C** (29,719 EVs). Heat-pump cars did no better in the heat. | Recurrent, reported by InsideEVs, 2025-06-23 [R9] |
| Winter road tests vs. WLTP | NAF El Prix 2025: −5 % to −32 % below freezing. ADAC 2025 at 0 °C and 111 km/h: about +50 % consumption over WLTP. | InsideEVs on NAF, 2025-01-16 [R10]; ADAC, 2025-01-31 [R11] |
| **Chemistry (LFP vs. NMC/NCA)** | Points one way, but thin. LFP cathode resistance at −20 °C is about **3×** its room-temperature value, and NCA handles the cold better than LFP (P3 cell study [R16]). Mixed. Recurrent's 2025 fleet study: LFP cars "don't perform noticeably worse than NCA alternatives" when freezing [R12]. Recurrent's 2024 LFP article: reviewers say "a few percentage points" more loss than NCA Model 3s, and fast charging is poor below −20 °C [R13]. A one-car test at 0 °C showed the LFP Model 3 no less efficient than the NCA Long Range [R14]. | see refs |

**What it means for the model:**
- **Heating is what matters.** Without cabin heat, AAA measured only −12 % at −7 °C. With it, −41 %. A heat pump saves about 8–10 points around 0 °C, but its edge fades and is nearly gone by −18 to −20 °C.
- **Chemistry: LFP loses a little more in the cold** (owner, 2026-11-20). No controlled same-car study publishes a number. The best figure is Recurrent's "a few percentage points" more for LFP Model 3s than NCA ones in Canadian and Norwegian winters, even with preheating [R13]. The cell physics (resistance tripling by −20 °C [R16]) says the gap widens as it gets colder. So LFP takes a small penalty that grows with the cold (§3), marked low confidence. NMC and NCA are treated the same, since nothing published separates them. The bigger LFP effect is still on *charging speed* when the pack is cold (20 kW vs. 111 kW warm in one test [R15]), so the note about that stays.
- **Heat:** air conditioning costs a few percent at 30–32 °C and about 15 % at 38 °C. A heat pump doesn't help, so hot weather uses one curve.

## 3. The formula

`r(T)` is the share of mild-weather range kept at outside temperature `T` (°C). The page uses it as:

```
consumption shown = rated consumption × wheel factor ÷ r(T)
range shown       = rated range       ÷ wheel factor × r(T)
range change      = r(T) − 1          (shown as a %; e.g. 0.75 → "−25%")
```

`r(T)` is linear interpolation in this table. `T` is limited to **−30…45 °C**. Outside that range the end value is used, and the note says the estimate is beyond the data.

| T (°C) | −30 | −25 | −20 | −15 | −10 | −7 | 0 | 5 | 10 | 15 | 20 | 25 | 30 | 32 | 35 | 38 | 40 | 45 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **No heat pump** | 0.40 | 0.43 | 0.48 | 0.54 | 0.60 | 0.64 | 0.75 | 0.83 | 0.91 | 0.97 | 1.00 | 1.00 | 0.97 | 0.95 | 0.91 | 0.85 | 0.82 | 0.75 |
| **Heat pump** | 0.40 | 0.44 | 0.50 | 0.58 | 0.67 | 0.72 | 0.83 | 0.89 | 0.94 | 0.98 | 1.00 | 1.00 | 0.97 | 0.95 | 0.91 | 0.85 | 0.82 | 0.75 |

How each anchor was set:
- **0 °C:** 0.75 / 0.83, the Recurrent fleet split [R1].
- **−7 °C:** 0.64 / 0.72. Recurrent's fleet average is 0.69 [R2], and this splits it around that by the heat-pump gap. The lab figures (0.59–0.61 [R4][R5][R7]) are harsher because the cars start cold-soaked on short cycles.
- **−15 to −20 °C:** about 0.50 at −18 °C [R4]. Geotab's 0.54 *of rated* at −15 °C is about 0.47 of mild-weather range [R8], so 0.54 (no heat pump) splits the difference with the Recurrent trend. The heat pump's lead shrinks to 2 points by −20 °C [R3][R4].
- **−25 to −30 °C:** an extrapolation, so the two curves meet. Below −20 °C the badge note says "beyond most published data".
- **10–15 °C:** at or above rated range in Geotab's fleet [R8] (≥ 0.87 of peak), so 0.91–0.98.
- **20–25 °C:** 1.00, the baseline.
- **30–40 °C:** 0.95 at 32 °C and 0.85 at 38 °C [R9]; 0.91 at 35 °C sits between AAA 2026 (0.915 [R7]) and DOE (0.86 [R4]).
- **45 °C:** extrapolation.

### Best and worst case (owner, 2026-11-20)

One figure hides a wide spread. At 0 °C Recurrent's models run from about 63 % (VW ID.4) to about 90 % of their best range [R1][R2]. So each curve has a **best** and a **worst** case around the **middle** figure above. The page's figures (range, consumption, km added) use the middle. The note under the field gives the band, e.g. "Estimate: range −40% vs. mild weather (likely −28% to −48%)".

- **Best case:** car preheated while plugged in, longer drives, seat heaters, a car that does well in the cold. Anchors:
  - the best models in Recurrent's data (about 90 % at 0 °C with a heat pump [R1][R2]);
  - AAA's cars with the heater off: −12 % at −7 °C, the floor for any heated drive [R5][R6];
  - preconditioning saves 9–20 % on short trips at −7 °C [R4];
  - AC off in the heat: −4 % at 35 °C [R5].
- **Worst case:** cold-soaked car, short trips, cabin at 22 °C, a car that does poorly in the cold. Anchors:
  - the lab tests: −41 % at −7 °C and about −50 % at −18 °C [R4][R5][R7];
  - the worst models in Recurrent's data: ID.4 63 % at 0 °C without a heat pump; GM heat-pump cars 72–74 % [R1];
  - Geotab's 47 % of best range at −15 °C [R8];
  - −14 % at 35 °C [R4];
  - −31 % at 38 °C from Recurrent's earlier, small summer sample [R9].

| T (°C) | −30 | −25 | −20 | −15 | −10 | −7 | 0 | 5 | 10 | 15 | 20–25 | 30 | 32 | 35 | 38 | 40 | 45 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| No heat pump, best | 0.50 | 0.54 | 0.60 | 0.66 | 0.72 | 0.76 | 0.85 | 0.90 | 0.96 | 0.99 | 1 | 0.99 | 0.98 | 0.96 | 0.92 | 0.90 | 0.85 |
| No heat pump, worst | 0.32 | 0.35 | 0.40 | 0.45 | 0.52 | 0.55 | 0.65 | 0.74 | 0.85 | 0.94 | 1 | 0.94 | 0.91 | 0.86 | 0.78 | 0.74 | 0.66 |
| Heat pump, best | 0.52 | 0.56 | 0.62 | 0.70 | 0.80 | 0.84 | 0.90 | 0.94 | 0.97 | 0.99 | 1 | 0.99 | 0.98 | 0.96 | 0.92 | 0.90 | 0.85 |
| Heat pump, worst | 0.32 | 0.36 | 0.41 | 0.48 | 0.58 | 0.62 | 0.72 | 0.80 | 0.88 | 0.95 | 1 | 0.94 | 0.91 | 0.86 | 0.78 | 0.74 | 0.66 |

- The middle is roughly halfway between best and worst at each point, so it remains the fleet average, the most likely result.
- The LFP penalty applies to all three figures.
- Interpolation and clamping work as for the middle.

### LFP adjustment (owner, 2026-11-20)

For `lfp` and `lmfp` packs, the share kept is **r(T) − p(T)**, with `p` linear between these points (0 at 10 °C and above, so hot weather is unchanged):

| T (°C) | ≤ −30 | −20 | −10 | 0 | ≥ 10 |
|---|---|---|---|---|---|
| **LFP penalty p(T)** (points of range) | 0.08 | 0.07 | 0.05 | 0.03 | 0 |

- **−5 to −15 °C, 4–6 points:** the conditions where reviewers saw "a few percentage points" more loss [R13].
- **0 °C, 3 points:** at freezing, Recurrent's fleet study found LFP "not noticeably worse" [R12], and a one-car test showed no gap [R14]. So the penalty is small there.
- **Below −10 °C, 5–8 points:** grows with the rise in cell resistance [R16]. This is a judgement, not a measurement, and the badge note says so.
- `other`, `nmc`, `nca` and unknown chemistry get no adjustment.

### Which curve a trim uses (`trims[].heat_pump`, B112/B113)

| `heat_pump` | Range figures use | Note under the field |
|---|---|---|
| `standard` | Heat pump curve | "Heat pump: standard on this trim. It saves about X% of range here compared with no heat pump." X is the middle heat-pump figure minus the middle no-heat-pump figure. Where X rounds to 0: "It saves no range at this temperature." A ticked optional heat pump gets the same note without "standard on this trim". (owner, 2026-11-20) |
| `none` | No heat pump curve | "No heat pump on this trim: heating takes more energy, so it loses more range in the cold." (owner, 2026-11-20) |
| `optional`, `standard_or_optional` | A **Heat pump** checkbox appears beside the field (owner, 2026-11-20). Unticked (the default, the safe case): no heat pump curve. Ticked: heat pump curve. | Unticked: "With the heat pump: −X%" |
| unknown (`null`) | No heat pump curve | "Heat pump not known; assumes none" |

Above 25 °C both curves are the same, so these notes appear only below 20 °C. The heat-pump note comes after the battery chemistry (LFP) note. The no-heat-pump note appears only below 20 °C. The heat-pump saving note appears at any temperature that changes the figures, so in the heat it says the heat pump saves nothing. The "Estimate:" lines under Wheels and Outside temperature are both bold.

### Chemistry (`fields.chemistry`)

The data holds `nmc` 1,129, `nca` 261, `lfp` 33, `other` 7 and unknown 3 cars. LFP and LMFP take the adjustment above. For them, below 0 °C, the note adds: "LFP battery: loses a little more range in the cold than NMC, and fast charging can be much slower until the battery warms up."

## 4. On screen

```
Range basis        Wheels
[Combined ▾]        [19″ (as rated) ▾]
Units              Price per kWh         Outside temperature     Temperature units
[ km | mi ]        [0.45]                [ -10 ] °C              [ °C | °F ]
                                         [ ] Heat pump        (only when optional on this trim)
                                         Estimate: range −40% vs. mild weather (likely −28% to −48%)
                                         With the heat pump: −33% (−20% to −42%)
```

- The field is a number input (step 1) in the chosen unit, with the unit after it. The °C/°F switch is the same segmented control as km/mi (`.seg`, `aria-pressed`).
- At 375 px the controls grid has two columns, so the field and its switch share one row.
- When the temperature changes the figures, the range and consumption tiles show "Rated: …" under the estimate, as they do for wheels. Their badge note gives the temperature basis, and the temperature studies are added to the car's Sources list.
- All text comes from `src/i18n/en.json` (`temp.*` keys).

**Estimates are labelled (owner, 2026-11-20).** Whenever the Wheels or Outside temperature setting changes a figure, the note under that control starts with "Estimate:". The changed figures show "~", the Estimated badge and "Rated: …", as before.

## 5. Sources (data/sources)

The adjusted values cite `src-b116-recurrent-heat-pump-split` [R1]. The badge note and the Sources list name all of these:

- [R1] `src-b116-recurrent-heat-pump-split`: InsideEVs, "Here's how much range these popular EVs lose in the cold" (Recurrent data), 2025-01-15. https://insideevs.com/news/747374/ev-range-loss-cold-heat-pump-data/
- [R2] `src-b116-recurrent-winter-2025`: Recurrent, "Best EV for Winter & Cold Weather Range", 2025-11-19. https://www.recurrentauto.com/research/winter-ev-range-loss
- [R3] `src-b116-recurrent-heat-pumps`: Recurrent, "Study: How Much Heat Pumps Boost EV Range", 2024-11-25. https://www.recurrentauto.com/research/heat-pumps
- [R4] `src-b116-doe-cold-ambient`: US DOE Vehicle Technologies Office / Argonne, "Impact of Cold Ambient Temperature and Extreme Conditions on Electric Vehicles", 2024-09-12. https://www.energy.gov/sites/default/files/2024-10/Impact_of_Cold_Ambient_Temperature_on_BEV_Performance_v15_TechEditFinal_12Sep2024__0.pdf
- [R5] `src-b116-aaa-2019`: AAA, "Cold weather reduces electric vehicle range", 2019-02-07. https://newsroom.aaa.com/2019/02/cold-weather-reduces-electric-vehicle-range/
- [R6] `src-b116-fueleconomy-cold`: fueleconomy.gov, "Fuel Economy in Cold Weather". https://www.fueleconomy.gov/feg/coldweather.shtml
- [R7] `src-b116-aaa-2026`: AAA, temperature impacts on EV and hybrid performance, 2026-05-01. https://newsroom.aaa.com/2026/05/aaa-study-reveals-temperature-impacts-on-ev-and-hybrid-performance-efficiency-and-costs/
- [R8] `src-b116-geotab-temperature`: Geotab, "Top EV range factors to extend fleet efficiency", 2025-10-30. https://www.geotab.com/blog/ev-range/
- [R9] `src-b116-recurrent-summer-2025`: InsideEVs, summer range study (Recurrent data), 2025-06-23. https://insideevs.com/news/763596/evs-best-summer-driving-range/
- [R10] InsideEVs, NAF El Prix winter 2025, 2025-01-16. https://insideevs.com/news/747548/ev-winter-range-test-norway-2025/ (context only; not cited by the model)
- [R11] ADAC winter motorway test, 2025-01-31. https://www.adac.de/rund-ums-fahrzeug/elektromobilitaet/elektroauto/e-auto-autobahn-reichweite-winter/ (context only)
- [R12] Carscoops on Recurrent's freezing study, 2025-01-31. https://www.carscoops.com/2025/01/evs-lose-20-range-on-average-in-freezing-conditions-study-finds/
- [R13] `src-b116-recurrent-lfp`: Recurrent, "Why We're Excited about LFP Batteries", 2024-05-31. https://www.recurrentauto.com/research/excited-about-lfp-batteries
- [R14] InsideEVs, Model 3 lineup real-world test at 0 °C, 2022-01-13. https://insideevs.com/news/560622/tesla-model3-lineup-realworld-test/ (context only)
- [R16] `src-b116-p3-cell-low-temperature`: P3 group, "Cell behavior at low temperatures" (white paper), 2024. https://www.p3-group.com/wp-content/uploads/2024/04/P3-Cell_behavior_at_low_temperatures.pdf
- [R15] InsideEVs, cold LFP Model 3 charging, https://insideevs.com/news/550021/cold-lfp-battery-tesla-model3/ (context only)

The NRCan cold-weather page refused automated access (HTTP 403), so it isn't cited.

## 6. Not included

- **Charging speed in the cold.** A cold pack charges much more slowly, and LFP most of all. The curve viewer still assumes a warm battery (`viewer.warm`). This would be a separate feature, needing per-car preconditioning data (`fields.preconditioning`).
- **Speed × temperature interaction.** Geotab shows highway speed costs more in the cold [R8]. Not modelled; the Range basis picker covers speed only roughly.
- **Trip planner.** The route energy model doesn't use temperature. That could follow later, with a forecast.
- **Per-model winter data.** Recurrent's model ranking (e.g. GM heat-pump cars doing worse than other heat-pump cars) isn't used. One curve per heating type keeps the model simple and source-agnostic.

## 7. Open questions for the owner

- ~~**O1, baseline.**~~ **Settled 2026-11-20:** losses only. The owner left it to Claude's judgement; the site already presents ratings as mild-weather range (`trip.winter`: "This plan assumes mild weather"), so adding a mild-weather gain would double-count. Original question: The model treats the official rating as the **mild-weather** range, so it only ever shows losses (or 0 % at 20–25 °C). Geotab's fleet beat its ratings by up to 15 % at 21.5 °C, but mostly on city-speed trips. Showing a gain would overstate highway range, so it is left out. The alternative: scale to rated range, with gains up to +15 % in mild weather.
- ~~**O2, LFP.**~~ **Decided by the owner 2026-11-20:** LFP takes a penalty that grows with the cold (§3). Original note: No penalty now (the evidence is mixed). The option: −3 points below −10 °C, ramping in from 0 °C.
- ~~**O3, remember the temperature?**~~ **Decided by the owner 2026-11-20:** no; each visit starts at 20 °C. Original question: It is not remembered now.
