# Check: batch-2026-11-20-b112-audi-vw.json (B112 adapters + heat pumps)

Checked 2026-11-20. `add-facts --check`: OK (valid). All 103 cars in `research/b112-todo-audi-vw.json` have `adapters_included` and every trim has a `heat_pump`, so there are no unknowns (check 14). `public/data/cars` has no existing `heat_pump` or `adapters_included` values for these cars, so there is nothing to compare against (check 11). audiusa.com returned 403 and was not worked around. All 26 sources opened except that one. The Audi FAQ claims are verified only through relays (Audi Club NA, electrive, InsideEVs).

**Verdict: FIX.** The adapter values for Audi and VW are mostly sound, but several heat pump values rest on weak, European or conflicting sources, the e-Golf values are mislabelled, and the e-tron/Q8 Supercharger access has no source.

## Answers to the riskiest points

1. **e-tron 2019-23, Q8 2024-25, e-tron GT 2022-24 `none` vs the US$200 accessory.**
   - Audi Club NA says the adapter is a "port-installed accessory" for new Q6, A6 Sportback and e-tron GT purchases. It says existing owners "should also expect a future announcement". It states no price on the page I read; the US$200 MSRP comes from the audiusa.com FAQ snippet (search result), which I could not open.
   - electrive says "not yet available to existing customers". InsideEVs says Audi has "no timeline" for selling the branded adapter.
   - I found no 2026 announcement that it is sold to existing owners. `none` is therefore supported as of Sept 2025 and unverifiable for now, because the FAQ is blocked. The batch's note that it "may be stale" is honest. Keep `low_confidence`.
   - **Do not switch to `nacs_to_ccs1_sold`** without the Audi FAQ or a dealer page that says existing owners can buy it. The US$200 price is for the accessory on new cars.
   - **Supercharger access for the e-tron and Q8 (report only):** no source I opened names them. InsideEVs lists "E-Tron GT, Q6 E-Tron, A6 E-Tron", and the Q4 is excluded. Audi's FAQ, as relayed by search, says the Q8 is not named. Our `via_adapter` access for the 2019-25 e-tron and Q8 rests on an estimate ("all Audi EVs except Q4"), so it is unsupported. Owners can't buy an Audi adapter, so "no" or "unknown" looks more honest.
   - For the e-tron GT 2022-24, access is supported (GT named), but the owner purchase is pending.
2. **Two entries per field (one per market).** The format allows both, but the car needs one value. Recommendations if the car is sold in both markets:
   - **ID.4 heat pump:**
     - The US value is solid: `none`. AutoGuide and InsideEVs, Jan 2023: "the U.S. market ID.4 does not come with a heat pump".
     - Canada is `optional` from 2024 (Autotrader.ca: "optional heat pump for $1,500 on every model").
     - Pick `none` for cars sold in both markets, because "standard/optional" does not hold in the US. Name Canada in the notes.
     - For Canada-only cars (2025 Base, 2026 AWD) `optional` stands. For US-only cars `none` stands.
     - `none` is the value that holds in both markets; the Canadian option goes in the notes.
   - **ID.4 2021-22 Canada `standard`:** this conflicts with a later source. Drive Tesla (June 2021, pre-launch) quotes VW: "included the heat pump as standard equipment in all ID.4 models bound for Canada". InsideEVs (Jan 2023) says "in Canada the heat pump is an optional feature". The batch records `standard` with no `low_confidence`, and the notes don't mention the conflict.
     - Fix: add `low_confidence` and name both, or record `optional`.
     - Even so, the US value for the same car is `none`, so the car's single value should be `none`.
   - **ID. Buzz adapter (CA + US):** US `sold` (US$200) is Electrek-verified. For Canada, Auto123 says "free from their dealership", which is a community relay. vw.ca says only "contact their dealer" and does not say free. Keep the car's value `nacs_to_ccs1_sold` with the Canadian note. Don't carry `_on_request` as a second value from a non-VW source. The brief wants one value per car, and the offer holding in both markets is `sold`.
