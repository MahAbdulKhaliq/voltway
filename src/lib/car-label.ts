import type { IndexEntry } from './types.ts';
import { splitVariantName } from './variant-name.ts';

/** My car's short label: model and the plain variant name ("Ioniq 5 Long Range AWD"). */
export const carLabel = (e: IndexEntry) => `${e.model} ${splitVariantName(e.name).plain}`;

/** The header chip's three lengths (B71), shortest first: "Model Y", "2026 Model Y",
 *  "2026 Model Y Performance". Without a known model (a car saved before B71) the label is the model. */
export function carChipParts(car: { carId: string; label?: string; model?: string }): [string, string, string] {
  const year = car.carId.split('/')[2] ?? '';
  const label = car.label ?? car.carId.split('/')[1];
  const model = car.model && label.startsWith(car.model) ? car.model : label;
  const withYear = year ? `${year} ${model}` : model;
  const trim = label.slice(model.length).trim();
  return [model, withYear, trim ? `${withYear} ${trim}` : withYear];
}

/** Ask the header to open its car dialog (B58): the one place a car is chosen. */
export const openCarPicker = () => window.dispatchEvent(new CustomEvent('voltway:pick-car'));
