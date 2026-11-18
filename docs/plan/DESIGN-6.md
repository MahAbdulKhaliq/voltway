# Phase 6: Open Charge Map as a second charger source (TD-P8, N7)

Status: **approved by the owner 2026-11-18 (B77)**, all of P1–P5. Build items are tagged [6] in `CHECKLIST.md`; checks in `QA.md` Phase 6.

IDs: OCM stations get map id `100000000 + OCM id` so they never collide with AFDC ids (max ~473,000). The `map-data-auditor` agent is extended to audit the OCM import and the duplicate matching.

## Why
The charger map and the trip planner use one source: the NLR Alternative Fuel Stations API (AFDC), whose Canadian records come from NRCan. It misses some sites. The owner found Hamilton → Vancouver can't be done with CCS only: AFDC has no CCS fast charger between Sault Ste. Marie and Marathon (401 km) or Thunder Bay and Dryden (337 km). B76 now suggests NACS for such trips; a second source is the real fix where AFDC lacks working sites.

## What OCM would add (survey, 2026-11-18)
From OCM's own GitHub export (`openchargemap/ocm-export`, Canada folder, last updated 2026-04-22; no API calls made):
- 18,804 Canadian entries. **15,954 are copies of AFDC** (data provider 2), so they add nothing.
- 2,818 come from OCM contributors (CC BY 4.0), 20 from AddÉnergie (CC BY 3.0), 6 from Greems (CC0), 6 from CarStations (no open licence: skipped).
- After dropping private, planned, removed and not-operational entries: about 2,490 left. Of those, **122 fast-charging sites and 439 Level 2 sites are more than 150 m from any AFDC station**: mostly ChargePoint, Petro-Canada, Ivy, FLO, Jule, EV Connect, On the Run, Circuit électrique.
- On Highway 17 that includes Ivy White River and Ivy Dryden (CCS 50 kW), and EV Connect Kenora. Ivy White River would split the 401 km stretch (ChargeHub says it may be out of service; OCM shows it operational, last verified 2024-11-23).

## Proposals (each needs the owner's OK)

### P1. How we fetch: a few API calls a month, nothing from the browser
OCM's fair-use rules: no repeated duplicate queries, throttle requests, may ban excessive callers; set a custom user agent; for regular refreshes of the **whole** dataset, clone their GitHub data instead.
- We don't need the whole dataset, only the Canadian, open-licensed, non-AFDC records (~2,850). So the monthly charger refresh (B36) makes **about 3 API requests**: `GET https://api.openchargemap.io/v3/poi?countrycode=CA&dataproviderid=1,24,45&compact=true&verbose=false&includecomments=false&sortby=id_asc&greaterthanid=<last id>&maxresults=1000`, paged by id like OCM's own export.
- **3 seconds between pages**, one attempt per page (no retry loops), at most 4 pages, so a pull is never more than 5 requests with the reference data (stop if more: something is off; changed from 10 after the 2026-11-18 audit). Key in the `X-API-Key` header (GitHub secret `OCM_API_KEY`, local `.env`), never in the URL or logs. User agent `Voltway-charger-refresh (+https://github.com/MahAbdulKhaliq/voltway)`.
- The site never calls OCM. The browser only loads our static map files, as now.
- If the OCM pull fails, the refresh keeps last month's OCM data and still updates AFDC.
- *Rejected:* the GitHub export. It is OCM's suggestion for full copies, but it is marked experimental, was last updated 7 months ago, and the Canada folder is 18,800 files (81 MB) to get 2,850 records.

### P2. Which records we keep
- Providers 1 (OCM contributors, CC BY 4.0), 24 (AddÉnergie, CC BY 3.0) and 45 (Greems, CC0). Skip 2 (copies of AFDC; we have the original) and any provider without an open licence.
- Published only (submission status 100 or 200). Status: operational or unknown → available; temporarily unavailable → shown as now (§6 of charger-map.md); planned, not operational and removed → dropped. Usage: private types (2, 3, 6) dropped; "membership required", "pay at location", "notice required" kept; only "notice required" is flagged like AFDC's restricted access (owner, 2026-11-18, after QA: membership networks such as Ivy, FLO and ChargePoint are open to anyone who signs up and AFDC doesn't mark them restricted; the planner skips restricted stations, so flagging them hid 46 fast-charging sites).
- Plugs: J1772, CCS1, CHAdeMO and NACS (Tesla) mapped to our four plugs; others ignored. The plug decides the level where it can (owner, 2026-11-18, after the data audit): CCS1 and CHAdeMO are always Level 3, J1772 always Level 2; NACS is Level 3 when OCM says level 3 or the port is 40 kW or more. Level 1 dropped. Same kW rules as AFDC.

