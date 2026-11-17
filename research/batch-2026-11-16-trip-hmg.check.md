# Check: research/batch-2026-11-16-trip-hmg.json

**Verdict: FIX.** Four of the six variants are fine or acceptable. The four `dc_max_kw` estimates (three IONIQ 5, one EV9) should be dropped. `--check` says the batch is valid (84 variants, 142 sources after applying), so the problems are about content, not format.

| Variant | Field | Value | Result | Evidence |
|---|---|---|---|---|
| hyundai/ioniq-5/2026/long-range | dc_max_kw | 260 kW estimated | ❌ basis fails | EV Database page says "max power 260 kW" (Hyundai claimed), spec line 263 kW, 18 min. But it is the European MY24 car. The batch's own notes say no Canadian or US page states a peak. The 2026 Canadian car has a native NACS port, and the repo's record has AC 10.9 kW (EU page says 11 kW), so the charging hardware is not shown to be identical. |
| hyundai/ioniq-5/2026/long-range-awd | dc_max_kw | 260 kW estimated | ❌ basis fails | Same page and problem. The page covers the RWD car. The AWD "same 263 kW" claim comes from a different EV Database page (car/2237) that I did not open. |
| hyundai/ioniq-5/2026/long-range-awd-xrt | dc_max_kw | 260 kW estimated | ❌ basis fails | Same problem, plus one test measured 233 kW on an XRT, which is 10 % below 260. |
| kia/ev9/2026/light | dc_max_kw | 210 kW estimated | ❌ contradicted | EV Database says "210 kW DC", from the European 76.1 kWh RWD car. Sources for the North American Light say 235 kW. Cars.com: "up to 235 kilowatts, the EV9 Light". Edwards Auto Group 2026 Light spec page: "Max DC Fast Charge 235". An Edmunds search excerpt says 235 for Light and 210 for the other trims (its page returned 403, so unverified). The Kia NZ brochure was not opened. |
| hyundai/kona-electric/2026/standard | charge_port | ccs1 | ✅ verified | The FAQ lists the 2026 KONA Electric among CCS-port vehicles. The Hyundai Canada FAQ was reopened and confirms it. |
| hyundai/kona-electric/2026/standard | supercharger_access | via_adapter | ✅ verified | FAQ: "a NACS adapter available separately". |
| kia/niro-ev/2026/standard | charge_port | ccs1 (low_confidence) | ⚠ partly unverifiable | The Kia US page does not name the port. The Kia Canada guide returned only a title to the fetcher. The "CCS1 ports, including Niro EV" wording is taken on trust from the batch's search excerpt. A separate search found the 2025-04-28 Kia Canada release: first NACS Kias are the 2025 EV6 and 2026 EV9, and Niro EV owners can buy an adapter. That supports ccs1 by inference. |
| kia/niro-ev/2026/standard | supercharger_access | via_adapter (low_confidence) | ✅ verified | Kia US page: "Access more than 30,000 NACS compatible Tesla Superchargers w/ a NACS adapter (sold separately)". The Canadian release excerpt agrees. |

## Answers to the flagged points

1. **IONIQ 5 (EU 84 kWh to the 2026 NA car).**
   - Not shown to be the same. Per rule 5, differing markets and any port or charging-hardware change defeat the basis.
   - Hyundai Canada's page confirms the 84.0 kWh pack, but the 2026 car moved to a native NACS port, and the 10.9 kW vs 11 kW AC figures suggest different charger hardware.
   - The matching "18 min 10-80%" supports similarity but does not prove the peak. Hyundai Canada's page is also internally inconsistent about the charger power.
   - The XRT is not reasonably covered: a 233 kW test measurement exists against 260 kW.
   - The batch's notes do state the basis clearly, but the basis itself does not hold.
2. **EV9 Light 210 vs 235.** The conflict resolves toward 235 kW for the North American Light. Two readable US pages (Cars.com, Edwards) say 235, and Edmunds reportedly agrees. The EU 210 kW figure is a European-market claim. Do not ship 210. None of the 235 sources is Kia itself, so I did not verify 235 as a manufacturer figure. Drop it unless a Kia Canada or US spec page can be found.
3. **Kona.** Verified. The FAQ wording is as the batch describes it.
4. **Niro EV.** Acceptable with `low_confidence`, but the Canadian page was not independently confirmed. The US page proves the adapter requirement (so `via_adapter`). `ccs1` is an inference, labelled low_confidence, and consistent with the Canadian release.

## Required changes

- Drop `dc_max_kw` for hyundai/ioniq-5/2026/long-range, long-range-awd and long-range-awd-xrt. The source is a European-market car, the Canadian car changed port and AC charger, and the XRT test measured 233 kW.
- Drop `dc_max_kw` for kia/ev9/2026/light. The cited 210 kW is contradicted by North American sources saying 235 kW. Optionally re-research with a Kia US or Canada spec page and add 235 as `manufacturer` if found.
- Keep the Kona `charge_port` and `supercharger_access` as is.
- Keep the Niro EV fields (both `low_confidence`). Optionally, rewrite the `charge_port` note to say it is inferred from the Kia Canada release (Niro EV owners need an adapter) rather than "no page states CCS1 outright".
- The removed sources (`src-evdb-ioniq5-84-rwd-2026-11-16`, `src-hyundai-eu-ioniq5-performance`, `src-evdb-ev9-761-2026-11-16`) become unused. `src-hyundai-eu-ioniq5-performance` is unused even now, so drop it either way.

## Applied by the main session (2026-11-16)

- Dropped `dc_max_kw` for the three `hyundai/ioniq-5/2026/*` long-range variants (an EU-market figure, not shown to apply to the 2026 North American car) and for `kia/ev9/2026/light` (210 kW contradicted by North American 235 kW reports, none from Kia). These four cars stay unplannable until a Hyundai/Kia North American peak, or a measured curve, is found.
- Kept Kona and Niro `charge_port` / `supercharger_access`. The Niro port note now says it is inferred from the Kia Canada release.
- Removed the unused sources.
