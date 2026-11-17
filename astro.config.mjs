// @ts-check
import { defineConfig, envField } from 'astro/config';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';

// Static site: every page is rendered to HTML at build time. React is used only for interactive
// "islands" (curve viewer, filters, compare, map).
// Phase 3 adds the app's only server code: the trip planner's routing and address-search endpoints
// (src/pages/api/*, `prerender = false`), which the Vercel adapter deploys as a Vercel Function so the
// openrouteservice key stays on the server (route-planner.md §2). Everything else stays static.
export default defineConfig({
  // The production address: absolute URLs for the link preview (og:url, og:image; checklist P.3).
  site: 'https://voltway-ten.vercel.app',
  output: 'static',
  adapter: vercel(),
  integrations: [react()],
  env: {
    schema: {
      // Read at request time on the server only, never inlined into a bundle (astro:env "secret").
      // Locally from .env; on Vercel from the project's environment variables.
      ORS_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },
});
