// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import icon from 'astro-icon';
import react from '@astrojs/react';
import remarkGfm from 'remark-gfm';

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), icon(), react()],
  site: "https://creatorpot.net",
  markdown: {
    remarkPlugins: [remarkGfm],
    shikiConfig: {
      theme: 'github-dark',
    },
  },
});