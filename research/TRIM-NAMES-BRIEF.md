# Trim-name research brief (B91, DESIGN-9 §2)

A special task, not figures research: you research buyer-facing **trim names** only and write nothing except your output file.

## Input and output
- **Input:** `research/trim-names-input-<group>.csv`. Each row is one government listing for one model year: NRCan is Canada (market CA), EPA is the US (market US).
- **Columns:** model_id, source, year, label (the regulator's wording), market, trim_name, dealer_trims, source_url, notes, confirmed.
- **Output:** `research/trim-names-<group>.csv`.
  - Write every input row in the same order, with the first five columns copied exactly, label text unchanged.
  - Fill in trim_name, dealer_trims, source_url and notes. Leave confirmed=false.
  - Write the file progressively, so partial work survives.

## What to fill
- **trim_name:** the name of that edition as the maker sold it in that market and model year, in the maker's own wording.
  - It must be specific enough to tell that year's editions apart: pack/range, drivetrain and performance level, e.g. "Long Range AWD", "Dual Large", "Grand Touring".
  - Never include NRCan letter codes ("-I", "-B"), wheel or tire sizes ("(21" Wheels)"), onboard-charger notes ("(11.5 kW)"), "(Import)" or date notes. These are not trim names.
  - When a wheel-size or charger-option listing is the same edition as another row, give it the same trim_name and say so in notes.
  - When the same edition is sold in Canada and the US under the same name, spell it identically in both markets' rows. That is how the two get paired.
  - When the two countries name the same car differently, give each market its own name, and say in notes which other-market row it equals.
- **dealer_trims:** the maker's trim levels this rating covers, separated by semicolons. Blank if not applicable or unknown.
- **source_url:** the page that shows the name for that market and year.
  - First choice: the maker's own site, press release, media/newsroom site or brochure. Use the Canadian site for CA rows.
  - Otherwise: a reputable outlet (Car and Driver, MotorTrend, InsideEVs, Electrek, Driving.ca, AutoTrader.ca, Guide Auto, Wikipedia for older line-ups).
  - One source per year and market is usually enough when it lists the line-up. Reuse a source across rows when it covers them.
- **notes:**
  - One short line of reasoning; "UNSURE:" for anything uncertain.
  - Listings not sold to the public (fleet-only, carsharing-only, never sold in that market and year): leave trim_name blank, write "not sold to the public", and add the page that says so. Lease-only retail cars count as sold.
  - Duplicate listings of the same car get the same trim_name.

## Rules
- Never work around a site that blocks automated fetches: evkx.net, Edmunds, web.archive.org, tesla.com, and any site that returns 403. Use another source.
- Don't edit any other file.
- Use your own scratch script names (other agents share the scratchpad).

## Final report (short)
- Rows filled.
- Rows marked UNSURE, with their labels.
- Listings that are duplicates or not real retail cars.
- CA/US pairs whose names differ.
