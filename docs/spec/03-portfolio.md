# 要件定義書: 実績・ポートフォリオセクション

## 概要

TechPlantStudioページにおける「実績・ポートフォリオセクション」の新設。対応領域セクションと中間CTAの間に配置し、自社プロダクト・クライアントワーク・テスティモニアルを掲載することで、発注検討者の信頼獲得とCVR向上を図る。

## 背景・目的

**背景:**
- 株式会社クリエイターのうえきばちは2024年11月設立の若い会社であり、実績面での信頼構築が事業成長の鍵
- 現状のTechPlantStudioページにはサービス内容・メンバー・制作フローの記載はあるが、具体的な成果物を示すセクションが存在しない
- 発注検討者にとって「実際に何を作れるのか」が不明確で、問い合わせへの心理的障壁が高い

**目的:**
- 自社プロダクト（NoLogic）やコーポレートサイト等の具体的成果物を提示し、技術力・デザイン力の裏付けとする
- テスティモニアルによる第三者評価で信頼性を補完する
- 将来的なクライアントワーク追加を見据えた拡張可能な構造を設計する

## チーム議論サマリー

### CTO（技術視点）
- ポートフォリオカードは再利用可能なAstroコンポーネント（`PortfolioCard.astro`）として設計し、propsでデータを注入する構造にする
- 将来的にAstroのContent Collections機能でMarkdownファイルからの動的生成に移行できるよう、データ構造を先に定義しておく
- 画像は`<Image>`コンポーネントによる最適化必須。OGP用メタデータも考慮した構造にする
- テスティモニアルもデータ駆動で、配列からmap生成する設計にすることで追加・編集を容易にする
- スクリーンショットはWebP形式を推奨。ファーストビューから離れているためlazy loadingを適用

### CMO（マーケティング視点）
- 「実績が少ない」ことをネガティブに見せない構成が重要。自社プロダクトは「自社プロダクト」として堂々と見せ、IPA未踏採択という権威付けを活用する
- テスティモニアルはコミュニティメンバーの声で初期代替可能。ただし「コミュニティメンバーの声」と明示し、クライアントの声と誤認させない
- カテゴリバッジ（自社プロダクト / クライアントワーク / コミュニティ）で分類することで、実績の文脈を明確化
- 「開発中」「β版」等のステータス表示は正直さの演出として有効。スタートアップらしい透明性を強みに変える
- ポートフォリオセクション下部にも軽めのCTA（「一緒にプロジェクトを始めませんか？」等）を配置し、実績閲覧後の導線を確保

### ペルソナ（業務委託発注企業担当者の視点）
- 発注判断において重視するのは: (1) 完成品のクオリティ (2) 技術スタックの適合性 (3) 類似案件の経験有無
- NoLogicは「ノーコードプラットフォームを自社開発できる技術力」の証明として非常に有効
- コーポレートサイトは「Astro + Tailwind CSS」の技術実績として説得力がある
- 実績数よりも、各案件の深さ（何を課題とし、どう解決したか）が伝わる方が安心感がある
- テスティモニアルはあれば加点だが、なくても実績カードの質が高ければ問い合わせには至る

### デビルズアドボケート（リスク・懸念視点）
- **実績2件（自社のみ）で「ポートフォリオ」と呼ぶリスク**: セクションタイトルを「実績・プロダクト」等にし、「ポートフォリオ一覧」感を薄める。自社プロダクトの深い紹介にフォーカスする構成に
- **スクリーンショットの品質問題**: 中途半端なスクリーンショットは逆効果。NoLogicのUIが十分な品質でない場合、デモリンクへの誘導をメインにし、スクリーンショットは厳選する
- **テスティモニアルの信頼性**: コミュニティメンバーの声は「身内の声」と捉えられるリスクあり。プロフィール情報（肩書き・活動内容）を添えて実在感を出す
- **「開発中」表記のダブルスタンダード**: 発注検討者が「この会社はまだ自社プロダクトすら完成していないのか」と受け取る可能性。対策として、IPA未踏採択・ゲーム投稿200件超等の客観的実績数値を併記する
- **空白感の回避**: クライアントワーク0件の状態で「クライアントワーク」枠を出すと空虚。初期段階では表示せず、実績が追加された時点で表示するフラグ制御を設ける

---

## 要件詳細

