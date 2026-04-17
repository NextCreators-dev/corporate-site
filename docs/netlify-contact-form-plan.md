# Netlify継続時のお問い合わせフォーム方針

**最終更新**: 2026-04-07

## 目的

現在の LP は Netlify にデプロイしている。  
この前提を維持したまま、お問い合わせフォームをどの構成で運用するのが妥当かを整理する。

---

## 結論

Netlify を継続するなら、優先順位は以下を推奨する。

1. **推奨案A: Netlify Forms を使う**
2. **代替案B: Netlify Functions + Netlify DB で自前 API を持つ**
3. **非推奨案C: Netlify 配信のまま Cloudflare D1 を併用する**

今回の LP の用途が「問い合わせ受付」であり、複雑な業務ロジックや高度な検索 UI がまだ不要であれば、**まずは Netlify Forms に寄せるのが最も運用が軽い**。

---

## なぜ Cloudflare D1 併用を避けたいか

現状のフォーム実装は Cloudflare Pages / Workers 前提になっている。

- `astro.config.mjs` が `@astrojs/cloudflare` を使用している
- `src/pages/api/contact.ts` が `locals.runtime.env.DB` から D1 binding を読む前提
- Turnstile も Cloudflare 寄りの設計になっている

この構成のまま Netlify で動かすと、**Cloudflare の runtime binding が存在しないため、同じコードはそのままでは動かない**。

Netlify 上で Cloudflare D1 を使うこと自体は不可能ではないが、以下の問題が増える。

- フロントの配信基盤と API/DB 基盤が分かれる
- 障害調査先が Netlify と Cloudflare に分散する
- 認証・CORS・監視の責任境界が複雑になる
- 小規模フォームに対して構成が過剰になる

---

## 比較表

| 案 | 構成 | 向いているケース | メリット | デメリット |
|---|---|---|---|---|
| A | Netlify Forms | まず問い合わせを安定稼働させたい | 実装と運用が最も軽い、管理画面あり、CSV 出力あり、通知設定が簡単 | 自由度は低い、独自バリデーションや独自保存ロジックは限定的 |
| B | Netlify Functions + Netlify DB | 今後ダッシュボードや一覧画面を作る可能性がある | 自由度が高い、Netlify に寄せて完結できる | 実装工数が増える、DB 設計や運用が必要 |
| C | Netlify + Cloudflare D1 | どうしても D1 を使いたい | 既存の Cloudflare 設計思想を一部活かせる | 運用が最も複雑、今回の LP には過剰 |

---

## 推奨案A: Netlify Forms

### 概要

Astro サイトは引き続き静的配信し、フォーム送信は Netlify Forms に任せる。  
フォームデータは Netlify の Forms 管理画面で確認し、必要に応じて通知や後続処理を追加する。

### この案が向いている理由

- 現在の LP は大半が静的ページで、フォームだけが動的要素
- まず必要なのは「確実に受け付けられること」
- 運用担当が Netlify UI で送信内容を確認しやすい
- フォーム通知、スパム判定、CSV 出力などの最低限機能が揃っている

### 推奨構成

- フロント: Astro の静的ページ
- 送信先: Netlify Forms
- スパム対策: Netlify の Akismet + honeypot
- 追加スパム対策が必要な場合: Netlify の reCAPTCHA 2
- 通知:
  - まずは Netlify のフォーム通知
  - 必要なら `submission-created` 関数で Slack / Resend を追加

Astro の公式ドキュメントでも、**静的サイトとして運用するだけなら adapter は不要**という整理になっている。  
そのため、この案では Cloudflare adapter 前提をやめて、静的サイト + Netlify Forms に寄せるのが素直。

### 実装イメージ

- `ContactForm.tsx` を Netlify Forms 送信用に調整
- 送信は `application/x-www-form-urlencoded` で POST
- サンクス表示は今のように React 側で継続可能
- hidden の `form-name` を含める
- Netlify に検出させるための静的 form 断片を HTML に残す

### この案で変える点

- Cloudflare Turnstile 前提は外す
- Cloudflare D1 保存は行わない
- `src/pages/api/contact.ts` 依存をなくす
- `@astrojs/cloudflare` 前提の設計を見直す

### この案で残せるもの

- フォーム UI
- クライアント側のバリデーション
- 同一ページ内サンクス表示
- 既存のデザイン

### 注意点

- Netlify Forms は build 時の form 検出が前提になる
- PII を保持するため、保持期間や削除運用を決める必要がある
- Turnstile を使いたい場合はこの案と相性があまり良くない

---

