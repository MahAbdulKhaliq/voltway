import { describe, expect, it } from 'vitest';
import { readMyCar, settingsChanged, settingsFields, withSettings } from '../src/lib/my-car.ts';
import { heatPumpKind, trimSettingsInfo, trimText } from '../src/lib/car-settings.ts';

const car = { carId: 'chevrolet/bolt/2027/bolt', trimId: null, label: 'Chevrolet Bolt' };
const trims = [
  { id: 'lt', wheels: [{ diameter_in: 17, is_standard: true, tire_size: '215/50R17' }], heat_pump: { value: { value: 'optional' } } },
  { id: 'rs', wheels: [{ diameter_in: 19, is_standard: true }], heat_pump: { value: { value: 'standard' } } },
];

describe('My car settings (B120)', () => {
  it('reads saved wheels and heat pump, and drops odd values', () => {
    expect(readMyCar({ ...car, wheelIn: 19, heatPump: true })).toMatchObject({ wheelIn: 19, heatPump: true });
    const odd = readMyCar({ ...car, wheelIn: 'big', heatPump: 'yes' })!;
    expect(odd.wheelIn).toBeUndefined();
    expect(odd.heatPump).toBeUndefined();
    expect(readMyCar({ ...car, wheelIn: 99 })!.wheelIn).toBeUndefined();
  });

  it('stores only what differs from the defaults', () => {
    const d = { standardIn: 17, heatPumpOptional: true };
    expect(settingsFields({ wheelIn: 17, heatPump: false }, d)).toEqual({});
    expect(settingsFields({ wheelIn: null, heatPump: false }, d)).toEqual({});
    expect(settingsFields({ wheelIn: 19, heatPump: true }, d)).toEqual({ wheelIn: 19, heatPump: true });
    // A heat pump that isn't optional is never stored.
    expect(settingsFields({ wheelIn: null, heatPump: true }, { standardIn: 17, heatPumpOptional: false })).toEqual({});
  });

  it('marks a car whose wheels or optional heat pump changed, and clears it back at the defaults', () => {
    const d = { standardIn: 17, heatPumpOptional: true };
    expect(settingsChanged(car)).toBe(false);
    const changed = withSettings({ ...car, plugs: ['ccs1'] }, { wheelIn: 18, heatPump: false }, d);
    expect(settingsChanged(changed)).toBe(true);
    expect(changed.plugs).toEqual(['ccs1']);
    const back = withSettings(changed, { wheelIn: null, heatPump: false }, d);
    expect(settingsChanged(back)).toBe(false);
    expect('wheelIn' in back).toBe(false);
    expect(settingsChanged(withSettings(car, { wheelIn: null, heatPump: true }, d))).toBe(true);
    expect(settingsChanged(null)).toBe(false);
  });

  it('works out a trim’s defaults: standard wheels, B93 sizes, heat pump kind', () => {
    const lt = trimSettingsInfo(trims, null);
    expect(lt.standardIn).toBe(17);
    expect(lt.sizes).toEqual([15, 16, 17, 18, 19, 20, 21]);
    expect(lt.factory.has(19)).toBe(true);
    expect(lt.heatPumpOptional).toBe(true);
    expect(lt.tireFor(17)).toBe('215/50R17');
    const rs = trimSettingsInfo(trims, 'rs');
    expect(rs.standardIn).toBe(19);
    expect(rs.heatPump).toBe('standard');
    expect(trimSettingsInfo([{ id: 'x', wheels: [] }], null).sizes).toEqual([]);
    expect(heatPumpKind('standard_or_optional')).toBe('optional');
    expect(heatPumpKind(undefined)).toBe('unknown');
    expect(heatPumpKind('none')).toBe('none');
  });

  it('shortens trim names that repeat the variant', () => {
    expect(trimText('eDrive40 Gran Coupe (18″ Wheels)', 'eDrive40 Gran Coupe')).toBe('18″ Wheels');
    expect(trimText('Bolt', 'Bolt')).toBe('Bolt');
  });
});