### セクション構成

#### 配置位置
- TechPlantStudioページ（`/techplantstudio`）の**対応領域セクション（Service Details）の直後**、**メンバーセクションの前**に配置
- 現在の構成: Hero → Overview → Service Details → **[実績セクション（新設）]** → Members → Flow → CTA

#### レイアウト
- セクション背景: `bg-[#111827]`（暗めの背景で対応領域セクションとの視覚的区切りを作る）
- セクション内パディング: `py-20 px-5 md:px-[120px]`（既存セクションと統一）
- 最大幅: `max-w-7xl mx-auto`
- 構成:
  1. セクションバッジ（`WORKS`）
  2. セクションタイトル（「実績・プロダクト」）
  3. セクション説明文
  4. ポートフォリオカードグリッド
  5. テスティモニアルエリア
  6. 軽量CTA

### ポートフォリオカード仕様

#### カード構成要素

```typescript
// ポートフォリオカードのデータ型定義
interface PortfolioItem {
  title: string;            // プロジェクト名
  category: 'product' | 'client' | 'community';  // カテゴリ
  categoryLabel: string;    // カテゴリ表示名（「自社プロダクト」「クライアントワーク」等）
  status?: 'released' | 'beta' | 'development';  // ステータス（任意）
  statusLabel?: string;     // ステータス表示名（「β版運用中」「開発中」等）
  description: string;      // 概要説明（2-3行）
  techStack: string[];      // 使用技術タグ
  image?: string;           // スクリーンショット画像パス（任意）
  url?: string;             // 外部リンク（任意）
  metrics?: string[];       // 実績数値（「ゲーム投稿200件超」等）
  featured?: boolean;       // 注目実績フラグ（大きく表示）
}
```

#### カードのビジュアル仕様
- 背景: `bg-[#0A0F1C]`
- ボーダー: `border border-[#1E293B]`、featuredの場合 `border-emerald-500/30`
- 角丸: `rounded-2xl`
- 画像エリア: アスペクト比 16:9、`overflow-hidden rounded-t-2xl`
- カテゴリバッジ: `bg-emerald-500/10 text-emerald-500 text-[11px] font-semibold rounded border border-emerald-500/20 px-3 py-1`
- ステータスバッジ: `bg-amber-500/10 text-amber-400 text-[11px] font-semibold rounded border border-amber-500/20 px-3 py-1`
- 技術タグ: `bg-white/5 text-gray-400 text-[11px] rounded px-2 py-0.5`
- リンクボタン: テキストリンク形式 `text-emerald-500 text-sm font-medium hover:underline`

#### グリッドレイアウト
- デスクトップ: `grid-cols-2`（2カラム、featured項目は `col-span-2` で全幅）
- タブレット: `grid-cols-2`
- モバイル: `grid-cols-1`
- ギャップ: `gap-6`

#### 初期掲載コンテンツ

**1. NoLogic（featured: true）**
- カテゴリ: 自社プロダクト
- ステータス: β版運用中
- 説明: ノーコードゲーム制作プラットフォーム。イラスト1枚からオリジナルゲームを生成。IPA未踏IT人材発掘・育成事業採択。
- 技術タグ: TypeScript, React, Node.js, WebSocket
- 画像: NoLogicのエディタ画面スクリーンショット（品質基準を満たすもの）
- URL: https://nologic.creatorpot.net/ja
- 実績数値: 「ゲーム投稿200件超」「サービス来訪者400名超」

**2. コーポレートサイト（featured: false）**
- カテゴリ: 自社プロダクト
- ステータス: 運用中
- 説明: 自社コーポレートサイト。ダークテーマのモダンなデザインとパフォーマンスを両立。
- 技術タグ: Astro, Tailwind CSS, TypeScript
- 画像: creatorpot.netのトップページスクリーンショット
- URL: https://creatorpot.net

**3. クライアントワーク枠（初期非表示）**
- `featured: false`
- 実績追加時にデータ配列に追加するだけで表示される構造
- 初期段階ではデータが空のため、セクション内にクライアントワークカードは表示しない

### テスティモニアル仕様

#### 表示形式
- ポートフォリオカードグリッドの下部に配置
- 横スクロール（モバイル）/ 2カラムグリッド（デスクトップ）
- カード型: `bg-[#0A0F1C] p-6 rounded-xl border border-[#1E293B]`
- 引用符アイコン（`"`）を装飾として左上に配置（`text-emerald-500/20 text-4xl`）

