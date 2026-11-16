// The spec table's groups (database-ui.md §5), shared by the Charging tab and Compare (§6).
import type { MessageKey } from '../i18n/t.ts';

export const GROUPS: { title: MessageKey; fields: string[] }[] = [
  { title: 'group.battery', fields: ['capacity_usable_kwh', 'capacity_gross_kwh', 'chemistry', 'nominal_voltage_class', 'preconditioning'] },
  { title: 'group.charging', fields: ['dc_max_kw', 'ac_max_kw', 'published_10_80_min', 'recharge_time_240v_h'] },
  { title: 'group.efficiency', fields: ['range_km', 'consumption_combined_wh_per_km', 'consumption_city_wh_per_km', 'consumption_highway_wh_per_km'] },
  { title: 'group.ports', fields: ['charge_port', 'supercharger_access', 'adapters_included'] },
];
