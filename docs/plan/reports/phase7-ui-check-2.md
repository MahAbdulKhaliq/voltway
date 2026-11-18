# Phase 7 UI check 2: items 7.10, 7.11 plus two fixes

Run 2026-11-18, local dev server port 4321. **Verdict: ISSUES (3).** Everything in the brief works except: "Spring" does not list Spring, TX on a fresh load; share-link / location starts do not lean the To list; the White House address is not found. Test car: 2026 Hyundai IONIQ 5 N set through localStorage `voltway.myCar` (cleared at the end). Map position set through `voltway.mapView`. 2 of the 4 address searches used.

## Results

| # | Check | Desktop dark | Desktop light | 375 light | 375 dark | Evidence |
|---|---|---|---|---|---|---|
| 1 | Place search | PARTIAL (Spring fails) | not repeated | PASS (Portland) | PASS (Portland, Moab, Toronto, Spring after US loaded) | see 1 |
| 2 | Lean | PASS with picked start; FAIL for share-link start | n/a | n/a | n/a | see 2 |
| 3 | Address search | PASS (US and Toronto), White House not found | n/a | n/a | n/a | see 3 |
| 4 | US trip via place search | PASS | n/a | n/a | n/a | Chicago, IL to Denver, CO planned; Chicago to Toronto shows cross-border message |
| 5 | Share link fills both ends | PASS | n/a | n/a | n/a | 1,636 km, 11 stops, one /api/route call |
| 6 | Zoom >= 9 first paint | PASS | n/a | n/a | n/a | see 6 |
| 7 | About, attribution, footers | PASS | PASS | PASS | PASS | see 7 |
| 8 | Console | PASS with 422 / AbortError noise | | | | see 8 |

No horizontal overflow in any pass (1265/1265 on About at 1280 due to scrollbar; 375/375 at mobile on About and map).

### 1. Place search (fresh load, map over Toronto z5.6, only places-ca.json loaded at start)
- Toronto: "Toronto, ON", "New Toronto, ON", "University of Toronto, ON". Only 3 hits, so no US load was needed; places-us.json not requested. PASS (Toronto, ON first). After the US file is loaded, "Toronto, OH" appears 2nd.
- **Spring: FAIL against the brief.** Fresh load: 8 Canadian matches (Spring Garden NS, Spring Park PE, Springhill NS, ...), so the "fewer than 3 matches" rule never loads the US file and Spring, TX is not offered. Once the US file is loaded (for example after "Portland"), Spring gives Spring, TX; Spring Valley, NV; Spring Hill, FL; Silver Spring, MD; ... as expected. This follows the D5 rule literally but a US visitor typing "Spring" never sees TX.
- Portland: Portland, OR; ME; TX; TN; IN; CT; NY; MI. places-us.json requested during typing. PASS. At 375 the suggestions sit inside the sheet (448-768 px of 812), no overflow.
- Moab: "Moab, UT" only. PASS (US already loaded at that point; the trigger for a fresh Moab was not isolated).
- Over Los Angeles (mapView z8 at -118.24, 34.05, reload, no typing): places-ca.json then places-us.json requested. PASS.
- 375 light: suggestions text rgb(26,27,30) on rgb(250,249,245), about 16:1.

### 2. Lean
- Start picked through the list (Toronto, ON), To "Richmond": Richmond, BC; Richmond Hill, ON; Richmond, AB; Richmond, ON; Richmond, QC; Fort Richmond, MB; Richmond West, MB; New-Richmond, QC. Canadian first. PASS.
- Start picked through the list (Chicago, IL), To "Richmond": Richmond, VA; CA; IN; KY; TX; MI; MO; Richmond Hill, NY. All US. PASS.
- **FAIL: start from a share link has no country.** `/?from=43.6532,-79.3832,Toronto` shows "Toronto" in From, but To "Richmond" lists Richmond, VA first (pure population order, no lean). `near?.cc` is undefined for a start read from a share link (`TripEnd.cc` is only set by place and address picks). Same would apply to "Use my location" and "Plan a trip here" starts.

