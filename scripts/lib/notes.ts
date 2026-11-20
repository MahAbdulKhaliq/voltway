// Shared notes (B111, owner 2026-11-20). A note that several values repeat word for word is stored once in
// data/notes.json ({ "n-<hash>": "text" }) and each value points to it with `note_id` instead of carrying
// `notes`. Every reader that needs the text (the build, the validator) calls resolveNotes right after
// loading a file, so downstream code and the built site see `notes` exactly as before.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const NOTES_FILE = 'data/notes.json';

export function loadNotes(root: string): Record<string, string> {
  const f = join(root, NOTES_FILE);
  return existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : {};
}

/** The id for a note's text: stable, so the same text always gets the same id. */
export const noteId = (text: string) => 'n-' + createHash('sha1').update(text).digest('hex').slice(0, 10);

/** Replace every `note_id` with its `notes` text, in place and in the same key position. Unknown ids
 *  are passed to onMissing (the validator reports them) and left as they are. */
export function resolveNotes<T>(x: T, notes: Record<string, string>, onMissing?: (id: string) => void): T {
  if (Array.isArray(x)) { x.forEach((y) => resolveNotes(y, notes, onMissing)); return x; }
  if (!x || typeof x !== 'object') return x;
  const o = x as Record<string, unknown>;
  if (typeof o.note_id === 'string') {
    const text = notes[o.note_id];
    if (text === undefined) onMissing?.(o.note_id);
    else {
      const entries = Object.entries(o).map(([k, v]) => (k === 'note_id' ? ['notes', text] : [k, v]) as [string, unknown]);
      for (const k of Object.keys(o)) delete o[k];
      Object.assign(o, Object.fromEntries(entries));
    }
  }
  for (const v of Object.values(o)) if (v && typeof v === 'object') resolveNotes(v, notes, onMissing);
  return x;
}