3. **electrichasgoneaudi.net.** It describes itself as "Independent fan site. Not affiliated with AUDI AG" and links EVKX.net. It is language-switchable (English, Norsk, Deutsch, Français), so it is Europe-oriented, and it names no market or year.
   - It mentions a second heater "standard in some cold markets".
   - The page's wording is verified for the e-tron ("heat pump as standard"), Q8, Q6 and A6, so the quotes are accurate. It is not a good source for North America.
   - Better sources found for the e-tron and Q8:
     - e-tron: Audi US launch release (automotiveworld.com/news/electric-goes-audi-all-electric-audi-e-tron-suv-unveiled...): "standard equipped heat pump" (search snippet, not opened).
     - Q8: InsideEVs 2024 Q8 US launch and Wards Auto: "four-zone automatic climate control with a heat pump" standard (search snippets, not opened).
   - For Q6 and A6, I found no US/Canada proof of the heat pump; Edmunds and Consumer Reports show only a "Warm Weather" package. The value is plausible but unverified for NA. Keep `low_confidence`, and note the source is a Europe-leaning fan site. Prefer an Audi USA or audi.ca spec page.
4. **Q4 e-tron timeline** (2022 `optional` / 2023-24 `none` / 2025 55 `optional`, 45 `none`).
   - **2023 onward `none` is supported.** InsideEVs (Jan 2023): "resistive heaters instead of heat pumps" from February, for "all Q4s". Drive Tesla Canada: "beginning in February 2023"; C$1,000 credit.
   - **2024 `none` is weakly supported.** The note says the Cold Weather package "only returned for 2025" and cites the Jan 2023 InsideEVs page. That page does not say this. The 2025 article implies it. Cite the right page.
   - **2025 55 `optional` is verified.** InsideEVs: Cold Weather package "includes a heated windshield and heat pump", on Q4 55 trims.
   - **2025 Q4 45 `none` is hedged.** The page says the 45 "seems" not to get it. Keep `low_confidence` (it has it).
   - **2022 `optional` rests on the European fan site.** Option 9M3 only inside package WNW. That is probably a European spec, with no US/Canada source. Canada's Feb 2023 cut implies Canadian Q4s had one, but standard or optional is unknown.
   - **2026 is carried** from the 2025 announcement; it has `low_confidence`.
5. **ID.4 Canada timeline.**
   - 2023 `none` is supported by InsideEVs: "late December 2022".
   - 2024 `optional` is verified for Canada (Autotrader).
   - 2025-26 `optional` is carried from 2024 with `low_confidence` and "no 2025/2026 page opened". Carry-over needs a source that says the system is unchanged; there is none.
   - Q: 2023 note says "Early 2023 cars may still have one". It is fine as `low_confidence`.
6. **e-Golf `optional` 2016-20 / `standard` 2015.** These are mislabelled.
   - Carvana 2019 says only the SEL Premium has "a heat-pump cabin heater"; the SE page doesn't say. Carvana 2017 lists a heat pump only on the Limited Edition. It does not mention SEL Premium.
   - The heat pump is trim-linked, not a paid option, so `optional` is the wrong label. The batch itself says "Heat pump only on the top trim (SEL Premium), not on SE". Each e-Golf car has a single trim covering both, so the per-trim format can't express that.
   - 2015 `standard` is plausible: the launch was SEL Premium only, and the VW text says "newly developed heat pump". But the Conceptcarz page "does not tie the pump to the trim", and a "Limited Edition" reportedly lacks it.
   - 2016: no page opened, and `optional` is carried. If only the SEL Premium existed in 2016, `standard` would follow the 2015 logic. Unproven.
   - Suggest the trim split, or `optional` with notes, but not for 2016 without a 2016 source. 2020 (Canada only) has no Canadian trim page.
7. **Q6/A6/e-tron GT 2026-27 adapter in the box** (carried from the Sept 2025 announcement).
   - Audi's announcement covers "new 2025" purchases only, and "starting in September" 2025. Nothing I found covers MY2026 or MY2027.
   - The carry is flagged `low_confidence` with the note "no change found". That is a reasonable carry, but the brief says carry-over needs a source that says the year is unchanged. **Accept with `low_confidence`, or require a 2026 Audi page.**
   - The 2025-MY entries (Q6, A6, GT) record the Sept 2025 "in the box" state. The brief says: if it changed during the model year, record the earlier state and put the change in the notes. Earlier 2025 deliveries had none, and existing owners' purchase was "subject to a future announcement". Either record `none` (earlier state) with the change in the notes, or defend the choice in the notes. The batch's notes say this but chose the later state.
   - Canada isn't confirmed. Drive Tesla Canada: "pricing for the adapter was not announced". The Audi section doesn't name Canada. The 2025 A6 cars are CA-only, so Canadian terms are unproven. It is flagged `low_confidence`.

