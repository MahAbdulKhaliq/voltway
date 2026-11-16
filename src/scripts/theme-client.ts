// Light/dark theme (owner decision B20). The device setting decides until the visitor picks;
// the pick is stored and applied as data-theme on <html> (an inline script in Base.astro
// applies it before first paint). Islands redraw canvas colours on "voltway:theme".

import { getItem, setItem, KEYS } from '../lib/storage.ts';

export type Theme = 'light' | 'dark';

export function currentTheme(): Theme {
  const picked = document.documentElement.dataset.theme;
  if (picked === 'light' || picked === 'dark') return picked;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function savedTheme(): Theme | null {
  const v = getItem(KEYS.theme);
  return v === 'light' || v === 'dark' ? v : null;
}

export function setTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  setItem(KEYS.theme, theme);
  window.dispatchEvent(new CustomEvent('voltway:theme', { detail: theme }));
}
