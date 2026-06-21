# コーポレートサイト：ファネル（TOFU/MOFU/BOFU）分析・AIO改善

**株式会社クリエイターのうえきばち** ／ 作成日: 2026-06-21 ／ 対象: creatorpot.net

---

## 0. この文書の目的と一行サマリー

コーポレートサイト（creatorpot.net）を **TOFU / MOFU / BOFU のファネル観点**で分析し、あわせて **AIO（AI検索最適化 / Generative Engine Optimization）** の現状を棚卸しして、コンテンツ・記載内容の改善計画をまとめる。

> **核心：技術的SEO基盤は非常に高水準（★★★★★）。しかしサイト構成は「会社案内＋個別営業LP」に寄っており、ファネルの「入口（TOFU）」と「信頼（MOFU/BOFU）」が薄い。AIOも基盤は強いが、AIが引用・抽出しやすい形にはなっていない。**

改善の方向性は3つ：

1. **入口を増やす（TOFU）** — 検索意図に応える情報系コンテンツ（コラム/ブログ）を新設する。
2. **信頼を補強する（MOFU/BOFU）** — お客様の声・導入事例・統一CTA導線を整える。
3. **AIに拾わせる（AIO）** — llms.txt・Person/Service 構造化データ・引用可能な文体を整える。

### 守る前提（フェンス）

- **既存の文言は改変せず「追記」を基本**とする。情緒的なコピー（エッセイ、ビジョン等）はそのまま維持し、AIO向け改善も結論ブロック・表・FAQの“追加”で対応する。
- **お客様の声・導入事例は事実に基づいて作る**。創作・捏造はしない。実データが無い箇所は構造のみ用意し、後日差し替え前提とする。

---

## 1. サイト現状の棚卸し

### 1.1 ページ構成

| ページ | パス | 役割 | ファネル位置 |
|---|---|---|---|
| トップ | `/` (index.astro) | 会社理念＋全製品/サービスの概要 | TOFU〜BOFU 横断 |
| エッセイ | `/essay` | 代表による情緒的メッセージ | TOFU（共感） |
| ニュース一覧 | `/news` | お知らせ・リリース一覧（9件） | TOFU/信頼 |
| ニュース詳細 | `/news/[slug]` | 個別記事（NewsArticle schema） | TOFU/信頼 |
| 受託開発 | `/techplantstudio` | TechPlant Studio（受託のハブ）＋問い合わせフォーム | MOFU/BOFU |
| 療育AI化 | `/techplantstudio/ryoiku` | 児童発達支援・放デイの業務AI化LP | MOFU/BOFU |
| コミュニティ運営代行 | `/community-ops` | 公式Discord運営代行LP | MOFU/BOFU |
| イベント制作パック | `/event-pack` | リアルイベント全部入りLP | MOFU/BOFU |
| プライバシー | `/privacy` | 個人情報保護方針 | — |

### 1.2 製品・サービスと掲載状況

| 製品/サービス | 主な掲載場所 | 価格表示 |
|---|---|---|
| NoLogic（ノーコードゲーム制作） | トップ、ニュース | 外部誘導（nologic.app） |
| NextCreators（クリエイターDiscord） | トップ、エッセイ | 無料 |
| TechPlant Studio（受託開発） | `/techplantstudio` | 参考価格帯8項目（15万〜/50万〜等） |
| コミュニティ運営代行 | `/community-ops` | 月額10〜20万円 |
| リアルイベント制作パック | `/event-pack` | 80〜150万円 |
| 療育AI化支援 | `/techplantstudio/ryoiku` | 初回30万＋月額10万 |

### 1.3 データファイル

| ファイル | 内容 | 状態 |
|---|---|---|
| `src/data/news.ts` | ニュース9件（告知・リリース型） | ✅ 充実 |
| `src/data/portfolio.ts` | ポートフォリオ3件（Comorevi / STARTUP OASIS / KOSEN GAME JAM） | ⚠️ 件数薄・浅い |
| `src/data/testimonials.ts` | お客様の声 | ❌ **空配列**（「リリース前に実際の声へ差し替え」と注記） |

---

## 2. ファネル別 現状診断

### 2.1 TOFU（認知）— ⚠️ ほぼ不在

**現状**
- `essay.astro`（情緒的・良質なブランド資産）と `news.ts`（9件・告知型）が存在。

**課題**
- 検索意図に応える**情報系コンテンツ（ブログ/コラム）が皆無**。
  - 例：「ノーコード ゲーム 作り方」「Discord コミュニティ 運営 コツ」「放課後等デイサービス 業務効率化 AI」「VTuber ファンコミュニティ 作り方」「周年イベント 進め方」等で**入口になる記事が無い**。
- ニュースはプレスリリース型で、検索流入を狙う how-to / ガイド型ではない。
- トピックハブ・カテゴリ設計が無く、関心段階の訪問者を受け止める器が無い。

### 2.2 MOFU（比較検討）— ⚠️ 重大ギャップあり

**現状**
- 各LPにFAQ＋料金あり（良い）。製品ページも整備済み。

