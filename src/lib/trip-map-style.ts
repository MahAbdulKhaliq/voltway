// Trip map colours (route-planner.md §7). Kept apart from the component so tests/contrast.test.ts
// can check them: the route line on the light and dark base maps, and the stop number on its pin.

import { PIN } from './map-icons.ts';

export const TRIP_MAP = {
  /** The route: a blue line on a white casing, visible on both base maps. */
  route: '#2563EB',
  casing: '#FFFFFF',
  /** A charging gap: dashed red over the route. */
  gap: '#DC2626',
  /** Stop pins share the Level 3 pin colour; the number on top is white. */
  stop: PIN.fill[3],
  stopText: '#FFFFFF',
  start: '#15803D',
  end: '#111827',
  ring: '#FFFFFF',
  selected: '#111827',
} as const;
