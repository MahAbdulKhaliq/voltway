// Charging price per kWh (owner, B66): one site-wide setting, in Settings and on the Charging page.
// It starts at the typical rate in config (COST, B19) and estimates the cost of trip stops, since
// there is no per-station price data. A change is announced with a "voltway:price" event.

import { COST } from '../config.ts';
import { getItem, setItem, KEYS } from './storage.ts';

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
