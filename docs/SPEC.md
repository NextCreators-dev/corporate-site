# SPEC.md - 技術仕様書

**プロジェクト**: 株式会社クリエイターのうえきばち コーポレートサイト
**最終更新**: 2026-02-26

---

## 1. プロジェクト概要

株式会社クリエイターのうえきばち（Creator no Uekibachi）のコーポレートサイト。
Astro + Tailwind CSS + React で構築された静的サイトで、https://creatorpot.net にデプロイされている。

### サイトの目的

- 会社のビジョン・ミッション・バリューの発信
- 主要プロダクト「NoLogic」（ノーコードゲーム制作プラットフォーム）の紹介
- クリエイターコミュニティ「NextCreators」への誘導
- 受託事業「TechPlant Studio」のサービス紹介
- 問い合わせ・採用等の窓口

### ページ構成

| パス | ファイル | 内容 |
|------|---------|------|
| `/` | `index.astro` | トップページ（Hero, News, 実績, プロダクト, コミュニティ, サービス, ビジョン, 会社概要） |
| `/essay` | `essay.astro` | 代表メッセージ |
| `/techplantstudio` | `techplantstudio.astro` | TechPlant Studio サービス詳細 |

---

## 2. 技術スタック・依存関係

### コア技術

| カテゴリ | 技術 | バージョン |
|---------|------|-----------|
| フレームワーク | Astro | ^5.0.5 |
| スタイリング | Tailwind CSS | ^3.4.17 |
| UIライブラリ | React | ^19.0.0 |
| 言語 | TypeScript | strict モード |

### 依存パッケージ一覧

| パッケージ | バージョン | 用途 |
|-----------|-----------|------|
| `@astrojs/react` | ^4.1.2 | Astro の React インテグレーション |
| `@astrojs/tailwind` | ^5.1.3 | Astro の Tailwind CSS インテグレーション |
| `@types/react` | ^19.0.2 | React 型定義 |
| `@types/react-dom` | ^19.0.2 | ReactDOM 型定義 |
| `astro-icon` | ^1.1.4 | アイコンコンポーネント |
| `astro-seo` | ^0.8.4 | SEO メタタグ管理 |
| `lucide-react` | ^0.469.0 | React アイコンライブラリ（Menu, X アイコン） |
| `prettier` | ^3.4.2 | コードフォーマッター |
| `prettier-plugin-astro` | ^0.14.1 | Astro ファイル用 Prettier プラグイン |
| `react-dom` | ^19.0.0 | React DOM レンダリング |

### パッケージ管理

- **パッケージマネージャー**: yarn
- **devDependencies**: なし（すべて dependencies に統合）

---

## 3. アーキテクチャ

### 3.1 ディレクトリ構成

```
corporate-site/
├── public/                      # 静的アセット（ビルド時にそのままコピー）
│   ├── favicon.ico
│   ├── logo.png                 # サイトロゴ
│   ├── hero-bg.png              # ヒーローセクション背景
│   ├── ceo-photo.png            # 代表写真
│   ├── nologic-logo.png         # NoLogic ロゴ
│   ├── nextcreator-logo.png     # NextCreators ロゴ
│   └── OGP.png                  # OGP 画像
├── src/
│   ├── assets/                  # Astro で処理されるアセット
│   │   ├── astro.svg
│   │   ├── background.svg
│   │   └── hero-bg.png
│   ├── components/              # 共通コンポーネント
│   │   ├── Head.astro           # SEO メタタグ（astro-seo）
│   │   ├── Navigation.astro     # ヘッダーナビゲーション
│   │   ├── Footer.astro         # フッター（CTA + リンク + SNS）
│   │   └── Welcome.astro        # 未使用コンポーネント
│   ├── layouts/
│   │   └── Layout.astro         # 共通レイアウト（html, head, body）
│   └── pages/                   # ページ（ファイルベースルーティング）
│       ├── index.astro          # トップページ
│       ├── essay.astro          # 代表メッセージ
│       └── techplantstudio.astro # サービス詳細
├── astro.config.mjs             # Astro 設定
├── tailwind.config.mjs          # Tailwind CSS 設定
├── tsconfig.json                # TypeScript 設定
├── package.json
├── CLAUDE.md                    # Claude Code ガイドライン
└── SPEC.md                      # 本ファイル
```

### 3.2 コンポーネント設計

#### レイアウトシステム

