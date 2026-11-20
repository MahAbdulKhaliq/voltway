# Outside temperature on the Charging page (B116)

Status: **owner reviewed it locally and approved going live 2026-11-20** (branch `feat/b116-outside-temperature`, one PR). Design and research: [`docs/design/outside-temperature.md`](../design/outside-temperature.md).

## Goal

A visitor sets the outside temperature (°C or °F) and sees how much range the shown car gains or loses. The range, consumption, km added and km per 10 min all follow, the same way the Wheels picker works.

## Build

1. **Model** `src/lib/temperature-effect.ts` (new):
   - `RETENTION`: the two tables from the design §3.
   - `retention(tC, curve)`: linear interpolation, clamped to −30…45 °C.
   - `temperatureEffect(tC, heatPump, chemistry)` returns:
     - `{ factor, retained, curve, withHeatPump?, clamped, lfpNote }`. `factor` = 1 / retained, applied to consumption.
     - `withHeatPump` is the heat-pump curve's figure, set only for `optional` / `standard_or_optional` trims below 20 °C.
   - `cToF` / `fToC`.
   - `TEMPERATURE_SOURCE_IDS`: the cited source ids.
2. **Sources:** `data/sources/src-b116-*.json`, one per cited study, valid against `schema/source.schema.json`.
3. **Build:** `scripts/lib/build.ts` adds `estimates.temperature = { sources }`, the Source records for `TEMPERATURE_SOURCE_IDS`. It throws if one is missing, so an unsourced estimate fails the build. `src/lib/data.ts` `loadEstimates()` types it, and `ChargingPage.astro` passes it to `CarExplorer`.
4. **Screen:** `CarExplorer.tsx`:
   - State: `tempC` (default 20) and `tempUnit` (°C/°F, stored as `voltway.tempUnit` in `KEYS`; default follows the distance unit).
   - The temperature factor multiplies the wheel factor in `estimate()`. The badge note joins the wheel and temperature bases.
   - The temperature sources are appended to the car's sources while the temperature changes the figures.
   - A `tempControl` node goes to a new `CurveViewer` prop, `climateControls`, rendered after the price field so it fills the empty cells under Range basis / Wheels.
5. **i18n:** `temp.*` keys in `src/i18n/en.json`, plus `KEYS.tempUnit`.
6. **Tests:** `tests/temperature-effect.test.ts`:
   - table anchors, interpolation, clamping, heat-pump vs. none, optional, unknown and LFP note;
   - °C↔°F round trip;
   - that every `temp.*` key exists (and the i18n test passes).

## Owner changes, 2026-11-20

- **LFP penalty:** `lfpPenalty(tC)`, and `retention` takes the chemistry, per design §3 "LFP adjustment". Needs a new source, `src-b116-p3-cell-low-temperature`.
- **Heat pump checkbox** for `optional` / `standard_or_optional` trims. State `hpTicked` resets when the car or trim changes. `temperatureEffect(t, heatPump, chemistry, { heatPumpFitted })`.

- **Best/worst band (later the same day):** `RETENTION_BAND` best/worst tables (design §3). `temperatureEffect` returns `best` and `worst` (and the same for the heat-pump line). The note reads "Estimate: … (likely … to …)". The Wheels note also gets "Estimate:".

## Not in scope

Cold charging speed, the trip planner, per-model winter data (design §6). Owner questions O1–O3 are in the design §7.
