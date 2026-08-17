# Supabase の自動停止を防ぐ疎通確認

**最終更新**: 2026-08-17

## なぜ必要か

お問い合わせフォームの保存先は Supabase の Free プラン。Supabase は、ユーザー由来のDBアクティビティが7日間ないプロジェクトを自動で一時停止（Pause）する。

フォームへの応募が1週間途切れるとDBが止まり、次の応募が保存できなくなる。これを避けるため、GitHub Actions から1日1回 Supabase に軽いリクエストを送って非アクティブ判定のタイマーをリセットしている。

参考: [Supabase 公式ドキュメント（Project Pausing）](https://supabase.com/docs/guides/platform/free-project-pausing)

## 仕組み

| 要素 | 役割 |
|---|---|
| `.github/workflows/supabase-keepalive.yml` | 毎日 00:23 UTC（JST 9:23）に実行するスケジュール。手動実行もできる |
| `scripts/keepalive.mjs` | Supabase の `keepalive_ping` を呼ぶスクリプト。依存パッケージなし（Node 22 の fetch のみ） |
| `keepalive` テーブル（`db/schema.sql`） | 1行だけのテーブル。ping時刻と累計回数を持つ。行が増えないのでDB容量は増えない |
| `keepalive_ping()` 関数（`db/schema.sql`） | その1行を更新し、前回・今回の時刻と累計回数を返す。1リクエストで読み書きが1回ずつ発生する |

キーは **anon（publishable）キーだけ**を使う。`keepalive` テーブルは RLS 有効かつポリシー無しで直接アクセスを塞いであり、`SECURITY DEFINER` の `keepalive_ping()` 経由でしか触れない。仮に GitHub Secrets が漏れても、できるのは keepalive の時刻を書き換えることだけ。service role キーは GitHub 側に置かない。

## 初期設定

### 1. SQL を適用する

Supabase Dashboard → SQL Editor で `db/schema.sql` の `keepalive` 以降（テーブルと関数、GRANT）を実行する。`CREATE TABLE IF NOT EXISTS` と `CREATE OR REPLACE FUNCTION` なので、何度実行しても壊れない。

適用直後に `PGRST202`（関数が見つからない）が返る場合は、PostgREST のスキーマキャッシュがまだ更新されていない。通常は自動で反映されるので、1分ほど待って再実行する。

### 2. GitHub Secrets を登録する

リポジトリの Settings → Secrets and variables → Actions に3つ登録する。

| Secret | 値 |
|---|---|
| `SUPABASE_URL` | Supabase Dashboard → Project Settings → API のプロジェクトURL |
| `SUPABASE_ANON_KEY` | 同ページの anon / publishable キー（**service role キーではない**） |
| `SLACK_WEBHOOK_URL` | Netlify に設定済みのものと同じ Incoming Webhook URL（任意。未設定なら通知なしで動く） |

## 動作確認

**手元で試す**

```bash
SUPABASE_URL=https://xxxx.supabase.co SUPABASE_ANON_KEY=xxxx node scripts/keepalive.mjs
```

`疎通確認 OK / 今回: ... / 前回: ... / 累計: N 回` と出れば成功。Supabase の Table Editor で `keepalive` の `last_ping_at` と `ping_count` が更新されていることも確認できる。

**GitHub Actions で試す**

Actions タブ → Supabase Keepalive → Run workflow で手動実行する。

## Slack 通知の見方

| 通知 | 意味 |
|---|---|
| 🚨 疎通確認に失敗 | 3回リトライしても Supabase に届かなかった。プロジェクトが既に停止しているか、キーが失効した可能性がある |
| ⚠️ 前回の実行から48時間以上空いている | ping自体は成功したが、定期実行が一度以上飛んでいる。Actions のスケジュールを確認する |
| ✅ 月次サマリ（毎月1日） | 定期実行が生きていることの確認。**このサマリが来ない月があれば、スケジュールが止まっている疑い** |

失敗時は Actions のジョブも赤くなるので、GitHub からメールも届く。

## 困ったときの確認箇所

**プロジェクトが停止してしまった場合**

Supabase Dashboard の対象プロジェクトで Resume project を押す。停止から1年以内ならデータと設定はそのまま復帰する。復帰後、Actions を手動実行して疎通確認が通ることを確かめる。

なお Supabase は停止の約1週間前に警告メールを送る。受信アドレスを今も確認できる状態にしておくこと。

**定期実行が止まっている場合**

このリポジトリは public なので、**60日間リポジトリに活動（コミットなど）がないと GitHub がスケジュールワークフローを自動で無効化する**。事前に GitHub から通知メールが届き、Actions タブから再有効化できる。月次サマリが来ない月があればここを疑う。

GitHub のスケジュールはもともと数分〜数十分遅れることがあり、混雑時にはスキップもある。7日の猶予に対して1日1回なので、数回飛んでも問題にはならない。

**より確実にしたい場合**

- Netlify Scheduled Function（`export const config = { schedule: "@daily" }`）を保険として同居させる。Netlify には Supabase の環境変数がすでに入っているので追加設定は少ない。ただし HTTP からは呼べず、本番デプロイでのみ動く。
- Supabase を有料プラン（$25/月）にすると、そもそも非アクティブによる停止の対象外になる。問い合わせが事業の生命線になった段階では、こちらのほうが確実。