```
Layout.astro
├── <head>
│   └── Head.astro (SEO: title, description, OGP, Twitter Card, favicon)
└── <body>
    └── <slot /> (各ページのコンテンツ)
```

- `Layout.astro` は `title` props を受け取る（`interface Props { title: string }`）
- `Head.astro` は `astro-seo` パッケージで OGP・Twitter Card を一括管理

#### コンポーネント詳細

| コンポーネント | Props | 説明 |
|---------------|-------|------|
| `Layout.astro` | `title: string` | HTML ドキュメント全体のラッパー |
| `Head.astro` | なし | SEO メタタグ。`import.meta.env.SITE` で OGP 画像 URL を動的生成 |
| `Navigation.astro` | `showBack?: boolean` | ヘッダーナビ。`showBack=true` で「トップに戻る」リンクを表示 |
| `Footer.astro` | `hideCta?: boolean` | フッター。`hideCta=true` で CTA セクションを非表示 |
| `Welcome.astro` | - | 未使用（Astro デフォルトテンプレートの残り） |

#### インタラクティブ要素

- **モバイルナビゲーション**: vanilla JavaScript で実装
  - `#menu-toggle` ボタンで `#mobile-menu` の `translate-x-full` クラスをトグル
  - メニュー内リンクのクリックでも自動的に閉じる
  - CSS トランジション（`transition-transform duration-300 ease-in-out`）でアニメーション
- **React コンポーネント**: `lucide-react` の `Menu` / `X` アイコンのみ
  - `client:load` ディレクティブでハイドレーション

### 3.3 Import エイリアス

`tsconfig.json` で以下のパスエイリアスを定義:

| エイリアス | 実パス |
|-----------|--------|
| `@assets/*` | `src/assets/*` |
| `@components/*` | `src/components/*` |
| `@layouts/*` | `src/layouts/*` |
| `@public/*` | `public/*` |

### 3.4 ルーティング

Astro のファイルベースルーティングを使用。`src/pages/` 配下のファイルが自動的にルートにマッピングされる。

| ファイル | URL |
|---------|-----|
| `src/pages/index.astro` | `/` |
| `src/pages/essay.astro` | `/essay` |
| `src/pages/techplantstudio.astro` | `/techplantstudio` |

### 3.5 スタイリング方針

- **Tailwind CSS**: ユーティリティファーストで記述
- **カスタム設定なし**: `tailwind.config.mjs` は `extend: {}` のみ
- **Arbitrary Values で対応**: カスタムカラーやサイズはすべて `[]` 記法で直接指定
  - 例: `bg-[#0A0F1C]`, `text-[17px]`, `px-[120px]`
- **主要カラーパレット**（arbitrary values）:
  - 背景: `#0A0F1C`（メイン）, `#111827`（セカンダリ）, `#0F172A`（CTA）
  - ボーダー: `#1E293B`
  - アクセント: Tailwind の `emerald-500`（`#10B981`）
  - テキスト: `white`, `gray-400`, `gray-500`

---

## 4. ビルド・デプロイ

### コマンド

| コマンド | 説明 |
|---------|------|
| `yarn dev` | 開発サーバー起動（`localhost:4321`） |
| `yarn build` | 本番ビルド（出力先: `./dist/`） |
| `yarn preview` | ビルド成果物のローカルプレビュー |

### ビルド設定

```javascript
// astro.config.mjs
export default defineConfig({
  integrations: [tailwind(), icon(), react()],
  site: "https://creatorpot.net",
});
```

- **出力形式**: 静的 HTML（Astro デフォルト `output: 'static'`）
- **site 設定**: `https://creatorpot.net`（OGP 画像 URL 等で `import.meta.env.SITE` として参照）

### デプロイ先

- **本番 URL**: https://creatorpot.net
- **ビルド成果物**: `./dist/` ディレクトリ内の静的ファイル一式

---

## 5. 開発環境セットアップ

### 前提条件

- Node.js（Astro 5 対応バージョン）
- yarn

### セットアップ手順

```bash
# 1. リポジトリのクローン
git clone <repository-url>
cd corporate-site

# 2. 依存パッケージのインストール
yarn install

# 3. 開発サーバーの起動
yarn dev
# → http://localhost:4321 でアクセス可能
```

### TypeScript 設定

- `astro/tsconfigs/strict` を継承
- JSX は `react-jsx` トランスフォームを使用
- `dist/` ディレクトリは TypeScript コンパイル対象から除外

