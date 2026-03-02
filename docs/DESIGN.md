# DESIGN.md - デザインガイドライン

株式会社クリエイターのうえきばち コーポレートサイト (creatorpot.net) のデザインガイドラインです。
すべてのページ・コンポーネント制作時にこのドキュメントを参照してください。

---

## 1. デザイン原則

### 1-1. ダークファースト
サイト全体をダークカラーで統一し、プロフェッショナルかつ没入感のある体験を提供します。エメラルドグリーンのアクセントで視線を誘導し、CTAや重要な情報を際立たせます。

### 1-2. クリエイターに寄り添うデザイン
ターゲットであるクリエイターが「自分の居場所」と感じられるよう、洗練されていながらも温かみのあるトーンを維持します。過度な装飾を避け、コンテンツが主役になるレイアウトを心がけます。

### 1-3. モバイルファースト
モバイル端末での閲覧体験を最優先に設計し、デスクトップへ拡張します。タッチ操作を前提としたUI設計（十分なタップ領域、適切な間隔）を徹底します。

### 1-4. 一貫性と再利用性
コンポーネントベースの設計により、デザインの一貫性を保ちながら開発効率を高めます。新しい要素を追加する際は、既存のパターンを優先的に活用してください。

### 1-5. 視認性とアクセシビリティ
ダーク背景上のテキストは十分なコントラスト比を確保します。WCAG 2.1 AA基準（通常テキスト 4.5:1、大テキスト 3:1）を最低ラインとします。

---

## 2. カラーシステム

### 2-1. カラーパレット

| トークン名 | 値 | Tailwindクラス | 用途 |
|---|---|---|---|
| **Primary (Emerald)** | `#10B981` | `emerald-500` | ボタン、アクセント、CTA、リンク |
| **Primary Hover** | `#059669` | `emerald-600` | ボタンホバー状態 |
| **Primary Text** | `#34D399` | `emerald-400` | バッジテキスト、アクセントテキスト |
| **Dark BG Main** | `#0A0F1C` | `bg-[#0A0F1C]` | メイン背景色 |
| **Dark BG Secondary** | `#111827` | `gray-900` | セクション交互背景 |
| **Dark BG Alt** | `#0F172A` | `slate-900` | CTA背景、特別セクション |
| **Border** | `#1E293B` | `slate-800` / `border-[#1E293B]` | ボーダー、区切り線 |
| **Text Primary** | `#FFFFFF` | `text-white` | 見出し、メインテキスト |
| **Text Secondary** | `#C0C8D4` | `text-[#C0C8D4]` | 説明文、サブテキスト |
| **Text Secondary Alt** | `#64748B` | `slate-500` | 補足テキスト |
| **Text Muted** | `#4B5563` | `gray-600` | 最も薄いテキスト |
| **Text Muted Alt** | `#94A3B8` | `slate-400` | 薄いテキスト（明るめ） |
| **Emerald Light BG** | `emerald-500` 15%透過 | `bg-emerald-500/15` | バッジ背景 |
| **Emerald Light Border** | `emerald-500` 20%透過 | `bg-emerald-500/20` | ボーダー装飾 |
| **White Translucent** | `#FFFFFF` 10%透過 | `bg-white/10` | カード背景 |

### 2-2. グラデーション

| 名称 | 値 | 用途 |
|---|---|---|
| Card Gradient | `bg-gradient-to-br from-emerald-900/40 to-[#111827]` | カード背景 |
| Header Overlay | `bg-[#0A0F1C]/90` | ナビバー背景 |

### 2-3. 使用ルール

- **背景の交互パターン**: セクションごとに `#0A0F1C` と `#111827` を交互に使用し、視覚的なリズムを作ります。
- **アクセントカラーの制限**: エメラルドグリーンはCTA・ボタン・バッジ・リンクなど、ユーザーの行動を促す要素にのみ使用します。装飾目的での多用は避けてください。
- **テキスト色の使い分け**: 情報の優先度に応じて `white` → `#C0C8D4` → `#94A3B8` → `#4B5563` の順に使い分けます。
- **新しい色の追加禁止**: 上記パレット外の色を使用する場合は、デザインレビューを経てこのドキュメントに追加してください。

---

## 3. タイポグラフィ

