# Check: batch-2026-11-20-b112-nissan-honda.json

**Verdict: FIX.** `--check` passes (valid, 1367 variants). Adapter values and the US LEAF heat pumps are mostly sound. A few labels and mappings need changes, and the 2026 LEAF heat pump needs a decision.

## Results

| Variant / group | Field | Value | Result | Evidence |
|---|---|---|---|---|
| LEAF 2016 S 24 kWh | heat_pump | none | ✅ | 2016 kit: S has a dash; "Available hybrid heater system (standard on SV and SL)" |
| LEAF 2016 SV 30 kWh | heat_pump | standard | ✅ | same kit |
| LEAF 2017 S | heat_pump | none | ✅ | 2017 kit: "standard on SV and SL", dash for S |
| LEAF 2018 S | heat_pump | none | ✅ | 2018 kit: S dash, SV optional, SL standard |
| LEAF 2019 S, S+ | heat_pump | none | ✅ | 2019 kit: S dash |
| LEAF 2019 SV, SV+ | heat_pump | optional | ✅ | 2019 kit: SV "O"; SV All Weather Package includes the hybrid heater (US$900 per kit, layout hard to read) |
| LEAF 2020 S, S+ / SV, SV+ | heat_pump | none / optional | ✅ | 2020 kit: SV and SV PLUS optional (All Weather Package), SL PLUS standard |
| LEAF 2021 S, S+ / SV, SV+ | heat_pump | none / standard | ✅ | 2021 kit: standard on SV, SV PLUS, SL PLUS |
| LEAF 2022 S, S+ / SV, SV+ | heat_pump | none / standard | ✅ | 2022 kit: same |
| LEAF 2023 S / SV+ | heat_pump | none / standard | ✅ | 2023 kit covers S and SV PLUS only: "SV PLUS adds ... a hybrid heater" |
| LEAF 2024 S / SV+ (US) | heat_pump | none / standard | ✅ | 2024 kit, same two trims |
| LEAF 2025 S / SV+ (US) | heat_pump | none / standard | ✅ | 2025 kit, same |
| LEAF 2024-25 `sv` (CA SV) | heat_pump | standard (2nd entry, CA 2023 kit) | ⚠ unverifiable per column | CA 2023 kit row shows a single "S"; the text can't be mapped to SV, SV PLUS or SL PLUS. Trims offered in Canada 2023: SV, SV PLUS, SL PLUS. Carry-over to 2024-25 has no "unchanged" source (flagged low_confidence). |
| LEAF 2019-2022 `sv` / `sv-plus` (CA) | heat_pump | US value applied | ⚠ unverifiable | No Canadian source for 2019-22. The notes say so (low_confidence). Note "Trim names: CA=SV, US=SV PLUS" is copied into every note and doesn't explain which kit row was used. |
| LEAF 2016-2025 (all) | adapters_included | none, estimated | ✅ with caveat | The Drive (2023-09-20): "Starting in 2024, Nissan will make available a NACS charging adapter for newly sold Nissan ARIYA models." It says nothing about the LEAF. Nissan only "continues to support our LEAF drivers with the continued installation of CHAdeMO connectors." InsideEVs: "There are no plans to open it up to Nissan Leafs." This dates Nissan's first offer (2024, Ariya only), so the basis is allowed. Caveat: the batch says Nissan "said it would offer an adapter only for the Ariya". The page only shows Ariya was named. Sources are typed `community`; they are press articles. |
| LEAF 2026 S+, SV+, Platinum+ | adapters_included | ccs1_to_nacs_sold | ✅ (US) / ⚠ (CA) | nissanusa LEAF features: "Genuine Nissan Accessory CCS adapters are available". Canada: I found no Nissan.ca source. Nissan Canada site pages were truncated (nav only). low_confidence is right. A retailer listing (allthingsnissan, US$199.99, 2026 LEAF) exists but is not Nissan's own page; not usable. |
| Ariya 2023-25 (US and CA) | adapters_included | nacs_to_ccs1_sold | ✅ | InsideEVs: "adapter costs $235 and is available for order today via a Nissan dealer or Nissanusa.com". Guide Auto: CA$309.99, "ordered through a Nissan dealer", access "beginning December 10". |
| Ariya 2025 premiere pkg, 2026 (all CA) | adapters_included | nacs_to_ccs1_sold | ⚠ | Cited `nissan.ca/.../2024-ariya/specs.html` now serves the 2027 Ariya page. It does show "NACS Adapter Kit $317" but for the current model, not a 2025/26 CCS1 car. The Guide Auto 2024 article is the better source for the 2026 CA cars. |
| Prologue and ZDX (US) | adapters_included | nacs_to_ccs1_sold | ✅ | TFLCar and Cars.com: US$225, "authorized Honda and Acura dealerships" or DreamShop; "not bundled" |
| Prologue and ZDX (CA) | adapters_included | nacs_to_ccs1_sold | ✅ | iPhone in Canada: "$400 CAD ... through authorized Honda and Acura dealerships". Market coverage is consistent: variants with a CA market mention Canada in the notes. |
| Clarity Electric 2017-19 | adapters_included | none, estimated | ✅ | Honda adapter first offered 2025 (TFLCar), Prologue and ZDX only; the car predates it |
| MX-30 2022-24 | adapters_included | none, **manufacturer** | 🏷 | CarGurus: "The low-selling, discontinued MX-30 will not get an adapter". The line is not attributed to Mazda. Relabel `estimated` (or `community`) with a basis note. A Mazda statement would be needed for `manufacturer`. |
| i-MiEV 2012-17 | adapters_included, heat_pump | none, estimated | ✅ with caveat | Wikipedia: "Heat... from the traction battery via a resistance element". CHAdeMO was an optional US$750 port, so no CCS or NACS adapter applies. Heat pump `none` rests on one Wikipedia line. It is allowed but weak. |
| Eclipse Sportback EV 2027 (cited as basis only) | n/a | n/a | ✅ | Mitsubishi CA: NACS "standard equipment on all models" (2027). No adapter mentioned. |
| LEAF 2026 | heat_pump | not in the batch | ❌ gap | See "2026 LEAF heat pump". |

