# Vehicle Data Model

Phase 1, step 2 of [roadmap.md](roadmap.md). Defines **what a vehicle record is**: how vehicles break down into levels, which fields they have, and how every figure carries its source. Covers D2–D4, D10–D12, C2, C8 and P9 in [gaps-and-questions.md](gaps-and-questions.md).

This is a design document, not code. Field names are shown as `snake_case` for clarity, but the real schema gets written at build time. It's modeled on the [OpenEV Data schema](https://open-ev-data.github.io/1.4.x/dataset/SCHEMA) (see [data-sources.md](data-sources.md)), so importing from it stays simple.

---

## 1. Core principles

1. **Every important figure records where it came from.** No bare numbers. This is how the accuracy pitch gets delivered (P9).
2. **Rated, tested and estimated values are kept apart**, never mixed in one field (D4).
3. **"Unknown" is a real value.** "No heat pump" and "we don't know" are different things, and the app shows them differently.
4. **Each fact is stored at the level where it varies.** A charging curve belongs to the battery pack, not the trim name. Wheel size belongs to the trim, not the model.
5. **Metric units throughout** (km, kWh, kW, Wh/km). Conversion to miles happens only on screen (U4).
6. **Derived numbers are calculated, not stored.** 10–80% time, average kW and km added per minute all come from the curve plus the efficiency. That way they can never go stale or contradict their inputs.

---

## 2. Hierarchy: how vehicles break down (D2) ✅

```
Make            Hyundai
 └─ Model       IONIQ 5
     └─ Model year    2024
         └─ Variant   Long Range AWD     ← battery pack + drivetrain: the "engineering" unit
             └─ Trim  Preferred AWD Long Range Ultimate   ← feature package: wheels, heat pump, price
```

| Level | What it means | What lives here |
|-------|---------------|-----------------|
| **Make** | Brand | Name, country, logo (optional) |
| **Model** | A product line across years | Name, body type, segment, images |
| **Model year** | A model's specs for one year | Market availability for that year |
| **Variant** | **A unique battery + drivetrain** within a model year | Battery, charging hardware, **charging curve(s)**, efficiency, rated range |
| **Trim** | A feature package sold under a name | Wheels and tires, heat pump, price, trim-specific rated range |

**Why variant is the key level:** charging behavior depends on the battery pack and its software, not the trim's marketing name. Several trims often share one variant (same pack and motors, different interiors). That keeps curve data from being duplicated.

**Rules:**
- A **variant** gets its own record when the **battery capacity, chemistry, DC power, or motor layout** changes.
- A **trim** gets its own record only when it changes something the app uses: wheels, heat pump or rated range. Interior-only trims can be grouped together.
- A model-year **carry-over** (nothing changed) may point to the previous year's variant to avoid duplication. It still gets its own market-availability row.
- **Software updates that change charging** (for example a curve improved over the air) are a new **curve version** on the same variant, not a new variant. See §5.

---

## 3. Sourced values: how a figure carries its source (P9, D4) ✅

Every important figure is stored as a **sourced value**, not a bare number:

| Field | Meaning | Example |
|-------|---------|---------|
| `value` | The figure | `488` |
| `unit` | Metric unit | `km` |
| `kind` | **What sort of number it is** (see below) | `rated_epa` |
| `source_id` | Points to a record in the **sources** table | `src-fueleconomy-2024` |
| `notes` | Optional context | "Rated with 19-inch wheels" |

### Kinds of value
| `kind` | Meaning | Badge shown to the user |
|--------|---------|------------------------|
| `rated_nrcan` | Official Canadian rating | **Official (Canada)** |
| `rated_epa` | Official US rating | **Official (US)** |
| `rated_wltp` | Official European rating (reference only) | **WLTP** |
| `manufacturer` | From a manufacturer spec sheet | **Manufacturer** |
| `tested` | Measured by an independent tester | **Tested** |
| `community` | Measured or reported by owners | **Community** |
| `estimated` | Calculated by us, no direct source | **Estimated** |

A field can hold **several values of different kinds at once**. For example, range has `rated_nrcan`, `rated_epa` and `tested` values side by side. The app chooses which to show by the precedence rules in §7, and can show the rest as "other figures".

### Sources table
Each source is one record, reused by every figure that came from it:

