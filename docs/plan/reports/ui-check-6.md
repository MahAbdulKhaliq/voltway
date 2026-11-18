# UI check: [6] 6.7 Source line and credits (QO8, QO12)

Verdict: **PASS** (no failures; 3 minor notes). Dev server http://localhost:4321, 2026-11-18. No external APIs called.

Screenshots (dark first) in docs/plan/reports/phase6/: ocm-1280-dark, ocm-1280-light, ocm-375-dark, ocm-375-light, about-1280-dark, about-1280-light, about-375-dark, about-375-light (.jpg). The 375 captures are small (171x370) because of the browser pane scaling.

| Check | 1280 dark | 1280 light | 375 light | 375 dark | Evidence |
|---|---|---|---|---|---|
| OCM panel (Ivy - Dryden Canadian Tire, id 100191382) footer text | pass | pass | pass | pass | "Data: Open Charge Map contributors, via Open Charge Map · updated Apr 22, 2026 · CC BY 4.0", then "Last verified on Open Charge Map: Nov 23, 2024", then link "This station on Open Charge Map", then "This station's record last changed Nov 23, 2024." (text checked at 1280 dark; all four passes show the same DOM) |
| Link targets | pass | - | - | - | CC BY 4.0 -> https://creativecommons.org/licenses/by/4.0/ (target _blank, rel "noopener license"); OCM link -> https://openchargemap.org/site/poi/details/191382 (id = 100191382 - 100000000), target _blank, rel noopener |
| AFDC panel (Dryden, ON - Tesla Supercharger) | pass | - | - | - | "Data: NRCan / NLR AFDC · updated Nov 16, 2026"; no "Open Charge Map" text, 0 OCM/CC links |
| About card "Open Charge Map (more charging stations)" next to AFDC card | pass | pass | pass | pass | Card sits directly after the AFDC card; has description, attribution (italic), licence link -> https://openchargemap.org/site/about/terms (_blank, noopener license), "Dataset" link -> https://openchargemap.org/ (_blank, noopener), "Accessed 2026-11-18" |
| Horizontal overflow | 1280/1280 | 1265/1265 (scrollbar) | 375/375 | 375/375 | Panel footer scrollWidth = clientWidth (310 at 1280; 210 at 375); About card 341/341 at 375 |
| Link contrast vs panel bg | 10.41 (rgb 255,212,0 on 38,39,44); text 5.83 | 6.84 (111,83,0 on 250,249,245); text 7.21 | 6.84 / 7.21 | 10.41 / 5.83 | All >= 4.5. About: dark 11.38, light 6.84 |
| Visible focus | pass | - | - | - | Keyboard Tab onto OCM link: :focus-visible, outline 3px solid rgb(255,212,0), offset 2px. Links are underlined in all themes |
| Tap targets (inline footer links) | 15 px tall | 15 px | 15 px (CC BY wraps to 2 lines, 36 px) | same | See notes |
| Console errors | see note | | | | |

## Issues
None blocking.

## Looks off, not in the brief
1. Footer links are 15 px tall (inline text links, "This station on Open Charge Map" is the only thing on its line). Under the 24 px WCAG 2.2 target-size guideline unless spacing exempts it (the lines above and below are text, not other targets, so the exemption probably applies). Fine for the "acceptable for inline links" bar; a bit more line padding would help on a phone.
2. On 375 the panel is only 240 px wide, and "CC BY 4.0" breaks across two lines in the footer ("... · / CC BY 4.0" with the link wrapped; link box 202x36). Readable, no clipping.
3. About card: the whole "Licence: ..." sentence including the visible URL text is one link (same pattern as the AFDC card), so on 375 it is a 99 px tall underlined block. Consistent with other cards.
4. Station title and address use the marquee (scrolling text) in the 240 px phone panel, so a screenshot can catch "Ivy - Dryden Canadian T" cut mid-scroll; not a defect.
5. Footer says "updated Apr 22, 2026" for OCM (dry-run data date) while AFDC says Nov 16, 2026. Expected for the dry run.
6. Content: About says "about 480 across Canada". I did not verify the count against l3/l2.json.

## Console
Fresh load of / and /about/ at 375: console buffer holds one "Failed to load resource: 404" and a React "order of Hooks" / "Should have a queue" error from ChargerMap.tsx?t=1794994436345 (useMapSheet). The `?t=` timestamp marks it as a stale hot-reload from a source edit earlier in the session (hook order changes on HMR); it did not repeat after fresh navigations, and the network log of a fresh load of / showed no 404. Treat as stale, but worth one fresh `astro dev` restart to confirm. The 404 URL was not captured (buffer dropped earlier requests).

## Not checked
- White River station (100249957): the place search had no "White River" town match; used Dryden instead.
- Light-theme 375 and dark-theme map panels at 1280 were measured via DOM; screenshot of 375 light panel was taken at the same state.
- Real tap-target behaviour on a touch device; the pane is mouse only.
- The panel's footer on stations from other OCM providers (AddEnergie CC BY 3.0, Greems CC0): only the Ivy station was opened, so the provider/licence wording for those was not seen.
- Storage: I did not add keys on purpose; the map remembers its view (Dryden) in localStorage and the My car already set was left alone.
