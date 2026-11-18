// `npm run fetch:afdc [-- --country=us]`: downloads every electric station in one country (Canada
// when none is given) from the AFDC Alternative Fuel Stations API (NLR, formerly NREL; Canadian
// records come from NRCan) into sources/afdc-<cc>/stations-raw.json, with a FETCHED.json recording
// where, when, its checksum and counts.
//
// The raw file is ~50 MB for Canada and much more for the US (DESIGN-7 D1), so it is streamed to
// disk, then read back to check it. It is git-ignored; only FETCHED.json is committed.
// The normalized, much smaller map data (M2) is what goes into the repo.
//
// Needs the API key in NLR_API_KEY: a GitHub Actions secret in CI, or a local
// git-ignored .env file. The key goes in a request header, never in the URL,
// so it can't end up in logs or in FETCHED.json.

import { createHash } from 'node:crypto';
import { createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { ReadableStream as WebReadableStream } from 'node:stream/web';
import { countryArg, rawDir, type Country } from './lib/countries.ts';

export const AFDC_API = 'https://developer.nlr.gov/api/alt-fuel-stations/v1.json';
// All statuses and access types: the normalizer (M2) decides what to drop, so the
// sanity checks (M3) can compare like with like between pulls.
export function afdcQuery(country: Country): string {
  return `country=${country.toUpperCase()}&fuel_type=ELEC&status=all&access=all&limit=all`;
}
export const RAW_FILE = 'stations-raw.json';

export interface AfdcResponse {
  total_results: number;
  fuel_stations: unknown[];
}

/** Checks the response looks like a full pull; returns a reason if not. */
export function responseProblem(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) return 'response is not a JSON object';
  const r = body as Partial<AfdcResponse>;
  if (!Array.isArray(r.fuel_stations)) return 'response has no fuel_stations array';
  if (typeof r.total_results !== 'number') return 'response has no total_results';
  if (r.fuel_stations.length !== r.total_results) {
    return `got ${r.fuel_stations.length} stations but total_results says ${r.total_results} (partial download?)`;
  }
  if (r.fuel_stations.length === 0) return 'no stations returned';
  return null;
}

function apiKey(): string {
  if (!process.env.NLR_API_KEY && existsSync('.env')) process.loadEnvFile('.env');
  const key = process.env.NLR_API_KEY?.trim();
  if (!key) throw new Error('NLR_API_KEY is not set (add it to .env locally, or as a GitHub Actions secret)');
  return key;
}

async function main() {
  const country = countryArg();
  const outDir = rawDir(process.cwd(), 'afdc', country);
  const query = afdcQuery(country);
  const res = await fetch(`${AFDC_API}?${query}`, { headers: { 'X-Api-Key': apiKey(), Accept: 'application/json' } });
  if (!res.ok || !res.body) throw new Error(`AFDC request failed: HTTP ${res.status}`);

  // Stream to a temporary file, hashing on the way; it replaces the last pull only once it checks out.
  mkdirSync(outDir, { recursive: true });
  const part = join(outDir, `${RAW_FILE}.part`);
  const hash = createHash('sha256');
  let bytes = 0;
  const tap = new Transform({
    transform(chunk: Buffer, _enc, done) {
      hash.update(chunk);
      bytes += chunk.length;
      done(null, chunk);
    },
  });
  await pipeline(Readable.fromWeb(res.body as WebReadableStream<Uint8Array>), tap, createWriteStream(part));
  const body = JSON.parse(readFileSync(part, 'utf8')) as AfdcResponse;
  const problem = responseProblem(body);
  if (problem) throw new Error(problem);
  renameSync(part, join(outDir, RAW_FILE));

  const meta = {
    api: AFDC_API,
    query,
    docs: 'https://developer.nlr.gov/docs/transportation/alt-fuel-stations-v1/all/',
    file: RAW_FILE,
    fetched_at: new Date().toISOString(),
    sha256: hash.digest('hex'),
    bytes,
    station_count: body.fuel_stations.length,
    rate_limit_remaining: res.headers.get('x-ratelimit-remaining'),
  };
  writeFileSync(join(outDir, 'FETCHED.json'), JSON.stringify(meta, null, 2) + '\n');
  console.log(`fetch:afdc ${country}: saved ${meta.station_count} stations (${(meta.bytes / 1e6).toFixed(1)} MB)`);
}

// Run only when called as a script, so tests can import the helpers.
if (process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/fetch-afdc.ts')) {
  main().catch((e) => {
    console.error(`fetch:afdc: ${(e as Error).message}`);
    process.exit(1);
  });
}
