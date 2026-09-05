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

## 8. API から自動でデータを取る（スクリプト連携）

GSC と GA4 の数値をコマンドで取れるようにしてある。画面を開いてスクリーンショットを撮る代わりに、
Claude Code から直接叩いてレポートを作れる。

### 8.1 全体像

スクリプトは**サービスアカウント `analytics-reader` として** GSC / GA4 の API を読む。ただし
**サービスアカウント鍵は作らない**。あなた本人の資格情報でサービスアカウントを一時的に借用し
（impersonation）、必要なスコープのアクセストークンをその都度発行してもらう。**読み取り専用**で、
外部依存パッケージは使っていない（Node 22 の組み込み機能だけ）。

この形になった経緯:

| 試したこと | 結果 |
| --- | --- |
| サービスアカウント鍵を発行する | 組織ポリシー `constraints/iam.disableServiceAccountKeyCreation` で禁止されていて発行できない |
| ADC で本人の権限のまま読む | 2026-09 時点で gcloud の既定クライアント ID では `analytics.readonly` スコープが Google 側にブロックされる |
| **サービスアカウントの権限借用** | **鍵を作らずに済み、スコープの制限にも当たらない。これを採用** |

| ファイル | 役割 |
| --- | --- |
| `scripts/analytics/config.mjs` | **対象プロパティの固定**（GSC のサイト URL / GA4 のプロパティ ID / サイトマップ） |
| `scripts/analytics/auth.mjs` | 資格情報 → アクセストークン（鍵 / 権限借用 / ユーザー資格情報の3方式に対応） |
| `scripts/analytics/lib.mjs` | 期間計算・引数解釈・表の整形 |
| `scripts/analytics/gsc.mjs` | Search Console API のクライアント兼 CLI |
| `scripts/analytics/ga4.mjs` | GA4 Data API / Admin API のクライアント兼 CLI |
| `scripts/analytics/report.mjs` | 週次レポートの生成（md + CSV） |
| `.claude/skills/seo-report/SKILL.md` | `/seo-report` |

### 8.2 セットアップ（1回だけ）

#### 済んでいること

| 項目 | 値 |
| --- | --- |
| Google Cloud プロジェクト | `creatorpot-analytics`（組織 `creatorpot.net` 配下、プロジェクト番号 469912785070） |
| 有効化した API | `searchconsole` / `analyticsdata` / `analyticsadmin` / `iamcredentials` |
| サービスアカウント | `analytics-reader@creatorpot-analytics.iam.gserviceaccount.com` |
| 借用の権限 | `yamagata@creatorpot.net` に `roles/iam.serviceAccountTokenCreator` |

このプロジェクトは API の呼び出し先とクォータの計上先を用意するためだけのもので、
GSC や GA4 のデータそのものは保持しない。課金アカウントは不要。

#### 手順1: ADC のログイン（借用の設定つき）

ブラウザが開くので `yamagata@creatorpot.net` を選ぶ。

```bash
gcloud auth application-default login \
  --impersonate-service-account=analytics-reader@creatorpot-analytics.iam.gserviceaccount.com
```

> **`--scopes` は付けない。** 付けると gcloud の既定クライアント ID でブロックされる。
> スコープはスクリプトが借用トークンを発行するときに指定するので、ここでは要らない。

資格情報は `~/.config/gcloud/application_default_credentials.json` に置かれる。中身は本人の
リフレッシュトークンと借用先の URL で、サービスアカウントの秘密鍵は含まれない。リポジトリには入らない。

#### 手順2: Search Console にサービスアカウントを追加する

読むのはサービスアカウントなので、GSC 側にそのメールアドレスを登録する。

1. https://search.google.com/search-console で対象プロパティを開く
2. 左メニュー下部の「設定」→「ユーザーと権限」
3. 「ユーザーを追加」→ `analytics-reader@creatorpot-analytics.iam.gserviceaccount.com`
4. 権限は **「フル」**

> 検索パフォーマンスを読むだけなら「制限付き」で足りるが、**URL 検査 API は「フル」以上でないと使えない**。
> `report.mjs` は既定でインデックス状況を調べるので、「制限付き」だと §5 が全ページ「検査に失敗」になる。
> URL 検査が不要なら「制限付き」＋ `--skip-inspect` の組み合わせでもよい。

#### 手順3: GA4 にサービスアカウントを追加する

1. https://analytics.google.com で「管理」→ 対象プロパティの「プロパティのアクセス管理」
2. 右上の「+」→「ユーザーを追加」
3. `analytics-reader@creatorpot-analytics.iam.gserviceaccount.com` を入力
4. 役割は **「閲覧者」**、「メールで通知する」のチェックは**外す**（送信先が実在しないため）

### 8.3 動作確認

