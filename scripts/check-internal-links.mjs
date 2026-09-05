// ビルド成果物（dist/）の内部リンクが末尾スラッシュ形になっているかを検査する。
//
// 非スラッシュの内部リンクは本番（Netlify）で 301 リダイレクトになる。
// sitemap と canonical は末尾スラッシュ形なので、リンクだけが非スラッシュだと
// 「sitemap には載っているが直接リンクが1本もない URL」が生まれ、
// Google のクロール優先度が落ちて「検出 - インデックス未登録」に留まる。
// 目視で気づけない不具合なので機械的に検査する。
//
// 使い方: yarn build && yarn check:links

import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;

/** dist 配下の .html を再帰的に集める */
async function collectHtmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return collectHtmlFiles(path);
      return entry.name.endsWith('.html') ? [path] : [];
    }),
  );
  return files.flat();
}

/**
 * 末尾スラッシュが必要なページリンクかどうか。
 * ルート（/）、拡張子付き（/favicon.ico）、アンカーのみ（#contact）は対象外。
 */
function needsTrailingSlash(href) {
  if (!href.startsWith('/') || href.startsWith('//')) return false;
  const path = href.split(/[?#]/)[0];
  if (path === '/' || path === '') return false;
  if (path.endsWith('/')) return false;
  // ファイルを直接指すリンク（最後のセグメントに拡張子がある）は除外
  return !/\.[a-z0-9]+$/i.test(path.split('/').pop() ?? '');
}

let htmlFiles;
try {
  htmlFiles = await collectHtmlFiles(DIST);
} catch {
  console.error('dist/ が見つかりません。先に `yarn build` を実行してください。');
  process.exit(1);
}

const offenders = [];
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  for (const match of html.matchAll(/href="([^"]+)"/g)) {
    const href = match[1];
    if (needsTrailingSlash(href)) {
      offenders.push({ file: relative(DIST, file), href });
    }
  }
}

if (offenders.length > 0) {
  console.error(
    `末尾スラッシュのない内部リンクが ${offenders.length} 件見つかりました（本番で 301 になります）:\n`,
  );
  for (const { file, href } of offenders) {
    console.error(`  ${file}: ${href}  →  ${href}/`);
  }
  process.exit(1);
}

console.log(`内部リンクは全て末尾スラッシュ形です（${htmlFiles.length} ファイルを検査）。`);
