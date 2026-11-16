# Check: research/batch-2026-11-15-etnga.json

**Verdict: FIX.** `--check` says the batch is valid. Most values are verified against their pages. Specific values need changes: model coverage of the Supercharger, chemistry, voltage and DC claims for Woodland and C-HR; the borrowed curve on the Canadian C-HR SE FWD; the bZ standard (57.7 kWh) DC and voltage claims; and the inferred 50 % point on the Solterra curve. Nothing was applied. A web search for a source tying the C-HR pack to the bZ pack was cut off by the usage limit, so that basis is unproven rather than disproven.

Note: the batch cites `src-toyota-ca-media-bz-2026`, `-c-hr-2026` and `-bz-woodland-2026`. These already exist in `data/sources/` and I opened their URLs.

## Per-value results

| Variant | Field / curve | Value | Result | Evidence |
|---|---|---|---|---|
| bz standard, awd, limited-awd | supercharger_access | yes | ✅ (low conf OK) | Toyota CA: "Toyota BEV drivers are now able to enjoy charging through the Tesla Supercharger Network". It names the 2026 bZ; Drive Tesla Canada says "2026 Toyota bZ lineup". |
| bz woodland-awd, woodland all-terrain | supercharger_access | yes | ❌ not shown for Woodland | The release names only "bZ"; Woodland appears only in the nav menu. The Woodland release (media.toyota.ca) mentions NACS but not Tesla or Supercharger. The value is inferred but labelled `manufacturer`. |
| c-hr awd, standard | supercharger_access | yes | ❌ not shown for C-HR | The release doesn't mention the C-HR. The Toyota CA C-HR release mentions NACS only ("thousands of high-speed charging stations"), not Tesla. |
| solterra awd | supercharger_access | yes | ✅ | Drive Tesla Canada: "all Solterra EV owners can now access more than 25,000 Tesla Superchargers in Canada and the U.S." Newswire's April 2025 footnote "Anticipated in 2025" is older and superseded. InsideEVs also tested a 2026 car on a V3. |
| bz (all 5) | dc_max_kw | 150 | ✅ for 74.7 kWh variants / ⚠ for standard | InsideEVs: "still capped at 150 kilowatts", model-level. GreenCars: "will now peak at 150 kilowatts", in the context of the 74.7 kWh pack. Nothing ties 150 kW to the 57.7 kWh XLE FWD pack, which Autopian gives as 288.6 V. |
| bz (all 5) | nominal_voltage_class | 400v | ✅ for 74.7 kWh / ⚠ for standard | InsideEVs: "still runs on a 400-volt electrical architecture". The 391 V cited in the note is the larger pack only; Autopian says the small pack is 288.6 V. The note is misleading for standard. |
| bz awd, limited-awd | battery.capacity_gross_kwh | 77 (CA) + 74.7 (US) | ✅ | Toyota CA: XLE AWD and Limited AWD are 77 kWh (74.7 not listed). Toyota US: 74.7 kWh for both. The two figures are labelled gross and sit side by side. |
| bz woodland x2 | battery.capacity_gross_kwh | 74.7 | ✅ | Toyota CA Woodland release: "a total capacity of 74.7 kWh". Toyota Canada itself says 77 for the AWD and 74.7 for Woodland, so the batch's "same pack" reading is plausible but is an inference. |
| bz standard | battery.capacity_gross_kwh | 57.7 | ✅ | Toyota CA: XLE FWD 57.7 kWh. |
| bz awd, limited-awd | battery.chemistry | nmc | ✅ | Autopian: "larger pack retains the same chemistry and cells"; GreenCars: "no change to the cell chemistry"; NMC cathodes. Covers the 74.7 kWh bZ. |
| bz woodland x2 | battery.chemistry | nmc, manufacturer | 🏷 | Sources cover "the bZ", not Woodland. The 74.7 kWh pack match is by capacity only. Should be `estimated` with the basis named, or have a source naming Woodland. |
| bz woodland x2 | dc_max_kw, voltage 400v | 150, 400v, manufacturer | 🏷 | Same issue: not stated for Woodland. |
| c-hr awd, standard | dc_max_kw | 150 | ✅ | InsideEVs: "can pull 150 kilowatts of maximum power". Toyota US and Toyota CA C-HR releases give no kW. |
| c-hr awd, standard | gross kWh | 77 (CA), 74.7 (US) | ✅ | Toyota CA: "77-kWh"; Toyota US: "74.7-kWh battery". |
| c-hr awd, standard | chemistry nmc, voltage 400v | estimated | ⚠ basis unproven | No cited page says the C-HR shares the bZ pack. The only link is the equal 74.7 kWh figure. Autopian doesn't describe a C-HR battery. For the AWD, motors match (338 hp both, 11 kW AC), so it is plausible. For the Canadian SE FWD, motors differ. |
| c-hr awd | curve insideevs-2026 | 20 %: 135, 50 %: 120, 60 %: 110 | ✅ values / ⚠ trim | InsideEVs: peak "135 kW ... about 20%", 120 kW at 50 %, 110 kW at 60 %. 15-80 % in 26 min. Measured, an Ionna station, no temperature (conditions "unknown" are right). The page doesn't say which trim was charged; "XSE" is an assumption. `tested` is OK. |
| bz awd, limited-awd, woodland x2 | curve borrowed-chr-awd-2026 | same 3 points | ⚠ partly proven | Sibling is tested; points are identical; `source_id` is the sibling's. Pack: 74.7 kWh in US figures for both (✅), AWD motors 338 hp on both. But chemistry and voltage on the C-HR are estimated from the bZ, so the match is circular. Canadian figures differ by 3 % (77 vs 74.7 for Woodland), over the 1 % bar. Kept as low-confidence estimated this is tolerable; the pack match is not independently shown. |
| c-hr standard (Canadian SE FWD) | curve borrowed-chr-awd-2026 | same 3 points | ❌ match unproven | Toyota US lists only AWD SE/XSE (338 hp); the FWD SE exists only in Canada. Toyota CA says the SE is FWD with 496 km range (XSE AWD 452 km) and gives "77-kWh" generally, with no per-trim pack, motor power or charge rate. The batch's note "Toyota USA lists the SE on the same 74.7 kWh pack" describes the US AWD SE, not this car. Motors differ and the chemistry and voltage are estimated. |
| solterra awd | gross kWh | 77 (CA), 74.7 (US) | ✅ | Newswire: "77.0-kWh lithium-ion battery"; Subaru US: "74.7-kWh". |
| solterra awd | ac_max_kw | 11 | ✅ | Newswire: "improved 11kW onboard charger". |
| solterra awd | dc_max_kw | 150 | ✅ | Newswire: "roughly 150 kW"; Subaru US: "up to an estimated 150 kW". |
| solterra awd | nominal_voltage_class | 400v | ✅ | InsideEVs: "400-volt architecture". |
| solterra awd | heat_pump (trim *) | standard | ✅ (low conf OK) | CarGurus CA: "A heat pump is standard in Canada." Single secondary source; Subaru pages are silent. |
| solterra awd | curve insideevs-2026 | 16 %: 98, 50 %: 121, 61 %: 104, 72 %: 91, 85 %: 71 | ✅ except 50 % | InsideEVs: start 16 %, "jumped to 98 kW", plateau about 121 kW, 104 kW at 61 %, 91 at 72 %, 71 at 85 %. Conditions are right: manual preconditioning, 34 °F (1 °C), V3 250 kW. The 50 % point is not measured: the article says only "over 50% at 12 minutes". |

