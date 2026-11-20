import { describe, expect, it } from 'vitest';
import { deflateRawSync } from 'node:zlib';
import { checkEpaColumns, epaKey, kwhPer100miToWhPerKm, milesToKm, normalizeEpaRows, unzipSingle } from '../scripts/lib/epa.ts';

const row = (o: Record<string, string>) => ({
  id: '38187', year: '2017', make: 'Chevrolet', model: 'Bolt EV', baseModel: 'Bolt EV', atvType: 'EV', drive: 'Front-Wheel Drive',
  evMotor: '150 kW ACPM', VClass: 'Small Station Wagons', range: '238', cityE: '26.427', highwayE: '30.5909', combE: '28.3007', charge240: '9.3', ...o,
});

describe('EPA import (B90)', () => {
  it('converts miles and kWh/100 mi to km and Wh/km', () => {
    expect(milesToKm(238)).toBe(383);
    expect(kwhPer100miToWhPerKm(26.427)).toBe(164.2);
    expect(kwhPer100miToWhPerKm(160.9344)).toBe(1000);
  });

  it('keeps battery-electric rows from 2011 on, as rated_epa values', () => {
    const recs = normalizeEpaRows([row({}), row({ atvType: 'Hybrid', id: '1' }), row({ year: '2008', id: '2' })], 'src-epa-test');
    expect(recs).toHaveLength(1);
    expect(recs[0]).toMatchObject({
      source_key: epaKey(2017, 'Chevrolet', 'Bolt EV', '38187'),
      base_model: 'Bolt EV',
      range_km: [{ value: 383, unit: 'km', kind: 'rated_epa', source_id: 'src-epa-test' }],
      consumption_combined_wh_per_km: [{ value: 175.9, unit: 'Wh/km' }],
      recharge_time_240v_h: [{ value: 9.3, unit: 'h' }],
    });
  });

  it('leaves out figures EPA left blank or zero', () => {
    const [r] = normalizeEpaRows([row({ range: '0', charge240: '' })], 'src');
    expect(r.range_km).toBeUndefined();
    expect(r.recharge_time_240v_h).toBeUndefined();
  });

  it('fails loudly when columns go missing', () => {
    expect(() => checkEpaColumns(['id', 'year'])).toThrow(/missing columns/);
  });

  it('reads a single-entry zip', () => {
    const data = Buffer.from('a,b\n1,2\n');
    const comp = deflateRawSync(data);
    const name = Buffer.from('vehicles.csv');
    const local = Buffer.alloc(30); local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(8, 8); local.writeUInt16LE(name.length, 26);
    const cd = Buffer.alloc(46); cd.writeUInt32LE(0x02014b50, 0); cd.writeUInt16LE(8, 10); cd.writeUInt32LE(comp.length, 20); cd.writeUInt16LE(name.length, 28); cd.writeUInt32LE(0, 42);
    const cdOff = 30 + name.length + comp.length;
    const eocd = Buffer.alloc(22); eocd.writeUInt32LE(0x06054b50, 0); eocd.writeUInt32LE(cdOff, 16);
    const zip = Buffer.concat([local, name, comp, cd, name, eocd]);
    expect(unzipSingle(zip)).toEqual({ name: 'vehicles.csv', data });
  });
});