## Table

| Variant / group | Field | Value | Result | Evidence |
|---|---|---|---|---|
| Q6 / A6 / GT 2025 (US+CA) | adapters_included | nacs_to_ccs1 | ⚠ partly | electrive: adapter "comes with new purchases of the 2025 Q6 e-tron, the A6 Sportback e-tron, and the e-tron GT". Earlier-state rule not followed; Canada unconfirmed. |
| A6/Q6/GT 2026-27 | adapters_included | nacs_to_ccs1 | ⚠ unverifiable | No 2026/27 source; carried. |
| e-tron 2019-23, Q8 2024-25 | adapters_included | none (estimated) | ⚠ unverifiable | Audi FAQ (403). Relays: "not yet available to existing customers". Q8 never named. |
| e-tron GT 2022-24 | adapters_included | none (estimated) | ⚠ unverifiable | Same; GT is named for new cars only. |
| Q4 e-tron 2022-26 | adapters_included | none (manufacturer) | ✅ | electrive: "cannot currently use the Audi NACS DC charging adapter". |
| e-Golf 2015-20 | adapters_included | none | ✅ | vw.ca: "cannot be used with the e-Golf". |
| ID.4 2021-25 | adapters_included | nacs_to_ccs1_sold | ✅ | Electrek: "$200 from VW"; C$304; vw.ca: "sold separately". |
| ID.4 2026 | adapters_included | nacs_to_ccs1 | ✅ (US) / ⚠ (CA) | Electrek: "Model year 2026+ VW EVs will come standard with the adapter included." vw.ca silent. |
| ID. Buzz 2025 | adapters_included | sold + on_request (CA) | 🏷 | Electrek: US$200. Auto123: "free from their dealership". vw.ca: contact dealer. Two entries; use one. |
| e-tron 2019-23 | heat_pump | standard | ⚠ | Fan-site quote verified: "heat pump as standard". Not an NA source; Audi US release exists (snippet). |
| Q8 2024-25 | heat_pump | standard | ✅ | Audi global: "heat pump as standard equipment". US sources agree (snippets). |
| e-tron GT 2022-27 | heat_pump | standard | ✅ | Audi: "efficient heat pump as standard". Global page; 2025+ update not checked (flagged). |
| Q6 2025/27 | heat_pump | standard | ⚠ | Fan site only; no NA source. |
| A6 2025/27 | heat_pump | standard | ⚠ | Fan site only; no NA source. |
| Q4 2022 | heat_pump | optional | ⚠ | Fan site, option 9M3 in WNW; probably Europe. |
| Q4 2023-24 | heat_pump | none | ✅ | InsideEVs: "resistive heaters instead of heat pumps". Fix the 2024 citation. |
| Q4 2025-26, 55 | heat_pump | optional | ✅ | InsideEVs: "includes a heated windshield and heat pump". 2026 carried. |
| Q4 2025-26, 45 | heat_pump | none | ⚠ | Page: base 45 "seems" not to get it. |
| ID.4 2021-22 CA | heat_pump | standard | ❌ | Conflicts with InsideEVs Jan 2023 ("optional" in Canada). Add `low_confidence`. |
| ID.4 US, all years | heat_pump | none | ✅ | AutoGuide: "U.S. market ID.4 does not come with a heat pump". The GCR 2021 page is pre-launch ("no mention of a heat pump"); prefer AutoGuide. |
| ID.4 2023 CA | heat_pump | none | ✅ | InsideEVs: late Dec 2022. |
| ID.4 2024 CA | heat_pump | optional | ✅ | Autotrader.ca: "optional heat pump for $1,500". |
| ID.4 2025-26 CA | heat_pump | optional | ⚠ | Carried, no source for 2025/26. |
| ID. Buzz 2025 | heat_pump | standard | ⚠ | Greencars (June 2023, pre-launch): "A heat pump is standard on all models". No VW page. |
| e-Golf 2015 | heat_pump | standard | ⚠ | Conceptcarz: "newly developed heat pump", launch SEL Premium only; page doesn't tie to trim. |
| e-Golf 2016-20 | heat_pump | optional | 🏷 | Trim-linked (SEL Premium / Limited Edition), not an option. 2016 has no source. |