## Stale Chargeprice values on subaru/solterra/2026/awd

- **usable 64 kWh:** drop. It belongs to the 72.8 kWh pack of the 2023-25 car; the 2026 pack is 74.7/77 kWh. This is confirmed by CarGurus ("72.8 ... to 74.7 kWh").
- **AC 6.6 kW:** drop. Subaru Canada states the 2026 charger as 11 kW, and the old figure is the older Solterra. Keeping both makes the site show a conflict.
- **curve chargeprice-2022:** drop or at least stop it being the display default. CarGurus says the previous car peaked at 100 kW, yet this curve peaks at 150 kW, so it is not a record of the 2026 car. The new `insideevs-2026` curve should be the default.

These sit in `data/`, so the owner or the applier must remove them; the batch cannot, and I did not touch the data.

## Required changes

1. Drop `supercharger_access` for `toyota/bz/2026/woodland-awd`, `woodland-awd-all-terrain-tire`, `toyota/c-hr/2026/awd` and `toyota/c-hr/2026/standard`. None is named on the cited pages. Or find a Toyota page that names them.
2. For both Woodland variants, change `battery.chemistry`, `nominal_voltage_class` and `dc_max_kw` to `kind: estimated` (basis: same 74.7 kWh pack as the bZ, which the Toyota Canada Woodland release supports by capacity only), or drop them.
3. For `toyota/bz/2026/standard`, drop `dc_max_kw` (150 kW is stated for the bZ in general and for the 74.7 kWh pack, but the 57.7 kWh pack is 288.6 V). Keep `400v` only if the note is changed: remove "Autopian: pack 391 V", which is the larger pack.
4. Drop `borrowed-chr-awd-2026` from `toyota/c-hr/2026/standard`. The Canadian SE FWD has different motors and no source gives its pack or charge rate. If kept, mark it as unproven and fix the note, which wrongly says Toyota USA lists the SE on that pack.
5. Weaken the bZ and Woodland borrowed curves' `reason`. The C-HR chemistry and voltage are themselves estimated from the bZ, so the pack match is circular. Either add a source that ties the C-HR pack to the bZ (for example a Toyota page naming the shared battery) or keep them clearly estimated and low-confidence. For the Woodland pair, note the Canadian figures differ (74.7 vs 77).
6. `toyota/c-hr/2026/awd` curve `insideevs-2026`: add to the notes that the article doesn't name the trim charged, or confirm it.
7. Solterra curve: remove the 50 %: 121 point (inferred, not measured), or keep it only if the owner accepts an inferred point in a `tested` curve. The other four points match the article.
8. Remove stale Solterra values (usable 64, AC 6.6, `chargeprice-2022` curve) as described above.
9. Tidy-up: the Newswire source `src-newswire-subaru-solterra-2026-b` appears to duplicate the Subaru Canada release already in the repo (`src-subaru-ca-newswire-solterra-2026`); reuse one id if they are the same page.

