import { describe, expect, it } from 'vitest';
import { calculateCharge, displayMinutes, powerAt, measuredSpan, usesExtension, type CurvePoint } from '../src/lib/charging.ts';

const flat = (kw: number): CurvePoint[] => [{ soc_percent: 0, power_kw: kw }, { soc_percent: 100, power_kw: kw }];

describe('powerAt (linear interpolation)', () => {
  const curve: CurvePoint[] = [
    { soc_percent: 10, power_kw: 200 },
    { soc_percent: 50, power_kw: 100 },
    { soc_percent: 80, power_kw: 40 },
  ];
  it('returns point values exactly', () => {
    expect(powerAt(curve, 50)).toBe(100);
  });
  it('joins points with straight lines, including uneven spacing', () => {
    expect(powerAt(curve, 30)).toBe(150);
    expect(powerAt(curve, 65)).toBe(70);
  });
  it('is flat beyond the first and last points', () => {
    expect(powerAt(curve, 0)).toBe(200);
    expect(powerAt(curve, 100)).toBe(40);
  });
});

describe('calculateCharge: the QA.md hand-worked example', () => {
  // 70 kWh usable, flat 100 kW, 10 → 80 %, 200 Wh/km.
  const base = { points: flat(100), usableKwh: 70, startSoc: 10, endSoc: 80, whPerKm: 200 };

  it('flat curve: time = energy ÷ power', () => {
    const r = calculateCharge(base);
    expect(r.energyKwh).toBeCloseTo(49, 10);
    expect(r.minutes).toBeCloseTo(29.4, 10);
    expect(r.averageKw).toBeCloseTo(100, 10);
    expect(r.lostToChargerMinutes).toBeCloseTo(0, 10);
  });

  it('km added and km per 10 minutes', () => {
    const r = calculateCharge(base);
    expect(r.kmAdded).toBeCloseTo(245, 10);
    expect(r.kmPer10Min).toBeCloseTo((245 / 29.4) * 10, 10); // ≈ 83.3
  });

  it('a 50 kW charger doubles the time; the extra is "lost to charger limits"', () => {
    const r = calculateCharge({ ...base, chargerKw: 50 });
    expect(r.minutes).toBeCloseTo(58.8, 10);
    expect(r.idealMinutes).toBeCloseTo(29.4, 10);
    expect(r.lostToChargerMinutes).toBeCloseTo(29.4, 10);
    expect(r.averageKw).toBeCloseTo(50, 10);
  });

  it('a charger above the car\'s peak changes nothing', () => {
    expect(calculateCharge({ ...base, chargerKw: 350 }).minutes).toBeCloseTo(29.4, 10);
  });
});

describe('calculateCharge: sloped curves', () => {
  it('matches the exact integral for a linear curve', () => {
    // P(s) = 50 + s kW over 0–100 %, 100 kWh → 1 kWh per %. Time = ∫ ds/(50+s) h = ln 3 h.
    const r = calculateCharge({
      points: [{ soc_percent: 0, power_kw: 50 }, { soc_percent: 100, power_kw: 150 }],
      usableKwh: 100,
      startSoc: 0,
      endSoc: 100,
    });
    expect(r.minutes).toBeCloseTo(Math.log(3) * 60, 2); // 65.92 min
  });

  it('caps only the part of the curve above the charger', () => {
    // 200 kW to 50 %, then 100 kW. A 150 kW charger slows only the first half.
    const points: CurvePoint[] = [
      { soc_percent: 0, power_kw: 200 },
      { soc_percent: 50, power_kw: 200 },
      { soc_percent: 50.0001, power_kw: 100 },
      { soc_percent: 100, power_kw: 100 },
    ];
    const r = calculateCharge({ points, usableKwh: 100, startSoc: 0, endSoc: 100, chargerKw: 150 });
    // first half: 50 kWh at 150 kW = 20 min; second half: 50 kWh at 100 kW = 30 min
    expect(r.minutes).toBeCloseTo(50, 1);
    expect(r.idealMinutes).toBeCloseTo(45, 1);
    expect(r.peakKw).toBe(150);
  });

  it('counts minutes spent above 100 / 150 / 200 kW', () => {
    const points: CurvePoint[] = [
      { soc_percent: 0, power_kw: 250 },
      { soc_percent: 40, power_kw: 250 },
      { soc_percent: 40.0001, power_kw: 120 },
      { soc_percent: 100, power_kw: 120 },
    ];
    const r = calculateCharge({ points, usableKwh: 100, startSoc: 0, endSoc: 80 });
    // 40 kWh at 250 kW = 9.6 min; 40 kWh at 120 kW = 20 min
    expect(r.minutesAbove[200]).toBeCloseTo(9.6, 1);
    expect(r.minutesAbove[150]).toBeCloseTo(9.6, 1);
    expect(r.minutesAbove[100]).toBeCloseTo(29.6, 1);
  });
});

