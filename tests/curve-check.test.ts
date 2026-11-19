import { describe, expect, it } from 'vitest';
import { checkCurve, powerAt } from '../scripts/lib/curve-check.ts';

const pts = (s: string) => s.split(' ').map((x) => { const [soc, kw] = x.split(':').map(Number); return { soc_percent: soc, power_kw: kw }; });
const codes = (issues: { code: string }[]) => issues.map((i) => i.code);

// The 2023 Model 3 Performance curve from the Chargeprice archive that was shown as "Tested"
// on the 2026 car (B95): holds 250 kW from 0 to 35 % SoC.
const MODEL3_CHARGEPRICE = pts('0:250 5:250 20:250 35:250 50:200 65:150 80:100 90:60 100:30');
// A dense, plausible 400 V NMC curve (every 5 %).
const DENSE = pts('0:180 5:240 10:250 15:248 20:240 25:225 30:205 35:190 40:175 45:160 50:148 55:135 60:120 65:110 70:98 75:88 80:76 85:62 90:48 95:30 100:12');

describe('checkCurve (B95)', () => {
  it('flags the Model 3 Chargeprice curve for a flat peak', () => {
    const issues = checkCurve(MODEL3_CHARGEPRICE, { dcMaxKw: 250, chemistry: 'nmc', voltageClass: '400v' });
    expect(codes(issues)).toContain('flat_peak');
    expect(issues.every((i) => i.level === 'warning')).toBe(true);
  });

  it('passes a dense, plausible 400 V curve', () => {
    expect(checkCurve(DENSE, { dcMaxKw: 250, chemistry: 'nmc', voltageClass: '400v' })).toEqual([]);
  });

  it('allows a longer plateau on an 800 V car', () => {
    const e800 = pts('0:200 5:230 10:235 15:235 20:234 25:233 30:232 35:230 40:228 45:226 50:224 55:200 60:180 65:160 70:140 75:120 80:100 85:80 90:60 95:40 100:20');
    expect(codes(checkCurve(e800, { dcMaxKw: 235, chemistry: 'nmc', voltageClass: '800v' }))).not.toContain('flat_peak');
    expect(codes(checkCurve(e800, { dcMaxKw: 235, chemistry: 'nmc', voltageClass: '400v' }))).toContain('flat_peak');
  });

  it('warns on sparse points and wide gaps', () => {
    expect(codes(checkCurve(pts('0:55 56:38 68:24 85:16 100:7'), { dcMaxKw: 55 }))).toEqual(expect.arrayContaining(['sparse', 'gap']));
  });

  it('errors on a peak above the car, on unsorted points and on points out of range', () => {
    expect(checkCurve(DENSE, { dcMaxKw: 200 }).find((i) => i.code === 'above_peak')?.level).toBe('error');
    expect(codes(checkCurve(pts('0:100 50:80 40:70')))).toEqual(['unsorted']);
    expect(codes(checkCurve(pts('0:100 50:80 120:70')))).toContain('out_of_range');
  });

  it('warns when the curve belongs to another generation, or is far off the template', () => {
    expect(codes(checkCurve(DENSE, { dcMaxKw: 250, yearMismatch: true }))).toContain('year_mismatch');
    const low = DENSE.map((p) => ({ ...p, power_kw: p.soc_percent >= 30 ? p.power_kw * 0.4 : p.power_kw }));
    expect(codes(checkCurve(low, { dcMaxKw: 250, chemistry: 'nmc', voltageClass: '400v' }))).toContain('off_template');
  });

  it('interpolates power between points', () => {
    expect(powerAt(pts('0:100 50:50'), 25)).toBe(75);
    expect(powerAt(pts('10:100 50:50'), 0)).toBe(100);
  });
});
