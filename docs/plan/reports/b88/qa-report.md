# B88 About page QA report (QY1-QY4)

Run 2026-11-19 against http://localhost:4321/about (dev server), 1280x800 and 375 (mobile preset), dark and light.

**Verdict: PASS (0 issues).**

| ID | Result | Evidence |
|----|--------|----------|
| QY1 | PASS | Matrix of 4 passes. scrollWidth equals clientWidth in all (1265/1265 desktop, 375/375 mobile); no element past the right edge at 375. Lowest text contrast over all 123 text nodes (card title/name/role/bio/issues line, readout labels/values, dataset credits and links, with details forced open): dark 5.53, light 5.61 (none under 4.5). Kind pills: dark 5.53 to 12.74 (rated 8.83, estimated 8.08, unknown 5.53); light 5.91 to 13.39 (rated 6.32, estimated 6.15, unknown 5.91). Hero: charged lane is 80.0 % of the lane, marker centre at 80.0 % in every pass; counts end 84/8/138/0 and match data-count. |
| QY2 | PASS | Portfolio https://mahabdulkhaliq.github.io/, GitHub https://github.com/MahAbdulKhaliq, Source https://github.com/MahAbdulKhaliq/voltway and "GitHub issues" (.../voltway/issues): all target=_blank, rel="noopener", sr-only "(opens in a new tab)". Issues line present in the card. No "Report a problem" text on the page. All 8 dataset and 2 map credit licence/source links also have target=_blank and noopener (licence ones "noopener license"). Not followed. |
| QY3 | PASS | Both sections closed on load with chips (labels, Official/Tested/Estimated/Unknown; 8 datasets/Base map/Licences). Opening adds acc-opening; body height grows 0 to final (618 px and 1673 px) with max sampled height equal to the final height (no overshoot); 14 animations on open including chevron, lane (420 ms), body grow (320 ms) and first panel rise (opacity 0, translateY(8px) to none). Click mid-close reverses (shutting at 48 px / 128 px, then opening from 398 / 1078 px, settles open at final height). Real Enter key opened and real Space key closed the first section; focus outline solid 3px, :focus-visible true. /about#data (after full reload): data section open, methods section closed, heading #data top 80 px below sticky header bottom 62 px. 8 datasets (NRCan, OpenEV Data, Chargeprice archive, AFDC CA, AFDC US, Open Charge Map, GeoNames, Natural Earth) plus 2 map credits (OpenStreetMap, OpenFreeMap), each with licence and source/website links; "Full licence notice" opens and shows the MIT text. Footer "About & sources" links to /about#data; the map's credit link on / links to /about#data (anchors checked by href, not clicked through). |
| QY4 | PASS | With voltway.motion=off (html data-motion=off): 0 running animations on /about, counts show 84/8/138/0 at once, marker opacity 1 at left 80 % with lane clip-path none, charged lane at 80 %. Both sections open and close instantly (no acc-opening or acc-shutting class, full height right after click). Regression with motion on: /charging (5 sections), /compare (1), /cars (11) each get acc-opening on open and acc-shutting on close and end in the right state. With motion off on /cars the sections toggle with no classes. |

## Console
Only one error, seen on every page: `Missing i18n key "viewer.custom"` from `Compare.tsx:550`, URL carries a stale `?t=1795062607627` hot-reload timestamp. `viewer.custom` is not referenced in the current Compare.tsx and isn't in en.json, so it is a stale entry from an earlier hot-reload, not from the current source. No errors from /about itself.

## Issues
None.

## Looks off, not in the brief
- The pane is narrower than 1280, so the desktop pass reports clientWidth 1265 (scrollbar). Not an app problem.

## Not checked
- Did not click through external links (told not to). Footer and map credit links checked by href only.
- 375 px pass: behaviour checks (animation, keyboard, #data) were done on desktop only, as briefed; at 375 only look/layout/contrast/overflow were measured.
- Rise-in of every panel was verified by animation keyframes on the first panel, not by visual frames.

Storage restored: voltway.theme and voltway.motion removed; viewport reset to desktop dark.
