# TechPlantStudio ページ改善 - ToDoリスト

## 凡例

- `[ ]` 未着手
- `[x]` 完了
- 🤖 = AIタスク（Claude が実装）
- 👤 = 人間タスク（チームメンバーが対応）

---

## Phase 1: 優先度高（今週中）

### 1-1. ページ構成の再構成 🤖 ✅

> 参照: `docs/spec/05-page-structure-ux.md`

- [x] セクション順序を再構成（Hero → 信頼の証 → 対応領域 → 中間CTA → チーム → フロー → 最下部CTA → Footer）
- [x] Overviewセクションを廃止し、導入文と強みカードを信頼の証セクションに統合
- [x] 各セクションの `<section>` タグに `data-section` 属性を付与（GA4用）

### 1-2. Heroセクション改善 🤖 ✅

> 参照: `docs/spec/01-hero-cta.md`

- [x] メインコピーを「企画・デザイン・開発、ワンストップで。」に変更
- [x] サブコピーを追加（エンジニア、デザイナー、映像・音楽クリエイターが在籍〜）
- [x] IPA未踏バッジを追加（amber系カラー、補足説明テキスト常時表示）
- [x] プライマリCTAボタン「初回ヒアリング無料 - ご相談はこちら」を追加
- [x] セカンダリボタン「サービス内容を見る」を追加（スムーズスクロール）
- [x] 対応領域セクションに `id="service-details"` を付与

### 1-3. CTA最適化（3箇所配置） 🤖 ✅

> 参照: `docs/spec/01-hero-cta.md`

- [x] Hero内CTA（プライマリ、shadow付き）
- [x] 中間CTA（対応領域セクション末尾、セクション統合型）
  - 誘導テキスト「気になるサービスはありましたか？」
  - ボタン「初回ヒアリング無料 - まずはご相談ください」
- [x] 最下部CTA改修
  - ボタンテキストを「初回ヒアリング無料 - まずはご相談ください」に変更
  - マイクロコピー「通常1営業日以内にご返信いたします」を追加
- [x] 全CTAリンクに `target="_blank"` `rel="noopener noreferrer"` を付与

### 1-4. 信頼の証セクション新設 🤖 ✅

> 参照: `docs/spec/02-trust-section.md`

- [x] `TrustSection.astro` コンポーネントを新規作成
- [x] セクションバッジ「TRACK RECORD」+ タイトル「実績と信頼」を配置
- [x] IPA未踏カード作成（主語「代表が」、補足説明付き）
- [x] NoLogicカード作成（「β版」明記、200+ ゲーム投稿数）
- [x] コミュニティカード作成（100+ 参加者数）
- [x] 各カードに「So What?」一文（受託事業との接続）を追加
- [x] カウントアップアニメーション実装（IntersectionObserver、1.5秒、1回のみ発火）
- [x] コード内に「要定期更新」コメントを記載

### 1-5. テキストカラー改善 🤖 ✅

> 参照: `docs/spec/05-page-structure-ux.md`

- [x] 本文テキストを `text-gray-400` → `text-gray-300` に変更
- [x] カード内 `text-[13px]` → `text-sm`（14px）に変更
- [x] WCAG AAコントラスト比4.5:1以上を確認

---

## Phase 2: 優先度中（2-4週間以内） ✅

### 2-1. 対応領域セクション改善 🤖 ✅

> 参照: `docs/spec/04-faq-pricing.md`

- [x] グリッドを2段構成に変更（上段: 得意領域2枚大きめ、下段: その他4枚）
- [x] ゲーム制作・Webアプリ制作カードに「得意領域」バッジを追加
- [x] 得意領域カードのボーダーを `border-emerald-500/40` に変更

### 2-2. 技術スタック一覧追加 🤖 + 👤

> 参照: `docs/spec/04-faq-pricing.md`

- [x] 🤖 技術ロゴのグリッドUI実装（カテゴリ別表示、レスポンシブ対応）
- [x] 🤖 ロゴデータの型定義（`TechItem` interface）とmap展開の実装
- [ ] 👤 技術ロゴSVGファイルの収集・配置（`/public/logos/` に15種以上）
  - フロントエンド: React, Next.js, Astro, TypeScript, Tailwind CSS
  - バックエンド: Node.js, Python
  - ゲーム・3D: Unity, Blender
  - デザイン: Figma, Adobe Creative Suite
  - AI: OpenAI API, Claude API
  - インフラ: Vercel, AWS, Firebase
