// GeoNames Canadian places (B45, data-sources.md §5a): parses the GeoNames `CA.txt` dump
// into the places used for From/To suggestions on the trip planner. Used by
// scripts/fetch-geonames.ts (writes data/imported/geonames/places.json) and by tests.
//
// GeoNames dump format (tab-separated, no header; https://download.geonames.org/export/dump/readme.txt):
//   0 geonameid · 1 name · 2 asciiname · 3 alternatenames · 4 latitude · 5 longitude
//   6 feature class · 7 feature code · 8 country code · 9 cc2 · 10 admin1 code · 11–13 admin2–4
//   14 population · 15 elevation · 16 dem · 17 timezone · 18 modification date

import { inflateRawSync } from 'node:zlib';

/** Places smaller than this are left out (B45). */
export const MIN_POPULATION = 1000;

/** GeoNames admin1 codes for Canada → province / territory abbreviation (admin1CodesASCII.txt). */
export const PROVINCE_CODES: Readonly<Record<string, string>> = {
  '01': 'AB',
  '02': 'BC',
  '03': 'MB',
  '04': 'NB',
  '05': 'NL',
  '07': 'NS',
  '08': 'ON',
  '09': 'PE',
  '10': 'QC',
  '11': 'SK',
  '12': 'YT',
  '13': 'NT',
  '14': 'NU',
};

/** Populated-place codes that are not real, current places: historical, abandoned, destroyed. */
const EXCLUDED_CODES = new Set(['PPLH', 'PPLQ', 'PPLW', 'PPLCH']);

export interface Place {
  /** GeoNames id, for tracing a row back to geonames.org. */
  id: number;
  name: string;
  ascii_name: string;
  province: string;
  lat: number;
  lon: number;
  population: number;
}

/** Province / territory abbreviation for a GeoNames admin1 code, or null if it isn't one. */
export function provinceFor(admin1: string): string | null {
  return PROVINCE_CODES[admin1.trim()] ?? null;
}

const round = (x: number, digits: number) => Number(x.toFixed(digits));

/**
 * Parses one GeoNames dump line. Returns the place if it is a current populated place in
 * Canada with population ≥ MIN_POPULATION and a known province; null otherwise.
 */
export function parseLine(line: string): Place | null {
  const f = line.split('\t');
  if (f.length < 15) return null;
  const [id, name, ascii, , lat, lon, fclass, fcode, country, , admin1] = f;
  if (country !== 'CA' || fclass !== 'P' || EXCLUDED_CODES.has(fcode)) return null;
  const population = Number(f[14]);
  if (!Number.isFinite(population) || population < MIN_POPULATION) return null;
  const province = provinceFor(admin1);
  const la = Number(lat);
  const lo = Number(lon);
  if (!province || !name.trim() || !Number.isFinite(la) || !Number.isFinite(lo)) return null;
  return {
    id: Number(id),
    name: name.trim(),
    ascii_name: (ascii || name).trim(),
    province,
    // 4 decimals ≈ 10 m: plenty for a route start or end.
    lat: round(la, 4),
    lon: round(lo, 4),
    population,
  };
}

export interface ParseResult {
  places: Place[];
  /** Lines read, and lines that were Canadian populated places but dropped as too small. */
  lines: number;
  below_min_population: number;
}

/** Parses a whole dump file; places come out sorted by population (largest first), then id. */
export function parseGeonames(text: string): ParseResult {
  const places: Place[] = [];
  let lines = 0;
  let small = 0;
  for (const line of text.split(/\r?\n/)) {
    if (!line) continue;
    lines++;
    const p = parseLine(line);
    if (p) places.push(p);
    else {
      const f = line.split('\t');
      if (f[6] === 'P' && f[8] === 'CA' && Number(f[14]) < MIN_POPULATION) small++;
    }
  }
  places.sort((a, b) => b.population - a.population || a.id - b.id);
  return { places, lines, below_min_population: small };
}

/**
 * Extracts one file from a .zip archive held in memory (stored or deflated entries only,
 * which is what GeoNames publishes). Reads the central directory, so data descriptors are fine.
 */
export function unzipEntry(zip: Buffer, entryName: string): Buffer {
  // End of central directory record: signature 0x06054b50, within the last 64 KB + 22 bytes.
  let eocd = -1;
  for (let i = zip.length - 22; i >= Math.max(0, zip.length - 65557); i--) {
    if (zip.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('not a zip file (no end of central directory)');
  const entries = zip.readUInt16LE(eocd + 10);
  let p = zip.readUInt32LE(eocd + 16);
  for (let n = 0; n < entries; n++) {
    if (zip.readUInt32LE(p) !== 0x02014b50) throw new Error('corrupt zip central directory');
    const method = zip.readUInt16LE(p + 10);
    const compressed = zip.readUInt32LE(p + 20);
    const nameLen = zip.readUInt16LE(p + 28);
    const extraLen = zip.readUInt16LE(p + 30);
    const commentLen = zip.readUInt16LE(p + 32);
    const localOffset = zip.readUInt32LE(p + 42);
    const name = zip.toString('utf8', p + 46, p + 46 + nameLen);
    if (name === entryName) {
      if (zip.readUInt32LE(localOffset) !== 0x04034b50) throw new Error('corrupt zip local header');
      const start = localOffset + 30 + zip.readUInt16LE(localOffset + 26) + zip.readUInt16LE(localOffset + 28);
      const data = zip.subarray(start, start + compressed);
      if (method === 0) return Buffer.from(data);
      if (method === 8) return inflateRawSync(data);
      throw new Error(`unsupported zip compression method ${method}`);
    }
    p += 46 + nameLen + extraLen + commentLen;
  }
  throw new Error(`${entryName} not found in zip`);
}

/** Short-key rows for the site (public/data/places.json): name, province, lat, lon, population. */
export interface PlaceRow {
  n: string;
  p: string;
  lat: number;
  lon: number;
  pop: number;
}

export function toPlaceRows(places: Place[]): PlaceRow[] {
  return places.map((x) => ({ n: x.name, p: x.province, lat: x.lat, lon: x.lon, pop: x.population }));
}
