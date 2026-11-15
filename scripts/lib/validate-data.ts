// Validates the data repository: each file against its JSON Schema, then the
// cross-file rules a schema can't express. Used by scripts/validate.ts and by tests.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import Ajv2020, { type ValidateFunction } from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { parseCsv } from './csv.ts';

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
  'curve.schema.json',
  'crosswalk-row.schema.json',
  'imported-nrcan.schema.json',
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
    curve: get('curve.schema.json'),
    crosswalkRow: get('crosswalk-row.schema.json'),
    importedNrcan: get('imported-nrcan.schema.json'),
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
  for (const rel of listJson(join(dataDir, 'models'))) {
    const file = `data/models/${rel}`;
    const data = read('models', rel) as { id: string; make_id: string; years: { year: number }[] } | undefined;
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
    modelYears.set(data.id, years);
  }

  // --- Variants ---
  const variants = new Set<string>();
  const carryOvers: { file: string; target: string }[] = [];
  for (const rel of listJson(join(dataDir, 'variants'))) {
    const file = `data/variants/${rel}`;
    const data = read('variants', rel) as
      | { id: string; model_id: string; year: number; carry_over_from?: string; trims?: { id: string }[] }
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
    const trimIds = new Set<string>();
    for (const trim of data.trims ?? []) {
      if (trimIds.has(trim.id)) errors.push(`${file}: trim id "${trim.id}" used twice`);
      trimIds.add(trim.id);
    }
    if (data.carry_over_from) carryOvers.push({ file, target: data.carry_over_from });
    checkSourced(data, file);
    variants.add(data.id);
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
      | { id: string; variant_id: string; points: { soc_percent: number }[]; is_display_default: boolean }
      | undefined;
    if (data === undefined || !check(v.curve, data, file)) continue;
    curveCount++;
    const parts = rel.replace(/\.json$/, '').split('/');
    const curveId = parts.pop();
    const variantFromPath = parts.join('/');
    if (data.id !== curveId) errors.push(`${file}: id "${data.id}" must match its file name "${curveId}"`);
    if (data.variant_id !== variantFromPath) errors.push(`${file}: variant_id "${data.variant_id}" must match its folder "${variantFromPath}"`);
    if (!variants.has(data.variant_id)) errors.push(`${file}: variant "${data.variant_id}" has no file in data/variants`);
    for (let i = 1; i < data.points.length; i++) {
      if (data.points[i].soc_percent <= data.points[i - 1].soc_percent) {
        errors.push(`${file}: points must be sorted by soc_percent with no repeats (point ${i} is ${data.points[i].soc_percent}% after ${data.points[i - 1].soc_percent}%)`);
        break;
      }
    }
    if (data.is_display_default) {
      const list = defaultsPerVariant.get(data.variant_id) ?? [];
      list.push(data.id);
      defaultsPerVariant.set(data.variant_id, list);
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
      if (!check(v.crosswalkRow, row, where)) return;
      crosswalkCount++;
      const variantId = row.our_variant_id as string;
      if (!variants.has(variantId)) errors.push(`${where}: variant "${variantId}" has no file in data/variants`);
      if (row.source === 'nrcan' && nrcanFiles > 0 && !nrcanKeys.has(row.source_key as string)) {
        errors.push(`${where}: NRCan key "${row.source_key}" is not in data/imported/nrcan`);
      }
      const key = `${variantId}|${row.source}`;
      if (seen.has(key)) errors.push(`${where}: ${variantId} already has a ${row.source} row`);
      seen.add(key);
    });
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
    },
  };
}