### 3. Address search ("Search full address", calls `/api/geocode?q=...&near=lon,lat`)
- US start Chicago (`near=-87.65,41.85`), "1600 Pennsylvania Ave Washington": results are US addresses (Snyder PA, Pine City NY, Stoughton MA, Wilmington DE, Dallas TX), but **not the White House in Washington, DC**. The bias towards Chicago wins over the city typed in the query. Counts as finding a US address; flagged as looks-off.
- Toronto start (`near=-79.38,43.65`), "100 Queen St W Toronto": "100 Queen Street West, Toronto, ON, Canada". PASS.

### 4 and 5. Trips
- Share link `/?from=41.8781,-87.6298,Chicago&to=39.7392,-104.9903,Denver`: fills both and plans: "Chicago → Denver, 1,636 km, 16 h driving, 11 stops", request `/api/route?from=-87.63,41.878&to=-104.99,39.739`. PASS (earlier issue 1 is fixed).
- Place-search pick (Where to Denver, CO, then From Chicago, IL): 1,635 km, 11 stops, request `/api/route?from=-87.65,41.85&to=-104.985,39.739`. PASS.
- Chicago, IL to Toronto, ON: "Trips that cross the border aren't supported yet. Pick a destination in the US." PASS.

### 6. Zoom 10 first paint over Toronto
Fresh load, `voltway.mapView` zoom 10 at -79.38, 43.65. Map left untouched. Requests: o3.json, tiles/index.json, places-ca.json, meta.json, then `/data/map/tiles/3/50-66.json` (about 35 s after load in the hidden pane, once the base map had finished). The saved view was unchanged (zoom 10). PASS (earlier issue 2 is fixed).

### 7. Words and credits
- Intro: "...for the electric cars sold in Canada, and a map of public chargers in Canada and the US." and "The vehicle list covers Canada today (84 variants)." PASS.
- About #data has "Alternative Fuel Stations (AFDC), US electric stations" (new card, NLR terms, accessed 2026-11-18). PASS.
- GeoNames "(places in Canada and the US)" with 1,000 / 2,000 floors; Open Charge Map "across Canada and the US"; Natural Earth "(Canada and US outlines)". PASS.
- US card measures: 1088 x 262 px at 1280; at 375 it is x 16-359, 450 px high, no overflow, text wraps. Lowest text contrast: 11.38 dark, 6.84 light. PASS in all four passes.
- Map attribution link text: "Chargers: NRCan / NLR AFDC, Open Charge Map" (then OpenStreetMap contributors). PASS.
- Station footers (desktop dark): Hilton Plaza, San Gabriel CA (US AFDC): "Data: NLR AFDC · updated Nov 16, 2026". A Toronto station: "Data: NRCan / NLR AFDC · updated Nov 16, 2026". PASS.
- Itinerary (planned Chicago trip): "Charger data: NRCan / NLR AFDC and Open Charge Map · updated Nov 16, 2026" inside the collapsed section titled "How this was estimated" (the brief says "How this is worked out"; the section title is the existing one). PASS.

### 8. Console
Errors seen: "Failed to load resource ... 422" lines (the buffer also holds the earlier session; I made one deliberate cross-border request) and one `Uncaught (in promise) AbortError: Transition was skipped. New ViewTransition started` (same as earlier issue 4, still present, harmless). Nothing else on map or About.

