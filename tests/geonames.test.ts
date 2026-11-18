// GeoNames places (3.1, B45): parser, province codes, population filter, zip reader,
// and the committed import / site output.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateRawSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import {
  MIN_POPULATION,
  MIN_POPULATION_US,
  PROVINCE_CODES,
  parseGeonames,
  parseLine,
  provinceFor,
  toPlaceRows,
  unzipEntry,
  type Place,
} from '../scripts/lib/geonames.ts';
import { formatPlacesFile } from '../scripts/fetch-geonames.ts';

/** A GeoNames dump line with the fields the parser reads. */
function line(o: { id?: number; name: string; ascii?: string; lat?: number; lon?: number; fclass?: string; fcode?: string; cc?: string; admin1?: string; pop?: number | string }): string {
  const f = new Array(19).fill('');
  f[0] = String(o.id ?? 1);
  f[1] = o.name;
  f[2] = o.ascii ?? o.name;
  f[3] = 'alt1,alt2';
  f[4] = String(o.lat ?? 45.5);
  f[5] = String(o.lon ?? -73.6);
  f[6] = o.fclass ?? 'P';
  f[7] = o.fcode ?? 'PPL';
  f[8] = o.cc ?? 'CA';
  f[10] = o.admin1 ?? '10';
  f[14] = String(o.pop ?? 5000);
  f[17] = 'America/Toronto';
  f[18] = '2024-01-01';
  return f.join('\t');
}

describe('provinceFor', () => {
  it('maps every Canadian admin1 code to its abbreviation', () => {
    expect(provinceFor('01')).toBe('AB');
    expect(provinceFor('02')).toBe('BC');
    expect(provinceFor('03')).toBe('MB');
    expect(provinceFor('04')).toBe('NB');
    expect(provinceFor('05')).toBe('NL');
    expect(provinceFor('07')).toBe('NS');
    expect(provinceFor('08')).toBe('ON');
    expect(provinceFor('09')).toBe('PE');
    expect(provinceFor('10')).toBe('QC');
    expect(provinceFor('11')).toBe('SK');
    expect(provinceFor('12')).toBe('YT');
    expect(provinceFor('13')).toBe('NT');
    expect(provinceFor('14')).toBe('NU');
    expect(Object.keys(PROVINCE_CODES)).toHaveLength(13);
  });

  it('returns null for codes that are not a province (06 is unused, 00 is unknown)', () => {
    expect(provinceFor('06')).toBeNull();
    expect(provinceFor('00')).toBeNull();
    expect(provinceFor('')).toBeNull();
  });
});

describe('parseLine', () => {
  it('reads a populated place, keeping accents and rounding coordinates', () => {
    const p = parseLine(line({ id: 6077243, name: 'Montréal', ascii: 'Montreal', lat: 45.50884, lon: -73.58781, fcode: 'PPLA2', admin1: '10', pop: 1762949 }));
    expect(p).toEqual({ id: 6077243, name: 'Montréal', ascii_name: 'Montreal', province: 'QC', lat: 45.5088, lon: -73.5878, population: 1762949 });
  });

  it('applies the population ≥ 1,000 filter (1,000 kept, 999 dropped)', () => {
    expect(MIN_POPULATION).toBe(1000);
    expect(parseLine(line({ name: 'Edge', pop: 1000 }))?.population).toBe(1000);
    expect(parseLine(line({ name: 'Small', pop: 999 }))).toBeNull();
    expect(parseLine(line({ name: 'Zero', pop: 0 }))).toBeNull();
    expect(parseLine(line({ name: 'Blank', pop: '' }))).toBeNull();
  });

  it('keeps only populated places (feature class P) in Canada', () => {
    expect(parseLine(line({ name: 'Lake', fclass: 'H', fcode: 'LK' }))).toBeNull();
    expect(parseLine(line({ name: 'Buffalo', cc: 'US' }))).toBeNull();
  });

  it('drops historical, abandoned and destroyed places', () => {
    for (const fcode of ['PPLH', 'PPLQ', 'PPLW', 'PPLCH']) expect(parseLine(line({ name: 'Old', fcode }))).toBeNull();
    for (const fcode of ['PPL', 'PPLA', 'PPLC', 'PPLX']) expect(parseLine(line({ name: 'Live', fcode }))).not.toBeNull();
  });

  it('drops rows with an unknown province or bad coordinates, and short lines', () => {
    expect(parseLine(line({ name: 'Nowhere', admin1: '00' }))).toBeNull();
    expect(parseLine(line({ name: 'Bad', lat: Number.NaN }))).toBeNull();
    expect(parseLine('1\tToo short')).toBeNull();
  });
});

