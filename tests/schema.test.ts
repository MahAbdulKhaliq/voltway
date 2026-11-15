import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { isHomepageUrl, validateRepo } from '../scripts/lib/validate-data.ts';
import { parseCsv } from '../scripts/lib/csv.ts';

const REPO = join(import.meta.dirname, '..');
const FIXTURE = join(import.meta.dirname, 'fixtures', 'valid-repo');
const VARIANT = 'data/variants/testmake/sparkle/2025/long-range-awd.json';
const CURVE = 'data/curves/testmake/sparkle/2025/long-range-awd/test-2025.json';

let tempDirs: string[] = [];
afterEach(() => {
  for (const d of tempDirs) rmSync(d, { recursive: true, force: true });
  tempDirs = [];
});

/** A fresh copy of the valid fixture plus the real schemas, in a temp folder. */
function makeRepo(): string {
  const dir = mkdtempSync(join(tmpdir(), 'voltway-schema-'));
  tempDirs.push(dir);
  cpSync(FIXTURE, dir, { recursive: true });
  cpSync(join(REPO, 'schema'), join(dir, 'schema'), { recursive: true });
  return dir;
}

function edit(dir: string, file: string, change: (json: any) => void) {
  const path = join(dir, file);
  const json = JSON.parse(readFileSync(path, 'utf8'));
  change(json);
  writeFileSync(path, JSON.stringify(json, null, 2));
}

function errorsAfter(file: string, change: (json: any) => void): string[] {
  const dir = makeRepo();
  edit(dir, file, change);
  return validateRepo(dir).errors;
}

describe('valid data', () => {
  it('the fixture passes with no errors', () => {
    const { errors, counts } = validateRepo(makeRepo());
    expect(errors).toEqual([]);
    expect(counts).toMatchObject({ sources: 3, makes: 1, models: 1, variants: 1, curves: 1, crosswalk_rows: 1, nrcan_records: 1, openev_records: 1, chargeprice_records: 1 });
  });

  it('the real repository data passes', () => {
    expect(validateRepo(REPO).errors).toEqual([]);
  });

  it('"unknown" is accepted as a whole field', () => {
    expect(errorsAfter(VARIANT, (v) => { v.range_km = 'unknown'; })).toEqual([]);
  });
});

describe('sourced values (vehicle-data-model.md §3)', () => {
  it('rejects a bare number', () => {
    const errors = errorsAfter(VARIANT, (v) => { v.range_km = 450; });
    expect(errors.some((e) => e.includes('/range_km'))).toBe(true);
  });

  it('rejects a bare number inside the list', () => {
    const errors = errorsAfter(VARIANT, (v) => { v.dc_max_kw = [200]; });
    expect(errors.some((e) => e.includes('/dc_max_kw'))).toBe(true);
  });

  it('rejects a value with no source_id', () => {
    const errors = errorsAfter(VARIANT, (v) => { delete v.dc_max_kw[0].source_id; });
    expect(errors.some((e) => e.includes('/dc_max_kw/0') && e.includes('source_id'))).toBe(true);
  });

  it('rejects a value with no kind', () => {
    const errors = errorsAfter(VARIANT, (v) => { delete v.dc_max_kw[0].kind; });
    expect(errors.some((e) => e.includes('/dc_max_kw/0') && e.includes('kind'))).toBe(true);
  });

  it('rejects a kind outside the seven allowed', () => {
    const errors = errorsAfter(VARIANT, (v) => { v.dc_max_kw[0].kind = 'guess'; });
    expect(errors.some((e) => e.includes('/dc_max_kw/0/kind'))).toBe(true);
  });

  it('rejects a source_id that is not in the sources table', () => {
    const errors = errorsAfter(VARIANT, (v) => { v.dc_max_kw[0].source_id = 'src-made-up'; });
    expect(errors).toContainEqual(expect.stringContaining('cites unknown source "src-made-up"'));
  });

  it('rejects a wrong unit (miles in a km field)', () => {
    const errors = errorsAfter(VARIANT, (v) => { v.range_km[0].unit = 'mi'; });
    expect(errors.some((e) => e.includes('/range_km/0/unit'))).toBe(true);
  });

  it('rejects a value missing its unit', () => {
    const errors = errorsAfter(VARIANT, (v) => { delete v.range_km[0].unit; });
    expect(errors.some((e) => e.includes('/range_km/0') && e.includes('unit'))).toBe(true);
  });

  it('rejects a categorical fact outside its enum', () => {
    const errors = errorsAfter(VARIANT, (v) => { v.trims[0].heat_pump[0].value = 'maybe'; });
    expect(errors.some((e) => e.includes('/trims/0/heat_pump'))).toBe(true);
  });

  it('requires low_confidence when the source URL is only a homepage', () => {
    const errors = errorsAfter(VARIANT, (v) => { delete v.charge_port[0].low_confidence; });
    expect(errors).toContainEqual(expect.stringContaining('only a homepage'));
  });

  it('detects homepage-only URLs', () => {
    expect(isHomepageUrl('https://example.com/')).toBe(true);
    expect(isHomepageUrl('https://example.com')).toBe(true);
    expect(isHomepageUrl('https://example.com/ca/specs')).toBe(false);
    expect(isHomepageUrl('https://example.com/?model=x')).toBe(false);
  });
});

