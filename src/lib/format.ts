// Turns sourced values into on-screen text (server side). Distances and efficiency are
// rendered in km and carry data attributes so the km/mi switch can convert them in place.

import { t, type MessageKey } from '../i18n/t.ts';
import { decimalsFor, formatNumber, whPerKmToDisplay } from './units.ts';
import type { SourcedValue } from './types.ts';

export interface Display {
  text: string;
  /** Attributes for the km/mi switch: data-km or data-whkm. */
  attrs: Record<string, string>;
}

export function valueLabel(v: string): string {
  const key = `value.${v}` as MessageKey;
  try {
    return t(key);
  } catch {
    return v;
  }
}

export function display(v: SourcedValue): Display {
  if (typeof v.value === 'string') return { text: valueLabel(v.value), attrs: {} };
  const n = v.value;
  switch (v.unit) {
    case 'km':
      return { text: t('fmt.km', { value: formatNumber(n) }), attrs: { 'data-km': String(n) } };
    case 'Wh/km':
      return { text: t('fmt.kwh100km', { value: formatNumber(whPerKmToDisplay(n, 'km'), 1) }), attrs: { 'data-whkm': String(n) } };
    case 'kWh':
      return { text: t('fmt.kwh', { value: formatNumber(n, decimalsFor('kWh', n)) }), attrs: {} };
    case 'kW':
      return { text: t('fmt.kw', { value: formatNumber(n, Number.isInteger(n) ? 0 : 1) }), attrs: {} };
    case 'min':
      return { text: t('fmt.min', { value: formatNumber(n) }), attrs: {} };
    case 'h':
      return { text: t('fmt.h', { value: formatNumber(n, decimalsFor('h', n)) }), attrs: {} };
    case 'kg':
      return { text: t('fmt.kg', { value: formatNumber(n) }), attrs: {} };
    default:
      return { text: formatNumber(n, 1), attrs: {} };
  }
}

export const kindLabel = (kind: SourcedValue['kind']): string => t(`kind.${kind}` as MessageKey);