**課題**
- `testimonials.ts` が**空＝お客様の声ゼロ**。← **最大の欠落**。
- ポートフォリオが**3件と薄く、内容も浅い**。「課題→施策→成果（数値）」の**導入事例化がされていない**。
- 比較コンテンツ（**内製 vs 委託**、他社比較、選ばれる理由）が無い。
- **資料DL等のソフトCV導線が無い**（いきなり問い合わせ/予約しかない）。
- 実績数値（200+ゲーム / 100+クリエイター / 連携5社）が**文脈・出典なし**で提示され、検討材料として弱い。

### 2.3 BOFU（決定・行動）— 🟡 LPは良いが全体導線が弱い

**現状**
- LPに料金・CTA・FAQ、`techplantstudio` に問い合わせフォーム、各LPにScheduleCTA（日程調整）。

**課題**
- **決定地点に「声」が無い**（信頼補強が不足）。
- **トップに統一されたCTA / 問い合わせ導線が弱い**。問い合わせが `techplantstudio` に集中し、他サービスからの導線が間接的。
- 「導入の流れ」「選ばれる理由」「実績数字」が決定地点で一貫して提示されていない。

### 2.4 ファネル俯瞰

```
TOFU（認知）     ❌ 入口コンテンツが無い → 検索流入の母数が増えない
   ↓
MOFU（検討）     ⚠️ 声/事例/比較が無い → 信頼が積み上がらない
   ↓
BOFU（決定）     🟡 LPは強いが全体導線と社会的証明が不足
```

---

## 3. AIO（AI検索最適化）現状診断

### 3.1 実装済み（強い基盤）✅

| 項目 | 状態 |
|---|---|
| meta（title/description/OGP/Twitter Card/canonical） | ✅ 全ページ固有設定可・フォールバック完備（`Head.astro`） |
| 構造化データ | ✅ Organization / WebSite / FAQPage / BreadcrumbList / NewsArticle（`src/lib/seo.ts`） |
| sitemap.xml | ✅ `@astrojs/sitemap` 自動生成 |
| robots.txt | ✅ `public/robots.txt`（sitemap参照あり） |
| 見出し階層 | ✅ セマンティック正確・スキップなし |
| 画像alt | ✅ 装飾画像は `aria-hidden`、情報画像は適切なalt |
| パンくず（JSON-LD） | ✅ 各下層ページに実装 |
| パフォーマンス | ✅ CSSインライン化・フォントpreload・画像AVIF/WebP |
| GA4 | ✅ 遅延読み込み最適化・イベント計測対応 |

### 3.2 未対応（AIO改善の余地）❌

| 項目 | 状態 | なぜ重要か |
|---|---|---|
| **`llms.txt`** | ❌ 無し | AIクローラ向けの中核ファイル。サイト要約・主要ページ・サービス概要をAIに直接渡せる |
| **Person schema（代表）** | ❌ 無し | E-E-A-T（経験・専門性・権威・信頼）の実体が弱い。IPA未踏採択等の権威付けがAIに伝わらない |
| **Service / Offer schema** | ❌ 無し | AIが「何を・いくらで売っているか」を構造的に抽出できない |
| Organization の充実 | 🟡 一部 | 住所(PostalAddress)・contactPoint・founder・knowsAbout・areaServed 等が未設定 |
| 引用可能な文体 | ❌ | AIは「結論先出し・自己完結・表・定義・Q&A」を好む。現状本文はストーリー型中心 |
| 可視パンくずUI | ❌ | JSON-LDのみ。画面上の視覚的パンくずが無い |
| 横断FAQ / 用語定義 | ❌ | FAQはLP内に埋め込み。横断ハブ・用語定義が無い |

---

## 4. 実装計画（フェーズ別）

> 方針：**既存の文言は改変せず「追記」を基本**とする（過去フィードバック準拠）。

### フェーズ0：AIO基盤強化（低リスク・即効）

- `public/llms.txt` 追加 — サイト概要／主要ページ／5サービス（要点＋価格帯）／会社情報をMarkdownで構造化（AIクローラ向け）。
- `src/lib/seo.ts` 拡張
  - `personSchema()` … 代表 山縣帆高（jobTitle / worksFor / sameAs / IPA未踏 award / knowsAbout）
  - `organizationSchema()` 拡充 … PostalAddress（神田神保町）・contactPoint・founder・foundingDate・knowsAbout・areaServed
  - `serviceSchema()` … NoLogic／コミュニティ運営代行／イベントパック／受託／療育AI化 を Service＋Offer(priceRange)
- 各サービスLP・トップのサービス節に Service/Offer JSON-LD を `jsonLd` 配列で付与。
- `robots.txt` にAIクローラ（GPTBot / ClaudeBot / PerplexityBot 等）の明示Allow＋llms.txt参照。

### フェーズ1：MOFU/BOFU 信頼の補強

- **お客様の声**：表示コンポーネント新設 → トップ＆各LPへ配置（※実データ必要。虚偽不可なのでReview schemaは実声がある場合のみ）。
- **導入事例の深掘り**：`portfolio.ts` 拡張 or `/works` 新設で「課題→施策→成果」化（Comorevi／KOSEN GAME JAM／STARTUP OASIS）。
- **トップに統一CTA / 問い合わせ導線セクション**を追加。
- 主要LPに「選ばれる理由」「内製 vs 委託」比較ブロックを追記。

