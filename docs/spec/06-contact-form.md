# 要件定義書: 内部お問い合わせフォーム

## 概要

現在 Google Forms で運用しているお問い合わせフォームを、サイト内埋め込みの自前フォームに置き換える。コーポレートサイト全体で共通利用する。

## 背景・目的

- Google Forms はドメイン外への遷移が発生し、CVR低下の要因となっている
- フォーム送信データの管理・分析ができていない
- 自動返信メールが送れない
- デザインの統一性が保てない

## チーム議論サマリー

### CTO（技術視点）

- **インフラ**: Cloudflare Pages + Functions（旧Workers）が最適。Astro の SSR アダプタ（`@astrojs/cloudflare`）を使えば、API エンドポイントを Astro 内に定義できる。別途 Workers を立てる必要がない
- **メール送信**: Resend が最もシンプル。無料枠（月3,000通）で十分。SDK が軽量で Cloudflare Workers 環境でも動作する
- **データ保存**: Cloudflare D1（SQLite）を推奨。KV は構造化データに不向き。D1 なら SQL でクエリ可能で、将来的にダッシュボード構築もしやすい
- **Slack通知**: Incoming Webhook URL を環境変数に持ち、`fetch` で POST するだけ。外部ライブラリ不要
- **スパム対策**: ハニーポット（CSS で非表示にした入力欄）を必須実装。reCAPTCHA の代わりに **Cloudflare Turnstile** を推奨。無料・低フリクション・Cloudflare エコシステムとネイティブ統合で運用コストがほぼゼロ
- **ダウンタイム回避**: Netlify → Cloudflare Pages の移行は DNS 切り替えのみ。Cloudflare Pages にデプロイしてから DNS を向ければダウンタイムなし

### CMO（マーケティング視点）

- **フォーム項目の最適化**: 項目数は CVR に直結する。「必要最小限 + 任意項目」の構成が重要。現在8項目は多すぎる。必須は4項目（名前・メール・種別・内容）に絞り、残りは任意にすべき
- **問い合わせ種別**: ドロップダウンではなく選択式ボタン（ラジオ or チップ）にするとタップしやすく CVR が上がる
- **返信希望手段/返信先の統合**: メールアドレスを入力している時点で返信先は確定している。別途「返信希望手段」「返信先」を聞くのは冗長。メール以外（Slack/Discord）の希望は「その他ご要望」欄に書いてもらえばよい
- **法人名の扱い**: 個人事業主やフリーランスからの問い合わせもあり得るので必須にしない
- **自動返信メール**: 送信確認 + 「1営業日以内に担当者からご連絡」の文言を入れる。これが不安解消に効く

### ペルソナ（発注検討企業担当者）

- **フォーム到達時の心理**: ここまでスクロールしてきた時点で興味はある。フォームが長いと「後でいいか」と離脱する。3-5項目が理想
- **「件名」は不要**: 種別を選んだ時点で件名の役割は果たされている。問い合わせの件名を考えるのは面倒
- **予算感の入力**: 予算レンジの選択肢があると、回答する側も助かるし、こちらも社内の温度感を伝えやすい
- **ファイル添付**: RFP や参考資料を添付できると便利だが、初回問い合わせでは不要かもしれない

### デビルズアドボケート

- **Cloudflare D1 の成熟度**: D1 は GA になっているが、大量データには不向き。ただし問い合わせデータ程度なら十分
- **Resend の信頼性**: Resend はスタートアップだが、技術的には信頼性が高い。万が一の障害時はSlack通知があるので問い合わせ自体は見逃さない
- **Turnstile の UX**: Turnstile は多くの場合バックグラウンドで検証が完了し、ユーザーに操作を求めない。reCAPTCHA v3 と同等の UX で運用コストはゼロ
- **ファイル添付は v2 で**: 初期実装ではファイル添付は見送り。Cloudflare R2 + 署名付き URL の実装コストが高い

### 合意事項

