import type { IndexEntry } from './types.ts';
import { splitVariantName } from './variant-name.ts';

/** My car's short label: model and the plain variant name ("Ioniq 5 Long Range AWD"). */
export const carLabel = (e: IndexEntry) => `${e.model} ${splitVariantName(e.name).plain}`;

/** Ask the header to open its car dialog (B58): the one place a car is chosen. */
export const openCarPicker = () => window.dispatchEvent(new CustomEvent('voltway:pick-car'));
