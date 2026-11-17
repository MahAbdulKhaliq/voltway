# User Flows

Answers X1 and X2 in [gaps-and-questions.md](gaps-and-questions.md): how people move between the parts of the app, and the links that make it "all-in-one" rather than separate tools side by side.

Each part's own screens are designed in [database-ui.md](database-ui.md), [charging-curve-viewer.md](charging-curve-viewer.md), [charger-map.md](charger-map.md) and [route-planner.md](route-planner.md). This doc covers **only the connections between them**.

---

## 1. What every part shares

| Shared state | Set in | Used by |
|--------------|--------|---------|
| **My car** (variant + trim) | First-load picker, car page, header chip | Car pages, curve viewer, map's "my car can use" filter, trip planner |
| **Units** (km/mi) | Header | Everything |
| **Comparison list** (up to 4 cars) | "+ Compare" anywhere | Compare screen, and later trip comparison (§4) |
| **Data dates and sources** | Build step | Badges and "last updated" notes everywhere |

All saved **in the browser only** (database-ui.md §3).

---

## 2. Cross-links between parts (X1) ✅

These links are what make the parts feel like one app. **Phase** shows when each becomes available.

| From | Link | To | Phase |
|------|------|----|-------|
| Car page | **"Set as my car"** | Updates My car everywhere | 1 |
| Car card / car page | **"+ Compare"** | Compare screen | 1 |
| Curve viewer, charger preset | **"Find chargers this fast"** | Map, filtered to the matching kW range + the car's plugs | 1b (B31) |
| **Charger popup** | **"How fast would my car charge here?"** | Curve viewer for My car, **capped at this charger's kW** | 1b (B31) |
| Charger popup | **"Route here"** | Route mode on the same map with this charger as the destination (B50) | 3 |
| **Trip stop** | **"See the charging curve for this stop"** | Curve viewer set to **this stop's arrival % → 80%**, capped at the charger's kW | 3 |
| Trip stop | Open charger | Same popup as the map | 3 |
| Trip results | **"Change car"** | My car picker, then re-plans the same trip | 3 |
| Any estimated figure | **"Why estimated?"** | The explanation and sources section on the car page | 1 |

**The key link** is the one between the **trip stop** and the **curve viewer**. It shows the user exactly why a stop takes 24 minutes, using the same curve, with the same source badge. That's the accuracy pitch carried all the way through.

---

## 3. Main journeys

### A. First visit (everyone)
```
Land on the site
  → "Which EV do you drive, or want to?"   (search or pick; or "Just browsing")
  → Car page for that car                  (key figures + curve viewer)
  → [later visits start on the same car, via My car]
```

### B. The shopper: "Which car suits me?"
```
Cars (browse)
  → filters: sold in Canada ✓, SUV, range ≥ 400 km, 10–80% ≤ 30 min
  → table view, sorted by km per 10 min
  → "+ Compare" on 3 cars
  → Compare: curves overlaid + side-by-side specs + best values highlighted
  → open a car → check sources on figures that matter
  → [Phase 3, later] "Try these cars on a trip" (§4)
```

### C. The owner: "Plan my road trip"
```
(My car already set)
  → Trip: From / To, start 90%, threshold 15%
  → Results: route, stops, itinerary, warnings
  → tap stop 1 → "See the charging curve for this stop"
  → back → "Open in Google Maps" for driving
```

### D. The owner: "Where can I charge near here?"
```
Map  (Level 3 shown by default)
  → toggle "Chargers my car can use"
  → "Locate me" or search a town
  → tap a charger → ports and kW, access, status
  → "How fast would my car charge here?" → curve viewer capped at that charger
```

### E. The enthusiast: "Show me the real data"
```
Car page
  → curve viewer → curve dropdown: Tested (Fastned-derived) vs. Estimated
  → overlay both → More detail: raw points, conditions, source link
  → tap any badge → other figures from other sources, any "sources differ" flags
  → About & sources page
```

---

## 4. Comparing a trip across cars (X2)

**Idea:** run one trip for every car in the comparison list, side by side: total time, number of stops, charging minutes.

- **Decision: later, after Phase 3 v1.** It's a strong feature for shoppers, and it fits the "linked parts" pitch.
- **Why it's easy to add later:** the planner is a function of (route, car). The route only needs fetching **once**, and each car's stops are then worked out **in the browser**. So comparing 4 cars uses **one** routing request, not four, which matters for the free allowance.
- **Design note for Phase 3:** keep the stop logic separate from the routing call, so this stays possible.

---

## 5. Navigation as phases ship

| Phase shipped | Header shows |
|---------------|--------------|
| 1 | Charging · Cars · Compare · My car · km/mi (Charging tab added 2026-11-16, B11) |
| 2 | + **Map** |
| 3 | + **Trip** |

Cross-links to parts that aren't built yet are **hidden**, not shown greyed out.
