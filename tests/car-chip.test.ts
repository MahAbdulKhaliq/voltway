import { describe, expect, it } from 'vitest';
import { carChipParts } from '../src/lib/car-label.ts';
import { readMyCar } from '../src/lib/my-car.ts';

describe('carChipParts (B71)', () => {
  it('gives model, year + model, year + model + trim', () => {
    expect(carChipParts({ carId: 'tesla/model-y/2026/performance', label: 'Model Y Performance', model: 'Model Y' }))
      .toEqual(['Model Y', '2026 Model Y', '2026 Model Y Performance']);
  });
  it('treats a car saved without a model as all model', () => {
    expect(carChipParts({ carId: 'tesla/model-y/2026/performance', label: 'Model Y Performance' }))
      .toEqual(['Model Y Performance', '2026 Model Y Performance', '2026 Model Y Performance']);
  });
  it('ignores a model that does not start the label', () => {
    expect(carChipParts({ carId: 'kia/ev9/2025/land', label: 'EV9 Land', model: 'Niro' })[2]).toBe('2025 EV9 Land');
  });
  it('keeps the saved model when reading storage', () => {
    expect(readMyCar({ carId: 'kia/ev9/2025/land', trimId: null, label: 'EV9 Land', model: 'EV9' })?.model).toBe('EV9');
  });
});
