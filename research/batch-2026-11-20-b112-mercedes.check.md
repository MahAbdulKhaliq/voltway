# Check: research/batch-2026-11-20-b112-mercedes.json (B112 adapters and heat pumps, 88 cars)

**Verdict: FIX.** `--check` passes (OK, nothing written). The batch is mostly sound and honest about its weak spots, but the MY2026 CA+US adapter value, the 2027 SUV direction and a few heat-pump sources need changes. 15 trims are unfilled (rule 14).

## Summary table

| Variant group | Field | Value | Result | Evidence |
|---|---|---|---|---|
| CLA 2026-27 (US, 250+ and 350) | adapters_included | ccs1_to_nacs, in box | verified | MBUSA nacs-charging page: "For the CLA with EQ Technology, the vehicle comes standard with a CCS1 to NACS adapter." (The batch's quotation marks are a light paraphrase.) Port nacs matches the work list. |
| CLA 350 2026 (CA+US) | adapters_included | ccs1_to_nacs, low_confidence | verified for CA, but wrong source | The cited CA page (`/en/charge/charging-with-nacs`) does NOT mention the CLA. The claim is on `https://www.mercedes-benz.ca/en/charge`: "upcoming 2026 CLA with EQ Technology will feature the NACS charging inlet... will include an adapter for CCS1 chargers". Guide Auto (2025-10-20) also says Canadian customers "receive a CCS adapter". So it holds, but only if the batch cites the `/en/charge` page (add it as an oem source). The batch note says it rests on a snippet: the snippet was right and the page text says it. |
| MY26 CCS1 cars, US only (EQE, EQE SUV, EQS, AMG EQE, Maybach, G 580 not US-only) | adapters_included | nacs_to_ccs1, in box | verified (US) | MBUSA: "MY26 electric vehicles come equipped with this adapter"; Automotive Fleet: "NACS DC fast-charging adapter included as standard equipment" (EQE sedan/SUV, EQS sedan/SUV). |
| MY26 CCS1 cars sold in CA+US (EQE 320 sedan, EQE 320 SUV, EQS 450 4MATIC, EQS 580, EQS SUV 400 and 550, G 580 = 7 cars) | adapters_included | nacs_to_ccs1, low_confidence | unsupported for CA | No Canadian source says MY26 CCS1 cars include one. mercedes-benz.ca `/en/charge` says "Drivers of other all-electric models with a CCS1 inlet can buy an adapter" and `charging-with-nacs` says adapters are "available for purchase through an authorized Mercedes-Benz dealer". Guide Auto: C$219.95 at dealers. The brief says a two-market car needs an offer that holds in both. See Q1 below. |
| MY2022-25 CCS1 cars (65) | adapters_included | nacs_to_ccs1_sold | verified | MBUSA "may purchase the approved adapter through a Mercedes-Benz dealer"; Cars.com "$185", "dealerships and online" (checked). CA: dealers sell it (Guide Auto C$219.95, Oct 2025). Price could be added for CA (C$219.95). Notes say "Canada dealer sales started Oct 2025" (Guide Auto dated 2025-10-20, consistent). |
| MY2027 NACS cars, US only (AMG GT x2, CLA x4, EQS 500/580, G 580, GLC x2) | adapters_included | ccs1_to_nacs, in box | verified | MBUSA: "Every 2027 electric vehicle comes with the Mercedes-Benz CCS1 Charging Adapter." Ports per work list are nacs. |
| EQE SUV 2027 (x2), EQS SUV 2027 (x2) | adapters_included | nacs_to_ccs1, low_confidence | unproven | See Q2. |
| EQE 2023, EQS 2022-23, EQE 2023 sedan | heat_pump | none | verified (source real) | Green Car Reports: heat pumps "previously omitted in all but the EQE SUV"; "All 2024 EQS and EQE models also get heat pumps". |
| EQE/EQS sedan 2024+, EQS SUV 2024+, EQE SUV 2024+ | heat_pump | standard | verified 2024; 2025-27 carried, low_confidence ok | GCR quote above. EQE SUV 2025: MB Canada page lists "Innovative heat pump" under Performance (page is MY2025). |
| EQE SUV 2023 | heat_pump | standard | verified | The Auto Channel (MB press kit): "heat pump as standard"; GCR update: "EQE SUV included heat pump... starting in 2023". |
| EQS SUV 2023 | heat_pump | none, community, low_confidence | supported, source weak | See Q3. |
| EQS 2022 (AMG, 580) | heat_pump | none | verified | MBpassion: sedan heat pump from model change 23/1 (July 2023, Europe), "als Serienbestandteil". Europe only; US per GCR 2024. |
| CLA 2026-27 | heat_pump | standard | verified | Automoblog: "All CLA EV models have a standard multi-source heat pump". Automotive Fleet: "First Mercedes-Benz vehicle to feature an air-to-air heat pump". |
| GLC 2027 | heat_pump | standard, low_confidence | verified | Motor1: "Mercedes throws in the heat pump as standard equipment." Global article, no US sheet (batch says so). |
| Maybach EQS 680 SUV 2024 | heat_pump | standard, low_confidence | assumption | GCR says all 2024 EQS models; Maybach not named; low_confidence already set. |

Kinds: `manufacturer` for GCR/Automoblog/MBpassion-relayed figures follows rule 5 (press relaying Mercedes). Two small mislabels to consider: heat pump `none` values citing GCR (a journalist's inference of "previously omitted", not a maker statement) are better `community`; and the MBpassion 2022 entry is already `community`.
Fit with existing data (rule 11): not applicable, these fields are new. Supercharger cross-check: all 13 MY26 and 4 MY27 CCS1 cars are `via_adapter` with a `nacs_to_ccs1*` value; all 13 NACS cars are `yes` with `ccs1_to_nacs`; no disagreements.

## Answers to the five risk points

**Q1. MY2026 CCS1 cars, Canada part.** Not supported. The US half is verified. For the Canadian half, the only Canadian statements say CCS1-inlet owners buy it from a dealer (`/en/charge`, `charging-with-nacs`, Guide Auto C$219.95). The 7 CA+US MY26 cars carry in-the-box with a low_confidence note, which is honest but backs the wrong direction. Recommendation: for those 7 cars use `nacs_to_ccs1_sold` (the offer that holds in both markets, per the brief), `low_confidence: true`, with a note "US: in the box for MY26 (MBUSA); Canada: sold by dealers, C$219.95 (Guide Auto)". The alternative, splitting CA cars as `_sold`, is not possible with one value per car, so sold-with-note is the only value that is true in both markets. US-only MY26 cars stay in the box.

**Q2. MY2027 EQE SUV / EQS SUV port.** Our data (CCS1) is right for the evidence found. MBUSA's own MY2027 spec tables for the EQS 400 4MATIC SUV (`.../models/2027/eqs/eqs400x4.html`) and EQE 320 4MATIC SUV (`.../2027/eqe/eqe320x4.html`) both list DC connector "Combined Charging System (CCS)". The MBUSA NACS page says "Equipped with a NACS DC charging inlet, MY27 electric vehicles..." but names no models, and the EQS facelift (sedan) is the NACS one; the SUVs were not found with NACS. So the port stays CCS1 and the adapter direction follows `nacs_to_ccs1`. But the page's "Every 2027 electric vehicle comes with the CCS1 Charging Adapter" is worded for NACS-port cars (a CCS1 adapter in a CCS1 car makes no sense), so whether MY27 CCS1 SUVs get an adapter in the box is unproven. Recommended value: `nacs_to_ccs1_sold`, low_confidence (dealers sell the adapter for CCS1-inlet cars per the same page), unless the owner accepts the MY26 rule ("CCS1 inlet come with the adapter") carrying to MY27. Current batch value (`nacs_to_ccs1` in box, low_confidence, with a note about the conflict) is a guess; replace the note's "conflict" wording with this finding.

**Q3. Heat pump split.**
- EQE sedan 2023 none / 2024 standard: supported by GCR ("previously omitted in all but the EQE SUV"; "All 2024 EQS and EQE models also get heat pumps"). 2023 `none` is low_confidence, fine.
- EQS sedan 2022-23 none: supported by GCR and MBpassion (Europe production from July 2023; US change 2024).
- EQS SUV 2023 none: the cited MBWorld forum says "Currently no heat pump on the EQS SUV" (Oct 2022, owners guessing from literature) which is weak. A better source is already cited elsewhere in the batch: GCR says heat pumps were "previously omitted in all but the EQE SUV", which covers the EQS SUV 2023. Recommend citing `src-mb-b112-gcr-hp-2024` (same text as the sedans) as the main source and keeping the forum as a secondary note; keep low_confidence. The "ArenaEV optional on some variants" claim: not found on any page I could open; searches found no source saying optional on the 2023 US EQS SUV, and a forum owner says the MY23 had none. So `none` is the better-supported value. InsideEVs (650436) says only that it "will become standard" with no US timing.

**Q4. The 15 unfilled trims (no write to batch).**
- EQB (12 cars, 2022-2025, US/CA): a Mercedes release snippet seen only in search results says "a sophisticated thermal management system with heat pump as standard"; I could not open it (media.mbusa.com releases return 404; mercedes-benz.ca 2022 EQB page, Motor1, GCR, KBB specs: silent). A spec database (evspecifications.com comparison, not opened) lists a heat pump on the 2022 EQB 300/350. Result: likely `standard`, but there is no opened US/CA maker page; if filled it should be low_confidence, and the 250+ (2024-25) rests on a third-party site only. Blocked: evkx.net (403, not worked around).
- G 580 (3 cars): no maker page states it. mercedes-benz.ca G 580 page and MBUSA 2027 spec table are silent; a search snippet from evkx.net (blocked 403) says "optional" (Swedish/Danish pages). Cannot fill reliably. Next step: open the mbusa 2025 G-Class electric order guide PDF (not readable via the fetcher) or a dealer window sticker.
- AMG GT 4-Door 2027 (2 cars): Motor1 and MBUSA future-vehicle page are silent on a heat pump. Cannot fill. Possibly inferred from the CLA/GLC (standard on the newer platforms), but those are different platforms (AMG.EA), so do not borrow.

**Q5. CLA 350 2026 Canada adapter.** The batch's note says the cited page did not repeat it. True for the cited page, but `https://www.mercedes-benz.ca/en/charge` (a different page) states: "upcoming 2026 CLA with EQ Technology will feature the NACS charging inlet... will include an adapter for CCS1 chargers". Fix: add that URL as an `oem` source for the CLA 350 2026 value and drop the "snippet" caveat (keep low_confidence only if the owner wants it, since the page says "upcoming", pre-launch wording).

## Required changes

1. MY26 CA+US cars (eqe/2026/eqe-320-4matic-sedan, eqe-suv/2026/eqe-320-4matic-suv, eqs/2026/eqs-450-4matic-sedan, eqs/2026/eqs-580-4matic-sedan, eqs-suv/2026/eqs-400-4matic-suv, eqs-suv/2026/eqs-550-4matic-suv, g-580/2026/g-580-with-eq-technology): change `nacs_to_ccs1` to `nacs_to_ccs1_sold`, keep low_confidence, notes as in Q1; cite the Canada page `https://www.mercedes-benz.ca/en/charge` (new source). Do the same for the 4 MY27 CCS1 SUVs unless the owner decides MY26's in-the-box rule carries to MY27 (Q2).
2. cla/2026/cla-350-4matic-with-eq-technology: add source `https://www.mercedes-benz.ca/en/charge` (type oem) and cite it for CA; reword the note (no "snippet").
3. eqs-suv/2023/eqs-450-4matic-suv heat_pump: cite GCR as primary (the "all but the EQE SUV" sentence); forum secondary; drop the unverified ArenaEV mention or say not found.
4. Heat pump `none` values citing GCR (EQE 2023, EQS 2022 (via MBpassion already community), EQS 2023, EQS SUV 2023): kind should be `community` (reporter's reading, not a maker statement), unless a Mercedes 2024 press kit is cited.
5. Quotation marks in notes ("MY26 EVs with a CCS1 inlet come with the adapter", "The CLA includes a CCS1-to-NACS adapter as standard equipment") are paraphrases; use the page's words ("MY26 electric vehicles come equipped with this adapter"; "comes standard with a CCS1 to NACS adapter").
6. Optional: add the Canadian adapter price C$219.95 (Guide Auto, 2025-10-20) to the CA-market notes of the `_sold` values; cite it as a source if used.

## Unfilled required fields (rule 14), 15 trims (heat_pump)

- eqb: 12 cars (2022 300/350; 2023 250+/350; 2024 250+/300/350; 2025 250+/300/350), trim `standard`
- g-580: 2025, 2026, 2027 (trim `standard`)
- amg-gt-4-door 2027: GT 55 and GT 63 (trim `standard`)

Findings on each in Q4. No unfilled adapters (88 of 88 cars have one).

## Not verified

- media.mbusa.com release pages (404), mbworld order-guide PDFs (unreadable), evkx.net (403, not worked around), mercedes-benz.ca EQS pages. Automoblog's "quotes Mercedes-Benz" note holds only for the one-third-energy sentence, not for the heat pump itself (kind `manufacturer` acceptable under rule 5).

## Applied by the main session (2026-11-20)
1. MY2026 CCS1 cars sold in both markets (7): `nacs_to_ccs1_sold`, `low_confidence`, cited to Mercedes-Benz Canada (new oem source `src-mb-b112-mbca-charge`); notes say US cars get it in the box. US-only MY2026 cars stay in the box.
2. MY2027 EQE SUV / EQS SUV (4): port confirmed CCS1 (no data change); adapter `nacs_to_ccs1_sold`, `low_confidence`, with the checker's finding in the notes.
3. Heat pump `none` entries citing Green Car Reports relabelled `community`; EQS SUV 2023 now cites Green Car Reports first, forum mentioned in the notes.
4. EQB / G 580 / AMG GT 4-Door heat pumps: left unfilled (no openable maker page).
5. CLA 350 2026 Canada: cited to mercedes-benz.ca/en/charge.
- Not done: replacing paraphrased quotation marks in older adapter notes with exact page wording (left for a later pass).
- `add-facts --check`: OK.
