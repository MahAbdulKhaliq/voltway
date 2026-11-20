import { describe, expect, it } from 'vitest';
import { formatJson } from '../scripts/lib/format-json.ts';
import { noteId, resolveNotes } from '../scripts/lib/notes.ts';

describe('formatJson (B111)', () => {
  const car = {
    id: 'x/y/2026/z',
    years: [2025, 2026],
    battery: { capacity_usable_kwh: [{ value: 77.4, unit: 'kWh', kind: 'manufacturer', source_id: 'src-a', notes: 'Said "so".' }] },
    trims: [{ id: 'standard', names: { CA: 'Base', US: 'Base' }, wheels: [{ diameter_in: 19, is_standard: true }] }],
    empty: [],
  };
  it('puts one figure on one line and parses back to the same value', () => {
    const s = formatJson(car);
    expect(JSON.parse(s)).toEqual(car);
    expect(s).toContain('\n      { "value": 77.4, "unit": "kWh", "kind": "manufacturer", "source_id": "src-a", "notes": "Said \\"so\\"." }\n');
    expect(s).toContain('"years": [2025, 2026]');
    expect(s).toContain('"names": { "CA": "Base", "US": "Base" }');
    expect(s.endsWith('}\n')).toBe(true);
  });
  it('keeps a flat file one entry per line', () => {
    expect(formatJson({ a: 'x', b: 'y' })).toBe('{\n  "a": "x",\n  "b": "y"\n}\n');
  });
});

describe('shared notes (B111)', () => {
  it('swaps note_id back to notes in the same place, and reports unknown ids', () => {
    const id = noteId('Same pack as 2025.');
    const v = { value: 1, kind: 'estimated', note_id: id, low_confidence: true };
    resolveNotes(v, { [id]: 'Same pack as 2025.' });
    expect(Object.keys(v)).toEqual(['value', 'kind', 'notes', 'low_confidence']);
    expect((v as any).notes).toBe('Same pack as 2025.');
    const missing: string[] = [];
    resolveNotes({ a: [{ note_id: 'n-nope' }] }, {}, (x) => missing.push(x));
    expect(missing).toEqual(['n-nope']);
  });
});

describe('formatJson oneLine (B111)', () => {
  it('puts each imported record on one line', () => {
    const file = { source: 'epa', records: [{ k: 'a', range_km: [{ value: 1, source_id: 's' }] }, { k: 'b' }] };
    const s = formatJson(file, { oneLine: 'records' });
    expect(s).toBe('{\n  "source": "epa",\n  "records": [\n    { "k": "a", "range_km": [{ "value": 1, "source_id": "s" }] },\n    { "k": "b" }\n  ]\n}\n');
    expect(JSON.parse(s)).toEqual(file);
  });
});