### 3-1. フォントファミリー

| 用途 | フォント | 指定方法 |
|---|---|---|
| **本文・UI** | Inter, Roboto, "Helvetica Neue", Arial, sans-serif | Tailwindデフォルト `font-sans` |
| **エッセイ・読み物** | BIZ UDPMincho, serif | Google Fonts読み込み + `font-serif` |

- `BIZ UDPMincho` はエッセイページ専用です。通常のページでは使用しません。
- Google Fontsの読み込みはエッセイページのみで行い、パフォーマンスへの影響を最小限にします。

### 3-2. サイズ階層

| レベル | デスクトップ (md以上) | モバイル | ウェイト | 用途 |
|---|---|---|---|---|
| **Display / H1** | 56px (`text-[56px]`) | 36px (`text-4xl`) | `font-black` (900) | ページヒーロータイトル |
| **H2** | 32px (`text-[32px]`) | 28px (`text-[28px]`) | `font-extrabold` (800) | セクション見出し |
| **H3** | 22px (`text-[22px]`) | 18px〜20px | `font-bold` (700) | カードタイトル、小見出し |
| **Body Large** | 17px (`text-[17px]`) | 16px (`text-base`) | `font-normal` (400) | メイン本文 |
| **Body** | 16px (`text-base`) | 15px (`text-[15px]`) | `font-normal` (400) | 通常テキスト |
| **Sub Text** | 14px〜15px | 13px (`text-[13px]`) | `font-medium` (500) / `font-semibold` (600) | 補足説明、ラベル |
| **Caption** | 12px (`text-xs`) | 11px (`text-[11px]`) | `font-semibold` (600) | バッジ、タグ、注釈 |

### 3-3. 行間・文字間

- 見出し（H1〜H3）: `leading-tight` (1.25)
- 本文: `leading-relaxed` (1.625) または `leading-7` (1.75rem)
- 日本語本文は行間を広めに取ることで可読性を確保します。

### 3-4. 使用ルール

- フォントサイズはTailwindのユーティリティクラスまたは `text-[Xpx]` で指定します。
- `rem` / `em` によるカスタム指定は避け、px値ベースのTailwindクラスに統一します。
- 見出しには必ずウェイト指定を付与し、本文との差別化を明確にします。

---

## 4. レイアウト・グリッドシステム

### 4-1. コンテナ

```html
<div class="max-w-7xl mx-auto px-5 md:px-20 lg:px-[120px]">
  <!-- コンテンツ -->
</div>
```

| プロパティ | 値 | 説明 |
|---|---|---|
| 最大幅 | `max-w-7xl` (1280px) | コンテンツの最大幅 |
| 中央揃え | `mx-auto` | 水平中央配置 |
| 左右パディング（モバイル） | `px-5` (20px) | モバイル時の余白 |
| 左右パディング（タブレット） | `md:px-20` (80px) | タブレット時の余白 |
| 左右パディング（大画面） | `lg:px-[120px]` | 大画面時の余白 |

### 4-2. セクション間隔

| 画面サイズ | 値 | 説明 |
|---|---|---|
| 大画面 | `py-[100px]` | メインセクション間の余白 |
| タブレット | `py-20` (80px) | 中間サイズ |
| モバイル | `py-16` (64px) | モバイル時の余白 |

### 4-3. グリッドシステム

```html
<!-- 製品一覧など -->
<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
  <!-- アイテム -->
</div>
```

- **2カラム**: モバイルでのカード配置
- **3カラム**: タブレットでの配置
- **5カラム**: 大画面でのメンバー一覧やアイコン配置
- `gap-6` (24px) を基本間隔とし、コンテンツ密度に応じて `gap-4` 〜 `gap-8` で調整します。

### 4-4. 背景交互パターン

```
セクション1: bg-[#0A0F1C]     (Dark BG Main)
セクション2: bg-[#111827]      (Dark BG Secondary)
セクション3: bg-[#0A0F1C]     (Dark BG Main)
セクション4: bg-[#111827]      (Dark BG Secondary)
CTA:         bg-[#0F172A]      (Dark BG Alt)
```

セクションの背景を交互に切り替えることで、スクロール時の区切りを視覚的に明確にします。

---

## 5. UIコンポーネント

### 5-1. ボタン

