// Units (database-ui.md §9). Data is metric; miles are an on-screen conversion only (U4).

export type DistanceUnit = 'km' | 'mi';
export const KM_PER_MI = 1.609344;

export const kmTo = (km: number, unit: DistanceUnit): number => (unit === 'km' ? km : km / KM_PER_MI);

/** Wh/km → kWh/100 km (NRCan's unit) or kWh/100 mi. */
export const whPerKmToDisplay = (whPerKm: number, unit: DistanceUnit): number =>
  unit === 'km' ? whPerKm / 10 : (whPerKm * KM_PER_MI) / 10;

const formatters = new Map<string, Intl.NumberFormat>();
/** Locale-aware number formatting with a fixed number of decimals. */
export function formatNumber(n: number, decimals = 0, locale = 'en-CA'): string {
  const key = `${locale}|${decimals}`;
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.NumberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    formatters.set(key, f);
  }
  return f.format(n);
}

/** Sensible decimals for a figure: whole km/kW, one decimal for small kWh / efficiency. */
export function decimalsFor(unit: string | undefined, value: number): number {
  if (unit === 'kWh' || unit === 'h') return Number.isInteger(value) ? 0 : 1;
  if (unit === 'Wh/km') return 1; // shown as kWh/100 km
  return 0;
}