- [ ] 👤 掲載技術の最終リストを確定（実際に使用している技術のみ）

### 2-3. 実績・ポートフォリオセクション新設 🤖 + 👤 ✅（AI部分）

> 参照: `docs/spec/03-portfolio.md`

- [x] 🤖 `src/data/portfolio.ts` データファイル作成（型定義 + 初期データ）
- [x] 🤖 `src/data/testimonials.ts` データファイル作成（型定義 + 空配列）
- [x] 🤖 `PortfolioCard.astro` コンポーネント作成（featured全幅対応）
- [x] 🤖 テスティモニアル表示をページ内にインライン実装（独立コンポーネント不要）
- [x] 🤖 ポートフォリオセクションのUI実装（バッジ「WORKS」、グリッド、ホバーエフェクト）
- [x] 🤖 テスティモニアルが0件の場合、エリア非表示のロジック実装
- [x] 🤖 画像未設定時のグラデーション背景フォールバック実装
- [ ] 👤 NoLogicのスクリーンショット撮影・配置（`/public/portfolio/nologic.png`）
- [ ] 👤 コーポレートサイトのスクリーンショット撮影・配置（`/public/portfolio/corporate-site.png`）
- [ ] 👤 テスティモニアルの声をコミュニティメンバーから収集（許可取得含む）

### 2-4. チーム紹介の構造変更 🤖 + 👤

> 参照: `docs/spec/05-page-structure-ux.md`

- [x] 🤖 代表プロフィールを大きく表示（160x160px、カード型、左辺emerald縦線）
- [x] 🤖 他メンバーをコンパクト表示（80x80px、説明文非表示）
- [x] 🤖 レスポンシブ対応（代表: PC横並び/モバイル縦並び、他: PC5列/タブレット3列/モバイル2列）
- [ ] 👤 メンバーのアバター画像を作成・配置（写真またはイラスト）

### 2-5. FAQ / 参考価格セクション新設 🤖 + 👤 ✅（AI部分）

> 参照: `docs/spec/04-faq-pricing.md`

- [x] 🤖 FAQアコーディオンUI実装（`<details>` / `<summary>`、CSSアニメーション）
- [x] 🤖 FAQ 7問のコンテンツ実装
- [x] 🤖 参考価格カードグリッド実装（6領域分）
- [x] 🤖 得意領域の価格カードに軽い強調（`border-emerald-500/30`）
- [x] 🤖 注意書き（参考価格・税別・無料見積もり）を配置
- [ ] 👤 FAQ回答内容の最終確認・修正
- [ ] 👤 参考価格帯の金額を最終確定

### 2-6. 制作フロー モバイル改善 🤖 ✅

> 参照: `docs/spec/05-page-structure-ux.md`

- [x] モバイル表示時のステップ間に縦線を追加（emerald-500/30、2px幅）
- [x] 各ステップに期間目安テキストを追加（「目安: 約1週間」等）
- [x] PC表示時の横矢印は維持

---

## Phase 3: 優先度低（1-2ヶ月以内）

### 3-1. スクロールアニメーション 🤖 ✅

> 参照: `docs/spec/05-page-structure-ux.md`

- [x] CSSクラス定義（`.animate-on-scroll`、`.is-visible`、スタガーディレイ）
- [x] IntersectionObserver実装（threshold: 0.1、1回のみ発火）
- [x] 対象要素にクラスと `data-delay` 属性を付与（JSで自動検出・付与）
- [x] `prefers-reduced-motion: reduce` 対応（アニメーション無効化）
- [x] CLS（Cumulative Layout Shift）が発生しないことを確認（opacity+transformのみ使用）

### 3-2. GA4イベントトラッキング 🤖 + 👤 ✅（AI部分）

> 参照: `docs/spec/05-page-structure-ux.md`

- [ ] 👤 GA4タグ（gtag.js）を `Head.astro` に追加（未実装の場合）
- [ ] 👤 GA4プロパティの作成・設定
- [x] 🤖 gtagラッパー関数の実装（`trackEvent` ユーティリティ、未設置ガード付き）
- [x] 🤖 `cta_click` イベント実装（3箇所の `data-cta-location` 属性）
- [x] 🤖 `section_impression` イベント実装（IntersectionObserverで検知）
- [x] 🤖 `faq_expand` イベント実装（`<details>` の `toggle` イベント監視）
- [ ] 👤 GA4 Enhanced Measurement でスクロール深度計測を有効化