#### Primary Button
```html
<button class="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl px-8 py-3.5 font-semibold transition-colors">
  ボタンテキスト
</button>
```
- 背景: `bg-emerald-500` → ホバー: `bg-emerald-600`
- テキスト: `text-white`, `font-semibold`
- 角丸: `rounded-xl`
- パディング: `px-8 py-3.5`
- アニメーション: `transition-colors`

#### Secondary Button (Outline)
```html
<button class="border-2 border-white text-white rounded-xl px-8 py-3.5 font-semibold hover:bg-white/10 transition-colors">
  ボタンテキスト
</button>
```
- ボーダー: `border-2 border-white`
- テキスト: `text-white`, `font-semibold`
- ホバー: `hover:bg-white/10`

#### ボタン共通ルール
- 最小タップ領域: 44x44px以上を確保
- テキストは簡潔に（日本語8文字以内を推奨）
- ページ内に Primary ボタンは原則1箇所（最も重要なCTA）

### 5-2. カード

```html
<div class="bg-white/10 rounded-2xl border border-[#1E293B] p-6">
  <!-- カードコンテンツ -->
</div>
```

| プロパティ | 値 | 説明 |
|---|---|---|
| 背景 | `bg-white/10` | 半透明白 |
| 角丸 | `rounded-2xl` | 大きめの角丸 |
| ボーダー | `border border-[#1E293B]` | 薄いボーダー |
| パディング | `p-6` (24px) | 内側余白 |

#### グラデーションカード（バリエーション）
```html
<div class="bg-gradient-to-br from-emerald-900/40 to-[#111827] rounded-2xl border border-[#1E293B] p-6">
  <!-- カードコンテンツ -->
</div>
```

### 5-3. バッジ

```html
<span class="bg-emerald-500/15 text-emerald-400 rounded-full px-3 py-1 text-[11px] font-semibold">
  バッジテキスト
</span>
```

| プロパティ | 値 |
|---|---|
| 背景 | `bg-emerald-500/15` |
| テキスト色 | `text-emerald-400` |
| 角丸 | `rounded-full` |
| パディング | `px-3 py-1` |
| フォントサイズ | `text-[11px]` |
| ウェイト | `font-semibold` |

### 5-4. ナビゲーションバー

```html
<nav class="bg-[#0A0F1C]/90 backdrop-blur-md fixed top-0 w-full z-50">
  <!-- ナビコンテンツ -->
</nav>
```

| プロパティ | 値 | 説明 |
|---|---|---|
| 背景 | `bg-[#0A0F1C]/90` | 90%透過のダーク背景 |
| ブラー | `backdrop-blur-md` | 背景ぼかし効果 |
| 配置 | `fixed top-0 w-full` | 画面上部に固定 |
| 重なり順 | `z-50` | 最前面に表示 |

- デスクトップ: 水平メニュー（リンク横並び）
- モバイル: ハンバーガーメニュー → フルスクリーンオーバーレイ

### 5-5. セクション見出しパターン

```html
<div class="text-center mb-12">
  <span class="bg-emerald-500/15 text-emerald-400 rounded-full px-3 py-1 text-[11px] font-semibold">
    セクションラベル
  </span>
  <h2 class="text-[28px] md:text-[32px] font-extrabold text-white mt-4">
    セクションタイトル
  </h2>
  <p class="text-[#C0C8D4] mt-3 text-[15px]">
    セクションの説明文
  </p>
</div>
```

---

## 6. 視覚効果・アニメーション

### 6-1. 背景効果

| 効果 | クラス | 用途 |
|---|---|---|
| Backdrop Blur | `backdrop-blur-md` | ナビバー、モーダル |
| 半透明背景 | `bg-white/10`, `bg-emerald-500/15` | カード、バッジ |
| グラデーション | `bg-gradient-to-br` | カード背景、装飾 |

### 6-2. 角丸

| サイズ | クラス | 用途 |
|---|---|---|
| 小 | `rounded-lg` | 入力フィールド |
| 中 | `rounded-xl` | ボタン |
| 大 | `rounded-2xl` | カード |
| 完全円 | `rounded-full` | バッジ、アバター |

### 6-3. トランジション

