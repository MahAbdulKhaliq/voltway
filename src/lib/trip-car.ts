// Turns a car file (/data/cars/<id>.json) into what the stop planner needs (trip-plan.ts PlanCar):
// trip energy figures, the default charging curve, the car's plugs and its DC peak.

import { carMapInfo } from './map-filter.ts';
import type { PlanCar } from './trip-plan.ts';
import { tripCar } from './trip-energy.ts';
import type { CarDetail } from './types.ts';

export type PlanCarResult = { ok: true; car: PlanCar } | { ok: false; missing: string[] };

export function planCarFrom(detail: CarDetail, trimId?: string | null): PlanCarResult {
  const energy = tripCar(detail, trimId);
  const missing = energy.ok ? [] : [...energy.missing];
  const curve = detail.curves.find((c) => c.is_display_default) ?? detail.curves[0];
  if (!curve || curve.points.length < 2) missing.push('charging_curve');
  const info = carMapInfo(detail);
  if (!info.rule) missing.push('charge_port');
  if (!energy.ok || missing.length) return { ok: false, missing };
  const dc = detail.fields.dc_max_kw?.value.value;
  return {
    ok: true,
    car: {
      energy: energy.car,
      curve: {
        points: curve!.points,
        // An estimated curve, or a measured one used past its measured points (B24).
        estimated: curve!.kind === 'estimated' || detail.derived.extrapolated,
      },
      rule: info.rule!,
      isTesla: info.isTesla,
      dcMaxKw: typeof dc === 'number' && dc > 0 ? dc : null,
    },
  };
}
