// My car and the comparison list (database-ui.md §3, user-flows.md §1). Browser storage only.
// Changes are broadcast as window events so the header chips and every island stay in step:
// "voltway:mycar" (detail: MyCar | null) and "voltway:compare" (detail: string[]).

import { getJSON, setJSON, KEYS } from './storage.ts';

/** `label` is the short name the header chip shows ("IONIQ 5 Long Range AWD"). */
export interface MyCar { carId: string; trimId: string | null; label?: string }
export const COMPARE_MAX = 4;
const ID = /^[a-z0-9-]+\/[a-z0-9-]+\/\d{4}\/[a-z0-9-]+$/;

const emit = (name: string, detail: unknown) => {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(name, { detail }));
};

/** A saved My car, checked; anything odd counts as none. */
export function readMyCar(saved: unknown): MyCar | null {
  if (!saved || typeof saved !== 'object') return null;
  const s = saved as Record<string, unknown>;
  if (typeof s.carId !== 'string' || !ID.test(s.carId)) return null;
  const out: MyCar = { carId: s.carId, trimId: typeof s.trimId === 'string' && s.trimId ? s.trimId : null };
  if (typeof s.label === 'string' && s.label) out.label = s.label.slice(0, 80);
  return out;
}

export const getMyCar = (): MyCar | null => readMyCar(getJSON<unknown>(KEYS.myCar, null));

export function setMyCar(car: MyCar | null): void {
  setJSON(KEYS.myCar, car);
  emit('voltway:mycar', car);
}

/** A saved comparison list, checked: valid ids only, no repeats, at most four. */
export function readCompare(saved: unknown): string[] {
  if (!Array.isArray(saved)) return [];
  return [...new Set(saved.filter((x): x is string => typeof x === 'string' && ID.test(x)))].slice(0, COMPARE_MAX);
}

export const getCompare = (): string[] => readCompare(getJSON<unknown>(KEYS.compare, []));

function saveCompare(list: string[]): string[] {
  setJSON(KEYS.compare, list);
  emit('voltway:compare', list);
  return list;
}

export type AddResult = 'added' | 'already' | 'full';

/** Pure list step, so it is unit-tested apart from storage. */
export function addTo(list: string[], id: string): { list: string[]; result: AddResult } {
  if (list.includes(id)) return { list, result: 'already' };
  if (list.length >= COMPARE_MAX) return { list, result: 'full' };
  return { list: [...list, id], result: 'added' };
}

export function addToCompare(id: string): AddResult {
  const { list, result } = addTo(getCompare(), id);
  if (result === 'added') saveCompare(list);
  return result;
}

export const removeFromCompare = (id: string): string[] => saveCompare(getCompare().filter((x) => x !== id));
export const setCompare = (ids: string[]): string[] => saveCompare(readCompare(ids));