## Required changes

1. **ID.4 2021-22 (CA+US cars):** the CA `standard` conflicts with InsideEVs Jan 2023 ("optional"). Add `low_confidence` and state both, or change to `optional`. For cars sold in both markets, the single value that holds is `none` (US). Apply the same single-value rule to 2023-26 ID.4 cars that carry two entries (`pro`, `pro-awd`, `pro-s*`, `standard`, `standard-range`): keep `none`, and name the Canadian `optional` in the notes.
2. **ID. Buzz adapter:** drop the second entry (`nacs_to_ccs1_on_request`, community, Auto123). Keep `nacs_to_ccs1_sold`, and mention Auto123's "free from their dealership" claim in the notes as unconfirmed by VW.
3. **e-Golf heat pump 2016-2020:** `optional` is the wrong meaning. Either split by trim (SEL Premium `standard`; SE `none`), or keep a single value with notes that explain it is trim-linked. 2016 has no source (the 2017 page mentions the Limited Edition only); either find a 2016/2017 US SEL Premium page or mark `low_confidence`. 2020 (Canada) has no Canadian trim page.
4. **Q4 2024 heat pump `none`:** the note's claim "Cold Weather package only returned for 2025" is not on the cited InsideEVs Jan 2023 page. Cite `src-b112-insideevs-q4-2025` for it, or drop the claim.
5. **Q4 2022 `optional`:** it rests on a European fan page. Add `low_confidence` (it is there), and say in the notes that Europe is assumed; find a US or Canada source or leave the status as unproven.
6. **e-tron, Q6 and A6 heat pumps:** replace or back up the fan-site citation with a North American source: Audi US e-tron 2019 release (automotiveworld), InsideEVs/Wards Q8 2024 US launch, and an Audi USA or audi.ca Q6/A6 spec page. Keep `low_confidence` until then. The fan site is acceptable only as a second, `low_confidence` source.
7. **2025 Q6/A6/GT adapters:** follow the brief's earlier-state rule, or justify in the notes why the later state is used. Keep `low_confidence`. 2026-27 carry-overs stay `low_confidence`.
8. **e-tron / Q8 / GT 2022-24 `none` (estimated):** keep as is, with the existing note about the US$200 accessory. Re-check when the Audi FAQ is readable. Do not change to `_sold` on the current evidence.
9. **Report, don't change:** Supercharger access `via_adapter` for the e-tron 2019-23 and Q8 2024-25 has no source naming those cars; the existing estimate comes from "all Audi EVs except Q4". The owner should decide between `no` and `via_adapter`.
10. **ID.4 2026 CA:** the in-the-box claim comes from Electrek (US/CA joint) and vw.ca is silent on 2026. Keep `low_confidence` (it is there).
11. Minor: the Audi Club NA, InsideEVs and Drive Tesla relays of Audi's announcement are typed `community`. Because the batch labels the values `manufacturer`, consider `type: press` for these sources.

## Applied by the main session (2026-11-20)
- ID.4 cars sold in both markets: one heat pump value (US `none`), `low_confidence`, the Canadian value in the notes (14 cars); 2021–22 Canadian `standard` flagged `low_confidence` with the InsideEVs "optional" conflict.
- ID. Buzz: the Canada-only `_on_request` entry dropped; `nacs_to_ccs1_sold` stands.
- electrichasgoneaudi.net entries: `community`, `low_confidence`, note that it is a Europe-leaning fan site.
- e-Golf: 2016 heat pump dropped (no source); 2017–2020 notes say it was fitted on the top trim only, not a paid option.
- Q6/A6/e-tron GT 2025 adapter: kept in the box, with the delivery-date caveat in the notes.
- Left for the owner: Supercharger access for the e-tron and Q8 (`via_adapter` from an estimate; no Audi adapter for them).
- Not done: re-citing the Q4 2024 "Cold Weather package returned" sentence to the 2025 article.
- `add-facts --check`: OK.
