# アクセス解析・SEO計測セットアップ手順

本サイト (creatorpot.net) に導入した Google Search Console (以下 GSC) と Google Analytics 4 (以下 GA4) の手動セットアップ手順をまとめる。コード側の実装は完了済みで、**本番環境で有効化するには本書で示す環境変数の設定と外部コンソールでの操作が必要**。

---

## 1. 手動で設定が必要な箇所（サマリ）

| # | 項目 | 対象 | 担当場所 |
| --- | --- | --- | --- |
| 1 | Search Console にプロパティを追加 | GSC | https://search.google.com/search-console |
| 2 | 所有権確認コードを取得 | GSC | 同上 |
| 3 | Netlify に `PUBLIC_GSC_VERIFICATION` 環境変数を設定 | Netlify | https://app.netlify.com → サイト設定 → Environment variables |
| 4 | 再デプロイして所有権確認 | Netlify / GSC | Netlify で再デプロイ後、GSC画面で確認ボタン |
| 5 | サイトマップ送信 | GSC | GSCの「サイトマップ」から `sitemap-index.xml` を登録 |
| 6 | GA4 プロパティ作成 | GA4 | https://analytics.google.com |
| 7 | 測定IDを取得 (`G-XXXXXXXXXX`) | GA4 | 同上 |
| 8 | Netlify に `PUBLIC_GA_MEASUREMENT_ID` 環境変数を設定 | Netlify | 上記同様 |
| 9 | 再デプロイして計測開始 | Netlify / GA4 | GA4 のリアルタイムで到達確認 |
| 10 | GSC と GA4 を紐付け | GA4 | GA4管理画面 → プロパティ設定 → Search Console のリンク |
| 11 | GA4 のコンバージョン設定 (`generate_lead` を有効化) | GA4 | 管理 → イベント → コンバージョンとしてマーク |

---

## 2. 前提: 実装済みの内容

以下はコードにすでに入っているので、追加実装は不要。

- `@astrojs/sitemap` による `sitemap-index.xml` / `sitemap-0.xml` の自動生成（ビルド時に `dist/` 配下に出力）
- `public/robots.txt` からサイトマップへのリンク
- `src/components/Head.astro` に以下を条件付きで埋め込み
  - `<meta name="google-site-verification" content="...">` — `PUBLIC_GSC_VERIFICATION` が設定されたときのみ出力
  - `gtag.js` (GA4 計測タグ) — `PUBLIC_GA_MEASUREMENT_ID` が設定されたときのみ出力
- `src/lib/gtag.ts` — `trackEvent(name, params)` ヘルパー
- `src/components/ContactForm.tsx` — 送信結果に応じて GA4 イベントを送信
  - `generate_lead`（成功時、GA4 推奨イベント）
  - `form_submit`（成功時、カスタム）
  - `form_error`（各種失敗、`reason` パラメータ付き）

環境変数が未設定の場合は関連タグ・イベントが一切出力されないため、未設定でも本番ビルドに影響はない。

---

## 3. Google Search Console セットアップ手順

### 3.1 プロパティの追加

1. https://search.google.com/search-console にアクセス（Googleアカウントでログイン）
2. 左上のプロパティ選択プルダウン → 「プロパティを追加」
3. プロパティタイプの選択
   - **推奨: 「URL プレフィックス」を選び `https://creatorpot.net/` を入力**
     - HTMLタグでの所有権確認が可能（本実装はこの方式）
   - 「ドメイン」を選ぶ場合は DNS TXT レコードでの確認が必要。ドメイン管理側でDNS編集権限が必要なため、サブドメイン含めた全配下を一括で計測したい場合以外は URLプレフィックスで十分

### 3.2 所有権確認（HTMLタグ方式）

1. プロパティ追加時に表示される「所有権の確認」画面で、**「HTMLタグ」** を選択
2. 表示される `<meta name="google-site-verification" content="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx">` の `content` の値をコピー
3. この値を Netlify に **`PUBLIC_GSC_VERIFICATION`** という名前の環境変数として登録（手順は §5 を参照）
4. Netlify で再デプロイを実行
5. デプロイ完了後、本番サイトの HTML ソースに以下が含まれていることを確認
   ```html
   <meta name="google-site-verification" content="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx">
   ```
6. GSC 画面に戻り「確認」ボタンをクリック

> 確認後もメタタグは残しておくこと（削除すると所有権確認が外れる）

