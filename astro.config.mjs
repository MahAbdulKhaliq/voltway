// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// Fully static site: every page is rendered to HTML at build time (no server).
// React is used only for interactive "islands" (curve viewer, filters, compare).
export default defineConfig({
  output: 'static',
  integrations: [react()],
});