```bash
# 権限のあるプロパティが出れば GSC 側は通っている
node scripts/analytics/gsc.mjs sites --format table

# プロパティ ID が出れば GA4 側は通っている
node scripts/analytics/ga4.mjs properties --format table

# 直近7日ぶんを保存せずに表示する
node scripts/analytics/report.mjs --dry-run --days 7
```

#### 対象プロパティは設定で固定してある

このアカウントには GA4 プロパティが2つある（`534062125` Corporate Site と `452255564` nologic-beta）。
**自動検出に任せると別プロダクトの数値を取り違える**ので、`scripts/analytics/config.mjs` で固定している。

| 設定 | 値 |
| --- | --- |
| `gscSiteUrl` | `sc-domain:creatorpot.net` |
| `ga4PropertyId` | `534062125`（Corporate Site）。HTML に埋まっている測定 ID `G-LD73BKRCCG` とは別物 |
| `sitemapUrl` | `https://creatorpot.net/sitemap-index.xml` |

一時的に別サイトを見たいときは環境変数 `GSC_SITE_URL` / `GA4_PROPERTY_ID` で上書きできる。
設定を消して自動検出に戻した場合、候補が複数あるとエラーで止まる（黙って選ばない）。

うまくいかないときは次を見る。

| 出力 | 原因と対処 |
| --- | --- |
| `Google API の資格情報が見つかりません` | ADC が未作成。§8.2 手順1 のログインコマンドを実行する |
| `サービスアカウントの権限借用に失敗しました` | `roles/iam.serviceAccountTokenCreator` が付いていないか、`iamcredentials` API が無効。§8.2 の「済んでいること」を確認する |
| `権限のある Search Console プロパティがありません` | GSC にサービスアカウントが追加されていない。§8.2 手順2 |
| `権限のある GA4 プロパティがありません` | GA4 にサービスアカウントが追加されていない。§8.2 手順3 |
| `HTTP 403`（URL 検査だけ失敗する） | GSC の権限が「制限付き」になっている。「フル」に上げるか `--skip-inspect` を使う |
| `has not been used in project ... or it is disabled` | API が有効化されていない。§8.2 の表を確認する |

### 8.4 レポートの出力先

```bash
node scripts/analytics/report.mjs
```

- `docs/analytics/reports/YYYY-MM-DD.md` … その回の詳細（サマリ / クエリ / ページ / デバイス / インデックス状況 / GA4 / 改善提案）
- `docs/analytics/history.csv` … 主要な数値の時系列。1回1行

改善提案は `report.mjs` の `THRESHOLDS` で機械的に抽出しているだけで、業界的な根拠のある値ではない。
運用しながら調整する。

### 8.5 定期実行にしたくなったら

**権限借用は手元のログインに紐づくので、GitHub Actions からは使えない。** 定期実行するなら、CI から
使える資格情報を別途用意することになる。GSC・GA4 へのサービスアカウント追加は済んでいるので、
残りは資格情報の渡し方だけ。

| 方法 | 必要な作業 | 備考 |
| --- | --- | --- |
| サービスアカウント鍵 | 組織ポリシー `constraints/iam.disableServiceAccountKeyCreation` を `creatorpot-analytics` だけ解除し、`analytics-reader` の鍵を発行して Secrets に入れる | 組織の管理者権限が必要。鍵の管理責任が発生する |
| Workload Identity Federation | GitHub Actions と `analytics-reader` の信頼関係を設定 | 鍵を作らずに済む。設定は複雑 |

`auth.mjs` はサービスアカウント鍵にも対応済みで、Secrets（`GOOGLE_SERVICE_ACCOUNT_KEY`）に
JSON の中身をそのまま入れれば読む。ワークフローの雛形は次のとおり。

```yaml
# .github/workflows/seo-report.yml （必要になったら作る）
name: SEO Report
on:
  schedule:
    - cron: "17 22 * * 0" # 毎週月曜 7:17 JST
  workflow_dispatch:

jobs:
  report:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .node-version
      - run: node scripts/analytics/report.mjs
        env:
          GOOGLE_SERVICE_ACCOUNT_KEY: ${{ secrets.GOOGLE_SERVICE_ACCOUNT_KEY }}
      - name: レポートをコミットする
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add docs/analytics
          git diff --staged --quiet || git commit -m "chore: SEOレポートを更新"
          git push
```

---

## 9. 参考リンク

- Search Console ヘルプ: https://support.google.com/webmasters
- GA4 ヘルプ: https://support.google.com/analytics/answer/10089681
- GA4 推奨イベントリファレンス: https://support.google.com/analytics/answer/9267735
- Astro sitemap 公式ドキュメント: https://docs.astro.build/en/guides/integrations-guide/sitemap/
