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