| 論点 | 結論 |
|---|---|
| インフラ | Cloudflare Pages + Functions（Astro SSR） |
| メール | Resend（自動返信 + 管理者通知） |
| データ保存 | Cloudflare D1 |
| Slack通知 | Incoming Webhook |
| スパム対策 | ハニーポット + Cloudflare Turnstile |
| フォーム項目数 | 必須4項目 + 任意2項目 = 計6項目（現行8→6に削減） |
| 件名 | 廃止（種別で代替） |
| 返信手段/返信先 | 廃止（メール返信で統一、他希望は備考欄へ） |
| 予算レンジ | 任意選択肢として追加 |
| ファイル添付 | v1 では見送り |

---

## フォーム項目設計

### 項目一覧

| # | 項目名 | 入力形式 | 必須 | バリデーション | 備考 |
|---|---|---|---|---|---|
| 1 | お名前 | テキスト | ✅ | 1-50文字 | 個人名（法人名は別項目） |
| 2 | メールアドレス | email | ✅ | メール形式 | 自動返信先にも使用 |
| 3 | お問い合わせ種別 | 選択式（チップ） | ✅ | いずれか1つ選択 | 後述の選択肢 |
| 4 | ご相談内容 | テキストエリア | ✅ | 10-2000文字 | プレースホルダーで記入例を案内 |
| 5 | 法人名 / 組織名 | テキスト | - | 0-100文字 | 個人・フリーランスの場合は空欄可 |
| 6 | ご予算 | 選択式（ドロップダウン） | - | 選択肢から | 概算の温度感を把握 |

### お問い合わせ種別の選択肢

| 値 | 表示ラベル |
|---|---|
| `web-site` | Webサイト制作 |
| `web-app` | Webアプリ開発 |
| `game` | ゲーム制作 |
| `creative` | クリエイティブ制作 |
| `ai` | AI活用コンサルティング |
| `event` | イベント企画・運営 |
| `other` | その他 |

チップ型ボタン（複数列、タップしやすい48px高さ）で表示。選択中はemeraldハイライト。

### ご予算の選択肢

| 値 | 表示ラベル |
|---|---|
| `under-30` | 〜30万円 |
| `30-50` | 30万円〜50万円 |
| `50-100` | 50万円〜100万円 |
| `100-300` | 100万円〜300万円 |
| `over-300` | 300万円〜 |
| `undecided` | 未定・相談したい |

### ハニーポットフィールド

```html
<!-- CSSで非表示。botが自動入力した場合はスパム判定 -->
<div class="hidden" aria-hidden="true">
  <label for="website">Website</label>
  <input type="text" id="website" name="website" tabindex="-1" autocomplete="off" />
</div>
```

サーバー側で `website` フィールドに値があればスパムとして破棄。

---

## 技術設計

### アーキテクチャ

```
[ブラウザ]
  ↓ POST /api/contact
[Cloudflare Pages Functions (Astro SSR)]
  ├→ バリデーション + ハニーポット/Turnstile検証
  ├→ Cloudflare D1 にデータ保存
  ├→ Resend API で自動返信メール送信
  ├→ Resend API で管理者通知メール送信
  └→ Slack Incoming Webhook で通知
  ↓
[ブラウザ] JSON レスポンス → 同一ページ内でサンクス表示
```

### ファイル構成

```
src/
├── pages/
│   └── api/
│       └── contact.ts          # API エンドポイント（POST）
├── components/
│   └── ContactForm.tsx         # React フォームコンポーネント（client:load）
├── lib/
│   ├── resend.ts               # Resend メール送信ユーティリティ
│   ├── slack.ts                # Slack通知ユーティリティ
│   └── validation.ts           # バリデーションロジック
└── emails/
    ├── auto-reply.tsx          # 自動返信メールテンプレート（react-email）
    └── admin-notify.tsx        # 管理者通知メールテンプレート
```

### 技術スタック