#### テスティモニアルのデータ型

```typescript
interface Testimonial {
  quote: string;        // 引用文（2-3文）
  name: string;         // 氏名またはハンドルネーム
  role: string;         // 肩書き・属性（「ゲームクリエイター / コミュニティメンバー」等）
  avatar?: string;      // アバター画像（任意）
  source: 'community' | 'client';  // 出典区分
}
```

#### 初期コンテンツ（コミュニティメンバーの声で代替）

セクション冒頭に「コミュニティメンバーの声」と明記。

**プレースホルダー例（実際の声を収集後に差し替え）:**

1. 「NoLogicのおかげで、プログラミング経験がなくてもゲームを作って公開できた。テンプレートから始められるので、アイデアをすぐ形にできるのが嬉しい。」 — コミュニティメンバー / イラストレーター

2. 「Discordコミュニティで制作の相談ができる環境があるのが心強い。異なるジャンルのクリエイターからフィードバックをもらえるのは貴重。」 — コミュニティメンバー / ゲームクリエイター

3. 「設立間もない会社とは思えないスピード感で機能改善が進んでいる。ユーザーの声を本当に聞いてくれていると感じる。」 — コミュニティメンバー / Web開発者

> **注意**: 上記はプレースホルダーであり、実際のコミュニティメンバーから許可を得た上で差し替えること。

### 拡張性

#### 新規実績の追加方法

**Phase 1（現状）: データ配列による管理**
- `techplantstudio.astro` 内のfrontmatter部分またはデータファイル（`src/data/portfolio.ts`）に配列として定義
- 新規実績はオブジェクトを配列に追加するだけで表示される

```typescript
// src/data/portfolio.ts
export const portfolioItems: PortfolioItem[] = [
  {
    title: 'NoLogic',
    category: 'product',
    categoryLabel: '自社プロダクト',
    status: 'beta',
    statusLabel: 'β版運用中',
    // ...
  },
  // 新規実績をここに追加
];
```

**Phase 2（将来）: Astro Content Collections**
- `src/content/portfolio/` ディレクトリにMarkdownファイルで個別管理
- frontmatterにメタデータ、本文にケーススタディの詳細を記載
- 一覧ページは自動生成、個別ページへのリンクも自動化

```
src/content/portfolio/
  ├── nologic.md
  ├── corporate-site.md
  └── client-project-001.md
```

#### ケーススタディページへの発展

- 各ポートフォリオカードに `slug` フィールドを追加し、`/techplantstudio/works/[slug]` として個別ページを生成可能にする
- ケーススタディページの構成: 課題 → アプローチ → 技術的詳細 → 成果 → クライアントの声
- Phase 1ではリンク先を外部URL（NoLogicサイト等）とし、Phase 2でケーススタディページに切り替え

---

## デザイン仕様

### カラーパレット（既存ダークテーマ準拠）
| 用途 | カラー |
|------|--------|
| セクション背景 | `#111827` |
| カード背景 | `#0A0F1C` |
| カードボーダー | `#1E293B`（通常）/ `emerald-500/30`（featured） |
| テキスト（見出し） | `#FFFFFF` |
| テキスト（本文） | `text-gray-400`（`#9CA3AF`） |
| アクセント | `emerald-500`（`#10B981`） |
| ステータスバッジ | `amber-400`（`#FBBF24`） |
| 技術タグ背景 | `white/5` |

### タイポグラフィ
| 要素 | スタイル |
|------|----------|
| セクションバッジ | `text-xs font-bold tracking-[2px]` |
| セクションタイトル | `text-[32px] font-extrabold` |
| セクション説明 | `text-gray-400 text-base leading-relaxed` |
| カードタイトル | `text-white text-lg font-bold` |
| カード説明 | `text-gray-400 text-sm leading-relaxed` |
| テスティモニアル引用 | `text-white text-sm leading-relaxed italic` |
| テスティモニアル氏名 | `text-white text-sm font-semibold` |

### アニメーション
- カードホバー: `transition-all duration-300` で `border-color` を `emerald-500/40` に変化
- スクロールイン: 将来的にIntersection Observer でフェードインを検討（Phase 1では不要）

---

