import type { Field } from './types.ts';

/**
 * B104: the Level 2 (240 V) time follows the onboard charger of the trim picked.
 * - A trim rated on its own regulator row shows its own time.
 * - A trim whose charger differs from the one the car's time was rated with (the first trim's)
 *   shows that time scaled by the charger ratio, marked as an estimate.
 * - Otherwise the car's time.
 */
export function levelTwoTime(carTime: Field, trimTime: Field, refAcKw: number | undefined, trimAcKw: number | undefined, note: string): Field {
  if (trimTime) return trimTime;
  if (!carTime || typeof carTime.value.value !== 'number') return carTime;
  if (!refAcKw || !trimAcKw || refAcKw === trimAcKw) return carTime;
  const hours = Math.round(((carTime.value.value * refAcKw) / trimAcKw) * 10) / 10;
  return {
    value: { value: hours, unit: carTime.value.unit, kind: 'estimated', source_id: carTime.value.source_id, notes: note },
    others: [carTime.value, ...carTime.others],
    conflict: false,
  };
}
