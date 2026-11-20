import type { IndexEntry } from './types.ts';
import { splitVariantName } from './variant-name.ts';

/** Make and model ("Chevrolet Bolt", "Polestar 2"): the shortest My car chip (owner 2026-11-20). */
export const carModel = (e: Pick<IndexEntry, 'make' | 'model'>) => `${e.make} ${e.model}`;

/** My car's label: make, model and the plain variant name ("Hyundai Ioniq 5 Long Range AWD"). A variant
 *  named like its model (the 2027 Bolt's "Bolt") is left out, so it never reads "Bolt Bolt". */
export function carLabel(e: Pick<IndexEntry, 'make' | 'model' | 'name'>): string {
  const plain = splitVariantName(e.name).plain;
  return plain && plain.toLowerCase() !== e.model.toLowerCase() ? `${carModel(e)} ${plain}` : carModel(e);
}

/** Bumped when the label format changes, so a saved My car is relabelled once. */
export const LABEL_VERSION = 2;

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
