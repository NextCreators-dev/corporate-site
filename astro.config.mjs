// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import icon from 'astro-icon';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import { newsItems } from './src/data/news';

const SITE_URL = 'https://creatorpot.net';

/** "2026.01.05" 形式の日付を sitemap 用の ISO 8601 文字列へ変換 */
const toLastmod = (date) =>
  new Date(`${date.replace(/\./g, '-')}T00:00:00Z`).toISOString();

// sitemap の <lastmod> は更新日が実在する URL にだけ付ける。
// 架空の日付を入れると Google が lastmod 自体を信用しなくなるため、
// 日付データを持つニュース記事と、その最新日を持つ一覧ページに限定している。
const lastmodByUrl = new Map(
  newsItems.map((item) => [
    `${SITE_URL}/news/${item.slug}/`,
    toLastmod(item.date),
  ]),
);

const newestNewsDate = newsItems
  .map((item) => toLastmod(item.date))
  .sort()
  .at(-1);

if (newestNewsDate) {
  lastmodByUrl.set(`${SITE_URL}/news/`, newestNewsDate);
}

// https://astro.build/config
export default defineConfig({
  integrations: [
    tailwind(),
    icon(),
    react(),
    sitemap({
      serialize(item) {
        const lastmod = lastmodByUrl.get(item.url);
        return lastmod ? { ...item, lastmod } : item;
      },
    }),
  ],
  site: SITE_URL,
  // sitemap・canonical・内部リンクをすべて末尾スラッシュ形に揃える。
  // 非スラッシュのリンクは本番（Netlify）で 301 になりクロール効率を落とすので、
  // dev サーバーで 404 にして開発中に気づけるようにしている。
  // 静的ビルドの出力ファイル構成（build.format: "directory"）は変わらない。
  trailingSlash: 'always',
  build: {
    // CSS をインライン化してレンダーブロックを回避（LCP 改善）
    inlineStylesheets: 'always',
  },
});