## レスポンシブ対応

| ブレークポイント | ポートフォリオグリッド | テスティモニアル | パディング |
|---|---|---|---|
| モバイル（< 768px） | 1カラム | 1カラム（縦積み） | `px-5 py-20` |
| タブレット（768px〜） | 2カラム | 2カラム | `px-5 py-20` |
| デスクトップ（1024px〜） | 2カラム（featured: 全幅） | 2カラム | `px-[120px] py-20` |

### モバイル固有の対応
- featured カードも1カラム表示（`col-span-1`）
- テスティモニアルは縦積み
- 画像のアスペクト比は維持しつつ、幅を `w-full` で可変
- 技術タグは折り返し表示（`flex-wrap`）

---

## 実装メモ

### ファイル構成
```
src/
  components/
    PortfolioCard.astro       # ポートフォリオカードコンポーネント
    TestimonialCard.astro     # テスティモニアルカードコンポーネント
  data/
    portfolio.ts              # ポートフォリオデータ
    testimonials.ts           # テスティモニアルデータ
  pages/
    techplantstudio.astro     # セクション追加
public/
  portfolio/                  # ポートフォリオ画像格納先
    nologic.png
    corporate-site.png
```

### データファイル仕様

#### `src/data/portfolio.ts`

```typescript
// 型定義
export interface PortfolioItem {
  /** プロジェクト名 */
  title: string;
  /** カテゴリ */
  category: "product" | "client" | "community";
  /** カテゴリ表示名（「自社プロダクト」「クライアントワーク」等） */
  categoryLabel: string;
  /** ステータス */
  status?: "released" | "beta" | "development";
  /** ステータス表示名（「β版運用中」「運用中」等） */
  statusLabel?: string;
  /** 概要説明（2-3行） */
  description: string;
  /** 使用技術タグ */
  techStack: string[];
  /** スクリーンショット画像パス（/public 配下の相対パス） */
  image?: string;
  /** 外部リンクURL */
  url?: string;
  /** 実績数値（「ゲーム投稿200件超」等） */
  metrics?: string[];
  /** 注目実績フラグ（trueで全幅表示） */
  featured?: boolean;
}

// 初期データ
export const portfolioItems: PortfolioItem[] = [
  {
    title: "NoLogic",
    category: "product",
    categoryLabel: "自社プロダクト",
    status: "beta",
    statusLabel: "β版運用中",
    description:
      "ノーコードゲーム制作プラットフォーム。イラスト1枚からオリジナルゲームを生成。IPA未踏IT人材発掘・育成事業採択プロジェクト。",
    techStack: ["TypeScript", "React", "Node.js", "WebSocket"],
    image: "/portfolio/nologic.png",
    url: "https://nologic.creatorpot.net/ja",
    metrics: ["ゲーム投稿 200件超", "サービス来訪者 400名超"],
    featured: true,
  },
  {
    title: "コーポレートサイト",
    category: "product",
    categoryLabel: "自社プロダクト",
    status: "released",
    statusLabel: "運用中",
    description:
      "株式会社クリエイターのうえきばちのコーポレートサイト。ダークテーマのモダンなデザインとパフォーマンスを両立。",
    techStack: ["Astro", "Tailwind CSS", "TypeScript"],
    image: "/portfolio/corporate-site.png",
    url: "https://creatorpot.net",
  },
];
```

##### ポートフォリオの追加方法

`portfolioItems` 配列にオブジェクトを追加するだけで表示される。

```typescript
// クライアントワークの追加例
{
  title: "案件名",
  category: "client",
  categoryLabel: "クライアントワーク",
  status: "released",
  statusLabel: "納品済み",
  description: "案件の概要を2-3行で記載",
  techStack: ["React", "Next.js"],
  image: "/portfolio/project-name.png",
  url: "https://example.com",
  metrics: ["成果指標があれば記載"],
},
```

#### `src/data/testimonials.ts`

```typescript
// 型定義
export interface Testimonial {
  /** 引用文（2-3文） */
  quote: string;
  /** 氏名またはハンドルネーム */
  name: string;
  /** 肩書き・属性（「ゲームクリエイター / コミュニティメンバー」等） */
  role: string;
  /** アバター画像パス（/public 配下の相対パス） */
  avatar?: string;
  /** 出典区分 */
  source: "community" | "client";
}

// 初期データ（空配列 — 実際の声を収集後に追加）
// テスティモニアルが0件の場合、セクション自体を非表示にする
export const testimonials: Testimonial[] = [];
```