## Checks that passed

- `npx tsx scripts/add-facts.ts research/batch-2026-11-15-etnga.json --check`: OK (84 variants, 73 sources after applying).
- Gross/usable labels are right: every kWh is labelled total and "usable not stated". No fit conflicts over 5 % against same-kind existing values (the 3 % CA/US gap is recorded side by side).
- `accessed_on` is present on all sources; `low_confidence` is applied wherever the source is secondary.

## Applied by the main session (2026-11-15)
Done:
- Dropped Supercharger access for both Woodland variants and both C-HR variants (no page names them). Kept bZ standard/AWD/Limited and Solterra.
- Dropped C-HR chemistry and voltage estimates (the bZ pack link is unproven).
- Dropped the borrowed curve `borrowed-chr-awd-2026` everywhere (bZ AWD, Limited, both Woodland, C-HR SE FWD): the pack match isn't shown and the basis is circular (standing rule: drop).
- Removed the inferred 50 % point from the Solterra InsideEVs tested curve.
- Dropped `dc_max_kw` for bZ standard (57.7 kWh pack); voltage note now says 288.6 V for that pack.
- Woodland chemistry, voltage and DC peak relabelled `estimated`, with the basis stated.
- Duplicate Subaru Newswire source replaced by the existing `src-subaru-ca-newswire-solterra-2026`.
Not done:
- Stale Chargeprice values on `subaru/solterra/2026/awd` (usable 64, AC 6.6, `chargeprice-2022` curve). They come from the crosswalk match, and changing a match is an owner decision (B8/B9, like B22). Raised with the owner.