### P3. Duplicates: one pin per real station, AFDC wins
Many chargers are in both sources. They are matched in layers; a matched OCM record is dropped and the AFDC record kept (it is the official, monthly-updated one).
1. **Copies:** OCM records imported from AFDC (data provider 2, ~15,950) are never fetched.
2. **Same place:** an AFDC station **within 150 m that shares a plug type at the same level**. In the survey, 1,923 of the ~2,480 remaining OCM records had an AFDC station within 150 m.
3. **Same address:** an AFDC station **within 1 km with the same street number and street name, sharing a plug type at the same level** (OCM pins are sometimes placed loosely, e.g. "6435 Metral Drive" 150 m apart in both). Numbered streets and highways count ("2nd Ave" = "2 Avenue", "Hwy 11"). Catches about 65 more.
4. **Same name:** an AFDC station **within 300 m whose name shares at least two words** and that shares a plug type at the same level (e.g. "Riverfront Chalets & Rafting" in both, 170 m apart). Catches about 15 more.
5. Everything else is kept as an OCM station: **about 580 sites** in the first real pull (578 on 2026-11-18).

**Never removed (owner, 2026-11-18, after the data audit):** an OCM station with a **Level 3 port or a NACS plug that its AFDC match doesn't have**, or a **CCS1/CHAdeMO fast charger next to an AFDC station whose only fast charging is NACS** (e.g. Jule Port Union by a Supercharger; added after the real-data audit), is not a duplicate of that match, at any layer. The first audit found the earlier rules removed about a dozen fast-charging sites and about 19 Tesla Destination sites against AFDC listings at the same address with Level 2 J1772 only. Another AFDC listing at the same place that does have them still matches.

A different network at the same plaza (a Petro-Canada CCS charger 160 m from the Golden Supercharger) has no shared plug, so it stays as its own station. This replaces the earlier N7 idea (same network, within 50 m): OCM's network names don't match AFDC's, and its pins are rougher.

**What can still slip through:** the same station with a different name and address in each source, more than 150 m apart. To catch those: every refresh lists the OCM sites kept within 500 m of an AFDC station in the PR summary, the `map-data-auditor` agent spot-checks them, and a small committed skip list (`data/imported/ocm/skip.json`, OCM id + reason) drops any duplicate found later, by the owner's say. It also takes OCM records that duplicate another OCM record. The two audits' 17 entries are in it (approved 2026-11-18). OCM records outside Canada's bounding box (bad coordinates) are dropped as "no location".

### P4. Credit on every station (OCM's licence requires it)
- The station panel gets a source line for every station: "Source: NRCan via NLR" for AFDC stations, "Source: Open Charge Map contributors (CC BY 4.0)" (or that provider's name and licence) for OCM ones, with a link to the station's OCM page. OCM stations also show "Last verified <date>" when OCM has one.
- The About page credits Open Charge Map and links its licence and terms, next to the AFDC credit.

### P5. Going live
The monthly refresh merges itself when checks pass (B27). OCM gets its own checks: stop if the OCM count drops by more than 10 % from the last good pull, or if required fields go missing. A failed OCM check keeps last month's OCM data and leaves the PR open for the owner, like AFDC.

## Owner setup (after approval)
1. Sign in at openchargemap.org → My profile → My apps → Register an application → copy the key.
2. Add it as the GitHub Actions secret `OCM_API_KEY` (I'll open the page) and as `OCM_API_KEY=…` in the local `.env`.

## Out of scope
Live status from OCM, user check-ins and comments, photos, OCM data outside Canada, writing back to OCM.