describe('parseGeonames', () => {
  it('parses a dump, counts small places, and sorts by population', () => {
    const text = [
      line({ id: 3, name: 'Whitehorse', admin1: '12', pop: 28201 }),
      line({ id: 2, name: 'Toronto', admin1: '08', pop: 2794356 }),
      line({ id: 4, name: 'Hamlet', pop: 200 }),
      line({ id: 5, name: 'River', fclass: 'H', fcode: 'STM', pop: 0 }),
      '',
    ].join('\r\n');
    const r = parseGeonames(text);
    expect(r.lines).toBe(4);
    expect(r.below_min_population).toBe(1);
    expect(r.places.map((p) => p.name)).toEqual(['Toronto', 'Whitehorse']);
    expect(r.places[1].province).toBe('YT');
  });
});

describe('unzipEntry', () => {
  /** Builds a minimal one-file deflated zip. */
  function zip(name: string, content: string): Buffer {
    const data = deflateRawSync(Buffer.from(content, 'utf8'));
    const nameBuf = Buffer.from(name, 'utf8');
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(8, 8);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(Buffer.byteLength(content), 22);
    local.writeUInt16LE(nameBuf.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(8, 10);
    central.writeUInt32LE(data.length, 20);
    central.writeUInt32LE(Buffer.byteLength(content), 24);
    central.writeUInt16LE(nameBuf.length, 28);
    central.writeUInt32LE(0, 42);
    const cdOffset = local.length + nameBuf.length + data.length;
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0);
    eocd.writeUInt16LE(1, 8);
    eocd.writeUInt16LE(1, 10);
    eocd.writeUInt32LE(central.length + nameBuf.length, 12);
    eocd.writeUInt32LE(cdOffset, 16);
    return Buffer.concat([local, nameBuf, data, central, nameBuf, eocd]);
  }

  it('extracts a deflated entry by name', () => {
    expect(unzipEntry(zip('CA.txt', 'Montréal\tline'), 'CA.txt').toString('utf8')).toBe('Montréal\tline');
  });

  it('fails clearly on a missing entry or a non-zip', () => {
    expect(() => unzipEntry(zip('readme.txt', 'x'), 'CA.txt')).toThrow(/not found/);
    expect(() => unzipEntry(Buffer.from('not a zip at all, just some text bytes here'), 'CA.txt')).toThrow(/not a zip/);
  });
});

describe('formatPlacesFile', () => {
  it('writes valid JSON with one place per line', () => {
    const text = formatPlacesFile({ source: 'geonames-ca', places: [{ id: 1 }, { id: 2 }] });
    expect(JSON.parse(text)).toEqual({ source: 'geonames-ca', places: [{ id: 1 }, { id: 2 }] });
    expect(text).toContain('\n    {"id":1},\n    {"id":2}\n');
  });
});

describe('committed GeoNames import', () => {
  const file = JSON.parse(readFileSync(join(process.cwd(), 'data', 'imported', 'geonames', 'places-ca.json'), 'utf8')) as {
    source_id: string;
    places: Place[];
  };
  const rows = toPlaceRows(file.places);
  const find = (name: string) => rows.find((r) => r.n === name);

  it('has about 3,000 places, all with population ≥ 1,000 and a province', () => {
    expect(rows.length).toBeGreaterThan(2500);
    expect(rows.length).toBeLessThan(4000);
    expect(rows.every((r) => r.pop >= 1000 && /^[A-Z]{2}$/.test(r.p))).toBe(true);
    expect(file.source_id).toBe('src-geonames');
  });

  it('has Toronto, Montréal (with accent), Whitehorse and Iqaluit with their province', () => {
    expect(find('Toronto')?.p).toBe('ON');
    expect(find('Montréal')?.p).toBe('QC');
    expect(find('Whitehorse')?.p).toBe('YT');
    expect(find('Iqaluit')?.p).toBe('NU');
  });

  it('turns places into short-key rows for the site', () => {
    expect(Object.keys(rows[0]).sort()).toEqual(['lat', 'lon', 'n', 'p', 'pop']);
  });
});