## Issues
1. **Spring, TX not offered on a fresh load.** Steps: clear storage, load `/` (map over Toronto), type "Spring" in Where to. Expected Spring, TX among results. Actual: 8 Canadian names only, places-us.json is never requested because Canada returns 3 or more matches. Same for any name that also exists in Canada.
2. **Share-link starts do not lean the To list.** Steps: open `/?from=43.6532,-79.3832,Toronto`, type "Richmond" in To. Expected Richmond, BC/QC first; actual Richmond, VA first. Cause: the start from a link carries no `cc`. Fix idea: derive the country from the coordinates (`countriesOf`) when `cc` is missing.
3. **Address bias beats the typed city.** Chicago start, "1600 Pennsylvania Ave Washington" returns 1600 Pennsylvania Ave in five other towns, not Washington, DC. Low severity; ask whether `near` should be a softer bias.

## Looks off, not in the brief
- Earlier issue 3 (stale From text after "Plan a trip here") and issue 4 (AbortError) were not retested for the fix; the AbortError is still logged.
- Pressing Enter in the From field after picking a place did not start the trip; I had to press Plan trip (the To pick via Where to / Plan flow worked). Not confirmed as a bug.
- My own test label produced "2026 2026 Hyundai IONIQ 5 N" in the header chip (the label I stored already had the year; not an app bug).

## Not checked
- Desktop light for place search and the trip flows (look only; About card checked in all four passes).
- 375 for the trip itinerary and station footers (footers checked at desktop dark only).
- A fresh-load "Moab" and "Toronto" at 375 with places-us.json untouched (Toronto confirmed on desktop; at 375 the US file was already loaded).
- Real geolocation (not used).
- Storage cleared and viewport reset (desktop, dark) at the end.

## Re-check (issues 1-3), 2026-11-18, local dev server

Desktop dark, then one pass at 375 light. 3 address searches not exceeded (2 used). Storage cleared, viewport reset.

| Check | Result | Evidence |
|---|---|---|
| 1a. "Spring" on fresh load | PASS (desktop dark and 375 light) | places-ca.json then places-us.json requested; options: Spring, TX; Spring Valley, NV; Spring Hill, FL; Silver Spring, MD; Spring Hill, TN; Spring Valley, NY; Big Spring, TX; Spring Valley, CA. 375: scrollWidth 375 = clientWidth 375 |
| 1b. "Toronto" on fresh load | PASS | only places-ca.json requested; options: Toronto, ON; New Toronto, ON; University of Toronto, ON |
| 2a. `?from=43.6532,-79.3832,Toronto`, To "Richmond" | PASS | Richmond, BC; Richmond Hill, ON; Richmond, AB; Richmond, ON; Richmond, QC; Fort Richmond, MB; Richmond West, MB; New-Richmond, QC |
| 2b. `?from=41.8781,-87.6298,Chicago`, To "Richmond" | PASS | Richmond, VA; CA; IN; KY; TX; MI; MO; Richmond Hill, NY (all US) |
| 3a. Chicago start, "1600 Pennsylvania Ave Washington" | PARTIAL | request `/api/geocode?q=1600%20Pennsylvania%20Ave%20Washington&country=us` (no `near=`): PASS. Results: Snyder PA, Stoughton MA, Wilmington DE, Dallas TX, West Sacramento CA. **Washington, DC is NOT in the results: FAIL on that part.** |
| 3b. Toronto start, "100 Queen St W Toronto" | PASS | request `/api/geocode?q=100%20Queen%20St%20W%20Toronto&country=ca`; result "100 Queen Street West, Toronto, ON, Canada" |
| 4. Console errors | PASS with noise | Buffer holds 422 "Failed to load resource" lines and one `AbortError: Transition was skipped` from before this re-check (buffer not cleared between sessions, so I could not tell which are new). No new error type seen; nothing from places or geocode. |

Verdict: issue 1 fixed, issue 2 fixed, issue 3 half fixed (country param is right, but the geocoder still does not return the White House for that query; the country filter alone does not rank the city named in the query first. Likely a geocoder ranking matter, maybe worth passing the city as a locality hint or accepting it).

Note: with the narrow pane the To field is reached by clicking at (120,103); after loading a share link the panel needs a moment before typing lands in it.
