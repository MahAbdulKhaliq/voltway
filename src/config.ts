// Coverage settings. The product isn't branded to one country; this says which market the
// current data covers, so the UI can state it openly. Adding markets later = new data + config.

export const COVERAGE = {
  /** The market the vehicle list covers today. */
  market: 'Canada',
  /** Where the official efficiency and range ratings come from. */
  regulator: 'Natural Resources Canada (NRCan)',
  /** Short name of that regulator's ratings, for compact notes. */
  regulatorShort: 'NRCan',
} as const;