describe('records and ids', () => {
  it('rejects a variant whose id does not match its path', () => {
    const errors = errorsAfter(VARIANT, (v) => { v.id = 'testmake/sparkle/2025/other'; });
    expect(errors).toContainEqual(expect.stringContaining('must match its path'));
  });

  it('rejects a variant for a year the model does not list', () => {
    const errors = errorsAfter('data/models/testmake/sparkle.json', (m) => { m.years[0].year = 2024; });
    expect(errors).toContainEqual(expect.stringContaining('no entry for year 2025'));
  });

  it('rejects duplicate trim ids', () => {
    const errors = errorsAfter(VARIANT, (v) => { v.trims.push({ id: 'base', name: 'Base again' }); });
    expect(errors).toContainEqual(expect.stringContaining('trim id "base" used twice'));
  });

  it('rejects unknown fields (catches typos)', () => {
    const errors = errorsAfter(VARIANT, (v) => { v.dc_max_kwh = v.dc_max_kw; });
    expect(errors.some((e) => e.includes('additional properties'))).toBe(true);
  });
});

describe('charging curves (vehicle-data-model.md §5)', () => {
  it('rejects a one-point curve', () => {
    const errors = errorsAfter(CURVE, (c) => { c.points = [c.points[0]]; });
    expect(errors.some((e) => e.includes('/points'))).toBe(true);
  });

  it('rejects points not sorted by SoC', () => {
    const errors = errorsAfter(CURVE, (c) => { c.points.reverse(); });
    expect(errors).toContainEqual(expect.stringContaining('must be sorted by soc_percent'));
  });

  it('rejects repeated SoC values', () => {
    const errors = errorsAfter(CURVE, (c) => { c.points[1].soc_percent = 0; });
    expect(errors).toContainEqual(expect.stringContaining('must be sorted by soc_percent'));
  });

  it('rejects SoC above 100%', () => {
    const errors = errorsAfter(CURVE, (c) => { c.points[4].soc_percent = 105; });
    expect(errors.some((e) => e.includes('/points/4/soc_percent'))).toBe(true);
  });

  it('rejects a stored curve of kind "estimated" (estimates are generated at build)', () => {
    const errors = errorsAfter(CURVE, (c) => { c.kind = 'estimated'; });
    expect(errors.some((e) => e.includes('/kind'))).toBe(true);
  });

  it('rejects two display-default curves on one variant', () => {
    const dir = makeRepo();
    const second = CURVE.replace('test-2025', 'test-2026');
    const json = JSON.parse(readFileSync(join(dir, CURVE), 'utf8'));
    json.id = 'test-2026';
    writeFileSync(join(dir, second), JSON.stringify(json));
    expect(validateRepo(dir).errors).toContainEqual(expect.stringContaining('at most one allowed'));
  });

  it('rejects a curve for a variant that does not exist', () => {
    const errors = errorsAfter(CURVE, (c) => { c.variant_id = 'testmake/sparkle/2025/nope'; });
    expect(errors).toContainEqual(expect.stringContaining('must match its folder'));
  });
});

describe('crosswalk (vehicle-data-model.md §6)', () => {
  it('parses quoted CSV fields containing commas', () => {
    const rows = parseCsv(readFileSync(join(FIXTURE, 'crosswalk', 'crosswalk.csv'), 'utf8'));
    expect(rows[0].source_key).toBe('2025 · Testmake · Sparkle AWD, LR');
  });

  it('rejects a row for an unknown variant', () => {
    const dir = makeRepo();
    writeFileSync(
      join(dir, 'crosswalk', 'crosswalk.csv'),
      'our_variant_id,source,source_key,match_method,confirmed,notes\ntestmake/sparkle/2025/nope,nrcan,X,manual,true,\n',
    );
    expect(validateRepo(dir).errors).toContainEqual(expect.stringContaining('has no file in data/variants'));
  });

  it('rejects confirmed values other than true/false', () => {
    const dir = makeRepo();
    writeFileSync(
      join(dir, 'crosswalk', 'crosswalk.csv'),
      'our_variant_id,source,source_key,match_method,confirmed,notes\ntestmake/sparkle/2025/long-range-awd,nrcan,X,manual,yes,\n',
    );
    expect(validateRepo(dir).errors.some((e) => e.includes('/confirmed'))).toBe(true);
  });
});

describe('crosswalk trim links (B7/B8)', () => {
  const header = 'our_variant_id,source,source_key,match_method,confirmed,our_trim_id,notes';
  const write = (dir: string, row: string) => writeFileSync(join(dir, 'crosswalk', 'crosswalk.csv'), `${header}\n${row}\n`);

  it('accepts a row linked to an existing trim', () => {
    const dir = makeRepo();
    write(dir, 'testmake/sparkle/2025/long-range-awd,nrcan,"2025 · Testmake · Sparkle AWD, LR",automatic,true,base,');
    expect(validateRepo(dir).errors).toEqual([]);
  });

  it('rejects a row linked to a trim the variant does not have', () => {
    const dir = makeRepo();
    write(dir, 'testmake/sparkle/2025/long-range-awd,nrcan,"2025 · Testmake · Sparkle AWD, LR",automatic,true,nope,');
    expect(validateRepo(dir).errors).toContainEqual(expect.stringContaining('trim "nope" is not a trim of'));
  });

  it('accepts drivetrain "unknown" but not a guess', () => {
    expect(errorsAfter(VARIANT, (v) => { v.drivetrain = 'unknown'; })).toEqual([]);
    expect(errorsAfter(VARIANT, (v) => { v.drivetrain = '2wd'; }).some((e) => e.includes('/drivetrain'))).toBe(true);
  });

  it('accepts a trim-level ac_max_kw override', () => {
    expect(errorsAfter(VARIANT, (v) => {
      v.trims[0].ac_max_kw = [{ value: 19.2, unit: 'kW', kind: 'manufacturer', source_id: 'src-test-oem-spec' }];
    })).toEqual([]);
  });
});