| レイヤー | 技術 | 理由 |
|---|---|---|
| フォームUI | React + `client:load` | 状態管理（入力値・送信中・完了）が必要 |
| バリデーション（クライアント） | Zod | 型安全なバリデーション、サーバー側と共有可 |
| バリデーション（サーバー） | Zod（同一スキーマ） | クライアントと同じスキーマを再利用 |
| API | Astro SSR（`src/pages/api/contact.ts`） | Cloudflare Functions として自動デプロイ |
| メール送信 | Resend + react-email | テンプレートを JSX で記述可能 |
| データ保存 | Cloudflare D1 | SQL でクエリ可能、Pages と統合済み |
| スパム対策 | ハニーポット + Turnstile | 二重防御。Turnstile は Cloudflare 無料 |
| Slack通知 | Incoming Webhook（fetch） | 外部ライブラリ不要 |

### Astro SSR 設定変更

```javascript
// astro.config.mjs
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'hybrid',       // 静的ページ + 一部SSR
  adapter: cloudflare(),
});
```

`output: 'hybrid'` により、既存の静的ページはそのまま、`/api/contact` のみサーバーサイドで処理。

### API エンドポイント設計

```
POST /api/contact
Content-Type: application/json
```

**リクエストボディ:**

```typescript
interface ContactRequest {
  name: string;
  email: string;
  category: string;
  message: string;
  company?: string;
  budget?: string;
  website?: string;           // ハニーポット
  turnstileToken?: string;    // Turnstile トークン
}
```

**レスポンス:**

```typescript
// 成功
{ success: true }

// バリデーションエラー
{ success: false, errors: { field: "メッセージ" } }

// サーバーエラー
{ success: false, error: "送信に失敗しました" }
```

### D1 テーブル設計

```sql
CREATE TABLE contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  budget TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  is_spam INTEGER NOT NULL DEFAULT 0
);
```

### Slack 通知フォーマット

```json
{
  "blocks": [
    {
      "type": "header",
      "text": { "type": "plain_text", "text": "📩 新しいお問い合わせ" }
    },
    {
      "type": "section",
      "fields": [
        { "type": "mrkdwn", "text": "*お名前:*\n山田 太郎" },
        { "type": "mrkdwn", "text": "*法人名:*\n株式会社〇〇" },
        { "type": "mrkdwn", "text": "*種別:*\nWebアプリ開発" },
        { "type": "mrkdwn", "text": "*予算:*\n50万円〜100万円" }
      ]
    },
    {
      "type": "section",
      "text": { "type": "mrkdwn", "text": "*ご相談内容:*\n問い合わせ内容がここに表示..." }
    }
  ]
}
```

### 自動返信メール内容

```
件名: 【クリエイターのうえきばち】お問い合わせありがとうございます

{name} 様

お問い合わせいただきありがとうございます。
以下の内容で承りました。

━━━━━━━━━━━━━━━━━━
■ お問い合わせ種別: {category}
■ ご相談内容:
{message}
━━━━━━━━━━━━━━━━━━

担当者より1営業日以内にご連絡いたします。
しばらくお待ちくださいませ。

─────────────────
株式会社クリエイターのうえきばち
https://creatorpot.net
─────────────────
```

---

## フォームUI設計

### レイアウト

- 全ページ共通で使えるコンポーネント（`<ContactForm />`）
- techplantstudioページ: 最下部CTAセクション内に埋め込み
- コーポレートサイト: Contactセクション内に埋め込み

### 状態遷移

```
[入力中] → 送信ボタン押下 → [送信中（ローディング）] → [完了（サンクス表示）]
                                                      → [エラー（エラーメッセージ表示）]
```

### サンクス表示

フォーム部分がフェードアウトし、以下のメッセージに切り替わる:

```
✅ お問い合わせありがとうございます

ご入力いただいたメールアドレスに確認メールをお送りしました。
担当者より1営業日以内にご連絡いたします。
```

### デザイン仕様

