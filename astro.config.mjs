// @ts-check
import { defineConfig } from 'astro/config';
import { DOMAIN } from './src/settings.ts';

export default defineConfig({
  site: `https://${DOMAIN}`,
  trailingSlash: 'ignore',
});