## 代替案B: Netlify Functions + Netlify DB

### 概要

フォーム送信を独自 API で受け、DB に保存する。  
Netlify を継続しつつ、保存先は Cloudflare D1 ではなく **Netlify DB** を第一候補にする。

### この案が向いているケース

- 問い合わせ一覧や簡単な管理画面を今後作る可能性が高い
- 送信ログに対して独自集計や独自ワークフローを追加したい
- Turnstile のような独自検証ロジックを維持したい

### 推奨構成

- フロント: Astro
- API: `netlify/functions/contact.ts`
- 保存先: Netlify DB（Neon/Postgres）または Neon / Supabase
- スパム対策: honeypot + Turnstile
- 通知: 関数内で Resend / Slack

### この案のポイント

- Cloudflare binding を前提にしない
- Netlify の Functions 環境変数で API キーを扱う
- DB は SQL ベースに寄せる
- 今の `/api/contact` は Astro API route ではなく Netlify Functions に寄せた方が明快

### この案で必要な変更

- `astro.config.mjs` から Cloudflare 依存を外す
- `src/pages/api/contact.ts` を Netlify Functions 向けに移植
- D1 固有コードを Postgres 系クライアントに置き換える
- 環境変数の取得方法を Netlify Functions 向けに揃える

### 評価

将来性は高いが、**今回の LP の問い合わせ受付だけを見ると少し重い**。  
「今後フォームまわりを自社機能として育てる」前提があるなら有力。

---

## 非推奨案C: Netlify + Cloudflare D1

### 概要

LP は Netlify 配信のまま、問い合わせ API だけ別で Cloudflare 側に置き、D1 に保存する。

### この案を非推奨にする理由

- 実行環境が分かれて責任境界が曖昧になる
- 送信失敗時の調査が面倒になる
- 小規模な問い合わせフォームとしては構成が複雑すぎる

### どうしても採るなら

- Netlify から Cloudflare API を直接叩く
- API 認証を追加する
- ログと監視の運用を明確に分ける

ただし、**今回の用途なら優先度は低い**。

---

## 今回のプロジェクト向け提案

### 第一推奨

**短期は Netlify Forms に寄せる。**

理由:

- もっとも早く安定稼働できる
- Netlify 継続という現状に最も素直
- フォーム受付のオペレーションがすぐ回る
- Cloudflare 前提コードを無理に残さなくてよい

### 第二推奨

**将来的に問い合わせ管理や集計を作りたいなら、次段階で Netlify Functions + Netlify DB に移る。**

つまり、

- v1: Netlify Forms
- v2: Netlify Functions + Netlify DB

の二段階が最も現実的。

---

## 実装方針メモ

### v1: Netlify Forms に寄せる場合

1. `ContactForm.tsx` の送信先を `/api/contact` から Netlify Forms に変更
2. `form-name` を含む送信形式に変更
3. honeypot は Netlify Forms 仕様に合わせる
4. Turnstile は撤去し、必要なら Netlify の reCAPTCHA 2 を採用
5. 通知はまず Netlify 標準通知で開始
6. 必要になったら `submission-created` 関数で Slack / Resend を後付け

### v2: Netlify Functions + Netlify DB に寄せる場合

1. `@astrojs/cloudflare` をやめる
2. `src/pages/api/contact.ts` を Netlify Functions に移植
3. DB を Netlify DB または Neon / Supabase に変更
4. Turnstile 検証は関数内で継続
5. Resend / Slack 通知を関数内で実行

---

## この判断に使った公式ドキュメント

- Astro Netlify adapter  
  https://docs.astro.build/en/guides/integrations-guide/netlify/
- Netlify Functions  
  https://docs.netlify.com/functions/get-started/
- Netlify Functions の環境変数  
  https://docs.netlify.com/functions/environment-variables/
- Netlify Forms setup  
  https://docs.netlify.com/forms/setup/
- Netlify Forms submissions  
  https://docs.netlify.com/forms/submissions/
- Netlify Forms spam filters  
  https://docs.netlify.com/forms/spam-filters/
- Netlify Forms notifications  
  https://docs.netlify.com/forms/notifications/
- Netlify event-triggered functions  
  https://docs.netlify.com/functions/trigger-on-events/
- Netlify DB  
  https://docs.netlify.com/build/data-and-storage/netlify-db/

---

## 補足

このドキュメントは **2026-04-07 時点** の Netlify / Astro 公式ドキュメントを前提に整理している。  
Netlify 側のフォーム機能や DB 機能は更新頻度があるため、実装着手前に最新仕様を再確認する。
