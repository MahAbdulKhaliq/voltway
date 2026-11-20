// B96 (owner, 2026-11-19): no unknowns on the figures that drive the 10–80 % time, km added per
// 10 min and the charger map. Every built car must carry a value (sourced or a stated-basis estimate).

export const REQUIRED_FIELDS = [
  'capacity_usable_kwh', 'chemistry', 'nominal_voltage_class', 'preconditioning',
  'dc_max_kw', 'ac_max_kw', 'charge_port', 'supercharger_access',
] as const;

type BuiltCar = { id: string; powertrain_id?: string; fields?: Record<string, { value?: { value?: unknown } | null } | null | undefined> };

/** The required fields a built car (public/data/cars/<id>.json) is still missing. */
export function missingRequired(car: BuiltCar): string[] {
  return REQUIRED_FIELDS.filter((k) => {
    const v = car.fields?.[k]?.value?.value;
    return v === undefined || v === null || v === 'unknown' || v === '';
  });
}
