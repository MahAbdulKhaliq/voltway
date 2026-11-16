# Competitors & Positioning

Answers M1 and M2 in [gaps-and-questions.md](gaps-and-questions.md): what existing tools do well and badly, and which gap this app fills.

*Based on general knowledge of these products as of 2026-11-15, plus the research in the other docs. Features and pricing change, so re-check the main ones before launch.*

---

## 1. The landscape (M1)

### Route planners
| Tool | Strong at | Weak at (for our users) |
|------|-----------|-------------------------|
| **A Better Route Planner (ABRP)** | The deepest energy model (weather, speed, elevation, live car data), global coverage, very configurable | Complex for casual users. The best features need a paid subscription. Vehicle data isn't shown with its sources. |
| **Google Maps / Android Auto EV routing**, car built-in navigation (Tesla, Hyundai/Kia, GM…) | Built in and convenient, often with live battery data and battery preconditioning | Tied to one car or platform. Not useful for comparing cars or for shoppers. You can't see or check the charging assumptions. |

### Charger maps
| Tool | Strong at | Weak at (for our users) |
|------|-----------|-------------------------|
| **PlugShare** | The largest community: check-ins, photos, reviews, some live status | Busy interface, a kW-slider filter style, and no link to car data or charging curves |
| **ChargeHub** (Canadian) | Canadian focus, network coverage | Map-first. No vehicle database or curves |
| **Network apps** (Tesla, FLO, Electrify Canada, Circuit électrique, Petro-Canada…) | Live status, payment, start/stop charging | One network each |

### Vehicle and charging data
| Tool | Strong at | Weak at (for our users) |
|------|-----------|-------------------------|
| **EV Database** (ev-database.org) | Detailed specs, real-world range estimates | European focus, so North American trims and prices are thin. Sources not shown per figure. |
| **evkx.net** | Charging curves, a large global database | Data not open. Enthusiast-oriented |
| **better-dcfc-calculator** | An excellent curve calculator: charger limits, current, pack voltage | A calculator only: no map, no trips, not Canada-focused |
| **NRCan Fuel Consumption Guide / search tool** | **The official Canadian ratings** | Official figures only: no curves, no charging maths, no comparison tools |
| **CAA EV resources** (Canada) | Trusted buyer guidance, Canadian winter testing | Articles and guides, not an interactive tool |

---

## 2. The gap (M2) ✅

**No single free tool combines:**
1. **Canadian vehicle data** (NRCan official ratings, Canadian trims, cars actually sold in Canada)
2. **with a source shown on every figure** (official / manufacturer / tested / estimated)
3. **with charging curves and their maths** (10–80% time, km per 10 min)
4. **linked to a simple charger map and trip planner that use the same data.**

Each competitor does one or two of these well. None does all four, and **none shows where every number comes from.**

## 3. Positioning ✅

> **For Canadian EV shoppers and drivers who want to know how a car really charges and travels, this app is the free, no-login place where every spec shows its source, every curve is labeled honestly, and the map and trip planner run on that same data.**

### Where we win
| Advantage | Versus |
|-----------|--------|
| **Trustworthy, sourced vehicle data** | Everyone. It's the core pitch. |
| **Canada first** (NRCan ratings, Canadian cars and trims, km, French later) | EV Database, evkx, ABRP (all global or European-first) |
| **Simple** (power bands instead of sliders, a threshold planner, three layers of detail) | PlugShare, ABRP |
| **Free, no account** | ABRP Premium, apps that require accounts |
| **Linked parts:** the curve you see is the one the planner uses | Separate tools (calculator + map + planner) |

### Where we deliberately don't compete
| Feature | Owned by | Why we skip it |
|---------|----------|----------------|
| Live charger availability | Network apps, PlugShare | Paid or network-specific data |
| Community reviews, check-ins, photos | PlugShare | Needs accounts and moderation |
| Deep energy model, live car data | ABRP, built-in navigation | Conflicts with "simple" and needs car connections |
| Turn-by-turn navigation | Google, Apple, cars | Out of scope (R7). We link out to them. |
| Global coverage | ABRP, evkx | Canada first (P4) |

### Biggest competitive risk
**Built-in car navigation keeps improving.** Owners may need a separate planner less over time. That's one more reason the **database and curves are the core** of this app (shoppers and comparisons). The planner adds value rather than being the main draw.
