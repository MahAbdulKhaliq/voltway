# Check: batch-2026-11-20-b112-toyota.json (adapters + heat pumps; Toyota, Lexus, Subaru)

Checked 2026-11-20. `npx tsx scripts/add-facts.ts ... --check`: OK (batch valid). Pages that blocked or could not be read were not worked around (Subaru trim-comparison and pricing PDFs are binary and unreadable by the fetcher; otogo.ca returned 503; Toyota Canada EV charging matrix PDF unreadable; lexus.com RZ brochure 403).

## Verdict: FIX

Adapter values are mostly right and well sourced. Four real problems:
1. 48 trims have no heat pump (batch notes say 44; I count 48). This breaks the owner's no-unknowns rule. Several are fillable now, see section "Heat pump findings".
2. Estimates that cross markets or rest on a "plans to provide" article (Uncharted, Trailseeker CA, Solterra 2026 CA, C-HR CA, Lexus TZ) are weak. Better manufacturer sources exist for several; see section "Better sources".
3. Woodland 2026 heat pump is labelled `manufacturer` but no cited page mentions the Woodland.
4. Some "manufacturer" labels sit on a journalist's own words (Charged first drive); fixable by citing Subaru's own feature pages (found below).

## Per-claim results

| Variant(s) | Field | Value | Result | Evidence |
|---|---|---|---|---|
| bZ4X 2023-25 (all, US and CA) | adapters_included | nacs_to_ccs1_on_request / manufacturer | ✅ | US pressroom: "Starting in November, model year 2023-25 Toyota bZ4X owners will receive a letter". Toyota Canada: "one free NACS adapter". Year of the letter (2025) is not on the pages (only "November"); US Lexus page says "November 2025". Notes say 2025, fine. Both pages say owners "will need" a CCS1-to-J3400 adapter, matching the direction. |
| RZ 2023-25 (US and CA) | adapters_included | nacs_to_ccs1_on_request | ✅ | Lexus US: "Starting in November 2025 ... free NACS charging adapter". Lexus CA release: "one complimentary NACS charging adapter per vehicle". Note: the Lexus CA FAQ itself does not say complimentary; the CA release does, and the batch cites that. |
| ES 2026, RZ 2026 (CA+US) | adapters_included | ccs1_to_nacs_sold / LC | ✅ | Lexus CA FAQ: "2026 Lexus BEVs do not come equipped with an adaptor"; Genuine adaptors "available for purchase at your Lexus Dealer". US in the box (pressroom: "All 2026 Lexus BEVs will come standard with adapters"). Sold is the offer that holds in both markets; LC and note are right. |
| RZ 2026 US-only (350e premium, 450e premium awd) | adapters_included | ccs1_to_nacs / manufacturer | ✅ | Lexus US pressroom quote above; Toyota NACS-migration caption "complimentary charging adapters (one set per VIN)". |
| bZ 2026 CA+US (limited-awd, woodland-awd) | adapters_included | ccs1_to_nacs_sold / LC | ⚠ | Toyota Canada: "will soon be able to order a Toyota-approved" adapter via dealer. The page does not say sold or free. "Sold" is plausible (Toyota Canada 2027 release: "New this year, every bZ receives CCS and J1772 charging adapters", and a Quebec article headline says Toyota made the adapters free; its text could not be opened), but unproven for 2026 on the cited page. Keep LC; add the 2027 Canada release as corroboration. |
| bZ 2026 CA-only (awd, standard, woodland-awd-all-terrain-tire) | adapters_included | ccs1_to_nacs_sold / LC | ⚠ | Same as above. |
| bZ 2026 US (xle-fwd, xle-awd, xle-plus-fwd, limited-fwd) | adapters_included | ccs1_to_nacs / manufacturer | ✅ | Toyota US: "All 2026 Toyota BEVs will come standard with adapters" (J1772 and CCS). |
| bZ 2027 US (5 cars) | adapters_included | ccs1_to_nacs / estimated, LC | ❌ (upgrade) | Not an estimate any more. Toyota US 2027 bZ release (https://pressroom.toyota.com/everyday-electric-confidence-returns-for-2027-with-toyota-bz/): "Each bZ model also has a standard adapter kit for compatibility with SAE J1772 and ... CCS" and the model "remains unchanged from the prior model year". Woodland page (https://pressroom.toyota.com/rugged-powerful-and-charged-up-for-adventure-2027-toyota-bz-woodland/): "Standard J1772 and CCS1 charging adapters". Value is right; kind should be `manufacturer` with these sources. |
| bZ 2027 US | heat_pump | standard / estimated, LC | ✅ (better) | Same US 2027 release says "unchanged from the prior model year" (that is the carry-over statement the brief requires). Heat pump itself not named on that page, so keep estimated, but cite it as the basis and name 2026 vs 2027. |
| ES 2027 US (4 cars) | adapters_included | ccs1_to_nacs / estimated | ⚠ | Basis (2026 US "all 2026 BEVs" statement + dealer page "CCS-to-NACS adapter in the box") is acceptable for a same-model carry-over, but no source says the 2027 ES is unchanged. Keep estimated + LC. Dealer page is not a maker source. |
| TZ 2027 US (2 cars) | adapters_included | ccs1_to_nacs / estimated | ❌ | Basis is a different, new model (2027 TZ) from the "all 2026 BEVs" statement. Lexus TZ US pressroom has no adapter text (I checked: only an appliance accessory adapter). Lexus CA TZ page also silent. Reject as estimate unless a TZ source is found, or record as unknown with a note. |
| Solterra 2023-25 (US + CA) | adapters_included | nacs_to_ccs1_sold / manufacturer | ✅ | Subaru release: "can purchase a Genuine Subaru Accessory Fast Charging Adapter (NACS)". US release; CA car (solterra-awd 2023/2024) carried from Drive Tesla Canada (does not name Canada). Subaru's own release says nothing about Canada; the `LC` on the CA cars is right. |
| Solterra 2026 awd (CA) | adapters_included | ccs1_to_nacs / manufacturer, LC | ❌ | Only a US source (InsideEVs: "comes out of the box with two adapters"). Subaru US features page also says "standard adapters that let you charge virtually anywhere". The car is CA-only here; Toyota Canada did the opposite of the US for 2026. Needs a Subaru Canada source; kind should be estimated at best. |
| Solterra 2027 US | adapters_included | ccs1_to_nacs / estimated | ⚠ | Carry-over from 2026 with no "unchanged" statement found; the batch's "2027 press kit says lineup continues" is not cited. Acceptable as estimated + LC. |
| Trailseeker 2026 US, 2027 US | adapters_included | ccs1_to_nacs / manufacturer (2026), estimated (2027) | 🏷 | Charged quote verified: "The car comes standard with both DC and AC adapters for CCS and J-1772". That is a reporter's sentence, not a Subaru statement. Subaru's page (https://www.subaru.com/vehicles/trailseeker/2026/features.html) says "With its included adapters, the Trailseeker lets you charge virtually anywhere." Cite that for `manufacturer`. |
| Trailseeker 2026 awd (CA) | adapters_included | ccs1_to_nacs / estimated | ❌ | Basis is the US report. Market differs and Toyota Canada showed Canada can differ from the US. No Canadian source. Reject unless a Subaru Canada page is found. |
| Uncharted 2026/2027 US (gt-awd, premium-fwd, sport-awd) | adapters_included | ccs1_to_nacs / estimated | 🏷 | Charged says only "plans to provide" (pre-production) and "bundling and price not final". Subaru's page (https://www.subaru.com/vehicles/uncharted/2026/features.html): "standard adapters that let you charge virtually anywhere". Use that as `manufacturer`. Press kit (2406) has no adapter text. 2027 carry is estimated; fine. |
| Uncharted 2026 CA (long-range-fwd, sport-awd CA/US) | adapters_included | ccs1_to_nacs / estimated | ❌ | CA market has no source; estimate crosses markets. For `sport-awd` (CA/US) the US value holds only for the US. |
| C-HR 2026 awd (CA/US), standard (CA) | adapters_included | ccs1_to_nacs_sold / estimated | ❌ | Basis is the Toyota Canada 2026 bZ release (different model). Toyota Canada C-HR release has no adapter text. Toyota US C-HR release: "Standard NACS-to-CCS charging adapter included" is listed under the SE only; it does not say the XSE has it. The Quebec article headline (otogo.ca, could not open) says Toyota made adapters free for "C-HR, bZ, bZ Woodland", which points to Canadian in-the-box from 2027. Not a safe estimate for 2026; also, the US value for `awd` (XSE) is unproven. |
| C-HR 2027 US se | adapters_included | ccs1_to_nacs / estimated | ✅ | US SE page quote above is for the 2026 SE; carry-over to the 2027 SE is acceptable as estimated + LC. Note the page's wording is "NACS-to-CCS", but the car has a NACS port; the batch's "charger plug to car port" naming (ccs1_to_nacs) is consistent with the brief. |
| bZ4X US 2023 (limited-awd, xle, xle-fwd) | heat_pump | standard / manufacturer | ✅ | Toyota US launch: "Heat pump system for both heating and air-conditioning" (general list, no grade named). Reasonable to treat as every grade since options in the same list are flagged "Available". |
| bZ4X 2025 US (xle-awd, xle-fwd, limited-*, nightshade) | heat_pump | standard / manufacturer | ✅ | Toyota US 2025: same sentence; grades XLE, Limited, Nightshade. |
| bZ4X 2024 US (limited-*, xle-*), 2024 xle-awd | heat_pump | standard / manufacturer, LC | ✅ | InsideEVs 2024: "Heat pump system for both heating and air-conditioning"; XLE and Limited. Press site relaying maker pricing sheet, fine as `manufacturer`. |
| bZ4X CA: 2024 le-fwd, 2025 le, le-awd, xle-awd-technology-package | heat_pump | standard / manufacturer, LC | ⚠ | Toyota Canada 2023 (French): "un système de pompe à chaleur pour le chauffage et la climatisation"; 2026 release lists it too. Carry across 2024-25 lacks any "unchanged" statement; brief requires one. Keep LC; bracketing years named. |
| bZ 2026 (xle-fwd, xle-awd, xle-plus-fwd, limited-fwd) US | heat_pump | standard / manufacturer | ✅ | Toyota US 2026: "Heat pump system for both heating and air-conditioning". Not per grade. |
| bZ 2026 woodland-awd, woodland-awd-all-terrain-tire | heat_pump | standard / manufacturer | ❌ | Neither the Toyota US 2026 release nor the Canada release mentions the Woodland (Canada page: Woodland only in the nav menu). Mark `estimated`, LC, basis "same pack/motors as 2026 bZ XLE AWD"; or find the 2026/2027 Woodland press kit. 2027 Woodland page (US) shows no heat pump text in the first 100k chars. |
| bZ 2027 (all, US) | heat_pump | standard / estimated | ✅ | See above (US 2027 release: "remains unchanged from the prior model year"). |
| Solterra 2027 limited, premium | heat_pump | standard / estimated | ⚠ | InsideEVs: lists "a heat pump, battery preconditioning" as 2026 upgrades (no trim detail). That implies the 2023-25 Solterra was not the same on this point per InsideEVs, which conflicts with the Charged 2023 "standard heat pump" (see findings). Subaru 2026 Solterra page does not mention a heat pump. OK as estimated + LC. |

## Required changes

1. **Fill the 48 missing heat pumps** (or state unknown with a reason, which the owner rule does not allow). Counts: Lexus ES 8, RZ 16, TZ 2, Solterra 2023-25 8, Trailseeker 5, Uncharted 6, C-HR 3. Findings below show what I could and could not source.
2. `toyota/bz/2027/*` adapters: change kind to `manufacturer`, source = Toyota US 2027 bZ release (and Woodland page for the Woodland); drop the estimate note. Heat pump: keep estimated but cite the "unchanged" sentence.
3. `toyota/bz/2026/woodland-awd` and `woodland-awd-all-terrain-tire` heat_pump: `manufacturer` is wrong; no cited page covers the Woodland. Make `estimated` + LC or find a Woodland source.
4. `lexus/tz/2027/*` adapters: remove the estimate (new model, no TZ source, a different basis from "all 2026 BEVs"). Look for a Lexus order guide or press kit, otherwise leave unknown.
5. `subaru/trailseeker/2026/awd` (CA), `subaru/uncharted/2026/long-range-fwd` (CA), `subaru/uncharted/2026/sport-awd` (CA/US), `subaru/solterra/2026/awd` (CA): no Canadian source; cross-market carry is not allowed. Find Subaru Canada pages (subaru.ca features or pricing release) or drop.
6. `subaru/trailseeker/2026/limited-awd`, `premium-awd` and `subaru/uncharted/2026/gt-awd` (US): switch source from Charged to the Subaru feature pages quoted above, so `manufacturer` is honest. Uncharted 2027 US carries from that page.
7. `toyota/c-hr/2026/awd`, `toyota/c-hr/2026/standard` adapters: the basis (bZ Canada policy) is a different model, and the US page covers only the SE. Drop or find a C-HR specific source (Toyota Canada EV charging matrix PDF, which my fetcher could not read, is a promising manufacturer source; so is the Quebec article).
8. `toyota/bz/2026` CA cars: keep `sold` + LC but add the 2027 Toyota Canada release as corroboration (the 2026 page does not say sold).
9. Correct the notes' count (44 vs actual 48 trims).

## Heat pump findings for the 48 missing trims (not written to the batch)

| Model | Finding | URL | Usable? |
|---|---|---|---|
| Solterra 2023-25 (US 6 trims, CA 2 trims) | Charged: Subaru execs said Solterra loses less range in cold "due to its standard heat pump". Quote verified. CarGurus Canada (search summary, not opened): "heat pump comes standard on Canadian models". | https://chargedevs.com/newswire/2023-subaru-solterra-the-love-brand-finally-gets-an-electric-suv/ | Yes for 2023, standard, all trims, `community` or `manufacturer` (relays Subaru exec statement). 2024-25 carry only if a source says unchanged. Note this conflicts with InsideEVs listing the heat pump as a 2026 upgrade, so mention both. |
| bZ/Solterra 2026+ | InsideEVs: "a heat pump, battery preconditioning" among 2026 upgrades. | https://insideevs.com/news/779213/subaru-solterra-nacs-test/ | Weak, no trims. Subaru 2026 features pages for Solterra, Trailseeker, Uncharted do not mention a heat pump. |
| Trailseeker, Uncharted | None found. Subaru press kits, features pages, Charged articles: no heat pump text, only battery preconditioning. | https://www.subaru.com/vehicles/trailseeker/2026/features.html ; https://www.subaru.com/vehicles/uncharted/2026/features.html | No. Cannot be filled from openable sources; `none` also lacks a source. |
| C-HR | Toyota US launch and 2026 release: no heat pump text. Toyota Canada C-HR release: no heat pump. Guide Auto (Canada preview, 2025): "A battery preconditioning system and energy-saving heat pump are expected to speed up charging sessions". Toyota Europe C-HR+ release says heat pump (other market, other car). | https://www.guideautoweb.com/en/articles/78566/toyota-c-hr-returning-to-canada-for-2026-as-electric-crossover | Weak (expectation, pre-launch). Not enough for a value. |
| Lexus RZ 2023-26 | Autoexpress (UK long-term test, via search summary, not opened): "The RZ does have a heat pump and battery conditioning". Electrifying.com says Lexus tuned cabin heating. Lexus US 2023 launch release (p=66609) mentions only optional radiant heaters. | https://www.autoexpress.co.uk/lexus/rz/360906/lexus-rz-450e-long-term-test-review | Possible estimated for UK/EU RZ; market differs. Not usable for NA without an NA source. The 2023 Lexus US pre-brochure returned 403. |
| Lexus ES 2026-27 | Lexus US pressroom pages and dealer page: no heat pump. Only "thermal management" and radiant heater (standard on Luxury, optional on Premium; that is not a heat pump). | https://pressroom.lexus.com/?p=75856 (first 100k chars) | No. |
| Lexus TZ 2027 | Lexus US and Canada pages: no heat pump. | https://pressroom.lexus.com/all-electric-three-row-luxury-the-all-new-2027-lexus-tz/ | No. |

Things to try next (could not open): Subaru trim comparison PDFs (subaru.com/services/vehicles/pdf/trimComparison/2023/SOL and .../2026/TSK) which are manufacturer spec lists but are binary to the fetcher; the Toyota Canada features PDF for the C-HR; the Toyota Canada EV charging matrix PDF; Lexus Canada RZ/ES build-and-price pages.

## Other checks

- Supercharger access vs adapter: no disagreements. Every CCS1-port car with `via_adapter` has a `nacs_to_ccs1*` value; every NACS-port car has a `ccs1_to_nacs*` value.
- Direction naming: consistent (charger plug to car port).
- Source quality: all sources have URL and `accessed_on`. `src-tvlexus-es-2026-charging` (dealer page) and Charged / InsideEVs / Drive Tesla Canada are `community`; they back `manufacturer` values in several places (Trailseeker, Solterra 2026, Solterra CA). Replace with the Subaru pages above where possible.
- Required-field gaps (rule 14): heat_pump missing on the 48 trims listed.

## Applied by the main session (2026-11-20)
- bZ 2027 US adapters: relabelled `manufacturer`, cited to the 2027 bZ and 2027 bZ Woodland Toyota USA releases (new sources).
- bZ 2027 heat pumps: still `estimated`; basis is now the 2027 release's "unchanged from the prior model year" line.
- bZ 2026 Woodland heat pumps (2 cars): `estimated`, low_confidence.
- Dropped adapter estimates: Lexus TZ 2027 (2), Subaru Trailseeker 2026 CA, Uncharted 2026 long-range-fwd and sport-awd, Solterra 2026 CA, C-HR 2026 awd and standard.
- Trailseeker and Uncharted 2026 US adapters: re-sourced to Subaru's own 2026 feature pages, `manufacturer`. The 2027 cars stay estimated.
- Added Solterra 2023 heat pump `standard` (3 cars) from Charged EVs quoting Subaru executives.
- Kept: CA bZ4X 2024–25 heat pump low_confidence. Unfilled: 48 trims (Lexus/Subaru/C-HR heat pumps), left for the owner's gap list.
- `--check` passes.