### 3.3 サイトマップの送信

所有権確認完了後、以下を実施。

1. GSC 左メニュー → 「サイトマップ」
2. 「新しいサイトマップの追加」欄に以下を入力して送信
   ```
   sitemap-index.xml
   ```
3. 「成功しました」と表示されればOK。検出URL数が `12` 程度になっていれば正常（ページ数ぶん検出される）

### 3.4 運用時の確認ポイント

| 画面 | 確認内容 | 頻度 |
| --- | --- | --- |
| 検索パフォーマンス | 表示回数・クリック数・平均掲載順位 | 週次 |
| カバレッジ（ページ） | 未インデックス・エラーの有無 | 週次 |
| エクスペリエンス → Core Web Vitals | LCP / INP / CLS の赤信号 | 月次 |
| サイトマップ | 最終読み取り日時とエラー | デプロイ後 |

---

## 4. Google Analytics 4 セットアップ手順

### 4.1 GA4 プロパティの作成

1. https://analytics.google.com にアクセス（Googleアカウントでログイン）
2. 左下の歯車アイコン（管理）→ 「プロパティを作成」
3. プロパティ名: `creatorpot.net` 等、任意
4. レポートのタイムゾーン: **日本**、通貨: **日本円 (JPY)**
5. 業種・規模を選択して「次へ」
6. ビジネスの目的: 「見込み顧客を生成する」「オンラインでの販促・販売を促進する」にチェック
7. 作成完了

### 4.2 データストリームの追加

1. プロパティ作成フロー内、またはプロパティ設定 → 「データストリーム」
2. 「ウェブ」を選択
3. ウェブサイトの URL: `https://creatorpot.net`
4. ストリーム名: `corporate-site` 等、任意
5. 「ストリームを作成」
6. 作成後の画面に表示される **測定ID** (`G-XXXXXXXXXX` の形式) をコピー

### 4.3 測定IDを Netlify に設定

1. §5 の手順で **`PUBLIC_GA_MEASUREMENT_ID`** として上記の測定IDを登録
2. Netlify で再デプロイ
3. デプロイ完了後、本番サイトに訪問し GA4 の **「レポート → リアルタイム」** に自分が表示されることを確認（遅延30秒〜1分程度）

### 4.4 コンバージョン (キーイベント) 設定

問い合わせ送信を獲得指標として扱うため、`generate_lead` をコンバージョンに昇格させる。

1. GA4 管理 → 「イベント」（またはプロパティ直下の「キーイベント」）
2. 一覧に `generate_lead` が出現するまで、本番フォームから1件テスト送信してから待つ（最大24時間）
3. 出現したら、その行の「キーイベントとしてマーク」をON

> GA4 の UI は 2024年以降「コンバージョン」→「キーイベント」に名称変更された。表記が違っても機能は同じ。

### 4.5 カスタムディメンションの登録（推奨）

`form_error` の `reason` と、`generate_lead` の `category` / `budget` をレポート上で切り分け可能にする。

1. GA4 管理 → 「カスタム定義」→ 「カスタムディメンションを作成」
2. 以下を1つずつ登録（いずれもスコープは「イベント」）

| ディメンション名 | イベントパラメータ | 用途 |
| --- | --- | --- |
| `form_name` | `form_name` | 将来フォームが増えたときの区別用 |
| `form_category` | `category` | 問い合わせ種別ごとのリード数集計 |
| `form_budget` | `budget` | 予算帯ごとのリード数集計 |
| `form_error_reason` | `reason` | 離脱要因の内訳（client_validation / server_validation / server_error / network） |

> カスタムディメンション作成後、**反映まで最大24時間**。当日のデータでは探索レポートに出ない点に注意。

### 4.6 実装済みイベント仕様

| イベント名 | 発火タイミング | パラメータ | 用途 |
| --- | --- | --- | --- |
| `page_view` | 全ページ遷移（自動） | GA4 が自動付与 | ページ遷移計測 |
| `generate_lead` | 問い合わせ送信成功時 | `form_name`, `category`, `budget` | **コンバージョン計測** |
| `form_submit` | 問い合わせ送信成功時 | `form_name`, `category` | 送信イベント（リード以外も拾う将来用） |
| `form_error` | 送信失敗時 | `form_name`, `reason` | 離脱要因の分析 |

`reason` の取りうる値:
- `client_validation` — Zodバリデーションでブロック
- `server_validation` — Netlify Functions側のバリデーション失敗
- `server_error` — サーバー側で例外
- `network` — 通信失敗（fetch 例外）