| Field | Example |
|-------|---------|
| `id` | `src-nrcan-bev-2026-09` |
| `type` | `regulatory` / `oem` / `testing_org` / `community` / `dataset` / `estimate` |
| `title` | "NRCan Fuel Consumption Ratings – BEV 2012–2026" |
| `url` | link to the exact page or file, **not** a homepage |
| `license` | "Open Government Licence – Canada" |
| `attribution` | the credit text the license requires |
| `accessed_on` | 2026-11-15 |

**Rule:** the URL should point to the **specific** document. The OpenEV Data sample linked only to a manufacturer homepage. That's not good enough for an accuracy-led app, so such values get a lower-confidence flag on import.

---

## 4. Fields by level (D3) ✅

**Legend:** ★ sourced value (with kind and source) · **MVP** needed for the first release · *later* nice to have

### Make
| Field | Notes | |
|-------|-------|-|
| `name`, `slug` | "Hyundai", `hyundai` | MVP |

### Model
| Field | Notes | |
|-------|-------|-|
| `name`, `slug` | | MVP |
| `body_type` | sedan / hatchback / SUV / crossover / truck / van / wagon / coupe | MVP |
| `segment` | compact / midsize / full-size, etc. | *later* |
| `images[]` | See §8 | *later* |

### Model year
| Field | Notes | |
|-------|-------|-|
| `year` | | MVP |
| `markets[]` | ISO country codes, for example `CA`, `US` | MVP |
| `sold_in_canada` | **True if the car appears in NRCan's ratings** for that year. That's the authoritative test. | MVP |
| `availability_status` | production / announced. An older year of a car still in production is **not** discontinued (B17, 2026-11-15) | MVP |
| `generation` | Which generation of the model this year belongs to (B17). The model lists its `generations[]` (`id`, `name`, `first_year`, `last_year` once ended); "discontinued" is derived for the model line only when the last generation has ended | MVP |

### Variant: the engineering record
| Group | Field | Notes | |
|-------|-------|-------|-|
| Identity | `name` | "Long Range AWD" | MVP |
| | `drivetrain` | fwd / rwd / awd | MVP |
| | `motor_count`, `motor_power_kw` ★ | | *later* |
| **Battery** | `capacity_gross_kwh` ★ | | MVP (gross or usable, at least one) |
| | `capacity_usable_kwh` ★ | **Charging-time maths uses this** | MVP |
| | `chemistry` | `nmc` / `nca` / `lfp` / `lmfp` / other / **unknown**. Needed for the later winter estimate | MVP |
| | `nominal_voltage_class` | `400v` / `800v` / other | MVP |
| | `thermal_management` | liquid / air / passive / unknown | *later* |
| | `preconditioning` | yes / no / unknown, plus whether it's automatic with navigation or manual | MVP |
| **AC charging** | `ac_max_kw` ★ | Onboard charger, for example 10.9 kW | MVP |
| **DC charging** | `dc_max_kw` ★ | Peak | MVP |
| | `dc_max_current_a` | Matters for 800V cars on 400V chargers (C4) | *later* |
| | `charge_curves[]` | See §5 | MVP |
| **Ports** | `charge_port` | `nacs` / `ccs1` / `chademo` / `j1772` (AC only) | MVP |
| | `adapters_included[]` | for example "NACS→CCS1" from the factory | *later* |
| | `supercharger_access` | yes / no / via adapter / unknown | MVP (feeds N3) |
| **Efficiency** | `consumption_combined_wh_per_km` ★ | Converted from NRCan kWh/100 km × 10 | MVP |
| | `consumption_city_wh_per_km` ★, `consumption_highway_wh_per_km` ★ | Highway is the one routing uses | MVP |
| **Range** | `range_km` ★ (several kinds) | Rated (NRCan, EPA) and tested | MVP |
| **Other** | `recharge_time_240v_h` ★ | Straight from NRCan | *later* |
| | `curb_weight_kg` ★ | Needed for the route planner's elevation maths (D17) | Phase 3 MVP |

