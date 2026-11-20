// `npm run data:format` (B111, owner 2026-11-20): rewrite the car data in the repo's JSON layout
// (scripts/lib/format-json.ts): one figure per line in variants, powertrains, curves, models, makes,
// sources and notes, and one rating per line in the imported regulator and community files. Only the
// layout changes; every file parses back to the same value (checked here before writing). Map data
// (afdc, ocm, geonames, naturalearth) is left alone: its monthly refresh writes its own files.
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { formatJson } from './lib/format-json.ts';

const CAR = ['data/variants', 'data/powertrains', 'data/curves', 'data/models', 'data/makes', 'data/sources'];
const IMPORTED = ['epa', 'nrcan', 'openev', 'chargeprice'].map((d) => `data/imported/${d}`);
const walk = (d: string): string[] =>
  existsSync(d) ? readdirSync(d).flatMap((e) => { const p = join(d, e); return statSync(p).isDirectory() ? walk(p) : p.endsWith('.json') ? [p] : []; }) : [];

let changed = 0;
let total = 0;
const fix = (f: string, oneLine?: string) => {
  total++;
  const text = readFileSync(f, 'utf8');
  const value = JSON.parse(text);
  const out = formatJson(value, { oneLine });
  if (JSON.stringify(JSON.parse(out)) !== JSON.stringify(value)) throw new Error(`${f}: layout changed the value`);
  if (out !== text) { writeFileSync(f, out); changed++; }
};
for (const f of CAR.flatMap(walk)) fix(f);
if (existsSync('data/notes.json')) fix('data/notes.json');
for (const f of IMPORTED.flatMap(walk)) fix(f, 'records');
console.log(`data:format: ${changed} of ${total} files rewritten`);
