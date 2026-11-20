// The repo's JSON layout for data files (B111, owner 2026-11-20): indented like JSON.stringify(x, null, 2),
// except that an object or array holding only plain values (a sourced value, a wheel entry, a curve
// point, a list of years) sits on one line. One figure is one line, so the files are about a fifth as
// tall and a changed value still shows as a one-line diff.

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

const flat = (x: Json): boolean =>
  x === null || typeof x !== 'object' || (Array.isArray(x) ? x.every((y) => y === null || typeof y !== 'object') : Object.values(x).every((y) => y === null || typeof y !== 'object'));

function inline(x: Json): string {
  if (x === null || typeof x !== 'object') return JSON.stringify(x);
  if (Array.isArray(x)) return `[${x.map(inline).join(', ')}]`;
  const entries = Object.entries(x).filter(([, v]) => v !== undefined);
  return entries.length ? `{ ${entries.map(([k, v]) => `${JSON.stringify(k)}: ${inline(v)}`).join(', ')} }` : '{}';
}

function block(x: Json, pad: string, oneLine?: string): string {
  // The file's top level always gets one entry per line (data/notes.json, a source record).
  if (flat(x) && (pad !== '' || x === null || typeof x !== 'object')) return inline(x);
  const inner = pad + '  ';
  if (Array.isArray(x)) return x.length ? `[\n${x.map((y) => inner + block(y, inner)).join(',\n')}\n${pad}]` : '[]';
  const entries = Object.entries(x as { [k: string]: Json }).filter(([, v]) => v !== undefined);
  const value = (k: string, v: Json) =>
    pad === '' && k === oneLine && Array.isArray(v) && v.length ? `[\n${v.map((y) => inner + '  ' + inline(y)).join(',\n')}\n${inner}]` : block(v, inner);
  return entries.length ? `{\n${entries.map(([k, v]) => `${inner}${JSON.stringify(k)}: ${value(k, v)}`).join(',\n')}\n${pad}}` : '{}';
}

/** A data file's text: the layout above plus a final newline. Parses back to the same value.
 *  `oneLine` names a top-level array whose items each sit on one line (imported rating files:
 *  `records`, one rating per line). */
export function formatJson(value: unknown, opts: { oneLine?: string } = {}): string {
  return block(JSON.parse(JSON.stringify(value)) as Json, '', opts.oneLine) + '\n';
}
