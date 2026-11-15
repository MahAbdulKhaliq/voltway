// The data build (checklist 1.7): joins our records with confirmed crosswalk matches,
// applies precedence (vehicle-data-model.md §7 + decision B4), flags conflicts (>5 %),
// adds estimated curves (§5, charging-curve-viewer.md §9) and computes browse figures.
// Pure: reads files under `root`, returns the output; scripts/build-data.ts writes it.

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { parseCsv } from './csv.ts';
import { parseName } from './match.ts';
import { deriveWheelEffect, type RatingRow, type WheelEffect } from '../../src/lib/wheel-effect.ts';
import { calculateCharge } from '../../src/lib/charging.ts';
import { estimateCurve } from '../../src/lib/estimated-curve.ts';
import { MVP_FIELDS, type CarDetail, type CurveOut, type Field, type IndexEntry, type Source, type SourcedValue, type TrimOut } from '../../src/lib/types.ts';

// ---------- reading ----------
function listJson(dir: string): string[] {
  const out: string[] = [];
  const walk = (d: string) => {
    if (!existsSync(d)) return;
    for (const n of readdirSync(d)) {
      const f = join(d, n);
      if (statSync(f).isDirectory()) walk(f);
      else if (n.endsWith('.json')) out.push(f);
    }
  };
  walk(dir);
  return out.sort();
}
const load = (f: string) => JSON.parse(readFileSync(f, 'utf8'));

// ---------- precedence ----------
type Group = 'rated' | 'spec' | 'fact' | 'curve' | 'other';

/** Which precedence list a field uses (§7). */
export const FIELD_GROUP: Record<string, Group> = {
  range_km: 'rated',
  consumption_combined_wh_per_km: 'rated',
  consumption_city_wh_per_km: 'rated',
  consumption_highway_wh_per_km: 'rated',
  recharge_time_240v_h: 'rated',
  capacity_gross_kwh: 'spec',
  capacity_usable_kwh: 'spec',
  dc_max_kw: 'spec',
  ac_max_kw: 'spec',
  curb_weight_kg: 'spec',
  published_10_80_min: 'spec',
  chemistry: 'fact',
  nominal_voltage_class: 'fact',
  preconditioning: 'fact',
  charge_port: 'fact',
  supercharger_access: 'fact',
  heat_pump: 'fact',
};

/**
 * Lower = preferred. `via` tells a direct manufacturer page (oem) from a value that came
 * through a dataset (OpenEV Data, Chargeprice): decision B4.
 */
export function rank(group: Group, v: SourcedValue, via: 'oem' | 'openev' | 'chargeprice' | 'regulatory' | 'other'): number {
  const k = v.kind;
  let r: number;
  if (group === 'rated') {
    // NRCan → EPA → manufacturer → tested → estimated. WLTP is reference only (never default unless alone).
    r = { rated_nrcan: 0, rated_epa: 1, manufacturer: 2, tested: 3, community: 4, estimated: 5, rated_wltp: 9 }[k];
  } else if (group === 'spec') {
    // Manufacturer (direct) → tested → manufacturer via OpenEV → Chargeprice → community → estimated.
    // Only a manufacturer's own page is "direct"; manufacturer figures reported elsewhere
    // (datasets, press or quick web lookups) rank below tested.
    if (k === 'manufacturer') r = via === 'oem' ? 0 : via === 'chargeprice' ? 3 : 2;
    else r = { tested: 1, community: 4, estimated: 5, rated_nrcan: 6, rated_epa: 6, rated_wltp: 7 }[k] ?? 8;
  } else if (group === 'fact') {
    // Manufacturer page → OpenEV Data → other.
    r = via === 'oem' ? 0 : via === 'openev' ? 1 : via === 'chargeprice' ? 2 : 3;
  } else {
    r = { tested: 0, community: 1, manufacturer: 2, estimated: 3 }[k as 'tested'] ?? 4;
  }
  return r * 2 + (v.low_confidence ? 1 : 0); // a confident value beats a weak one in the same tier
}

