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

## 2026-11-15: VW ID.4 + BMW i4 quick lookup (research/batch-2026-11-15-vw-bmw.json, --check OK, not applied)
Sources: thinkEV (https://thinkev.ca/compare/volkswagen-id4-2026, https://thinkev.ca/compare/bmw-i4-edrive40-2026), VW dealer article (https://www.volkswagendessources.ca/en/news/view/everything-you-want-to-know-about-the-2026-volkswagen-id-4/158815), BMW Canada newsroom (https://newsroom.bmwgroup.com/americas/en-ca/bmw-canada-further-improves-ev-convenience-in-canada-with-shell-recharge-integration-and-access-to-nacs-format-superchargers). All low confidence.
- **ID.4 (standard, awd):** charge port CCS1, chemistry NMC (82 kWh pack; thinkEV), heat pump standard (dealer article; trims not named, uncertain). awd only: 10-80% 28 min (dealer article, "Pro models", optimal conditions). thinkEV also cites 34 min from a CAA winter test (tested, not added).
- **BMW i4 (3 variants):** charge port CCS1 (thinkEV), Supercharger access via_adapter (BMW Canada: CCS models need Lectron Vortex Plus adapter; i4 not named).
- Not found: preconditioning (both cars), ID.4 Supercharger access (page silent; VW adapter status conflicting in search snippets), i4 heat pump, i4 published 10-80%, wheel sizes for ID.4. thinkEV: i4 eDrive40 has 18 in and 19 in options (matches the existing trim ids; no source stating standard vs optional, not added). Plug & Charge mentioned for both is not preconditioning.
- No stale-match evidence.

## 2026-11-15: Toyota bZ, Toyota C-HR, Subaru Solterra (research/batch-2026-11-15-toyota-subaru.json, --check OK, not applied)
Sources are Toyota Canada media releases and the Subaru Canada Solterra release (Newswire); read directly, so normal confidence except where noted.
- **Toyota bZ (5 variants):** NACS, 11 kW AC ("across all trims"), 10-80% ~30 min (model-level, not per trim), preconditioning = automatic_and_manual (nav destination or manual). Standard variant drivetrain = fwd (XLE FWD, 57.7 kWh). Heat pump "standard" on standard/awd/limited-awd (low confidence: page lists it for the model without trim qualifier). Wheels: XLE 18 in (standard; awd assumed same, low), Limited AWD 20 in, Woodland 18 in (both Woodland variants; low).
- **Toyota C-HR:** NACS, 11 kW, ~30 min, preconditioning automatic_and_manual on both variants; standard (SE) drivetrain fwd, 18 in wheels. AWD (XSE) wheels not added: 20-in only mentioned as Technology Package option, base size not stated, so 18-in/20-in trims not mapped.
- **Subaru Solterra AWD:** NACS, Supercharger yes (low; release footnotes it as "anticipated, date to be determined"), 10-80% ~35 min at ~150 kW, preconditioning automatic_and_manual. Wheels (18 and 20 in) not mapped to trims. Heat pump: only a CarGurus snippet said standard in Canada; not added.
- **Not found / skipped:** usable kWh, chemistry (pages only say "lithium-ion"), voltage class, DC peak kW (Toyota pages state none), Supercharger access for Toyota (pages say NACS only), heat pump for Woodland and C-HR.
- **Conflict:** Subaru Solterra battery 77.0 kWh (Subaru Canada release, Auto123) vs 74.7 kWh (CarGurus, Carvana); Toyota Woodland and US C-HR figures use 74.7, Canadian C-HR page says 77. Possible stale/gross-vs-net difference; gross fields untouched.

## 2026-11-15: Volvo EX30/EX40 + Polestar 2 quick lookup (research/batch-2026-11-15-volvo-polestar.json, --check OK, not applied)
volvocars.com/ca returned 403 (not worked around). Used a Canadian Volvo dealer article, thinkEV, Polestar Canada.
- **EX40 (standard, twin):** port ccs1 and Supercharger via_adapter (Volvo NACS adapter, 18,000+ stations), 10-80% 28 min at up to 200 kW (https://www.volvocarshamilton.com/en/news/view/living-with-the-2026-volvo-ex40-in-ontario-range-charging-and-year-round-capability/162647, dealer, low confidence).
- **EX30 (single-motor-extended-range, twin-performance):** 10-80% 26 min, 153 kW peak (https://thinkev.ca/blog/volvo-ex30-canada-review-2026, low). Cross Country not covered. Port and Supercharger access NOT filled: Volvo said EX30 adapter availability would be announced later (https://driveteslacanada.ca/news/volvo-and-polestar-join-tesla-supercharger-network-nacs-adapters-go-on-sale); no later confirmation found.
- **Polestar 2 (all 3):** Supercharger via_adapter (https://www.polestar.com/en-ca/charging/tesla-supercharger-network/, manufacturer).
- **Not found:** preconditioning (no page for any of the three), chemistry, heat pump per trim, wheels per trim for EX30/EX40/Polestar 2 (see below).
- **Skipped as unreliable/market mismatch:** Polestar page https://www.polestar.com/en-ca/polestar-2/specifications/ shows Type 2 AC cable, 82 kWh 400 V, 205 kW, 10-80% 28 min, heat pump only in Climate pack, single 19-in Aero 245/45R19: content looks European despite the en-ca URL, so nothing taken. autodealcanada EX40 spec page lists 20 in (P235/45HR20 front, P255/40HR20 rear) for Plus, Ultra and base alike, contradicting other pages that call 20 in optional: not used. EX40 heat pump: dealer/US pages say optional in a cold-weather package, no Canadian trim page read.
- Conflicts: EX30 DC peak 153 kW (thinkEV) vs 134 kW (ArenaEV, EU) vs 157 kW (EVKX); EX40 200 kW (dealer) vs 205 kW (Carvana, US). Not added.
- Stale-match evidence: none.

## 2026-11-15: Nissan ARIYA + LEAF quick lookup (research/batch-2026-11-15-nissan.json, --check OK, not applied)
- **LEAF 2026 (new gen, S+/SV+/Platinum+; all quick lookups, low confidence):** DC 150 kW, port NACS, Supercharger yes, 10-80% 35 min (https://www.spinellinissan.com/en/news/view/53-kwh-or-75-kwh-ccs-or-nacs-the-2026-nissan-leaf-questions-buyers-ask-first/161878; per-model, not per trim). Heat pump standard on all trims (https://driveteslacanada.ca/news/2026-nissan-leaf-debuts-with-up-to-488-km-range-new-styling-and-nacs-charging/). Wheels: SV+ 18 in, Platinum+ 19 in (Spinelli); S+ not stated.
- **LEAF not found:** usable kWh (only "75 kWh", gross/usable unstated), chemistry (only "lithium-ion", not an allowed value), voltage class, AC onboard kW (nissan.ca page listing 7 and 11 kW is the 2027 LEAF page, no trim mapping, not used), drivetrain (one front motor per press, "likely FWD", not stated), preconditioning (Auto123 says navigation adjusts cooling; no charge-preconditioning statement; battery heater only).
- **ARIYA 2026:** nothing added. nissan.ca specs page (https://www.nissan.ca/vehicles/electric-cars/ariya/specs.html) says only "lithium-ion", "Battery heater", no heat pump, no trim mapping for 19/20 in wheels, blank 10-80% times. Possible stale/market issue: that page lists a NACS quick-charge port, but NACS is reported as new for the 2027 ARIYA (driveteslacanada.ca), so the page may be 2027 content; 2026 Canadian ARIYA is CCS1. SV 19 in (P235/55R19) only seen in a dealer snippet, not read. 130 kW DC peak reported; 35 min is 20-80%, not 10-80%.
- Stale-match: none found for LEAF (all variants are the new generation). Pack sizes: ARIYA SV/SL e-4ORCE 63 kWh usable, others 87 kWh usable per nissan.ca (66/91 gross).

## 2026-11-15: Ford Mustang Mach-E 2026 + F-150 Lightning 2025 quick lookup (research/batch-2026-11-15-ford.json, --check OK, not applied)
Read directly: ford.ca Mach-E Premium, GT, Rally pages (https://www.ford.ca/suvs/mach-e/models/premium/, /gt/, /rally). Ford Canada Lightning pages (ford.ca/trucks/f150-lightning/, .../f150-platinum) returned no specs in the readable text; fordauthority.com 403 (not worked around).
- **Mach-E heat pump:** "Vapor Injection Heat Pump" standard on GT and Rally (normal confidence); applied to SR, SR AWD, ER, ER AWD from the Premium page, low confidence (variant-to-Select/Premium mapping not confirmed).
- **Mach-E wheels:** GT 20 in std (245/45R20) + 20 in optional summer-tire wheel; Rally 19 in std (235/55R19) + 19 in optional. SR/ER variants left out: Premium is 19 in std (225/55R19) + optional 19 in black, but Ford trims (Select/Premium) don't map clearly to the variant names.
- **Not found (Mach-E):** chemistry, preconditioning, 10-80% (only a dealer blog "under 35 min", not used), charge port (Ford Canada lists an optional "Fast Charging Adapter (NACS)"; a press snippet says the 2026 port is still CCS1 - unconfirmed, not added), Supercharger access (adapter listed, but no page states Supercharger access, so not recorded as via_adapter).
- Batteries seen but not added (already filled or ambiguous): 73 / 88 kWh (Select/Premium, gross vs usable not stated), 91 kWh usable (GT, Rally).
- **F-150 Lightning:** only Platinum wheels: 22 in optional (Dark Elements package, US article, low). Other trims: 18 in gloss black std on Pro/XLT, 20 in on Flash/Lariat (US sources/snippets, order guide) not added; variants are named by battery, not trim. Heat pump (a snippet says Vapour Injection Heat Pump on 2025), chemistry, preconditioning, Supercharger access (NACS adapter ~$600 bundled with Mobile Power Cord per InsideEVs), 10-80%: no readable Canadian page, not added.
- No stale-match evidence found. Conflict: port (above).

## 2026-11-15: preconditioning, wheels, Supercharger gaps (research/batch-2026-11-15-precondition-wheels.json, --check OK, not applied)
All values low confidence. Blocked (403, not worked around): chevrolet.com/.ca support pages, cadillaccanada.ca, gm.ca, tesla.com manuals. Manufacturer pages for Hyundai/Kia Canada give no wheel sizes per trim.
- **Preconditioning, Kia EV6 (3 variants):** automatic_and_manual. Manual via infotainment/app: Kia UK page names EV6/EV9 (https://www.kia.com/uk/about/news/what-is-ev-battery-preconditioning/). Navigation trigger: generic Kia EV manual page, model not named (https://ownersmanual.kia.com/full_webhelp/SW1K/2026/en_RG/topics/t00027.html). UK market, not confirmed for Canada.
- **Kia EV9 (5 variants):** automatic_and_manual: 2024 EV9 manual (nav trigger in battery conditioning mode, https://www.manualslib.com/manual/3377411/Kia-Ev9-2024.html?page=22) plus the Kia UK page for manual activation.
- **Tesla Model 3 and Y (all 11 variants):** automatic_with_navigation (https://www.iphoneincanada.ca/2024/12/24/tesla-superchargers-now-heat-your-battery/); page mentions no manual control, silent rather than a denial. Tesla manual pages were blocked.
- **Not recorded:** Hyundai (IONIQ 5/6/9, Kona): only third-party snippets (recharged.com, now 410) saying navigation-only; Hyundai Canada pages only say a battery temperature management system pre-warms while plugged in (not navigation). Chevrolet/Cadillac: Chevy quick-start guide snippet mentions "Fast Charge Prep" in the Charging app but the page was blocked. Niro EV: nothing.
- **Supercharger via_adapter (Blazer EV, Equinox EV, Silverado EV, LYRIQ, all 14 variants):** https://guideautoweb.com/en/articles/75753/gm-drivers-can-now-order-their-nacs-adapter-to-use-at-tesla-superchargers (Canadian, Sept 2024, $310 adapter). Not found for Hyundai IONIQ 5 N/IONIQ 6/Kona (Hyundai Canada free-adapter program unconfirmed; forum said none) or Niro EV.
- **Wheels:** Blazer EV SS AWD 22 in standard (iSeeCars, US listing). Model Y Premium AWD 19 in standard / 20 in option; Performance 21 in standard (https://tslna.com/?p=1866, Canadian). Not added: Model Y RWD/Standard variants (18 in only per same page; rwd-b vs standard-b mapping unclear), Model 3 (nothing found), Equinox EV (US iSeeCars: LT 19, RS 21; Canadian trim ids "11-5-kw-charger" etc. don't map), Blazer LT 19 / RS 21 (US; variant "standard" mixes them), Niro EV (17 in on Wind+ per Manitoba dealer listings; Wave unknown), EV6 (19 in Light/Wind, 20 in Land GT-Line, from US/proxy sources only; thinkEV says rated ranges use 19 in), IONIQ 6 (Hyundai Canada 2025 summary snippet: 18 in standard, 20 in with Ultimate package; PDF not read), IONIQ 5 (19 in aero alloy on 2026 product card snippet, per-trim unclear), IONIQ 9, EV9, Kona, Silverado, LYRIQ (20/22 earlier note) not verified.
- **LYRIQ port question (2026, Canada):** nothing recorded. Cadillac Canada's EV page snippet speaks of Cadillac EV drivers using a GM-approved NACS DC adapter (general, not LYRIQ-specific, page blocked); US/dealer/third-party sources (The Charge Port, Cadillac dealer tables) say the 2026 LYRIQ is CCS1 with adapter and that native NACS starts with 2027 (GM Authority, Carvana); the 2026 Optiq is the only native-NACS Cadillac. No Canada-specific 2026 LYRIQ page found. Likely CCS1 + adapter, not confirmed; the earlier "NACS on some trims" snippet is unexplained (possibly Optiq or 2027).
- **Stale-match evidence:** none found (2027 LYRIQ/Equinox/Blazer/Silverado move to native NACS, but those are later model years).