| 効果 | クラス | 用途 |
|---|---|---|
| 色変化 | `transition-colors` | ボタンホバー、リンクホバー |
| 全プロパティ | `transition-all` | 複合的なアニメーション |
| 持続時間 | `duration-300` | 標準のアニメーション速度 |

### 6-4. アニメーション指針

- ホバーエフェクトは `transition-colors` を基本とし、派手なアニメーションは避けます。
- ページ遷移やスクロールアニメーションは必要最小限にとどめます。
- `prefers-reduced-motion` メディアクエリを尊重し、アニメーションを無効化できるようにします。

---

## 7. 画像・アセットガイドライン

### 7-1. 画像アセット一覧

| ファイル名 | サイズ | 用途 | 表示サイズ |
|---|---|---|---|
| `logo.png` | 200x50px | サイトロゴ | `h-7` (28px) |
| `ceo-photo.png` | 200x200px | CEO写真 | 円形表示 (`rounded-full`) |
| `OGP.png` | - | OGP画像（SNS共有用） | 1200x630px推奨 |
| `hero-bg.png` | - | ヒーロー背景画像 | 全幅表示 |
| `nologic-logo.png` | - | NoLogic製品ロゴ | コンテンツに応じて |
| `nextcreator-logo.png` | - | NextCreator製品ロゴ | コンテンツに応じて |

### 7-2. 画像最適化ルール

- Astroの `<Image>` コンポーネントを使用し、自動最適化を適用します。
- 外部画像を使用する場合は `loading="lazy"` を必ず指定します。
- すべての `<img>` タグに `alt` 属性を付与します（装飾画像は `alt=""` + `aria-hidden="true"`）。
- WebP形式での配信を優先し、フォールバックとしてPNG/JPGを用意します。

### 7-3. ファビコン

- `/public/favicon.svg` を使用します。
- ダークモード・ライトモード両方で視認できるデザインにします。

---

## 8. レスポンシブデザイン

### 8-1. ブレークポイント

| 名称 | 値 | 対象デバイス |
|---|---|---|
| デフォルト | 0px〜 | モバイル（スマートフォン） |
| `md` | 768px〜 | タブレット |
| `lg` | 1024px〜 | デスクトップ |

### 8-2. レスポンシブ対応方針

- **モバイルファースト**: スタイルはモバイル向けをベースに記述し、`md:` `lg:` プレフィックスで拡張します。
- **フォントサイズ**: モバイルとデスクトップで適切なサイズに切り替えます（セクション3参照）。
- **グリッド**: `grid-cols-1` → `md:grid-cols-2` → `lg:grid-cols-3` のように段階的に拡張します。
- **パディング**: `px-5` → `md:px-20` → `lg:px-[120px]` で画面幅に応じた余白を確保します。

### 8-3. ナビゲーションのレスポンシブ対応

| 画面サイズ | 表示形式 |
|---|---|
| モバイル | ハンバーガーメニュー + フルスクリーンオーバーレイ |
| デスクトップ (`md`以上) | 水平メニュー（ヘッダー内にリンク横並び） |

- モバイルメニューは画面全体を覆うオーバーレイとして表示します。
- メニューの開閉にはスムーズなトランジションを適用します。
- ハンバーガーアイコンのタップ領域は44x44px以上を確保します。

### 8-4. 画像のレスポンシブ対応

- ヒーロー背景画像は `object-cover` で全幅表示します。
- 製品ロゴやアイコンはコンテナ幅に応じて適切にリサイズします。
- モバイルで不要な装飾画像は `hidden md:block` で非表示にすることを検討します。

---

## 9. アクセシビリティ

### 9-1. コントラスト比

ダーク背景上のテキストは以下のコントラスト比を確保してください。

| テキスト種別 | 背景 | 最低コントラスト比 |
|---|---|---|
| 本文テキスト (white) | `#0A0F1C` | 4.5:1 以上 (達成済み) |
| サブテキスト (`#C0C8D4`) | `#0A0F1C` | 4.5:1 以上 (要確認) |
| 薄いテキスト (`#94A3B8`) | `#0A0F1C` | 4.5:1 以上 (要確認) |
| バッジテキスト (`#34D399`) | `emerald-500/15` 背景 | 3:1 以上 |