### Trim: the feature record
| Field | Notes | |
|-------|-------|-|
| `name` | "Preferred AWD Long Range Ultimate" | MVP |
| `variant_id` | Which variant this trim is built on | MVP |
| `heat_pump` | `standard` / `optional` / `none` / `unknown`. **Four states**, because "optional" is common | MVP |
| `wheels[]` | One entry per **factory option**: `diameter_in`, `tire_size`, `is_standard`, and an optional `rated_range_km` ★ for that wheel size | MVP (diameter + standard flag, plus `source_id`: each entry names its source, *added 2026-11-15, B14*); *later* (rest) |
| `range_km` ★ | Only when the trim's rating differs from the variant's | MVP if available |
| `ac_max_kw` ★ | Only when the trim's onboard charger differs from the variant's (for example 11.5 vs 19.2 kW). Overrides the variant value for that trim. *Added 2026-11-15 (B7).* | MVP if available |
| `price_msrp_cad` ★ | Prices change often, so record the date | *later* |

### Range effect of trim features (D10)
**Update (B13, 2026-11-16): the wheel-size part is built.** A rough per-inch effect is learned from official ratings of the same car at two wheel sizes (any source), and the Charging tab applies it live, showing the estimate first and the rated figure underneath. Heat pump effects are still *later*.

**Store only the facts now** (has a heat pump, wheel sizes, and a rated range per wheel size where official figures exist). **The estimator that turns features into % range changes comes later.** Its job will be easier because official ratings already split by wheel size for some cars, which gives real measured differences to start from.

---

## 5. Charging curves (C2, C8) ✅

### What a curve is
A list of **points: state of charge (SoC %) → power (kW)**, for one variant under stated conditions.

| Field | Meaning |
|-------|---------|
| `points[]` | `{soc_percent, power_kw}`. At least 2 points, sorted by SoC. **Uneven spacing is fine:** store what the source gives. |
| `kind` | `tested` / `community` / `manufacturer` / `estimated` (same badges as §3) |
| `source_id` | Points to the sources table |
| `conditions` | Battery temperature or "preconditioned: yes/no/unknown", charger used (rated kW, 400V/500V/1000V), ambient temperature if known |
| `software_version` | Optional. For OTA changes |
| `valid_from` | Optional date. A curve version replaced by an OTA update keeps its history |
| `is_display_default` | Exactly one curve per variant is the one shown by default |
| `based_on` | Only for a stored `estimated` curve borrowed from a same-pack sibling (B16, 2026-11-15): the sibling variant id and why the packs match |

### Rules
- **Many curves per variant are allowed** (different tests, conditions or software). The default is the **best one available**, using §7's precedence.
- **For calculations,** points are joined by **straight lines** between them (linear interpolation) to get power at any SoC.
- **Charging maths** (shown here so the data model supports it; the detail goes in `charging-curve-viewer.md`):
  - energy per 1% SoC = `capacity_usable_kwh / 100`
  - time for each 1% step = energy ÷ power at that SoC, adding up across 10% → 80%, for example
  - km added = energy added ÷ consumption (Wh/km)
  - *Open:* whether to include a **charging-loss factor** (energy lost as heat). Added as C9.
- **Charger limits** (C4) are applied **when calculating, not stored**: the power actually delivered is the lower of the car's curve and the charger's limit. The curve stays a property of the car only.

### Estimated curves (C8)
For variants with **no measured curve**, so every car still gets one:
- Generated from **`dc_max_kw`, chemistry and voltage class**, using a small set of **template shapes** (for example "800V NMC: holds near peak to ~50%, then tapers" or "LFP: flatter, with a steep drop near the top").
- Stored like any other curve with `kind: estimated`, plus a `basis` note saying which template and inputs were used.
- **Always labeled "Estimated"** in the app, and never chosen as the default when a measured curve exists.
- Imported Chargeprice curves flagged as "default curve" are **not imported** (decision 2026-11-15; they are generic shapes, and our own template estimate replaces them). See data-sources.md §2.
- The exact template shapes get designed in `charging-curve-viewer.md`.

---

## 6. Matching the same car across sources (D11) ✅

Each source names cars differently. Every record gets **our own stable ID**, plus a **crosswalk** table that links it to each source's own record.

### Our IDs
`make/model/year/variant`, for example `hyundai/ioniq-5/2024/long-range-awd`. They're readable and stable, and never reused.

### Crosswalk table
| Our variant ID | Source | Source's own key | Match method | Confirmed by a person? |
|----------------|--------|------------------|--------------|-----------------------|
| `hyundai/ioniq-5/2024/long-range-awd` | NRCan | `2024 · HYUNDAI · IONIQ 5 AWD (LR)`* | automatic | ✅ |
| same | OpenEV Data | `hyundai/ioniq_5/2024/ioniq_5_awd` | automatic | ✅ |
| same | Chargeprice | *(their vehicle ID)* | manual | ✅ |