// B78 (DESIGN-7 D5): US towns from US.zip, with a higher population floor.
describe('US places (B78)', () => {
  const us = (o: Parameters<typeof line>[0]) => line({ cc: 'US', admin1: 'TX', lat: 30.08, lon: -95.42, ...o });
  it('keeps US populated places at or above the US floor, with their state', () => {
    expect(MIN_POPULATION_US).toBe(2000);
    expect(parseLine(us({ name: 'Spring', pop: 54298 }), 'US')).toMatchObject({ name: 'Spring', province: 'TX', population: 54298 });
    expect(parseLine(us({ name: 'Edge', pop: 2000 }), 'US')?.population).toBe(2000);
    expect(parseLine(us({ name: 'Small', pop: 1999 }), 'US')).toBeNull();
  });
  it('takes only the asked-for country and real states (DC yes, territories and bad codes no)', () => {
    expect(parseLine(us({ name: 'Spring' }), 'CA')).toBeNull();
    expect(parseLine(line({ name: 'Toronto' }), 'US')).toBeNull();
    expect(parseLine(us({ name: 'Washington', admin1: 'DC' }), 'US')?.province).toBe('DC');
    expect(parseLine(us({ name: 'Nowhere', admin1: '00' }), 'US')).toBeNull();
    expect(provinceFor('PR', 'US')).toBeNull();
  });
  it('parses a dump given as bytes, with CRLF lines', () => {
    const buf = Buffer.from([us({ id: 2, name: 'Portland', admin1: 'OR', pop: 652503 }), us({ id: 3, name: 'Tiny', pop: 10 })].join('\r\n') + '\r\n', 'utf8');
    const r = parseGeonames(buf, 'US');
    expect(r.places.map((p) => p.name)).toEqual(['Portland']);
    expect(r.lines).toBe(2);
    expect(r.below_min_population).toBe(1);
  });
});

describe('committed GeoNames US import (B78)', () => {
  const file = JSON.parse(readFileSync(join(process.cwd(), 'data', 'imported', 'geonames', 'places-us.json'), 'utf8')) as {
    source: string;
    source_id: string;
    min_population: number;
    places: Place[];
  };
  const rows = toPlaceRows(file.places);
  it('has about 12,500 places at or above 2,000 people, under 1 MB as site rows', () => {
    expect(file.source).toBe('geonames-us');
    expect(file.source_id).toBe('src-geonames');
    expect(file.min_population).toBe(2000);
    expect(rows.length).toBeGreaterThan(10000);
    expect(rows.length).toBeLessThan(15000);
    expect(rows.every((r) => r.pop >= 2000 && /^[A-Z]{2}$/.test(r.p))).toBe(true);
    expect(JSON.stringify(rows).length).toBeLessThan(1_000_000);
  });
  it('has Spring TX, several Portlands (OR largest), Moab UT, Lewistown MT, Anchorage AK and Honolulu HI', () => {
    expect(rows.find((r) => r.n === 'Spring')?.p).toBe('TX');
    const portlands = rows.filter((r) => r.n === 'Portland');
    expect(portlands.length).toBeGreaterThan(3);
    expect(portlands[0].p).toBe('OR');
    for (const [n, p] of [['Moab', 'UT'], ['Lewistown', 'MT'], ['Anchorage', 'AK'], ['Honolulu', 'HI']]) expect(rows.some((r) => r.n === n && r.p === p)).toBe(true);
  });
});
