# Waves 2-3 spec research brief (2026-11-19)

Owner request (2026-11-19): add every other BEV make and model with the current methodology. The cars now exist as skeletons; every one fails `npm run validate` on the B96 required fields until your batch lands.

- Follow `.claude/agents/ev-data-researcher.md` exactly (B94 market-neutral sources, B96 no unknowns, estimate rules).
- Your work list: the entries in `research/powertrain-gaps.json` whose `model` is in your model list. Ignore every other entry.
- Almost every new car has its own powertrain id (one per model year), so the same hardware appears as many ids. Research each **hardware generation** once and write the values to every powertrain id on it (a small script that fans the values out is fine; give it your own scratch name). Check for mid-generation changes (pack sizes, onboard charger upgrades, 800 V adoption, NACS ports from a model year).
- Older cars (2011-2019): preconditioning is usually `none` before the maker's first launch of it; cite the launch or the manual. CHAdeMO/J1772-era cars: `charge_port` is the DC port (or `j1772` with `dc_max_kw` 0 when the car had no DC port; say which trims) and `supercharger_access` `no` unless an adapter programme covers it.
- Never work around blocked sites (403s, tesla.com, GM/Cadillac/Chevrolet/GMC, Volvo, Edmunds, evkx.net, web.archive.org). EVChargingStations.com's terms forbid database use: don't cite it.
- Output: `research/batch-2026-11-19-w2-<group>.json`, `--check` must pass (other groups' B96 errors are expected; only your own cars matter). Append to `research/NOTES.md`.
- Report briefly: per hardware generation, ids covered and values with kinds; estimates and their basis; anything still missing; owner questions.
