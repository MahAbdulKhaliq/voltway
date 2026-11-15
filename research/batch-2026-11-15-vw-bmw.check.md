# Check: research/batch-2026-11-15-vw-bmw.json

**Verdict: FIX.** The batch is structurally valid (`add-facts.ts --check`: OK, 84 variants, 23 sources, nothing written). Several values are not supported by the cited pages. Nothing in `data/variants` conflicts with them, because those variant files hold no figures yet. I did not run `data:build`, so imported values were not compared.

| Variant | Field | Value | Result | Evidence |
|---|---|---|---|---|
| vw id-4 standard | battery.chemistry | nmc | 🏷 | thinkEV: "NMC", 82 kWh; same page says base is a smaller-pack version. Value is third-party and not tied to this variant; `kind: manufacturer` is wrong for a community aggregator. |
| vw id-4 standard | charge_port | ccs1 | 🏷 | thinkEV spec table: "CCS1". Value is right; kind `manufacturer` is not (community source). |
| vw id-4 standard | trims.* heat_pump | standard | ❌ | Dealer article: "heat pump climate control" in winter features. Says nothing on standard vs optional or trims. |
| vw id-4 awd | battery.chemistry | nmc | 🏷 | thinkEV says NMC 82 kWh, with no trim named ("longer-range versions"). Not tied to AWD; kind mislabel as above. |
| vw id-4 awd | charge_port | ccs1 | 🏷 | Same as standard. |
| vw id-4 awd | published_10_80_min | 28 min | ❌ | Dealer: "ID.4 Pro models... 10% to 80% in approximately 28 minutes". The page also names "ID.4 Pro AWD" separately, so mapping to AWD is inferred, not stated. The same pass of thinkEV gives 34 min (CAA winter test), a different kind. |
| vw id-4 awd | trims.* heat_pump | standard | ❌ | Same as standard: no trim or standard/optional wording. |
| bmw i4 edrive40-gran-coupe | charge_port | ccs1 | 🏷 | thinkEV: "CCS1" (205 kW). Value fine; `manufacturer` kind is wrong for a community source. |
| bmw i4 xdrive40-gran-coupe | charge_port | ccs1 | ⚠ | thinkEV gives connector only in the eDrive40 table; not stated for xDrive40. |
| bmw i4 m60-xdrive-gran-coupe | charge_port | ccs1 | ⚠ | Not stated for M60 either. Likely true but unconfirmed. |
| bmw i4 (all 3) | supercharger_access | via_adapter | ❌ | BMW newsroom: models with CCS ports "must only use the approved Lectron Vortex Plus" adapter. Page names the iX3 and i3, not the i4. Applying it to the i4 is an inference. |

## Required changes

1. Drop `trims.*.heat_pump` for both VW variants. The article does not say standard or optional, and does not name trims. Re-add only from a Canadian VW build/price page that does.
2. Drop `published_10_80_min` for `volkswagen/id-4/2026/awd`. The 28 min applies to "Pro models" and the AWD mapping is inferred. If kept, record it as `kind: manufacturer` only with a source that names the AWD, or add the same value to both Pro variants with a note.
3. Relabel the thinkEV-sourced values (`charge_port`, `battery.chemistry`, all BMW `charge_port`). thinkEV is a community aggregator, not the manufacturer. Use a kind that matches the source, or source them from a VW Canada / BMW Canada page.
4. Drop `battery.chemistry` for `volkswagen/id-4/2026/standard`. The page does not tie NMC to the base pack. Keep it for AWD only if a page ties NMC to that version.
5. Drop `charge_port` for `bmw/i4/2026/xdrive40-gran-coupe` and `m60-xdrive-gran-coupe` (marked unverifiable), or find a source that states it. Keep eDrive40.
6. Drop `supercharger_access` for all three i4 variants. Re-add from a BMW Canada source that names the i4 (a compatible-models list), or from a source that lists the i4 as a CCS1 model covered by the adapter rule.
7. No `preconditioning` or `wheels` values are in this batch, so there is nothing to check there.

## Applied by the main session (2026-11-15)
Changes 1, 2, 4, 5, 6 done (values dropped). Change 3 (relabel thinkEV values) not done: researcher rule 5 keeps `kind: manufacturer` for manufacturer figures relayed by a spec site; the source `type` is `community`.
