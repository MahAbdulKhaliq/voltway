// `npx tsx scripts/dedupe-notes.ts [--dry]` (B111, owner 2026-11-20): store each note that two or more
// values repeat word for word once, in data/notes.json, and point the values at it with `note_id`.
// Safe to run again after a research round: new repeats are moved, notes no longer used are dropped,
// and a shared note now used only once goes back inline. Only sourced values are touched (objects with a
// `source_id`: figures, wheel entries, curves).
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { formatJson } from './lib/format-json.ts';
import { loadNotes, noteId, NOTES_FILE } from './lib/notes.ts';

const dry = process.argv.includes('--dry');
const DIRS = ['data/variants', 'data/powertrains', 'data/curves'];
const walk = (d: string): string[] => (existsSync(d) ? readdirSync(d).flatMap((e) => { const p = join(d, e); return statSync(p).isDirectory() ? walk(p) : [p]; }) : []);
const files = DIRS.flatMap(walk).filter((f) => f.endsWith('.json'));
const old = loadNotes('.');

type Obj = Record<string, unknown>;
const visit = (x: unknown, fn: (o: Obj) => void) => {
  if (Array.isArray(x)) x.forEach((y) => visit(y, fn));
  else if (x && typeof x === 'object') { const o = x as Obj; if (typeof o.source_id === 'string') fn(o); Object.values(o).forEach((v) => visit(v, fn)); }
};
const textOf = (o: Obj) => (typeof o.notes === 'string' ? o.notes : typeof o.note_id === 'string' ? old[o.note_id] : undefined);

// 1. Count every note's uses.
const docs = files.map((f) => ({ f, j: JSON.parse(readFileSync(f, 'utf8')) as unknown }));
const uses = new Map<string, number>();
for (const { j } of docs) visit(j, (o) => { const t = textOf(o); if (t) uses.set(t, (uses.get(t) ?? 0) + 1); });

// 2. Rewrite: repeated text -> note_id, single-use text -> inline notes (same key position).
const shared: Record<string, string> = {};
const swap = (o: Obj, key: string, value: string) => {
  const entries = Object.entries(o).map(([k, v]) => ((k === 'notes' || k === 'note_id') ? [key, value] : [k, v]) as [string, unknown]);
  for (const k of Object.keys(o)) delete o[k];
  Object.assign(o, Object.fromEntries(entries));
};
let changed = 0;
for (const d of docs) {
  const before = JSON.stringify(d.j);
  visit(d.j, (o) => {
    const t = textOf(o);
    if (!t) return;
    if ((uses.get(t) ?? 0) > 1) { const id = noteId(t); shared[id] = t; swap(o, 'note_id', id); }
    else swap(o, 'notes', t);
  });
  if (JSON.stringify(d.j) !== before) { changed++; if (!dry) writeFileSync(d.f, formatJson(d.j)); }
}
const sorted = Object.fromEntries(Object.keys(shared).sort().map((k) => [k, shared[k]]));
if (!dry) writeFileSync(NOTES_FILE, formatJson(sorted));
const saved = [...uses].filter(([, n]) => n > 1).reduce((a, [t, n]) => a + t.length * (n - 1), 0);
console.log(`notes: ${Object.keys(sorted).length} shared (used 2+ times), ${changed} files changed, ~${(saved / 1e6).toFixed(2)} MB of repeated text removed`);