- 背景: `bg-[#111827]`（カード型 `rounded-2xl p-8`）
- 入力フィールド: `bg-[#0A0F1C] border border-[#1E293B] rounded-lg px-4 py-3 text-white`
- フォーカス時: `focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500`
- ラベル: `text-sm font-medium text-gray-300 mb-2`
- 必須マーク: `text-emerald-500 text-xs ml-1`（「必須」テキスト）
- 種別チップ: `px-4 py-2 rounded-lg border cursor-pointer`、選択時 `bg-emerald-500/15 border-emerald-500/40 text-emerald-500`
- 送信ボタン: 既存CTAと同じスタイル（`bg-emerald-500 hover:bg-emerald-600`）
- エラーメッセージ: `text-red-400 text-xs mt-1`

---

## 環境変数

```env
RESEND_API_KEY=re_xxxxxxxxxxxx
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx/xxx/xxx
TURNSTILE_SECRET_KEY=0x4AAAAAAxxxxxxx
TURNSTILE_SITE_KEY=0x4AAAAAAxxxxxxx    # クライアント側で使用
```

Cloudflare Pages の環境変数 / Secrets として設定。

---

## 移行計画（Netlify → Cloudflare Pages）

### フェーズ A: Cloudflare Pages セットアップ

1. Cloudflare Pages プロジェクト作成（GitHub連携）
2. `@astrojs/cloudflare` アダプタをインストール
3. `astro.config.mjs` を `output: 'hybrid'` に変更
4. D1 データベース作成 + テーブル作成
5. 環境変数設定（Resend, Slack, Turnstile）
6. Cloudflare Pages にデプロイ → `xxx.pages.dev` で動作確認

### フェーズ B: フォーム実装

1. Zod バリデーションスキーマ作成
2. API エンドポイント実装（`/api/contact`）
3. ContactForm.tsx コンポーネント実装
4. 自動返信・管理者通知メールテンプレート作成
5. Slack 通知実装
6. Turnstile 統合
7. `xxx.pages.dev` 上で E2E テスト

### フェーズ C: DNS 切り替え（ダウンタイムなし）

1. Cloudflare に DNS を移管（またはCNAME設定）
2. Netlify のカスタムドメインを解除
3. Cloudflare Pages にカスタムドメインを設定
4. SSL証明書の自動発行を確認
5. 全ページの動作確認
6. Google Forms リンクをフォームコンポーネントに差し替え

---

## 追加パッケージ

```
@astrojs/cloudflare    # Cloudflare アダプタ
resend                 # メール送信
zod                    # バリデーション
@cloudflare/turnstile  # Turnstile ウィジェット（クライアント）
```

react-email は自動返信メールのテンプレートに使用するが、テキストメールで十分なら不要。

---

## 受け入れ基準

### フォーム UI

- [ ] 6項目のフォームが表示される（必須4 + 任意2）
- [ ] 種別がチップ型ボタンで選択できる
- [ ] 未入力の必須項目にエラーメッセージが表示される
- [ ] 送信中はローディング表示になり、二重送信が防止される
- [ ] 送信完了後、同一ページ内でサンクスメッセージが表示される
- [ ] ダークテーマのデザインが統一されている

### バックエンド

- [ ] POST /api/contact でデータが D1 に保存される
- [ ] ハニーポットに値がある場合、スパムとして処理される（200を返すがデータは保存しない）
- [ ] Turnstile トークンの検証が行われる
- [ ] バリデーションエラー時に適切なエラーレスポンスが返る

### 通知

- [ ] 送信者に自動返信メールが届く
- [ ] 管理者に通知メールが届く
- [ ] Slack チャンネルに通知が届く
- [ ] メール内容に問い合わせの全項目が含まれる

### 非機能要件

- [ ] Netlify → Cloudflare の移行でダウンタイムが発生しない
- [ ] 既存の静的ページのパフォーマンスが劣化しない
- [ ] Lighthouse スコア 90 以上を維持
- [ ] エラー時にユーザーに適切なメッセージが表示される（Resend/Slack障害時含む）
