// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import icon from 'astro-icon';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  integrations: [icon(), react(), sitemap()],
  // Tailwind v4 は Vite プラグインとして読み込む（@astrojs/tailwind は Astro 6 非対応のため廃止）
  vite: {
    plugins: [tailwindcss()],
  },
  site: "https://creatorpot.net",
  build: {
    // CSS をインライン化してレンダーブロックを回避（LCP 改善）
    inlineStylesheets: "always",
  },
});
