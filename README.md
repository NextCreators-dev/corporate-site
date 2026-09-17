# corporate-site

株式会社クリエイターのうえきばちのコーポレートサイト（https://creatorpot.net）。会社紹介、ニュース、受託事業 TechPlant Studio の紹介と問い合わせフォームを載せている。Astro 5 + Tailwind CSS で作り、Netlify にデプロイしている。

## セットアップ

Node 22 と yarn が要る。

```sh
yarn install
yarn dev          # http://localhost:4321
```

問い合わせフォームをローカルで動かすときは、Netlify Functions を含めて起動する。

```sh
netlify dev
```

## コマンド

| コマンド | 内容 |
|---|---|
| `yarn dev` | 開発サーバー（localhost:4321） |
| `yarn build` | 本番ビルド（`dist/`） |
| `yarn preview` | ビルド結果のプレビュー |
| `yarn check:links` | `dist/` の内部リンクが末尾スラッシュ形かを検査（`yarn build` の後に実行） |

## ディレクトリ

| 場所 | 中身 |
|---|---|
| `src/pages/` | 各ページ（index / techplantstudio / essay / privacy / news） |
| `src/data/` | ニュース・実績・お客様の声のデータ |
| `src/components/`・`src/layouts/` | コンポーネントと共通レイアウト |
| `src/lib/` | SEO の構造化データ、メール、Slack 通知、入力検証 |
| `netlify/functions/` | 問い合わせ受信の Netlify Function |
| `scripts/` | リンク検査、Supabase 疎通確認、GSC・GA4 レポート |
| `docs/` | 設計・仕様・分析のメモ |

## デプロイ

main への push で Netlify が自動ビルドして公開する。設定は `netlify.toml`。

## 編集するときは

作業のルール（日本語での記述、会社の事実と数値の扱い、表記、ブランド色、末尾スラッシュ、環境変数）は `CLAUDE.md` にまとめてある。触る前に読むこと。
