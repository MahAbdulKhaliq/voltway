// B120 (owner 2026-11-20): what the My car settings can change for a trim, worked out from the
// car file: the standard wheel size and the sizes to offer (B93), and whether a heat pump is
// optional (a switch), standard, absent or not known.

import { standardWheel, wheelSizeOptions } from './wheel-effect.ts';

interface SettingsTrim {
  id: string;
  wheels: { diameter_in: number; is_standard: boolean; tire_size?: string }[];
  heat_pump?: { value: { value: unknown } } | null;
}

export type HeatPumpKind = 'optional' | 'standard' | 'none' | 'unknown';

export interface TrimSettingsInfo {
  standardIn: number | null;
  /** Sizes for the Wheels select; empty when the standard size isn't known. */
  sizes: number[];
  /** Sizes some trim of this car comes with from the factory. */
  factory: Set<number>;
  heatPump: HeatPumpKind;
  heatPumpOptional: boolean;
  tireFor: (inches: number) => string | undefined;
}

/** The trim a saved trim id points at; no id (or an unknown one) means the first, standard trim. */
export const trimFor = <T extends { id: string }>(trims: T[], trimId: string | null | undefined): T | undefined =>
  trims.find((x) => x.id === trimId) ?? trims[0];

export function heatPumpKind(value: unknown): HeatPumpKind {
  if (value === 'optional' || value === 'standard_or_optional') return 'optional';
  if (value === 'standard') return 'standard';
  if (value === 'none') return 'none';
  return 'unknown';
}

export function trimSettingsInfo(trims: SettingsTrim[], trimId: string | null | undefined): TrimSettingsInfo {
  const trim = trimFor(trims, trimId);
  const standardIn = standardWheel(trim);
  const factory = new Set(trims.flatMap((x) => x.wheels.map((w) => w.diameter_in)));
  const heatPump = heatPumpKind(trim?.heat_pump?.value.value);
  return {
    standardIn,
    sizes: standardIn !== null ? wheelSizeOptions([...factory], standardIn) : [],
    factory,
    heatPump,
    heatPumpOptional: heatPump === 'optional',
    tireFor: (inches) => trim?.wheels.find((w) => w.diameter_in === inches)?.tire_size,
  };
}

/** Trim names repeat the variant ("eDrive40 Gran Coupe (18″ Wheels)"); show only what differs. */
export function trimText(trim: string, variant: string): string {
  if (trim === variant) return trim;
  const rest = trim.startsWith(variant) ? trim.slice(variant.length).trim().replace(/^\((.*)\)$/, '$1') : '';
  return rest || trim;
}
