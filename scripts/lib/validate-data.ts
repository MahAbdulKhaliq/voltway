// Validates the data repository: each file against its JSON Schema, then the
// cross-file rules a schema can't express. Used by scripts/validate.ts and by tests.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import Ajv2020, { type ValidateFunction } from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { parseCsv } from './csv.ts';
import { parseName } from './match.ts';
import { COUNTRIES } from './countries.ts';
import { MIN_POPULATION_FOR, PROVINCE_CODES, US_STATES, type GeoCountry } from './geonames.ts';

const CA_PROVINCES = new Set(Object.values(PROVINCE_CODES));

export interface ValidationResult {
  errors: string[];
  counts: Record<string, number>;
}

const SCHEMA_FILES = [
  'common.schema.json',
  'source.schema.json',
  'make.schema.json',
  'model.schema.json',
  'variant.schema.json',
  'powertrain.schema.json',
  'curve.schema.json',
  'crosswalk-row.schema.json',
  'imported-nrcan.schema.json',
  'imported-epa.schema.json',
  'imported-openev.schema.json',
  'imported-chargeprice.schema.json',
  'imported-afdc.schema.json',
  'imported-geonames.schema.json',
] as const;

const SCHEMA_BASE = 'https://github.com/MahAbdulKhaliq/voltway/schema/';

function loadValidators(schemaDir: string) {
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats.default(ajv);
  for (const file of SCHEMA_FILES) {
    ajv.addSchema(JSON.parse(readFileSync(join(schemaDir, file), 'utf8')));
  }
  const get = (name: string): ValidateFunction => {
    const fn = ajv.getSchema(SCHEMA_BASE + name);
    if (!fn) throw new Error(`Schema ${name} failed to load`);
    return fn;
  };
  return {
    source: get('source.schema.json'),
    make: get('make.schema.json'),
    model: get('model.schema.json'),
    variant: get('variant.schema.json'),
    powertrain: get('powertrain.schema.json'),
    curve: get('curve.schema.json'),
    crosswalkRow: get('crosswalk-row.schema.json'),
    importedNrcan: get('imported-nrcan.schema.json'),
    importedEpa: get('imported-epa.schema.json'),
    importedOpenev: get('imported-openev.schema.json'),
    importedChargeprice: get('imported-chargeprice.schema.json'),
    importedAfdc: get('imported-afdc.schema.json'),
    importedGeonames: get('imported-geonames.schema.json'),
  };
}

/** All .json files under dir, as paths relative to dir using forward slashes. */
function listJson(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  const walk = (d: string) => {
    for (const name of readdirSync(d)) {
      const full = join(d, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (name.endsWith('.json')) out.push(relative(dir, full).split(sep).join('/'));
    }
  };
  walk(dir);
  return out.sort();
}

/** Every object inside a record that carries a source_id (sourced values, facts, curves). */
function collectSourced(node: unknown, path: string, out: { path: string; value: Record<string, unknown> }[]) {
  if (Array.isArray(node)) {
    node.forEach((item, i) => collectSourced(item, `${path}[${i}]`, out));
  } else if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>;
    if ('source_id' in obj) out.push({ path, value: obj });
    for (const [k, v] of Object.entries(obj)) collectSourced(v, path ? `${path}.${k}` : k, out);
  }
}

export function isHomepageUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return (u.pathname === '/' || u.pathname === '') && !u.search && !u.hash;
  } catch {
    return false;
  }
}

