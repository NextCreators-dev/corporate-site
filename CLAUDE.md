# CLAUDE.md

株式会社クリエイターのうえきばちのコーポレートサイト（https://creatorpot.net）。Astro 5 + Tailwind + yarn、Netlify にデプロイ。事業は NoLogic（ノーコードゲーム制作）、NextCreators（Discord コミュニティ）、TechPlant Studio（受託）の3つ。

## 守ってほしいこと

- やりとり・コード内のコメント・コミットメッセージは日本語
- 会社の事実と数値を勝手に書かない・更新しない。トップの実績数値（ゲーム数・クリエイター数・連携企業数）、メンバー数、設立日、リリース日、採択歴は代表の指示があるときだけ変える。数値を書くときは経営ポータルの `fundraising/master-numbers.md` の値に実測日を添える（例: 完了310本・2026-09-05 本番DB実測）。ポータルは代表の環境ではこのリポジトリの親ディレクトリにある
- 表記の正は社名「株式会社クリエイターのうえきばち」。「植木鉢」「クリエーター」「Creator Pot」「creatorpot（社名として）」は使わない。`src/lib/seo.ts` の alternateName にある "CreatorPot" は検索エンジン向けの別称で、表記の正ではない。みらいスタジオは当社ではなく別法人。所在地に含まれる拠点名として以外は書かない
- 色・文字・部品の決まりは `docs/DESIGN.md`、変数の正は `src/styles/site.css`。2026-10 に明るい配色へ移した。サイトはエメラルドを使い続け、slide-kit 規約のティールには合わせない（経営ポータルの決定 0087）。指示なく色を変えない
- 対外ページは、読み手の判断に効かない飾り（理由のない3列カード、意味のないアイコン、光彩）を置かない。文言は `.claude/skills/b2b-lp-copy-jp/` で骨格を決め、`.claude/skills/stop-ai-slop-jp/` で1回推敲する
- メンバー情報は双方向。掲載本文は `src/data/members.ts`、顔写真は `public/members/` にあり、経営ポータルの `company/team.md` がここを出典にしている。変えたら team.md 側の更新も代表に伝える

## 構成

- ページは `index`（理念 / 何の会社かと事業内容 / ご用件ごとの入口と料金の目安 / NoLogic / 体制 / 実績 / 私たちについて / お知らせ / 会社概要）、`techplantstudio`（Unity・ブラウザのミニゲーム・AI研修、料金、進め方、体制、実績、FAQ、問い合わせフォーム）、`techplantstudio/ip-minigame`（版権・IP企業向けのミニゲーム）、`business-game`（社内研修向けのゲーム。独自テーマ）、`essay`、`privacy`、`news/index`、`news/[slug]`
- コンテンツの入口は `src/data/`（`news.ts` `portfolio.ts` `testimonials.ts`）。ニュースを足すのは `news.ts` で、sitemap の `lastmod` も `astro.config.mjs` がここから生成する。`testimonials.ts` は現在0件で、その場合はセクションごと非表示になる。公開前に実際の声へ差し替える
- SEO は `src/lib/seo.ts` の JSON-LD ビルダー（Organization / WebSite / NewsArticle / BreadcrumbList / FAQPage）。`Layout.astro` 1枚が全ページを包み、`Head.astro` が astro-seo のメタと JSON-LD を出す
- コンポーネントは `.astro`。React は `ContactForm.tsx` だけで `client:load`
- `src/lib/` に `mail.ts`（Resend）・`slack.ts`・`validation.ts`（zod）・`gtag.ts`。入力検証はフォームと Netlify Function が `validation.ts` の同じスキーマを共有する
- エイリアスは `@components/` `@layouts/` `@public/`。`@assets/` は `tsconfig.json` にあるだけで未使用で、`src/assets/` は相対パスで読んでいる
- 画像は Astro の `Image` コンポーネントで最適化する

## 規約

- パッケージ管理は yarn。Node 22 を `.node-version`・`package.json` の `engines`・`netlify.toml` の `NODE_VERSION` の3か所で揃える
- `trailingSlash` は `always`。内部リンクは必ず末尾スラッシュで書く（非スラッシュは本番で301、dev では404）。リンクを足したら `yarn build && yarn check:links`
- コマンドは `yarn dev`（localhost:4321）/ `yarn build` / `yarn preview` / `yarn check:links`。問い合わせフォームをローカルで動かすには `netlify dev` が要る
- `tailwind.config.mjs` の `extend` は空。色は `src/styles/site.css` の CSS 変数を `text-[var(--muted)]` のように使う

## デプロイと外部連携

- Netlify（`netlify.toml`、publish は `dist`、Functions は `netlify/functions`）。main への push で自動デプロイ
- 問い合わせは `netlify/functions/contact.ts`。Supabase の `contacts` テーブルへ保存し、Resend で自動返信と管理者通知、Slack へ Webhook 通知する。環境変数は `SUPABASE_URL` `SUPABASE_SERVICE_ROLE_KEY` `RESEND_API_KEY` `MAIL_FROM` `MAIL_ADMIN` `SLACK_WEBHOOK_URL`。テーブル定義は `db/schema.sql`
- ビルド時に読む公開変数は `PUBLIC_GSC_VERIFICATION`（Search Console 認証）と `PUBLIC_GA_MEASUREMENT_ID`（GA4）。未設定ならタグを出力しない
- `.github/workflows/supabase-keepalive.yml` は Supabase Free の自動停止（7日間無活動）を防ぐ日次 cron。`scripts/keepalive.mjs` を `SUPABASE_URL` `SUPABASE_ANON_KEY` `SLACK_WEBHOOK_URL` で走らせる。service role キーは使わない
- `scripts/analytics/` と `.claude/skills/seo-report/` は GSC・GA4 から実測を取るレポート生成。Google のサービスアカウント鍵はリポジトリに置かない（`.gitignore` 済み）

## 注意

- `docs/PRODUCT.md` には訂正注記つきの誤記（β版の時期、未踏の主体）が本文に残る。会社の事実の一次情報にしない。正は経営ポータルの `company/facts.md`
- `src/components/Welcome.astro` は Astro スターターの残骸で、どこからも参照されていない。消すなら確認してから
