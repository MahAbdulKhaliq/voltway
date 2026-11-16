// Coverage settings. The product isn't branded to one country; this says which market the
// current data covers, so the UI can state it openly. Adding markets later = new data + config.

export const COVERAGE = {
  /** The market the vehicle list covers today. */
  market: 'Canada',
  /** Where the official efficiency and range ratings come from. */
  regulator: 'Natural Resources Canada (NRCan)',
  /** Short name of that regulator's ratings, for compact notes. */
  regulatorShort: 'NRCan',
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