## Questions asked

### LEAF 2016-2025 `none`
The basis is allowed. The Drive dates Nissan's first adapter offer (Ariya, 2024) and shows nothing for the LEAF. InsideEVs says "no plans". Nissan told The Drive it can't comment on CHAdeMO plans, so "estimated" is right. Reword the note to "Nissan announced an adapter for the Ariya only".

### LEAF 2026 adapter
US is verified. Canada isn't found, so keep `low_confidence`.

### LEAF heat pump per trim and year
- US 2016-2025 is verified against all ten kits (table above).
- 2019 and 2020 SV: optional via the SV All Weather Package. Confirmed in both kits.
- 2021 and later SV: standard. Confirmed.
- Canada 2019-22 has no source. The 2023 CA kit can't be mapped by column, so CA SV 2023-25 is unverified.

### 2026 LEAF heat pump: what is right
Existing data says `standard` for all three trims, from Drive Tesla Canada ("not per trim"). Findings:
- **US:** Motor1: "A heat pump is standard on the top two trims, with an optional battery heater available as an option." That means SV+ and Platinum+ have one and S+ has none. Cars.com says the SV+ includes "a heat pump", with no mention for S+ or Platinum+. Right values: US S+ `none`, SV+ `standard`, Platinum+ `standard`.
- **Canada:** CarGurus.ca: "in Canada, a heat pump is standard". It lists S, S Plus, SV Plus and Platinum Plus and notes no exceptions. Right value: all CA trims `standard` (one source, low_confidence).
- **Structure problem:** `s-plus` is a single variant for CA and US with one trim. A single value can't hold "none in the US, standard in Canada". The owner needs to choose: split by market, or record `standard` with a US note, or use a market-aware field.
- Nothing in the batch covers 2026, which leaves existing data in conflict with the US sources.

### Ariya port, 2026 Canada
nissan.ca now lists the **2027** Ariya (page title "2027 Nissan ARIYA"). The 2027 Canadian Ariya adds the native NACS port (Drive Tesla Canada, Auto123, Guide Auto teaser). The 2026 Canadian Ariya "features no cosmetic revisions or technological updates" (Guide Auto). So 2026 stays CCS1 and our data is right. The nissan.ca finding is the 2027 model. I didn't see any page that says the 2026 car has NACS.

### Unfilled heat pumps and the Eclipse adapter
No openable source found for:
- **Ariya.** Nissan USA 2023 kit has no heat pump row (battery heater listed S on Engage, Venture+ and Platinum+). Nissan.ca 2027 page lists a "Hybrid heater" under Comfort & Convenience, with no per-trim marker. A 2027 trim mapping would need the Nissan Canada build page. Wikipedia: no mention. Autocar says the UK Ariya has one standard (not our market).
- **Prologue.** Honda Info Center features-by-trim (US 2024-26) shows no heat pump row. Recharged and EVKX say heat pump on higher trims or AWD, a conflicting secondary read.
- **ZDX.** The Acura USA 2024 spec release has no heat pump or battery heater. The Canadian spec PDF is not readable as text.
- **MX-30.** Mazda Canada owner's manual (2023) climate page: no heat pump mentioned. ArenaEV and EVKX: "optional" and "yes", not North American. Weak.
- **Clarity Electric.** An ahgautoservice page and forums say heat pump plus PTC heater. No Honda page. Honda Info Center has a 2018 Clarity-Electric dual-zone climate page not yet read.
- **Eclipse Sportback EV 2027 adapter.** Mitsubishi CA says NACS port standard, no adapter mentioned. KBB: no adapter statement. Consumer Reports (paywalled; seen only in search snippet) says one is included. Single-sourced and unopened. Honest status: unknown.

Leads for the owner: Honda Info Center 2024-26 Prologue PDF (`hondainfocenter.com/-/media/.../2025-Prologue-Features-by-Trim.ashx`), Nissan Canada Ariya build page, Mitsubishi USA press kit.