describe('calculateCharge: edges', () => {
  it('start = end gives zero time and no km per 10 min', () => {
    const r = calculateCharge({ points: flat(100), usableKwh: 70, startSoc: 50, endSoc: 50, whPerKm: 200 });
    expect(r.minutes).toBe(0);
    expect(r.energyKwh).toBe(0);
    expect(r.kmPer10Min).toBeNull();
    expect(r.steps).toEqual([]);
  });

  it('handles the full 0 → 100 % window', () => {
    const r = calculateCharge({ points: flat(60), usableKwh: 60, startSoc: 0, endSoc: 100 });
    expect(r.minutes).toBeCloseTo(60, 10);
  });

  it('handles windows that are not a multiple of the step', () => {
    const r = calculateCharge({ points: flat(100), usableKwh: 100, startSoc: 10.3, endSoc: 80.1 });
    expect(r.energyKwh).toBeCloseTo(69.8, 10);
    expect(r.minutes).toBeCloseTo(41.88, 6);
  });

  it('returns null km figures when consumption is unknown', () => {
    const r = calculateCharge({ points: flat(100), usableKwh: 70, startSoc: 10, endSoc: 80 });
    expect(r.kmAdded).toBeNull();
    expect(r.kmPer10Min).toBeNull();
  });

  it('records elapsed time per step for the power-vs-time chart', () => {
    const r = calculateCharge({ points: flat(100), usableKwh: 100, startSoc: 0, endSoc: 10, stepPercent: 5 });
    expect(r.steps.map((s) => [s.soc, s.elapsedMin])).toEqual([[5, 3], [10, 6]]);
  });

  it('rejects impossible inputs', () => {
    expect(() => calculateCharge({ points: flat(100), usableKwh: 70, startSoc: 80, endSoc: 10 })).toThrow(/SoC window/);
    expect(() => calculateCharge({ points: flat(100), usableKwh: 0, startSoc: 10, endSoc: 80 })).toThrow(/Usable/);
    expect(() => calculateCharge({ points: [flat(100)[0]], usableKwh: 70, startSoc: 10, endSoc: 80 })).toThrow(/2 points/);
    expect(() => calculateCharge({ points: flat(0), usableKwh: 70, startSoc: 10, endSoc: 80 })).toThrow(/zero/);
  });
});

describe('displayMinutes', () => {
  it('rounds estimated results to the nearest 5 minutes', () => {
    expect(displayMinutes(23.4, true)).toBe(25);
    expect(displayMinutes(22.4, true)).toBe(20);
    expect(displayMinutes(1, true)).toBe(5);
  });
  it('rounds measured results to the minute', () => {
    expect(displayMinutes(23.4, false)).toBe(23);
  });
});

describe('measured span (B24)', () => {
  const pts = [{ soc_percent: 18, power_kw: 200 }, { soc_percent: 80, power_kw: 100 }];
  it('flags a window that reaches past the first or last point', () => {
    expect(calculateCharge({ points: pts, usableKwh: 80, startSoc: 10, endSoc: 80 }).extrapolated).toBe(true);
    expect(calculateCharge({ points: pts, usableKwh: 80, startSoc: 20, endSoc: 80 }).extrapolated).toBe(false);
    expect(calculateCharge({ points: pts, usableKwh: 80, startSoc: 20, endSoc: 90 }).extrapolated).toBe(true);
    expect(usesExtension(pts, 50, 50)).toBe(false);
    expect(measuredSpan(pts)).toEqual({ from: 18, to: 80 });
  });
  it('shows an empty window as 0 min, not ~5 (QA 9.1)', () => {
    expect(displayMinutes(0, true)).toBe(0);
    expect(displayMinutes(0, false)).toBe(0);
    expect(displayMinutes(1, true)).toBe(5);
  });
});
