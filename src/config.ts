// Coverage settings. The product isn't branded to one country; this says which market the
// current data covers, so the UI can state it openly. Adding markets later = new data + config.

import { t } from './i18n/t.ts';

export const COVERAGE = {
  /** Market code; its names below come from the i18n dictionary. */
  marketCode: 'CA',
  /** The market the vehicle list covers today. */
  market: t('market.CA.name'),
  /** Where the official efficiency and range ratings come from. */
  regulator: t('market.CA.regulator'),
  /** Short name of that regulator's ratings, for compact notes. */
  regulatorShort: t('market.CA.regulatorShort'),
  /** Currency for charging cost (B19). */
  currency: 'CAD',
  /** Formatting locale for money. */
  moneyLocale: 'en-CA',
} as const;

/**
 * Charging cost (owner decision B19). The visitor can change the price; this is only the
 * starting value: a typical Canadian Supercharger rate in late 2026 (Tesla prices mostly
 * C$0.37–0.50/kWh, range C$0.18–0.79; Drive Tesla Canada 2026-11-06, tslna.com 2026 guide).
 */
export const COST = {
  defaultPricePerKwh: 0.45,
  /** Energy drawn from a DC charger ≈ energy added ÷ this (charging-curve-viewer.md §3: ~90–95 %). Assumption. */
  dcEfficiency: 0.92,
} as const;

/**
 * Charger map (charger-map.md §2). Base map tiles from OpenFreeMap: free, no key. Switching to
 * the self-hosted Protomaps fallback means changing these style URLs only.
 */
export const MAP = {
  styleUrl: 'https://tiles.openfreemap.org/styles/positron',
  darkStyleUrl: 'https://tiles.openfreemap.org/styles/dark',
  /** The tiles credit OpenFreeMap and OpenMapTiles; OSM's licence asks for this exact wording too. */
  attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>',
  /** First visit: southern Ontario and Québec, where most chargers are. [lon, lat], zoom. */
  defaultView: { center: [-76.2, 45.0] as [number, number], zoom: 5.6 },
  /** Built map data (scripts/lib/map-build.ts). */
  dataUrl: '/data/map',
} as const;

/**
 * Trip planner energy model (route-planner.md §3, R1). Kept simple on purpose (Q-V1).
 * Each value is a stated assumption from the design, not a vehicle figure.
 */
export const TRIP = {
  /**
   * NRCan highway consumption × this when the car has no tested highway figure. Calibrated against 14 tested
   * mild-weather highway figures (docs/plan/highway-calibration-report.md); the owner chose the conservative
   * 75th percentile, 1.08, over the 0.97 best fit (B49, 2026-11-16). Was a 1.15 placeholder.
   */
  highwayFactor: 1.08,
  /** True once the owner approved a calibrated factor (R10, B49); while false the trip screen says "not yet calibrated". */
  highwayCalibrated: true,
  /** Driver and luggage added to curb weight (kg). */
  payloadKg: 150,
  /** Drivetrain efficiency when climbing: lift energy ÷ this. */
  climbEfficiency: 0.9,
  /** Share of descent energy recovered by regenerative braking. */
  regenShare: 0.6,
  /** Default starting battery % (R9) and stop threshold %. */
  defaultStartSoc: 90,
  defaultThresholdSoc: 15,
  /** Charge target at each stop (Q-V2) and minutes added per stop for parking, plugging in and paying (§5). */
  chargeToSoc: 80,
  stopOverheadMin: 5,
} as const;
