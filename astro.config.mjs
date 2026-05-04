import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://kharon.co.za',
  output: 'server',
  adapter: cloudflare(),
  integrations: [
    sitemap({
      customPages: [
        'https://kharon.co.za/',
        'https://kharon.co.za/solutions',
        'https://kharon.co.za/solutions/fire-detection',
        'https://kharon.co.za/solutions/gas-suppression',
        'https://kharon.co.za/environments',
        'https://kharon.co.za/environments/server-rooms',
        'https://kharon.co.za/compliance',
        'https://kharon.co.za/projects',
        'https://kharon.co.za/fabrications',
        'https://kharon.co.za/triage',
        'https://kharon.co.za/triage/emergency',
        'https://kharon.co.za/triage/quote',
        'https://kharon.co.za/triage/maintenance'
      ]
    })
  ],
  vite: {
    plugins: [tailwindcss()]
  }
});
