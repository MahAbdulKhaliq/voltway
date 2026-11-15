# Research notes (checklist 1.6): rough lookups not yet applied

Owner's instruction (2026-11-15): find **rough** info online, don't dig deep. Apply these with `npx tsx scripts/add-facts.ts research/<batch>.json`, marking every value `low_confidence: true` with a note like "Quick web lookup", citing the page listed. No PDFs and no bypassing bot blocks.

## Applied already
- `research/hyundai-2026.json`: IONIQ 5 (800V), IONIQ 9 (110.3 kWh, 800V, NACS, heat pump, 24 min), Kona Electric (64.8 kWh, FWD, 43 min, low confidence). Read directly from the pages, so not low confidence except where marked.

## Applied in research/batch-2026-11-16.json (except where noted)

LYRIQ figures were not applied (no usable source URL for them). Silverado per-trim battery sizes still unknown.

**Kia EV6 2025** (read directly on kia.ca: https://www.kia.ca/en/vehicles/ev6)
- NACS port, Supercharger access ("access to thousands of additional fast-charge stations across Canada and the United States")
- Heat pump standard on Wind and Land (Light: not stated)
- 10–80% "as little as 20 minutes" on a 350 kW charger (84 kWh variants)
- Specs page (https://www.kia.ca/en/vehicles/ev6/specs): 10.9 kW onboard charger, LIPB battery, 84 kWh (trim tabs couldn't be confirmed separately → low confidence)
- Quick lookup (https://insideevs.com/news/741756/2025-kia-ev6-specs-us/, US): Light 63 kWh / 180 kW DC; long-range trims 84 kWh / 240 kW DC; 800V

**Kia EV9 2026** (read directly: https://www.kia.ca/en/vehicles/ev9)
- NACS port, Supercharger access; heat pump standard on Wind, Land, GT (Light: not stated)
- 10–80% "as little as 20 minutes" for **Light RWD** on 350 kW
- Quick lookup (https://www.slashgear.com/2040439/2026-kia-ev9-review/ and Kia NZ brochure https://www.kia.co.nz/assets/Uploads/KIA0161-EV9-Brochure-2026-v6.pdf): 76.1 kWh gross (standard), 99.8 kWh gross (long range); peak DC 210 / 235 kW (sources disagree which pack gets which); 800V

**Kia Niro EV 2026** (read directly: https://www.kia.ca/en/vehicles/niro/ev): heat pump "available" → optional. Battery/DC not found yet.

**Hyundai IONIQ 6 2025** (quick lookup): 77.4 kWh, 10.9 kW onboard charger, 800V / up to 350 kW (https://www.auto123.com/en/specs/hyundai/ioniq-6/hyundai-ioniq-6-2025-preferred-awd-long-range-462829/, https://www.hyundaicanada.com/-/media/hyundai/showroom/2025/ioniq-6/product_cards/2025-hyundai-ioniq-6-model-summary-en.pdf); heat pump on RWD and AWD (dealer sheet); 10–80% ~18 min (Hyundai US). Port: CCS1 likely for 2025 Canada, **not confirmed** → leave unknown.

**Chevrolet Equinox EV 2026** (quick lookup, https://www.chevrolet.com/equinox-ev, https://thinkev.ca/compare/chevrolet-equinox-ev-2026): 85 kWh, 150 kW DC peak, heat pump standard; port CCS1 vs NACS: sources disagree → leave unknown.

**Chevrolet Blazer EV 2026** (quick lookup, https://thinkev.ca/compare/chevrolet-blazer-ev-2026): 85 kWh NMC (FWD LT/RS), SS 102 kWh; DC 190 kW (Canadian listing, unconfirmed).

**Chevrolet Silverado EV 2026** (quick lookup, https://www.gmupfitter.com/wp-content/uploads/2026/07/2026-Silverado-EV-Specification-Guide-072726.pdf, https://insideevs.com/news/720662/chevy-silverado-ev-battery-explained/): up to 350 kW DC, ~800V charging. Per-trim battery sizes not found.

**Cadillac LYRIQ 2026** (quick lookup): 102 kWh, NCMA chemistry, 10–80% ~40 min. Peak DC and port not found.

## Still to look up
Tesla Model Y, Model 3 · Ford Mach-E, F-150 Lightning · VW ID.4 · Toyota bZ, C-HR · Subaru Solterra · Nissan ARIYA, LEAF · Volvo EX30, EX40 · Polestar 2 · BMW i4 · Kia Niro EV battery · IONIQ 5 usable kWh / DC kW.

## Open points for the owner
- Many manufacturers give one "battery capacity" without saying gross or usable. Charging maths needs usable. Currently recorded as gross with a note; decide in 1.7 whether to fall back to gross (labelled estimated) when usable is missing.

## 2026-11-15: LYRIQ + Tesla Model 3/Y quick lookup (research/batch-2026-11-16-lyriq-tesla.json, --check OK, not applied)
tesla.com, cadillaccanada.ca product pages returned 403 (not worked around). Used search results, thinkEV, The Charge Port.
- **Tesla Model 3 (all 4 variants):** Supercharger access = yes (https://www.tesla.com/en_ca/support/charging/supercharging, low confidence). Performance and Performance AWD: 10-80% 25 min (https://thinkev.ca/compare/tesla-model-3-2026, community, low; one spec set, matched by 510 hp AWD). Heat pump per trim not found.
- **Tesla Model Y (all 7 variants):** Supercharger = yes (same Tesla page); heat pump "standard" for all trims (https://thechargeport.com/ev/tesla-model-y, US-oriented, not per trim, low). That page also lists 225 kW DC (Standard) / 250 kW (Premium, Performance) and NACS: not added (OpenEV already supplies DC/port).
- **Cadillac LYRIQ:** nothing added. Chemistry (NCMA seen earlier, no usable URL), heat pump and Supercharger access not stated on any readable page. Port conflict: Cadillac Canada snippet lists NACS on some trims; CarGurus/The Charge Port say 2026 is CCS1 with a $225-275 NACS DC adapter (2027 is native NACS).
- LYRIQ wheels (not in batch format): 20 in on Luxury/Premium Luxury/Sport trims, 22 in on Signature/V (autodealcanada.ca, trim names unreliable); V: 22 in per dealer listing, though a Canadian page snippet mentions 20 in split 6-spoke on the V. Not verified per Standard/AWD/V variant.
