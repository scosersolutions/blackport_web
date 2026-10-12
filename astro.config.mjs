// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { loadEnv } from 'vite';

// Dominio público definitivo. Mientras no exista, no se generan canonical ni sitemap.
// Definir en .env → SITE_URL=https://dominio-real.es
const env = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '');
const SITE_URL = env.SITE_URL?.trim() || undefined;

export default defineConfig({
  site: SITE_URL,
  integrations: SITE_URL ? [sitemap()] : [],
  devToolbar: { enabled: false },
});