export function validateRepo(root: string): ValidationResult {
  const errors: string[] = [];
  const v = loadValidators(join(root, 'schema'));
  const dataDir = join(root, 'data');

  const read = (dir: string, rel: string): unknown => {
    const file = `data/${dir}/${rel}`;
    try {
      return JSON.parse(readFileSync(join(dataDir, dir, rel), 'utf8'));
    } catch (e) {
      errors.push(`${file}: not valid JSON (${(e as Error).message})`);
      return undefined;
    }
  };

  const check = (fn: ValidateFunction, data: unknown, file: string): boolean => {
    if (fn(data)) return true;
    for (const err of fn.errors ?? []) {
      errors.push(`${file}: ${err.instancePath || '(root)'} ${err.message}`);
    }
    return false;
  };

  // --- Sources table ---
  const sources = new Map<string, { url: string }>();
  for (const rel of listJson(join(dataDir, 'sources'))) {
    const file = `data/sources/${rel}`;
    const data = read('sources', rel) as { id: string; url: string } | undefined;
    if (data === undefined || !check(v.source, data, file)) continue;
    if (rel !== `${data.id}.json`) errors.push(`${file}: file name must be ${data.id}.json`);
    if (sources.has(data.id)) errors.push(`${file}: duplicate source id ${data.id}`);
    sources.set(data.id, { url: data.url });
  }

  const checkSourced = (record: unknown, file: string) => {
    const found: { path: string; value: Record<string, unknown> }[] = [];
    collectSourced(record, '', found);
    for (const { path, value } of found) {
      const id = value.source_id as string;
      const src = sources.get(id);
      if (!src) {
        errors.push(`${file}: ${path || '(root)'} cites unknown source "${id}"`);
      } else if (isHomepageUrl(src.url) && value.low_confidence !== true) {
        errors.push(`${file}: ${path || '(root)'} cites "${id}", whose URL is only a homepage; set low_confidence: true`);
      }
    }
  };

  // --- Makes ---
  const makes = new Set<string>();
  for (const rel of listJson(join(dataDir, 'makes'))) {
    const file = `data/makes/${rel}`;
    const data = read('makes', rel) as { id: string } | undefined;
    if (data === undefined || !check(v.make, data, file)) continue;
    if (rel !== `${data.id}.json`) errors.push(`${file}: file name must be ${data.id}.json`);
    makes.add(data.id);
  }

  // --- Models ---
  const modelYears = new Map<string, Set<number>>();
  const modelGenerations = new Map<string, { id: string; first_year: number; last_year?: number }[]>();
  for (const rel of listJson(join(dataDir, 'models'))) {
    const file = `data/models/${rel}`;
    const data = read('models', rel) as
      | { id: string; make_id: string; years: { year: number; generation?: string }[]; generations?: { id: string; first_year: number; last_year?: number }[] }
      | undefined;
    if (data === undefined || !check(v.model, data, file)) continue;
    const expectedId = rel.replace(/\.json$/, '');
    if (data.id !== expectedId) errors.push(`${file}: id "${data.id}" must match its path "${expectedId}"`);
    if (data.id.split('/')[0] !== data.make_id) errors.push(`${file}: make_id "${data.make_id}" doesn't match id "${data.id}"`);
    if (!makes.has(data.make_id)) errors.push(`${file}: make "${data.make_id}" has no file in data/makes`);
    const years = new Set<number>();
    for (const y of data.years) {
      if (years.has(y.year)) errors.push(`${file}: year ${y.year} listed twice`);
      years.add(y.year);
    }
    // Generations (B17): ids unique, years in order and not overlapping; each year's generation exists and covers it.
    const gens = [...(data.generations ?? [])].sort((a, b) => a.first_year - b.first_year);
    gens.forEach((g, i) => {
      if (gens.findIndex((x) => x.id === g.id) !== i) errors.push(`${file}: generation "${g.id}" listed twice`);
      if (g.last_year !== undefined && g.last_year < g.first_year) errors.push(`${file}: generation "${g.id}" ends before it starts`);
      const next = gens[i + 1];
      if (next && (g.last_year === undefined || g.last_year >= next.first_year)) errors.push(`${file}: generation "${g.id}" overlaps "${next.id}" (give it a last_year before ${next.first_year})`);
    });
    for (const y of data.years) {
      if (!y.generation) continue;
      const g = gens.find((x) => x.id === y.generation);
      if (!g) errors.push(`${file}: year ${y.year} names generation "${y.generation}", which isn't listed`);
      else if (y.year < g.first_year || (g.last_year !== undefined && y.year > g.last_year)) errors.push(`${file}: year ${y.year} is outside generation "${g.id}" (${g.first_year}–${g.last_year ?? 'current'})`);
    }
    modelYears.set(data.id, years);
    modelGenerations.set(data.id, gens);
  }

  // --- Powertrains (B95) ---
  const powertrains = new Map<string, { model_id: string; years: number[] }>();
  for (const rel of listJson(join(dataDir, 'powertrains'))) {
    const file = `data/powertrains/${rel}`;
    const data = read('powertrains', rel) as { id: string; model_id: string; generation?: string; years: number[] } | undefined;
    if (data === undefined || !check(v.powertrain, data, file)) continue;
    const expectedId = rel.replace(/.json$/, '');
    if (data.id !== expectedId) errors.push(`${file}: id "${data.id}" must match its path "${expectedId}"`);
    const [make, model] = data.id.split('/');
    if (data.model_id !== `${make}/${model}`) errors.push(`${file}: model_id "${data.model_id}" doesn't match id "${data.id}"`);
    if (!modelYears.has(data.model_id)) errors.push(`${file}: model "${data.model_id}" has no file in data/models`);
    const gens = modelGenerations.get(data.model_id) ?? [];
    if (data.generation) {
      const g = gens.find((x) => x.id === data.generation);
      if (!g) errors.push(`${file}: generation "${data.generation}" isn't listed on ${data.model_id}`);
      else for (const y of data.years) if (y < g.first_year || (g.last_year !== undefined && y > g.last_year)) errors.push(`${file}: year ${y} is outside generation "${g.id}"`);
    }
    checkSourced(data, file);
    powertrains.set(data.id, data);
  }

  // --- Variants ---
  const variants = new Set<string>();
  const trimsByVariant = new Map<string, Set<string>>();
  const variantPowertrain = new Map<string, string>();
  const carryOvers: { file: string; target: string }[] = [];
  for (const rel of listJson(join(dataDir, 'variants'))) {
    const file = `data/variants/${rel}`;
    const data = read('variants', rel) as
      | { id: string; model_id: string; year: number; powertrain_id: string; carry_over_from?: string; trims?: { id: string }[] }
      | undefined;
    if (data === undefined || !check(v.variant, data, file)) continue;
    const expectedId = rel.replace(/\.json$/, '');
    if (data.id !== expectedId) errors.push(`${file}: id "${data.id}" must match its path "${expectedId}"`);
    const [make, model, year] = data.id.split('/');
    if (data.model_id !== `${make}/${model}`) errors.push(`${file}: model_id "${data.model_id}" doesn't match id "${data.id}"`);
    if (String(data.year) !== year) errors.push(`${file}: year ${data.year} doesn't match id "${data.id}"`);
    const years = modelYears.get(data.model_id);
    if (!years) errors.push(`${file}: model "${data.model_id}" has no file in data/models`);
    else if (!years.has(data.year)) errors.push(`${file}: model "${data.model_id}" has no entry for year ${data.year}`);
    const pt = powertrains.get(data.powertrain_id);
    if (!pt) errors.push(`${file}: powertrain "${data.powertrain_id}" has no file in data/powertrains`);
    else {
      if (pt.model_id !== data.model_id) errors.push(`${file}: powertrain "${data.powertrain_id}" belongs to another model`);
      if (!pt.years.includes(data.year)) errors.push(`${file}: powertrain "${data.powertrain_id}" doesn't list year ${data.year}`);
    }
    const trimIds = new Set<string>();
    for (const trim of data.trims ?? []) {
      if (trimIds.has(trim.id)) errors.push(`${file}: trim id "${trim.id}" used twice`);
      trimIds.add(trim.id);
    }
    if (data.carry_over_from) carryOvers.push({ file, target: data.carry_over_from });
    checkSourced(data, file);
    variants.add(data.id);
    variantPowertrain.set(data.id, data.powertrain_id);
    trimsByVariant.set(data.id, trimIds);
  }
  for (const { file, target } of carryOvers) {
    if (!variants.has(target)) errors.push(`${file}: carry_over_from "${target}" is not a known variant`);
  }

  // --- Curves ---
  const defaultsPerVariant = new Map<string, string[]>();
  let curveCount = 0;
  for (const rel of listJson(join(dataDir, 'curves'))) {
    const file = `data/curves/${rel}`;
    const data = read('curves', rel) as
      | { id: string; variant_id?: string; powertrain_id?: string; points: { soc_percent: number }[]; is_display_default: boolean; based_on?: { variant_id: string } }
      | undefined;
    if (data === undefined || !check(v.curve, data, file)) continue;
    curveCount++;
    const parts = rel.replace(/\.json$/, '').split('/');
    const curveId = parts.pop();
    const ownerFromPath = parts.join('/');
    // B95: a curve belongs to a powertrain (shared by its variants) or to one variant.
    const owner = (data.powertrain_id ?? data.variant_id)!;
    const ownPt = data.powertrain_id ?? (data.variant_id ? variantPowertrain.get(data.variant_id) : undefined);
    if (data.id !== curveId) errors.push(`${file}: id "${data.id}" must match its file name "${curveId}"`);
    if (owner !== ownerFromPath) errors.push(`${file}: ${data.powertrain_id ? 'powertrain_id' : 'variant_id'} "${owner}" must match its folder "${ownerFromPath}"`);
    if (data.powertrain_id && !powertrains.has(data.powertrain_id)) errors.push(`${file}: powertrain "${data.powertrain_id}" has no file in data/powertrains`);
    if (data.variant_id && !variants.has(data.variant_id)) errors.push(`${file}: variant "${data.variant_id}" has no file in data/variants`);
    if (data.based_on && !variants.has(data.based_on.variant_id)) errors.push(`${file}: based_on variant "${data.based_on.variant_id}" has no file in data/variants`);
    if (data.based_on && (data.based_on.variant_id === data.variant_id || variantPowertrain.get(data.based_on.variant_id) === ownPt)) errors.push(`${file}: a borrowed curve can't be based on its own variant or powertrain`);
    for (let i = 1; i < data.points.length; i++) {
      if (data.points[i].soc_percent <= data.points[i - 1].soc_percent) {
        errors.push(`${file}: points must be sorted by soc_percent with no repeats (point ${i} is ${data.points[i].soc_percent}% after ${data.points[i - 1].soc_percent}%)`);
        break;
      }
    }
    if (data.is_display_default) {
      const list = defaultsPerVariant.get(owner) ?? [];
      list.push(data.id);
      defaultsPerVariant.set(owner, list);
    }
    checkSourced(data, file);
  }
  for (const [variant, ids] of defaultsPerVariant) {
    if (ids.length > 1) errors.push(`data/curves/${variant}: ${ids.length} curves are display defaults (${ids.join(', ')}); at most one allowed`);
  }

  // --- Imported NRCan ratings ---
  const nrcanKeys = new Set<string>();
  let nrcanFiles = 0;
  for (const rel of listJson(join(dataDir, 'imported', 'nrcan'))) {
    const file = `data/imported/nrcan/${rel}`;
    const data = read('imported/nrcan', rel) as
      | { year: number; source_id: string; records: { source_key: string; year: number }[] }
      | undefined;
    if (data === undefined || !check(v.importedNrcan, data, file)) continue;
    nrcanFiles++;
    if (rel !== `${data.year}.json`) errors.push(`${file}: file name must be ${data.year}.json`);
    data.records.forEach((r, i) => {
      if (r.year !== data.year) errors.push(`${file}: records[${i}] has year ${r.year}, expected ${data.year}`);
      if (nrcanKeys.has(r.source_key)) errors.push(`${file}: duplicate source_key "${r.source_key}"`);
      nrcanKeys.add(r.source_key);
    });
    checkSourced(data, file);
  }

  // --- Imported EPA / fueleconomy.gov ratings (B90) ---
  const epaKeys = new Set<string>();
  let epaFiles = 0;
  for (const rel of listJson(join(dataDir, 'imported', 'epa'))) {
    const file = `data/imported/epa/${rel}`;
    const data = read('imported/epa', rel) as { year: number; records: { source_key: string; year: number }[] } | undefined;
    if (data === undefined || !check(v.importedEpa, data, file)) continue;
    epaFiles++;
    if (rel !== `${data.year}.json`) errors.push(`${file}: file name must be ${data.year}.json`);
    data.records.forEach((r, i) => {
      if (r.year !== data.year) errors.push(`${file}: records[${i}] has year ${r.year}, expected ${data.year}`);
      if (epaKeys.has(r.source_key)) errors.push(`${file}: duplicate source_key "${r.source_key}"`);
      epaKeys.add(r.source_key);
    });
    checkSourced(data, file);
  }

  // --- Imported OpenEV Data records ---
  const openevKeys = new Set<string>();
  let openevFiles = 0;
  for (const rel of listJson(join(dataDir, 'imported', 'openev'))) {
    const file = `data/imported/openev/${rel}`;
    const data = read('imported/openev', rel) as { make: string; records: { source_key: string }[] } | undefined;
    if (data === undefined || !check(v.importedOpenev, data, file)) continue;
    openevFiles++;
    if (rel !== `${data.make}.json`) errors.push(`${file}: file name must be ${data.make}.json`);
    for (const r of data.records) {
      if (openevKeys.has(r.source_key)) errors.push(`${file}: duplicate source_key "${r.source_key}"`);
      openevKeys.add(r.source_key);
    }
    checkSourced(data, file);
  }

  // --- Imported Chargeprice archive records ---
  const chargepriceKeys = new Set<string>();
  let chargepriceFiles = 0;
  for (const rel of listJson(join(dataDir, 'imported', 'chargeprice'))) {
    const file = `data/imported/chargeprice/${rel}`;
    const data = read('imported/chargeprice', rel) as
      | { make: string; records: { source_key: string; curve?: { points: { soc_percent: number }[] } }[] }
      | undefined;
    if (data === undefined || !check(v.importedChargeprice, data, file)) continue;
    chargepriceFiles++;
    if (rel !== `${data.make}.json`) errors.push(`${file}: file name must be ${data.make}.json`);
    data.records.forEach((r, i) => {
      if (chargepriceKeys.has(r.source_key)) errors.push(`${file}: duplicate source_key "${r.source_key}"`);
      chargepriceKeys.add(r.source_key);
      const pts = r.curve?.points ?? [];
      for (let j = 1; j < pts.length; j++) {
        if (pts[j].soc_percent <= pts[j - 1].soc_percent) {
          errors.push(`${file}: records[${i}].curve points must be sorted by soc_percent with no repeats`);
          break;
        }
      }
    });
    checkSourced(data, file);
  }

  // --- Crosswalk ---
  let crosswalkCount = 0;
  const crosswalkFile = join(root, 'crosswalk', 'crosswalk.csv');
  if (existsSync(crosswalkFile)) {
    const seen = new Set<string>();
    const rows = parseCsv(readFileSync(crosswalkFile, 'utf8'));
    rows.forEach((raw, i) => {
      const where = `crosswalk/crosswalk.csv row ${i + 2}`;
      const row: Record<string, unknown> = { ...raw };
      if (raw.confirmed === 'true') row.confirmed = true;
      else if (raw.confirmed === 'false') row.confirmed = false;
      if (raw.notes === '') delete row.notes;
      if (raw.our_trim_id === '' || raw.our_trim_id === undefined) delete row.our_trim_id;
      if (!check(v.crosswalkRow, row, where)) return;
      crosswalkCount++;
      const variantId = row.our_variant_id as string;
      if (!variants.has(variantId)) errors.push(`${where}: variant "${variantId}" has no file in data/variants`);
      else if (row.our_trim_id && !trimsByVariant.get(variantId)?.has(row.our_trim_id as string)) {
        errors.push(`${where}: trim "${row.our_trim_id}" is not a trim of ${variantId}`);
      }
      if (row.source === 'nrcan' && nrcanFiles > 0 && !nrcanKeys.has(row.source_key as string)) {
        errors.push(`${where}: NRCan key "${row.source_key}" is not in data/imported/nrcan`);
      }
      if (row.source === 'epa' && epaFiles > 0 && !epaKeys.has(row.source_key as string)) {
        errors.push(`${where}: EPA key "${row.source_key}" is not in data/imported/epa`);
      }
      if (row.source === 'openev' && openevFiles > 0 && !openevKeys.has(row.source_key as string)) {
        errors.push(`${where}: OpenEV key "${row.source_key}" is not in data/imported/openev`);
      }
      if (row.source === 'chargeprice' && chargepriceFiles > 0 && !chargepriceKeys.has(row.source_key as string)) {
        errors.push(`${where}: Chargeprice key "${row.source_key}" is not in data/imported/chargeprice`);
      }
      // A trim may carry several regulator rows that differ only by wheel size (B91: wheel options, not trims).
      const wheel = parseName(String(row.source_key)).wheel_in;
      const key = `${variantId}|${row.source}|${row.our_trim_id ?? ''}|${row.our_trim_id && wheel ? wheel : ''}`;
      if (seen.has(key)) errors.push(`${where}: ${variantId}${row.our_trim_id ? ` trim ${row.our_trim_id}` : ""} already has a ${row.source} row`);
      seen.add(key);
    });
  }

  // --- Imported AFDC charging stations (charger map), one file per country (DESIGN-7 D1) ---
  let afdcStations = 0;
  for (const country of COUNTRIES) {
    if (!existsSync(join(dataDir, 'imported', 'afdc', `${country}.json`))) continue;
    const file = `data/imported/afdc/${country}.json`;
    const data = read('imported/afdc', `${country}.json`) as { source: string; source_id: string; stations: { id: number }[] } | undefined;
    if (data !== undefined && check(v.importedAfdc, data, file)) {
      if (data.source !== `afdc-${country}`) errors.push(`${file}: source is "${data.source}", expected "afdc-${country}"`);
      if (!sources.has(data.source_id)) errors.push(`${file}: cites unknown source "${data.source_id}"`);
      for (let i = 1; i < data.stations.length; i++) {
        if (data.stations[i].id <= data.stations[i - 1].id) {
          errors.push(`${file}: stations must be sorted by id with no repeats (at index ${i}, id ${data.stations[i].id})`);
          break;
        }
      }
      afdcStations += data.stations.length;
    }
  }

  // --- Imported GeoNames places (trip planner From/To suggestions, B45; US added by B78) ---
  let geonamesPlaces = 0;
  for (const cc of COUNTRIES) {
    const name = `places-${cc}.json`;
    if (!existsSync(join(dataDir, 'imported', 'geonames', name))) continue;
    const file = `data/imported/geonames/${name}`;
    const data = read('imported/geonames', name) as
      | { source: string; source_id: string; min_population: number; places: { id: number; province: string; population: number }[] }
      | undefined;
    if (data !== undefined && check(v.importedGeonames, data, file)) {
      if (!sources.has(data.source_id)) errors.push(`${file}: cites unknown source "${data.source_id}"`);
      if (data.source !== `geonames-${cc}`) errors.push(`${file}: source is "${data.source}", expected "geonames-${cc}"`);
      const geo = cc.toUpperCase() as GeoCountry;
      if (data.min_population !== MIN_POPULATION_FOR[geo]) errors.push(`${file}: min_population ${data.min_population}, expected ${MIN_POPULATION_FOR[geo]}`);
      const ids = new Set<number>();
      for (const p of data.places) {
        if (ids.has(p.id)) errors.push(`${file}: GeoNames id ${p.id} appears twice`);
        ids.add(p.id);
        if (!(geo === 'US' ? US_STATES.has(p.province) : CA_PROVINCES.has(p.province)))
          errors.push(`${file}: GeoNames id ${p.id} has unknown ${geo === 'US' ? 'state' : 'province'} "${p.province}"`);
        if (p.population < MIN_POPULATION_FOR[geo]) errors.push(`${file}: GeoNames id ${p.id} is below the population floor`);
      }
      geonamesPlaces += data.places.length;
    }
  }

  return {
    errors,
    counts: {
      sources: sources.size,
      makes: makes.size,
      models: modelYears.size,
      variants: variants.size,
      curves: curveCount,
      crosswalk_rows: crosswalkCount,
      nrcan_records: nrcanKeys.size,
      epa_records: epaKeys.size,
      openev_records: openevKeys.size,
      chargeprice_records: chargepriceKeys.size,
      afdc_stations: afdcStations,
      geonames_places: geonamesPlaces,
    },
  };
}