## Fit with existing data
- Supercharger access agrees with the adapter on every CCS1 Ariya, Prologue and ZDX car (`via_adapter`), the CHAdeMO LEAFs and the Clarity (`no`).
- 2026 LEAF `supercharger_access: yes` (native NACS) agrees with `ccs1_to_nacs_sold`.
- The 2026 LEAF heat pump conflicts with the existing `standard` (above).

## Required changes
1. Relabel MX-30 `adapters_included` (2022-24) from `manufacturer` to `estimated`, or find a Mazda statement. CarGurus doesn't attribute "will not get an adapter" to Mazda.
2. For the 2026 Ariya (CA) adapters and the 2025 Premiere package, cite the Guide Auto article, or note that the nissan.ca URL now shows the 2027 page.
3. Replace the copied "Trim names: CA=SV, US=SV PLUS" in LEAF 2019-22 `sv` notes with the actual source row. Canada isn't verified.
4. Reword the LEAF `none` note to "Nissan announced an adapter for the Ariya only". The sources don't say Nissan limited the offer.
5. LEAF 2026 heat pump: the owner decides per variant and market (split, or `standard` with a US note), and whether to overwrite the existing Drive Tesla Canada value. US S+ is `none` (Motor1) and Canada is `standard` (CarGurus.ca).
6. CA SV 2024-25 heat pump: keep as `low_confidence`. The CA 2023 kit can't be mapped to a column.
7. Change `type` on The Drive and InsideEVs sources from `community` to the press type if the schema allows.
8. Required fields left empty: heat_pump for Ariya (all years), Prologue, ZDX, MX-30, Clarity; LEAF 2026 (all trims, all markets); LEAF 2019-22 CA; adapter for Eclipse Sportback EV 2027 if that powertrain is covered.

Sources:
- https://www.thedrive.com/news/nissan-isnt-making-a-nacs-ccs-ev-charging-adapter-for-leaf-owners
- https://insideevs.com/news/743289/nissan-ariya-supercharger-access/
- https://usa.nissannews.com/en-US/releases/us-2016-nissan-leaf-press-kit
- https://usa.nissannews.com/en-US/releases/us-2017-nissan-leaf-press-kit
- https://usa.nissannews.com/en-US/releases/us-2018-nissan-leaf-press-kit
- https://usa.nissannews.com/en-US/releases/us-2019-nissan-leaf-plus
- https://usa.nissannews.com/releases/2020-nissan-leaf-press-kit
- https://usa.nissannews.com/releases/2021-nissan-leaf-press-kit
- https://usa.nissannews.com/en-US/releases/2022-nissan-leaf-press-kit
- https://usa.nissannews.com/en-US/releases/2023-nissan-leaf-press-kit
- https://usa.nissannews.com/en-US/releases/2024-nissan-leaf-press-kit
- https://usa.nissannews.com/en-US/releases/2025-nissan-leaf-press-kit
- https://canada.nissannews.com/en-CA/releases/2023-nissan-leaf-press-kit
- https://www.nissanusa.com/vehicles/electric-cars/leaf/features.html
- https://www.motor1.com/news/763008/2026-nissan-leaf-specs-details/
- https://www.cars.com/articles/all-new-2026-nissan-leaf-remains-cheapest-ev-available-starts-at-31485-514473
- https://cargurus.ca/research/2026-Nissan-LEAF-c34147
- https://www.guideautoweb.com/en/articles/80303/2026-nissan-ariya-sticks-around-with-no-changes-but-slashed-prices/
- https://driveteslacanada.ca/news/2027-nissan-ariya-canada-refresh-nacs-google-built-in/
- https://guideautoweb.com/en/articles/76760/nissan-releases-nacs-adapter-for-ariya-drivers
- https://tflcar.com/2025/07/honda-acura-nacs-adapter-supercharger-network-update/
- https://www.cars.com/articles/honda-acura-ev-owners-now-have-access-to-tesla-superchargers-513103
- https://www.iphoneincanada.ca/2025/10/06/honda-and-acura-evs-can-now-use-tesla-superchargers-in-canada/
- https://www.cargurus.com/Cars/articles/all-the-evs-that-use-teslas-nacs-plug
- https://en.wikipedia.org/wiki/Mitsubishi_i-MiEV
- https://mitsubishi-motors-pr.ca/mitsubishi-eclipse-sportback-ev-to-offer-multiple-charging-options/

## Applied by the main session (2026-11-20)
- MX-30 adapter `none`: relabelled `estimated` (CarGurus does not attribute it to Mazda).
- Ariya 2025 Premiere package and 2026 CA cars: re-sourced from the nissan.ca specs page (now the 2027 car) to Guide Auto (CA$309.99).
- LEAF adapter notes reworded: "an adapter for the Ariya (no LEAF adapter was announced)".
- LEAF 2019–22 SV heat pump notes: say the value comes from the US SV row.
- Not done, owner decision: 2026 LEAF heat pump (US S+ none, Canada standard on all trims) needs a market split; existing data left as is.
- Ariya 2026 port: no change (checker found no NACS 2026 car).
- `--check` passes.