##### テスティモニアルの追加方法

`testimonials` 配列にオブジェクトを追加するだけで表示される。

```typescript
// コミュニティメンバーの声の追加例
{
  quote: "引用文をここに記載（2-3文）",
  name: "メンバー名",
  role: "イラストレーター / コミュニティメンバー",
  source: "community",
},

// クライアントの声の追加例
{
  quote: "引用文をここに記載（2-3文）",
  name: "担当者名",
  role: "株式会社〇〇 / マーケティング部",
  avatar: "/portfolio/avatars/client-name.png",
  source: "client",
},
```

#### 表示ロジック

| 条件 | 表示 |
|------|------|
| `portfolioItems` が空 | ポートフォリオセクション自体を非表示 |
| `portfolioItems` に `category: "client"` がない | クライアントワーク枠は非表示（自社プロダクトのみ表示） |
| `testimonials` が空 | テスティモニアルエリアを非表示 |
| `testimonials` に `source: "community"` のみ | 「コミュニティメンバーの声」と明記 |
| `testimonials` に `source: "client"` が含まれる | 「お客様・コミュニティの声」と表記 |

### コンポーネント設計方針
- `PortfolioCard.astro`: propsで `PortfolioItem` を受け取り、条件分岐でfeatured表示を切り替え
- `TestimonialCard.astro`: propsで `Testimonial` を受け取る純粋な表示コンポーネント
- 両コンポーネントはTechPlantStudioページ以外（コーポレートサイトトップ等）でも再利用可能な設計

### 画像の取り扱い
- スクリーンショット画像は `/public/portfolio/` に配置
- Astroの `<Image>` コンポーネントで最適化（WebP変換、サイズ指定）
- `loading="lazy"` を適用（ファーストビュー外のため）
- 画像が未準備（`image` 未指定）の場合、グラデーション背景をフォールバックとして表示

### パフォーマンス考慮
- 画像の遅延読み込み（lazy loading）
- 適切な `width` / `height` 属性によるCLS防止
- データファイル分離により、ページコンポーネントの肥大化を防止

### 注意事項
- 初期段階ではクライアントワーク枠は非表示。`portfolio.ts` にデータが追加された時点で自動表示
- テスティモニアルのプレースホルダーは必ず実際の声に差し替えてからリリースすること
- スクリーンショットは品質チェック後に掲載。品質基準を満たさない場合は `image` を省略しデモリンクのみとする

---

## 受け入れ基準

### 必須（Must）
- [ ] 対応領域セクションの直後にポートフォリオセクションが表示される
- [ ] セクションバッジ（WORKS）、タイトル、説明文が表示される
- [ ] NoLogicのポートフォリオカードが表示される（タイトル、カテゴリバッジ、ステータスバッジ、説明、技術タグ、リンク）
- [ ] コーポレートサイトのポートフォリオカードが表示される
- [ ] NoLogicカードがfeatured表示（全幅）になっている
- [ ] テスティモニアルが最低2件表示される
- [ ] テスティモニアルに「コミュニティメンバーの声」と明記されている
- [ ] モバイル・タブレット・デスクトップで適切にレスポンシブ対応している
- [ ] 既存のダークテーマ（`#0A0F1C` / `#111827`）・アクセントカラー（emerald-500）と統一されている
- [ ] `PortfolioCard.astro` が再利用可能なコンポーネントとして実装されている
- [ ] データ配列への追加のみで新規実績カードが表示される構造になっている

### 推奨（Should）
- [ ] 画像が `<Image>` コンポーネントで最適化されている
- [ ] `loading="lazy"` が適用されている
- [ ] カードホバー時にボーダーカラーが変化するインタラクションがある
- [ ] ポートフォリオセクション下部に軽量CTAが配置されている
- [ ] `src/data/portfolio.ts` としてデータが分離されている

### 将来対応（Won't - Phase 2）
- [ ] Astro Content Collectionsへの移行
- [ ] ケーススタディ個別ページ（`/techplantstudio/works/[slug]`）の生成
- [ ] スクロールインアニメーション
- [ ] クライアントワーク実績の掲載（実績発生時）