### 3-3. お問い合わせフォーム（Netlify Functions + Netlify DB） 🤖 + 👤

> 参照: `docs/netlify-contact-form-plan.md`

- [x] 👤 フォーム要件の決定（項目数、バリデーション、通知先）
- [x] 🤖 サイト内埋め込みフォーム UI の実装
- [x] 🤖 同一ページ内サンクス表示の実装（独立サンクスページは未採用）
- [新たx] 🤖 `techplantstudio` ページの Google Forms 導線をサイト内フォームに切り替え
- [x] 🤖 成功メッセージと実際の通知結果の整合見直し
- [x] 🤖 Netlify Forms への暫定切り替え（退避用）
- [x] 🤖 Cloudflare Turnstile / D1 前提の実装を撤去または無効化
- [ ] 👤 Netlify DB の作成・claim・接続確認
- [ ] 👤 Functions 用環境変数の設定（Resend / Slack / DB 接続情報）
- [x] 🤖 `netlify/functions/contact.ts` の新規実装
- [x] 🤖 問い合わせ保存用のスキーマ定義追加（contacts テーブル）
- [x] 🤖 Function 内のバリデーション・保存・エラーハンドリング実装
- [x] 🤖 自動返信メール送信を Netlify Functions 経由で実装
- [x] 🤖 管理者通知メール送信を Netlify Functions 経由で実装
- [x] 🤖 Slack 通知の実装または切り替え要否の整理
- [x] 🤖 `ContactForm.tsx` の送信先を `/.netlify/functions/contact` に変更
- [x] 🤖 Netlify Forms 用の hidden form / 属性を撤去
- [ ] 👤 本番相当環境での疎通確認（送信、DB 保存、自動返信、管理者通知）

### 3-4. テスティモニアル掲載 👤

- [ ] コミュニティメンバーから実際の声を収集（最低2件）
- [ ] 掲載許可を取得
- [ ] `src/data/testimonials.ts` にデータを追加
- [ ] プレースホルダーでないことを確認してからリリース

### 3-5. ケーススタディ拡張（将来） 🤖 + 👤

- [ ] 👤 クライアントワーク実績の蓄積
- [ ] 🤖 Astro Content Collections への移行
- [ ] 🤖 ケーススタディ個別ページの生成（`/techplantstudio/works/[slug]`）

---

## QA指摘対応（2026-03-10）

> 参照: `docs/issues.md`

### QA-1. トップページ＞SERVICES＞「ゲーム制作」カードの緑ボーダー常時表示 🤖 ✅

- [x] `index.astro` SERVICES セクションの「ゲーム制作」カードの `border-emerald-500/20` を他カードと同じ `border-[#1E293B]` に統一

### QA-2. 業務委託ページ＞TRACK RECORD＞ホバー時の緑ボーダー 🤖 ✅

- [x] `TrustSection.astro` 実績カード3枚から `hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5` を削除、ボーダーを `border-[#1E293B]` に統一

### QA-3. 業務委託ページ＞TECH STACK & TOOLS＞ホバー時の緑ボーダー 🤖 ✅

- [x] `techplantstudio.astro` TECH STACK & TOOLS の各ツール名から `hover:border-emerald-500/30 transition-colors` を削除

### QA-4. 業務委託ページ＞相談フォーム＞テキストボックスのリサイズ不可 🤖 ✅

- [x] `ContactForm.tsx` textarea に `style={{ resize: "vertical" }}` をインラインスタイルで明示的に指定、`overflow-y-auto` を追加

---

## 横断タスク（全Phase共通）

### 品質確認 🤖

- [ ] モバイル（375px幅）での表示確認
- [ ] デスクトップ（1280px幅）での表示確認
- [x] `npm run build` がエラーなく完了すること
- [ ] Lighthouse Performance スコア90以上を維持
- [ ] 主要ブラウザ（Chrome, Safari, Firefox）での表示確認

### コンテンツ確認 👤

- [ ] メンバー紹介テキストの記入完了
- [ ] 全コピー・テキストの最終レビュー
- [ ] 外部リンク（Google Forms, NoLogic, Discord）の動作確認
- [ ] 「要定期更新」数値（ゲーム投稿数、コミュニティ参加者数）の最新化
