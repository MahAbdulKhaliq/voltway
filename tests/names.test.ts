import { describe, expect, it } from 'vitest';
import { dropRun } from '../scripts/lib/names.ts';

describe('dropRun (variant names without the model name repeated)', () => {
  it('drops the model words from an NRCan name', () => {
    expect(dropRun(['eDrive40', 'Gran', 'Coupe'], ['Gran', 'Coupe'])).toEqual(['eDrive40']);
    expect(dropRun(['M60', 'xDrive', 'gran', 'coupe'], ['Gran', 'Coupe'])).toEqual(['M60', 'xDrive']);
  });
  it('leaves names alone when the run is absent, split up, or empty', () => {
    expect(dropRun(['Long', 'Range', 'AWD'], ['Gran', 'Coupe'])).toEqual(['Long', 'Range', 'AWD']);
    expect(dropRun(['Gran', 'Sport', 'Coupe'], ['Gran', 'Coupe'])).toEqual(['Gran', 'Sport', 'Coupe']);
    expect(dropRun(['Standard'], [])).toEqual(['Standard']);
  });
});
