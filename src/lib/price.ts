// Charging price per kWh (owner, B66): one site-wide setting, in Settings and on the Charging page.
// It starts at the typical rate in config (COST, B19) and estimates the cost of trip stops, since
// there is no per-station price data. A change is announced with a "voltway:price" event.

import { COST } from '../config.ts';
import { getItem, setItem, KEYS } from './storage.ts';
import { KM_PER_MI, type DistanceUnit } from './units.ts';

export const PRICE_EVENT = 'voltway:price';

export function chargePrice(): number {
  const raw = getItem(KEYS.price);
  const v = raw === null ? NaN : Number(raw);
  return Number.isFinite(v) && v >= 0 ? v : COST.defaultPricePerKwh;
}

export function setChargePrice(price: number): void {
  if (!Number.isFinite(price) || price < 0) return;
  setItem(KEYS.price, String(price));
  window.dispatchEvent(new CustomEvent(PRICE_EVENT, { detail: price }));
}

/** Cost of adding `addedKwh` to the battery: the charger bills a little more than it delivers. */
export const chargeCost = (addedKwh: number, price: number): number => (addedKwh / COST.dcEfficiency) * price;

/** B99: costs read as plain "$12.34", with no currency code or country, whatever the browser's locale. */
export const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', currencyDisplay: 'narrowSymbol' });

/** Compare (B119): the cost of 10 minutes of charging at the window's average rate; null without time. */
export const costPer10Min = (addedKwh: number, minutes: number, price: number): number | null =>
  minutes > 0 ? chargeCost((addedKwh / minutes) * 10, price) : null;

/** Compare (B119): what 100 km (or 100 mi) of driving costs at this consumption, charging losses included. */
export const costPer100 = (whPerKm: number, price: number, unit: DistanceUnit): number =>
  chargeCost((whPerKm * 100 * (unit === 'km' ? 1 : KM_PER_MI)) / 1000, price);