---

## 6. 外部サービス連携

### プロダクト・コミュニティ

| サービス | URL | 用途 |
|---------|-----|------|
| NoLogic | https://nologic.creatorpot.net/ja | ノーコードゲーム制作プラットフォーム |
| Discord (NextCreators) | https://discord.gg/3hy2UNmXca | クリエイターコミュニティ |

### お問い合わせ

| サービス | URL | 用途 |
|---------|-----|------|
| Google Forms | https://forms.gle/MrRY3fbb4bX8xBVL6 | 制作相談・お問い合わせフォーム |

### SNS

| サービス | URL |
|---------|-----|
| Twitter (X) | https://twitter.com/creator_pot |
| YouTube | https://www.youtube.com/@creator_pot |

---

## 7. パフォーマンス・SEO

### パフォーマンス

- **静的生成**: Astro のビルド時に全ページを HTML として生成。ランタイム JS を最小化
- **最小限の JavaScript**: React は `lucide-react` アイコン（Menu/X）のみに使用。`client:load` でハイドレーション
- **モバイルメニュー**: vanilla JS で実装し、React バンドルへの依存を回避
- **画像**: `public/` に静的配置。`astro:assets` の `Image` コンポーネントで幅・高さを指定

### SEO

- **astro-seo**: `Head.astro` で以下を一括管理
  - `<title>`: 「株式会社クリエイターのうえきばち」
  - `<meta name="description">`: 事業内容の説明
  - **Open Graph**: type=website, 画像=`/OGP.png`
  - **Twitter Card**: creator=`@creator_pot`
  - **favicon**: `/favicon.ico`
- **言語設定**: `<html lang="ja">`
- **文字コード**: UTF-8

### レスポンシブ対応

- Tailwind CSS のブレークポイント（`md:`, `lg:`）で対応
- モバイル: ハンバーガーメニュー（全画面スライドイン）
- デスクトップ: 横並びナビゲーション
- グリッドレイアウト: `grid-cols-1` → `grid-cols-2` / `grid-cols-3` 等で段階的に変化

---

## 8. 今後の技術的課題・改善案

### 優先度：高

1. **Head.astro の OGP URL 修正**
   - 現状: `url: "https://corporate-site.com"` とハードコードされている
   - 修正案: `import.meta.env.SITE`（`https://creatorpot.net`）を使用する

2. **ページごとの SEO 対応**
   - 現状: `Head.astro` の title / description が固定値
   - 改善案: `Head.astro` に props を追加し、ページごとに title / description / OGP を設定可能にする

3. **未使用コンポーネントの削除**
   - `Welcome.astro` は Astro テンプレートのデフォルトファイルで未使用。削除が望ましい

### 優先度：中

4. **画像最適化の強化**
   - 現状: `public/` に静的配置のため、Astro の画像最適化（WebP 変換、リサイズ等）が効いていない
   - 改善案: 画像を `src/assets/` に移動し、`astro:assets` の `Image` コンポーネントで最適化を有効化

5. **Tailwind CSS のカスタムテーマ整理**
   - 現状: `bg-[#0A0F1C]` 等の arbitrary values が各所に散在
   - 改善案: `tailwind.config.mjs` の `theme.extend.colors` に定義してセマンティックな命名にする
   - 例: `bg-primary`, `bg-secondary`, `text-accent` 等

6. **React 依存の見直し**
   - 現状: React は `lucide-react` の Menu/X アイコン 2 つのためだけに導入されている
   - 改善案: SVG を直接インラインで記述するか、`astro-icon` に統一して React 依存を除去。バンドルサイズ削減に寄与

### 優先度：低

7. **ニュースセクションの動的化**
   - 現状: `index.astro` にハードコードされている
   - 改善案: Markdown/MDX ファイルや CMS と連携し、コンテンツを分離

8. **プライバシーポリシーページの作成**
   - 現状: フッターのリンクが `href="#"` のまま
   - 改善案: `/privacy` ページを作成してリンクを設定

9. **アクセシビリティの改善**
   - `sr-only` の使用は一部あるが、全体的な ARIA 属性の見直しが必要
   - カラーコントラストの検証（特にグレーテキスト `gray-400` / `gray-500` の可読性）

10. **テスト環境の整備**
    - 現状: テストフレームワーク未導入
    - 改善案: Playwright 等で E2E テスト、リンク切れチェック等を自動化