**注意**: `#4B5563` (Text Muted) は `#0A0F1C` 背景上でコントラスト比が不足する可能性があります。装飾的な用途に限定し、重要な情報には使用しないでください。

### 9-2. キーボード操作

- すべてのインタラクティブ要素（ボタン、リンク、メニュー）はキーボードでアクセス可能にします。
- フォーカス状態には `focus:ring-2 focus:ring-emerald-500 focus:outline-none` を適用します。
- タブ順序は視覚的な配置と一致させます。

### 9-3. スクリーンリーダー対応

- セマンティックなHTML要素 (`<nav>`, `<main>`, `<section>`, `<article>`) を使用します。
- 装飾的なアイコンには `aria-hidden="true"` を付与します。
- ハンバーガーメニューには `aria-label="メニューを開く"` / `aria-expanded` を設定します。
- ページ内リンクには適切な `aria-label` を付与します。

### 9-4. モーション設定

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

ユーザーがモーション軽減を設定している場合、アニメーションを無効化します。

---

## 10. デザイン改善提案

現在のデザインをベースに、今後検討すべき改善案を以下にまとめます。

### 10-1. ダークモード/ライトモード切替

現状はダークテーマ固定ですが、ライトモードの需要がある場合に備え、CSS変数（Tailwind v4のカスタムプロパティ）を活用したテーマ切替の仕組みを検討してください。カラートークンをCSS変数化しておくと、将来の対応が容易になります。

### 10-2. マイクロインタラクションの追加

- カードのホバー時に `scale-[1.02]` + `shadow-lg` で軽い浮き上がり効果を追加
- スクロール時のフェードインアニメーション（Intersection Observer + `opacity` / `translate-y` トランジション）
- ボタンクリック時の `scale-95` によるフィードバック

```html
<!-- カードホバー例 -->
<div class="bg-white/10 rounded-2xl border border-[#1E293B] p-6
            transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-emerald-500/10">
</div>
```

### 10-3. テキストカラーの統合

現在 `#C0C8D4` と `#64748B`、`#4B5563` と `#94A3B8` のように近い色が複数存在します。用途を明確に分離するか、統合して管理の複雑さを減らすことを推奨します。

| 現状 | 提案 |
|---|---|
| `#C0C8D4` / `#64748B` | → サブテキストは `slate-400` (`#94A3B8`) に統一 |
| `#4B5563` / `#94A3B8` | → ミュートテキストは `slate-600` (`#475569`) に統一 |

### 10-4. デザイントークンのCSS変数化

将来的なメンテナンス性向上のため、主要なカラー・スペーシング値をCSS変数として定義することを推奨します。

```css
:root {
  --color-bg-main: #0A0F1C;
  --color-bg-secondary: #111827;
  --color-bg-alt: #0F172A;
  --color-border: #1E293B;
  --color-primary: #10B981;
  --color-primary-hover: #059669;
  --color-text-primary: #FFFFFF;
  --color-text-secondary: #C0C8D4;
  --color-text-muted: #94A3B8;
  --spacing-section-lg: 100px;
  --spacing-section-md: 80px;
  --spacing-section-sm: 64px;
}
```

### 10-5. フォーカス状態のスタイル強化

現状、フォーカス状態のスタイルが明示的に定義されていない箇所があります。すべてのインタラクティブ要素に対し、統一されたフォーカスリングを適用してください。

```html
<!-- 推奨フォーカススタイル -->
<button class="... focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-[#0A0F1C]">
</button>
```

### 10-6. ローディング・スケルトン画面

ページ読み込み時の体験向上のため、コンテンツ領域にスケルトンUIの導入を検討してください。ダークテーマに合わせた `bg-white/5` のパルスアニメーションが効果的です。

```html
<!-- スケルトン例 -->
<div class="animate-pulse bg-white/5 rounded-2xl h-48 w-full"></div>
```

### 10-7. 日本語フォントの最適化

現在、日本語フォントはシステムフォントに依存しています。OS間で表示を統一したい場合は、Noto Sans JP（Google Fonts）の導入を検討してください。ただし、パフォーマンスへの影響を考慮し、`font-display: swap` と必要なウェイトのみのサブセット読み込みを行います。

---

## 更新履歴

| 日付 | 内容 |
|---|---|
| 2026-02-26 | 初版作成 |
