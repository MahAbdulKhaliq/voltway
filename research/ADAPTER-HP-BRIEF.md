# Adapters and heat pumps: research brief (B112, 2026-11-20)

Shared brief for the B112 researchers. **This round you research only two things**: the DC charging adapter per car (`adapters_included`) and the heat pump per trim (`heat_pump`). This overrides the line in your agent file that says not to fill heat pumps. The rules in `research/ROUND2-BRIEF.md` under "Rules that never change" all apply (blocked sites, banned sources, open what you cite, `--check` must pass, write as you go, own file names only). Cars.com, KBB (B108) and Auto-Data (B109) are allowed.

## Work list
`research/b112-todo-<group>.json` (your group is in your prompt): per model, every car (variant id, year, markets, charge port, Supercharger access) and its trims (id, names). Fill **every** car and trim on it. Work per model and generation, not car by car: a heat pump or an adapter policy usually holds for several years and both markets, so find it once and write it to every car it covers (a small node script that loops over the work list is fine; no Python on this machine).

## 1. Adapter (`adapters_included`, one value per car)
Goes under `variants.<variant id>.fields.adapters_included` as `[{ "value": "…", "kind": "…", "source_id": "…", "notes"?: "…", "low_confidence"?: true }]` (no `unit`).

- **DC only**: NACS ↔ CCS1. Ignore J1772 (AC) adapters and Level 2 mobile connectors. A CHAdeMO adapter goes in the notes only.
- **Name = charger plug → car port.** A CCS1-port car that can use Tesla Superchargers needs `nacs_to_ccs1`. A NACS-port car (every Tesla, and the 2025+ cars that switched to a NACS port) that can use CCS1 chargers needs `ccs1_to_nacs`.
- **How owners got it**, as a suffix:
  - no suffix = **in the box** with the car from the factory (e.g. 2025 IONIQ 5 with NACS port came with a CCS1 adapter);
  - `_on_request` = **free on request** from the maker, often for a limited time or for cars delivered in a date window (e.g. Ford's 2024 free adapter offer). Give the window and how to claim in the notes;
  - `_sold` = **sold by the maker** (its accessory store or dealers; e.g. Tesla's CCS1 adapter). Price in the notes if stated;
  - `none` = the maker offers no such adapter for that car (e.g. a 2018 Bolt EV; a Nissan LEAF with CHAdeMO). For cars from before the maker offered any adapter, `none` needs a source that dates the maker's first adapter offer or Supercharger access (cite it, and say in the notes the car predates it); kind `estimated`, notes starting "Estimated: ".
- Pick the **best way owners of that car can get it** in this order: in the box > free on request > sold by the maker > none. If it changed during the model year (e.g. "in the box for cars built after March 2025"), record the earlier state and put the change and its date in the notes with `low_confidence: true`.
- **Market matters.** Canadian and US offers often differ. A car with both markets needs an offer that holds in both; otherwise record what holds in its markets and name the market in the notes with `low_confidence: true`.
- **Kinds:** `manufacturer` when the maker states it (its site, press release, owner's manual, adapter store page), even when relayed by press. `community` for forum or owner reports only (avoid where you can). `estimated` only as above.
- Cross-check with the car's `supercharger_access` in the work list: a CCS1 car with `via_adapter` access should normally have some `nacs_to_ccs1*` value. Report any car where they disagree instead of changing Supercharger access.

## 2. Heat pump (`heat_pump`, per trim)
Goes under `variants.<variant id>.trims.<trim id>.heat_pump` (or trim key `"*"` when every trim of the car is the same) as `[{ "value": "standard" | "optional" | "none", "kind": "…", "source_id": "…", "notes"?: "…", "low_confidence"?: true }]`.

- `standard` = fitted to every car of that trim; `optional` = a paid option or package (name it in the notes); `none` = not available on that trim.
- A heat pump that is standard in one market and optional in another: record what holds for the car's market(s) and say so in the notes.
- **Best sources:** the maker's spec sheets, order guides, press kits and Canadian/US build pages; then Car and Driver, MotorTrend, InsideEVs, Electrek, Driving.ca, Guide Auto, Auto-Data, Wikipedia. Don't infer a heat pump from cold-weather range alone.
- **Carry-over** to the year before or after is allowed only when a source says the climate system or that model year is unchanged; mark it `low_confidence` and name the years you compared.
- **`none` needs a source too**: a spec list that shows the system (e.g. "PTC heater") or a press article saying the heat pump arrived in a later year.

## Output
`research/batch-2026-11-20-b112-<group>.json` (add-facts format: `sources` and `variants`). Append a dated section to `research/NOTES.md`. Reply with: per model, the adapter values and years they cover, the heat pump values and trims, each estimate and its basis, every car or trim you could not fill and what you tried, and any car where the adapter and the Supercharger access disagree.
