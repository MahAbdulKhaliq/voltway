// Animations on/off (owner, B65): a site setting in the header's Settings menu, on by default.
// Stored in localStorage and applied as data-motion="off" on <html> (an inline script in
// Base.astro applies it before first paint). CSS motion rules and reducedMotion() read it.

import { getItem, setItem, KEYS } from '../lib/storage.ts';

export const motionOn = (): boolean => getItem(KEYS.motion) !== 'off';

export function setMotion(on: boolean): void {
  if (on) delete document.documentElement.dataset.motion;
  else document.documentElement.dataset.motion = 'off';
  setItem(KEYS.motion, on ? 'on' : 'off');
}