*\*Illustrative. NRCan's exact model text gets checked at import.*

### How matching works
1. **Suggest automatically** using make + year, then model name similarity, then **battery kWh and drivetrain** as tie-breakers.
2. **A person confirms** each suggested match. With a starter set of 20–30 cars, that's a short job and avoids silent errors.
3. **Unmatched records are listed for review**, never guessed.
4. **Stale matches are withdrawn (B9, 2026-11-15):** if a manufacturer page shows the car changed since the matched record (new pack, power or port), the crosswalk row is set back to unconfirmed with a note giving the evidence. Its values and curves then stop flowing in.
5. **NRCan is the reference list:** a variant exists in the app if NRCan lists it (for Canadian-market cars). Other sources add detail to it.

---

## 7. Which source wins (D12) ✅

When sources disagree, the **default figure shown** comes from the first available source in this order. The others stay stored and can be viewed.

| Figure | Order of preference |
|--------|---------------------|
| Range, consumption (Canada) | NRCan → EPA → manufacturer → tested → estimated |
| Battery capacity | Manufacturer → tested → OpenEV Data → Chargeprice |
| DC max kW, AC max kW | Manufacturer → tested → OpenEV Data → Chargeprice |
| Charging curve | Tested → community (measured) → manufacturer → estimated from a same-pack sibling's measured curve (B16) → template estimate |
| Heat pump, wheels, ports | Manufacturer site (US first, then Canadian; B15) → OpenEV Data → other |

- **How to read the order (decision 2026-11-15):** each step names a **kind plus where it came from**, not just a kind. For battery capacity and DC/AC kW, "Manufacturer" means a value **entered directly from the manufacturer's own spec page**. Manufacturer values that arrived **via OpenEV Data** are kind `manufacturer` too, but rank **after** `tested`. So the full order is: manufacturer (direct) → tested → manufacturer via OpenEV Data → Chargeprice. Precedence rules are written against kind + source.
- **Real-world figures** (`tested`) never replace rated ones. They're shown **alongside**, as "Rated 488 km · Tested 430 km at highway speed".
- **Conflict flag:** if two sources differ by more than **5%** on the same kind of figure (for example two manufacturer battery figures), the field is marked **for review**. The threshold is a starting proposal.

---

## 8. Images

| Field | Notes |
|-------|-------|
| `url` | Stored copy or link |
| `source_page` | The Commons or press page |
| `license`, `author`, `attribution_text` | Shown in a credit line |
| `angle` | front 3/4, side, rear, interior |
| `applies_to` | Model, or a specific model year (designs change) |

Fallback: a **silhouette for each body type** when there's no image.

---

## 9. Example record (shape only)

Real values from the OpenEV Data sample. Other values are shown as `…`, deliberately not invented.

```
Variant: hyundai/ioniq-5/2024/long-range-awd
  drivetrain:            awd
  battery:
    capacity_gross_kwh:  77.4   [manufacturer · via OpenEV Data]
    capacity_usable_kwh: 72.6   [manufacturer · via OpenEV Data]
    chemistry:           unknown          ← OpenEV said only "li-ion"; to fill by hand
    voltage_class:       800v
  dc_max_kw:             220    [manufacturer · via OpenEV Data]
  charge_port:           …      (CCS1 or NACS depends on model year and market; check)
  consumption_highway:   …      [rated_nrcan]
  range_km:              488    [rated_epa]  ·  …  [rated_nrcan]
  charge_curves:
    - kind: estimated, basis: "800V NMC template, dc_max 220 kW", is_display_default: true
      (replaced once a tested curve is added)
  trims:
    - name: …, heat_pump: …, wheels: [{diameter_in: …, is_standard: true}, …]
```

---

## 10. Still open (moved to the gaps file)

| ID | Question |
|----|----------|
| C9 | Include a **charging-loss factor** when converting kW into battery % gained? |
| D14 | Are **wheel-specific rated ranges** in NRCan's data, or only in EPA's? This decides how much D10 can rely on official figures. *Partly answered (2026-11-15): NRCan splits some cars into per-wheel-size rows; see gaps-and-questions.md.* |
| D15 | **Prices:** include MSRP (CAD) at all, given how often prices change? Currently marked *later*. |