---

## 5. Netlify 環境変数の設定手順

1. https://app.netlify.com にログイン → 対象サイトを選択
2. 左メニュー「Site configuration」→「Environment variables」
3. 「Add a variable」→ 「Add a single variable」
4. 以下をそれぞれ登録

| Key | Value | Scopes | Deploy contexts |
| --- | --- | --- | --- |
| `PUBLIC_GSC_VERIFICATION` | GSCのHTMLタグ確認で取得した `content` 値 | All scopes | All (Production で十分ならProdのみでも可) |
| `PUBLIC_GA_MEASUREMENT_ID` | `G-XXXXXXXXXX` 形式の測定ID | All scopes | **Production のみ推奨** |

> **`PUBLIC_GA_MEASUREMENT_ID` は Deploy Preview / Branch Deploy から外すことを推奨**。外さないと PR プレビューのアクセスも本番GA4に混入する。

5. 保存後、サイトトップで「Trigger deploy」→「Deploy site」を実行（環境変数は既存のデプロイに反映されないため再デプロイが必須）

### 5.1 なぜ `PUBLIC_` プレフィックスが必要か

Astro（Vite）では、クライアント側のコードから参照される環境変数は `PUBLIC_` プレフィックス必須。プレフィックスなしの環境変数はビルド時にクライアントバンドルへ露出しない。GSC 認証タグも GA4 測定IDも HTML に埋め込まれる値なので、プレフィックスが必要。

なお、これらの値は **公開されても問題ない値**（HTMLソースを見れば誰でも取得可能）なので、プレフィックスが付いていても機密上の問題はない。

---

## 6. ローカル検証手順（任意）

Netlifyで本番反映する前に挙動確認したい場合:

1. プロジェクトルートに `.env` を作成（`.gitignore` 済みであることを確認）
   ```
   PUBLIC_GSC_VERIFICATION=test-gsc-value
   PUBLIC_GA_MEASUREMENT_ID=G-TEST000000
   ```
2. `yarn build && yarn preview`
3. `dist/index.html` に以下が埋め込まれていれば正常
   - `<meta name="google-site-verification" content="test-gsc-value">`
   - `<script ... src="https://www.googletagmanager.com/gtag/js?id=G-TEST000000"></script>`
4. フォーム計測まで見たい場合は `netlify dev` で Functions を起動し、ブラウザDevToolsのNetworkで `collect?v=2&tid=G-...` への送信を確認

---

## 7. トラブルシューティング

### 所有権確認が失敗する
- メタタグが HTMLソースに含まれているか確認（ビュー → ページのソース）
- `content` 値にタイポ・前後空白がないか
- CDNキャッシュが残っている可能性。Netlify管理画面で「Clear cache and deploy」を実行

### GA4 リアルタイムに自分が出ない
- ブラウザの広告ブロッカー (uBlock Origin等) が gtag をブロックしている可能性。シークレットウィンドウまたは拡張機能無効で再確認
- `PUBLIC_GA_MEASUREMENT_ID` が **`PUBLIC_`** プレフィックス付きで登録されているか
- 環境変数を追加した後に再デプロイしているか（既存デプロイには反映されない）
- 本番サイトのソースに `gtag/js?id=G-...` のスクリプトタグが含まれているか

### `generate_lead` イベントが GA4 に出てこない
- GA4 のイベント反映は最大24時間かかる。**DebugView** (GA4管理 → DebugView) か **リアルタイム → イベント** で即時確認可能
- リアルタイムにも出ない場合、ブラウザDevToolsのNetworkで `google-analytics.com/g/collect` または `analytics.google.com/g/collect` へのリクエストが発生しているか確認

### サイトマップがGSCで「取得できませんでした」
- デプロイ後 `https://creatorpot.net/sitemap-index.xml` にブラウザで直接アクセスして200が返るか
- `robots.txt` が正しいか（`https://creatorpot.net/robots.txt` で確認）

---

## 8. 参考リンク

- Search Console ヘルプ: https://support.google.com/webmasters
- GA4 ヘルプ: https://support.google.com/analytics/answer/10089681
- GA4 推奨イベントリファレンス: https://support.google.com/analytics/answer/9267735
- Astro sitemap 公式ドキュメント: https://docs.astro.build/en/guides/integrations-guide/sitemap/