/** Two values of the same kind more than 5 % apart (numbers), or different (facts), are flagged (§7). */
export function hasConflict(values: SourcedValue[]): boolean {
  for (let i = 0; i < values.length; i++) {
    for (let j = i + 1; j < values.length; j++) {
      const a = values[i];
      const b = values[j];
      if (a.kind !== b.kind || a.source_id === b.source_id) continue;
      if (typeof a.value === 'number' && typeof b.value === 'number') {
        const base = Math.max(Math.abs(a.value), Math.abs(b.value));
        if (base > 0 && Math.abs(a.value - b.value) / base > 0.05) return true;
      } else if (a.value !== b.value) return true;
    }
  }
  return false;
}

interface Candidate { v: SourcedValue; via: Parameters<typeof rank>[2] }

export function resolve(field: string, all: Candidate[]): Field {
  // The same value from the same source (e.g. our file and the import both citing NRCan) counts once.
  const seen = new Set<string>();
  const candidates = all.filter((c) => {
    const key = `${c.v.source_id}|${c.v.kind}|${c.v.value}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  if (candidates.length === 0) return null;
  const group = FIELD_GROUP[field] ?? 'other';
  const sorted = [...candidates].sort((a, b) => rank(group, a.v, a.via) - rank(group, b.v, b.via));
  // WLTP is reference only: never the default while anything else exists.
  const first = sorted.find((c) => c.v.kind !== 'rated_wltp') ?? sorted[0];
  const others = sorted.filter((c) => c !== first).map((c) => c.v);
  return { value: first.v, others, conflict: hasConflict(sorted.map((c) => c.v)) };
}

// ---------- mapping imported records onto our fields ----------
const OPENEV_FIELDS: Record<string, string> = {
  capacity_gross_kwh: 'capacity_gross_kwh',
  capacity_usable_kwh: 'capacity_usable_kwh',
  chemistry: 'chemistry',
  nominal_voltage_class: 'nominal_voltage_class',
  ac_max_kw: 'ac_max_kw',
  dc_max_kw: 'dc_max_kw',
  charge_port: 'charge_port',
  range_km: 'range_km',
  curb_weight_kg: 'curb_weight_kg',
  published_10_80_min: 'published_10_80_min',
};
const CHARGEPRICE_FIELDS: Record<string, string> = {
  capacity_usable_kwh: 'capacity_usable_kwh',
  dc_max_kw: 'dc_max_kw',
  ac_max_kw: 'ac_max_kw',
  nominal_voltage_class: 'nominal_voltage_class',
};
const NRCAN_FIELDS = ['consumption_city_wh_per_km', 'consumption_highway_wh_per_km', 'consumption_combined_wh_per_km', 'range_km', 'recharge_time_240v_h'];

/** Our variant file's own fields, keyed by flat field name. */
function ownFields(v: any): Record<string, SourcedValue[]> {
  const out: Record<string, SourcedValue[]> = {};
  const take = (name: string, val: unknown) => { if (Array.isArray(val)) out[name] = val as SourcedValue[]; };
  for (const [k, val] of Object.entries(v.battery ?? {})) take(k, val);
  for (const k of Object.keys(FIELD_GROUP)) if (k in v && k !== 'heat_pump') take(k, v[k]);
  return out;
}

export interface Estimates {
  /** Rough wheel-size effect on consumption (B13); null when no source rates a car at two sizes. */
  wheel: WheelEffect | null;
}

export interface BuildResult {
  cars: CarDetail[];
  index: IndexEntry[];
  estimates: Estimates;
  report: { cars: number; unknownByField: Record<string, number>; conflicts: number; curves: Record<string, number> };
}

/**
 * Hand-entered wheels can come from several sources (B14). Keep one entry per diameter, in
 * the order first listed, standard when any source says so. The first source's entry is kept.
 */
export function oneWheelPerSize(list: TrimOut['wheels']): TrimOut['wheels'] {
  const out = new Map<number, TrimOut['wheels'][number]>();
  for (const w of list) {
    const seen = out.get(w.diameter_in);
    if (!seen) out.set(w.diameter_in, { ...w });
    else if (w.is_standard) seen.is_standard = true;
  }
  return [...out.values()];
}

/**
 * Rating rows for the wheel-size effect. Each source that rates the same car at several wheel
 * sizes gets a small adapter here; NRCan is the first (its model names carry "(20" Wheels)").
 * An EPA, WLTP or other adapter would push rows of the same shape.
 */
export function ratingRows(imported: Record<string, Map<string, any>>): RatingRow[] {
  const rows: RatingRow[] = [];
  for (const r of imported.nrcan?.values() ?? []) {
    const p = parseName(r.model);
    const c = r.consumption_combined_wh_per_km?.[0];
    if (!p.wheel_in || !c) continue;
    rows.push({ group: `nrcan|${r.year}|${r.make}|${p.base}|${r.motor_kw?.[0]?.value}`, wheel_in: p.wheel_in, wh_per_km: c.value, source_id: c.source_id });
  }
  return rows;
}

export function buildCars(root: string): BuildResult {
  const sources = new Map<string, Source>(listJson(join(root, 'data/sources')).map((f) => { const s = load(f); return [s.id, s]; }));
  const makes = new Map<string, any>(listJson(join(root, 'data/makes')).map((f) => { const m = load(f); return [m.id, m]; }));
  const models = new Map<string, any>(listJson(join(root, 'data/models')).map((f) => { const m = load(f); return [m.id, m]; }));
  const imported: Record<string, Map<string, any>> = { nrcan: new Map(), openev: new Map(), chargeprice: new Map() };
  for (const src of Object.keys(imported)) {
    for (const f of listJson(join(root, 'data/imported', src))) for (const r of load(f).records) imported[src].set(r.source_key, r);
  }
  const storedCurves = listJson(join(root, 'data/curves')).map(load);
  const cwFile = join(root, 'crosswalk/crosswalk.csv');
  const crosswalk = existsSync(cwFile) ? parseCsv(readFileSync(cwFile, 'utf8')).filter((r) => r.confirmed === 'true') : [];

  const viaOf = (sourceId: string): Candidate['via'] => {
    const s = sources.get(sourceId);
    if (!s) return 'other';
    if (s.type === 'oem') return 'oem';
    if (s.type === 'regulatory') return 'regulatory';
    if (sourceId.startsWith('src-openev')) return 'openev';
    if (sourceId.startsWith('src-chargeprice')) return 'chargeprice';
    return 'other';
  };

  const cars: CarDetail[] = [];
  const unknownByField: Record<string, number> = {};
  let conflicts = 0;
  const curveKinds: Record<string, number> = {};

  for (const f of listJson(join(root, 'data/variants'))) {
    const v = load(f);
    const model = models.get(v.model_id);
    const make = makes.get(model?.make_id);
    const rows = crosswalk.filter((r) => r.our_variant_id === v.id);
    const trimIds: string[] = (v.trims ?? []).map((t: any) => t.id);

    // Candidate values per field.
    const cands: Record<string, Candidate[]> = {};
    const add = (field: string, values: unknown) => {
      if (!Array.isArray(values)) return;
      for (const val of values as SourcedValue[]) (cands[field] ??= []).push({ v: val, via: viaOf(val.source_id) });
    };
    for (const [k, vals] of Object.entries(ownFields(v))) add(k, vals);

    // NRCan: the variant's figures come from its first trim's row (or the only row).
    const nrcanRows = rows.filter((r) => r.source === 'nrcan');
    const nrcanFor = (trimId?: string) => nrcanRows.find((r) => (r.our_trim_id || undefined) === trimId) ?? (trimId ? undefined : nrcanRows[0]);
    const primaryNrcan = imported.nrcan.get((nrcanFor(trimIds[0]) ?? nrcanRows[0])?.source_key ?? '');
    if (primaryNrcan) for (const k of NRCAN_FIELDS) add(k, primaryNrcan[k]);

    let openevHeatPump: SourcedValue[] | undefined;
    let openevWheels: TrimOut['wheels'] = [];
    const importedCurves: CurveOut[] = [];
    for (const r of rows) {
      const rec = imported[r.source]?.get(r.source_key);
      if (!rec) continue;
      if (r.source === 'openev') {
        for (const [ours, theirs] of Object.entries(OPENEV_FIELDS)) add(ours, rec[theirs]);
        if (Array.isArray(rec.heat_pump)) openevHeatPump = rec.heat_pump;
        if (Array.isArray(rec.wheels) && rec.wheels.length) {
          // Imported records don't repeat their file's source id; any of their values carries it.
          const src = [rec.dc_max_kw, rec.capacity_usable_kwh, rec.range_km].find((x) => Array.isArray(x))?.[0]?.source_id as string | undefined;
          openevWheels = rec.wheels.map((w: TrimOut['wheels'][number]) => ({ ...w, ...(src ? { source_id: src } : {}) }));
        }
      } else if (r.source === 'chargeprice') {
        for (const [ours, theirs] of Object.entries(CHARGEPRICE_FIELDS)) add(ours, rec[theirs]);
        if (rec.curve) {
          importedCurves.push({
            id: `chargeprice-${rec.year}`,
            kind: 'tested',
            source_id: rec.curve.source_id,
            points: rec.curve.points,
            is_display_default: false,
            notes: `${rec.curve.notes} Recorded for the ${rec.year} ${rec.make} ${rec.model}${rec.variant ? ` ${rec.variant}` : ''}.`,
          });
        }
      }
    }

    const fields: Record<string, Field> = {};
    for (const k of new Set([...Object.keys(cands), ...MVP_FIELDS, 'capacity_gross_kwh'])) {
      fields[k] = resolve(k, cands[k] ?? []);
      if (fields[k]?.conflict) conflicts++;
    }
    for (const k of MVP_FIELDS) if (!fields[k]) unknownByField[k] = (unknownByField[k] ?? 0) + 1;

    // Trims: own heat pump, else OpenEV's "standard or optional". When NRCan rates a trim on its
    // own row (wheel or charger splits), that row's range and consumption apply to the trim, and
    // the wheel size / onboard charger NRCan writes in its model name become trim facts.
    const asCands = (xs: unknown) => (Array.isArray(xs) ? (xs as SourcedValue[]) : []).map((x) => ({ v: x, via: viaOf(x.source_id) }));
    const differs = (f: Field, variantField: Field) => (f && f.value.value !== variantField?.value.value ? f : null);
    const trims: TrimOut[] = (v.trims ?? []).map((t: any): TrimOut => {
      const hp = asCands([...(t.heat_pump ?? []), ...(openevHeatPump ?? [])]);
      const trimRow = imported.nrcan.get(nrcanFor(t.id)?.source_key ?? '');
      const nrcanSource = trimRow?.range_km?.[0]?.source_id as string | undefined;
      const hints = trimRow ? parseName(trimRow.model) : null;
      const per = (k: string) => resolve(k, asCands([...(t[k] ?? []), ...(trimRow?.[k] ?? [])])) as Field<number>;
      const acFromName: SourcedValue[] = hints?.charger_kw && nrcanSource
        ? [{ value: hints.charger_kw, unit: 'kW', kind: 'rated_nrcan', source_id: nrcanSource, notes: `From NRCan's model name: “${trimRow.model}”.` }]
        : [];
      const ac = resolve('ac_max_kw', asCands([...(t.ac_max_kw ?? []), ...acFromName])) as Field<number>;
      const wheels: TrimOut['wheels'] = t.wheels?.length
        ? oneWheelPerSize(t.wheels)
        : hints?.wheel_in
          ? [{ diameter_in: hints.wheel_in, is_standard: true, ...(nrcanSource ? { source_id: nrcanSource } : {}) }]
          : openevWheels;
      return {
        id: t.id,
        name: t.name,
        ...(t.aliases ? { aliases: t.aliases } : {}),
        heat_pump: resolve('heat_pump', hp) as Field<string>,
        range_km: differs(per('range_km'), fields.range_km) as Field<number>,
        consumption_combined_wh_per_km: differs(per('consumption_combined_wh_per_km'), fields.consumption_combined_wh_per_km) as Field<number>,
        consumption_city_wh_per_km: differs(per('consumption_city_wh_per_km'), fields.consumption_city_wh_per_km) as Field<number>,
        consumption_highway_wh_per_km: differs(per('consumption_highway_wh_per_km'), fields.consumption_highway_wh_per_km) as Field<number>,
        ac_max_kw: ac,
        wheels,
      };
    });

    // Curves: stored + imported measured; estimate when there is a DC peak. Default by precedence.
    const curves: CurveOut[] = [
      ...storedCurves.filter((c) => c.variant_id === v.id).map((c): CurveOut => ({
        id: c.id, kind: c.kind, source_id: c.source_id, points: c.points, is_display_default: Boolean(c.is_display_default),
        ...(c.notes ? { notes: c.notes } : {}), ...(c.conditions ? { conditions: c.conditions } : {}), ...(c.low_confidence ? { low_confidence: true } : {}),
      })),
      ...importedCurves,
    ];
    const dc = fields.dc_max_kw?.value;
    if (dc && typeof dc.value === 'number') {
      curves.push(estimateCurve({
        dcMaxKw: dc.value,
        chemistry: (fields.chemistry?.value.value as string) ?? null,
        voltageClass: (fields.nominal_voltage_class?.value.value as string) ?? null,
        sourceId: dc.source_id,
      }));
    }
    if (curves.length && !curves.some((c) => c.is_display_default)) {
      const order = { tested: 0, community: 1, manufacturer: 2, estimated: 3 };
      const best = [...curves].sort((a, b) => order[a.kind] - order[b.kind] || Number(a.low_confidence ?? false) - Number(b.low_confidence ?? false))[0];
      best.is_display_default = true;
    }
    const defaultCurve = curves.find((c) => c.is_display_default);
    if (defaultCurve) curveKinds[defaultCurve.kind] = (curveKinds[defaultCurve.kind] ?? 0) + 1;

    // Browse figures (database-ui.md §4): uncapped 10–80 % with the default curve.
    const usable = fields.capacity_usable_kwh?.value.value as number | undefined;
    const gross = fields.capacity_gross_kwh?.value.value as number | undefined;
    const kwh = usable ?? gross;
    const whPerKm = fields.consumption_highway_wh_per_km?.value.value as number | undefined;
    let derived: CarDetail['derived'] = { minutes_10_80: null, km_per_10_min: null, estimated: true, battery_basis: null };
    if (defaultCurve && kwh) {
      const r = calculateCharge({ points: defaultCurve.points, usableKwh: kwh, startSoc: 10, endSoc: 80, whPerKm });
      derived = {
        minutes_10_80: Math.round(r.minutes * 10) / 10,
        km_per_10_min: r.kmPer10Min === null ? null : Math.round(r.kmPer10Min),
        estimated: defaultCurve.kind === 'estimated' || usable === undefined,
        battery_basis: usable !== undefined ? 'usable' : 'gross',
      };
    }

    // Every source cited on this car.
    const cited = new Set<string>();
    const collect = (x: unknown) => {
      if (Array.isArray(x)) x.forEach(collect);
      else if (x && typeof x === 'object') {
        const o = x as Record<string, unknown>;
        if (typeof o.source_id === 'string') cited.add(o.source_id);
        Object.values(o).forEach(collect);
      }
    };
    collect(fields); collect(trims); collect(curves);

    const soldInCanada = nrcanRows.length > 0;
    cars.push({
      id: v.id,
      make: { id: make?.id ?? v.model_id.split('/')[0], name: make?.name ?? v.model_id.split('/')[0] },
      model: { id: v.model_id, name: model?.name ?? v.model_id, body_type: model?.body_type ?? 'unknown' },
      year: v.year,
      name: v.name,
      drivetrain: v.drivetrain,
      sold_in_canada: soldInCanada,
      fields,
      trims,
      curves,
      derived,
      sources: [...cited].sort().map((id) => sources.get(id)).filter((s): s is Source => Boolean(s)),
    });
  }

  const num = (f: Field) => (f && typeof f.value.value === 'number' ? f.value.value : null);
  const str = (f: Field) => (f && typeof f.value.value === 'string' ? f.value.value : null);
  const index: IndexEntry[] = cars.map((c) => ({
    id: c.id,
    make: c.make.name,
    model: c.model.name,
    year: c.year,
    name: c.name,
    body_type: c.model.body_type,
    drivetrain: c.drivetrain,
    sold_in_canada: c.sold_in_canada,
    range_km: num(c.fields.range_km),
    dc_max_kw: num(c.fields.dc_max_kw),
    usable_kwh: num(c.fields.capacity_usable_kwh) ?? num(c.fields.capacity_gross_kwh),
    charge_port: str(c.fields.charge_port),
    voltage_class: str(c.fields.nominal_voltage_class),
    heat_pump: [...new Set(c.trims.map((t) => (t.heat_pump ? String(t.heat_pump.value.value) : 'unknown')))],
    chemistry: str(c.fields.chemistry),
    curve_kind: c.curves.find((x) => x.is_display_default)?.kind ?? null,
    derived: c.derived,
  }));

  return {
    cars,
    index,
    estimates: { wheel: deriveWheelEffect(ratingRows(imported)) },
    report: { cars: cars.length, unknownByField, conflicts, curves: curveKinds },
  };
}
