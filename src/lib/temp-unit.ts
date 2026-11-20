// °C / °F, site-wide (B116, B123). Saved as voltway.tempUnit; with no saved choice it follows the
// distance unit (miles → °F). Changes are broadcast as "voltway:tempunit" (detail: TempUnit), so the
// Settings menu, the Charging page and the trip planner stay in step.

import { getItem, setItem, KEYS } from './storage.ts';
import type { TempUnit } from './temperature-effect.ts';

export const TEMP_UNIT_EVENT = 'voltway:tempunit';

/** The saved choice, or null when the visitor never picked one. */
export function savedTempUnit(): TempUnit | null {
  const s = getItem(KEYS.tempUnit);
  return s === 'C' || s === 'F' ? s : null;
}

export function currentTempUnit(): TempUnit {
  return savedTempUnit() ?? (getItem(KEYS.units) === 'mi' ? 'F' : 'C');
}

export function setTempUnit(u: TempUnit): void {
  setItem(KEYS.tempUnit, u);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(TEMP_UNIT_EVENT, { detail: u }));
}

/** B123 Region preset: Canada = km + °C, US = mi + °F; null while the two units are mixed. */
export function regionOf(distance: 'km' | 'mi', temp: TempUnit): 'ca' | 'us' | null {
  if (distance === 'km' && temp === 'C') return 'ca';
  if (distance === 'mi' && temp === 'F') return 'us';
  return null;
}
