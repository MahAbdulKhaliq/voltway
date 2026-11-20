// Build-time access to the data build's output (public/data/), for Astro pages.
// `npm run build` and `npm run dev` run the data build first, so these files exist.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CarDetail, IndexEntry, Source } from './types.ts';
import type { WheelEffect } from './wheel-effect.ts';

const dir = join(process.cwd(), 'public', 'data');

export function loadIndex(): IndexEntry[] {
  return JSON.parse(readFileSync(join(dir, 'index.json'), 'utf8'));
}

export function loadEstimates(): { wheel: WheelEffect | null; temperature?: { sources: Source[] } } {
  return JSON.parse(readFileSync(join(dir, 'estimates.json'), 'utf8'));
}

export function loadCar(id: string): CarDetail {
  return JSON.parse(readFileSync(join(dir, 'cars', `${id}.json`), 'utf8'));
}
