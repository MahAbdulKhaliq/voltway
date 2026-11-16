// In-browser car search (phase1-stack.md: MiniSearch), shared by the Cars tab and the car picker.
// Matches make, model, variant, trim names and aliases, and the year; prefix and light typo tolerance.

import MiniSearch from 'minisearch';
import type { IndexEntry } from './types.ts';
import { searchText } from './browse.ts';

export interface CarSearch { (query: string): string[] }

export function makeCarSearch(index: IndexEntry[]): CarSearch {
  const ms = new MiniSearch({
    fields: ['make', 'model', 'name', 'trims', 'year'],
    storeFields: [],
    searchOptions: { prefix: true, fuzzy: 0.2, combineWith: 'AND', boost: { model: 2, make: 1.5 } },
    // "ioniq 5" → "ioniq", "5"; "model-y" → "model", "y"
    tokenize: (text) => text.toLowerCase().split(/[\s\-_/()″"]+/).filter(Boolean),
  });
  ms.addAll(index.map(searchText));
  return (query: string) => {
    const q = query.trim();
    if (!q) return [];
    return ms.search(q).map((r) => String(r.id));
  };
}