### フェーズ2：TOFU コンテンツ基盤

- Astro Content Collections で**コラム/ブログ（`/column`）** ＋ BlogPosting schema ＋ 可視パンくずUI。
- シード記事 3〜5本（検索意図特化）。例：
  - 「ノーコードでゲームを作る方法」
  - 「Discordコミュニティの作り方・運営のコツ」
  - 「放課後等デイサービスの業務をAIで効率化する方法（補助金活用）」
  - 「VTuberの公式ファンコミュニティの作り方」
  - 「周年イベントを成功させる進め方」
- 記事 → 該当LPへの内部リンク / CTA（MOFUハンドオフ）。

### フェーズ3：仕上げ・AIO文体・計測

- 主要ページに「結論先出し要約・定義・比較表」をAIO向けに**追記**。
- FAQ拡充（横断 `/faq` ハブ検討）。
- 記事 `dateModified` 運用、関連記事・内部リンク強化。
- GA4コンバージョンイベント整理（問い合わせ / 診断予約）。

---

## 5. 未決事項（着手前に確認が必要）

1. **実装範囲の優先順位** — フェーズ0+1優先 / 全フェーズ一括 / AIOのみ先行 / TOFU（ブログ）優先 のいずれか。
2. **実証データの調達** — お客様の声・導入事例を、(a) 公開実績から事例化 / (b) 実データ提供 / (c) 構造のみ先行作成、のいずれで進めるか。

---

## 付録：評価サマリ

| 項目 | 実装度 |
|---|---|
| 技術的SEO（meta/OGP/canonical/sitemap/robots） | ★★★★★ |
| 構造化データ（Org/WebSite/FAQ/Breadcrumb/NewsArticle） | ★★★★★ |
| パフォーマンス | ★★★★★ |
| TOFUコンテンツ（情報系記事） | ★☆☆☆☆ |
| MOFU（声・事例・比較） | ★★☆☆☆ |
| BOFU（CTA導線・社会的証明） | ★★★☆☆ |
| AIO（llms.txt / Person・Service schema / 引用文体） | ★★☆☆☆ |

---

## 実装結果（2026-06-21 実施）

上記フェーズ0〜3を全て実装し、`yarn build`（全24ページ）が通過。3観点（事実性・スキーマ／日本語／コード・デザイン）の敵対的レビューを実施し、重大な指摘はなし。

### フェーズ0：AIO基盤
- `src/lib/seo.ts` 拡張：`personSchema()`（代表・IPA未踏）／`organizationSchema()` 拡充（住所・連絡先・founder・knowsAbout）／`serviceSchema()`（Service＋Offer、月額は UnitPriceSpecification で機械可読化）／`nologicAppSchema()`（SoftwareApplication）／`blogPostingSchema()`。
- `public/llms.txt` 新設。`public/robots.txt` にAIクローラ（GPTBot/ClaudeBot/PerplexityBot 等）を明示許可。
- 各サービスLP・トップ・受託ページ（OfferCatalog）にService/Person JSON-LDを配線。

### フェーズ1：MOFU/BOFU 信頼補強（構造先行）
- `Testimonials.astro`（0件時は非表示・`testimonials.ts` にテンプレート整備）をトップに配置。
- トップに統合CTA（`#contact-cta`）。`ComparisonTable.astro`（AIO向け `<table>`）を3LPに追加。
- `portfolio.ts` に `caseStudy`（課題→取り組み→成果）を追加し、`/works`（導入事例）を新設。Footerに内部リンク追加。

### フェーズ2：TOFU コンテンツ基盤
- Astro Content Collections（`src/content.config.ts`／`column`）。`/column` 一覧・記事ページ、可視パンくず（`Breadcrumb.astro`）、BlogPosting／Breadcrumb JSON-LD、関連記事・関連サービスCTA。
- シード記事5本（ノーコードゲーム／Discord運営／放デイAI化／周年イベント／Webアプリ外注）。各記事は対応サービスLPへ内部リンク。ナビ・Footerに `/column` 追加。

### フェーズ3：仕上げ・AIO文体・計測
- `/faq` 横断ハブ（`faq.ts`／FAQPage 15問）。news `dateModified`（`updated` フィールド）対応。
- サービスページ→記事の逆リンク。GA4 `cta_click` 計測（`[data-cta]`）。

### 要確認・未投入データ（運用側で対応）
- **お客様の声**：`src/data/testimonials.ts` は空（=非表示）。実際の声を1件以上入れると自動表示。
- **導入事例の数値・顧客コメント**：`portfolio.ts` の `caseStudy` に、許諾済みの成果数値・コメントを追記。
- **トップの「連携企業数 5」**（既存表記・未改変）：実数の確認を推奨。該当企業を明示できると信頼性が増す。
- **日程調整リンク**：`scheduling.ts` のプレースホルダ（既存TODO）。
