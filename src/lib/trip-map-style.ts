// Trip map colours, "Road Paint" (DESIGN-4, 4.5; route-planner.md §7). Kept apart from the
// component so tests/contrast.test.ts can check them against the base-map palette (map-style.ts).

export const TRIP_MAP = {
  /** The trip: centre-line yellow painted on a dark road band, so it reads on asphalt and concrete. */
  route: '#FFD400',
  band: '#2B2C30',
  /** A charging gap: the same line dashed (passing-zone paint), on a band edged in construction orange. */
  gapEdge: '#FF7A1A',
  /** Stop pins: road-marking white with a dark number and ring. */
  stop: '#F5F3EC',
  stopText: '#1A1B1E',
  stopRing: '#1A1B1E',
  /** Start is a yellow dot, the destination a dark one with a pale ring. */
  start: '#FFD400',
  startRing: '#1A1B1E',
  end: '#1A1B1E',
  endRing: '#F5F3EC',
  /** The ring under the selected stop. */
  selectedFill: '#FFD400',
  selectedRing: '#1A1B1E',
} as const;
