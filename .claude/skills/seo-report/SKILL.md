---
name: seo-report
description: Google Search Console と GA4 の実測値を取ってきて、コーポレートサイト（creatorpot.net）の SEO レポートを docs/analytics/ に書き出す。「SEOの数字を見せて」「検索流入どうなってる？」「GSCとGA4のレポート出して」「先月と比べてどう？」「どのクエリが伸びた？」等のときに使う。
---

# /seo-report（creatorpot.net の検索まわりの実測）

GSC と GA4 から数字を取り、`docs/analytics/reports/YYYY-MM-DD.md` に詳細を、
`docs/analytics/history.csv` に主要な数値を1行だけ残す。
セットアップと API の仕組みは `docs/analytics-setup.md` の §8。

## 手順

### 1. レポートを作る

```bash
node scripts/analytics/report.mjs
```

既定は直近28日と、その直前28日の比較。期間を変えたいときだけ `--days 7` や
`--start 2026-08-01 --end 2026-08-31` を付ける。

保存せず内容だけ見たいときは `--dry-run`。URL 検査 API の割り当てを使いたくないときは
`--skip-inspect`。

### 2. 失敗したときは、原因を伝えて止まる

| 出力 | 伝えること |
|---|---|
| `Google API の資格情報が見つかりません` | ADC が未作成。`docs/analytics-setup.md` §8.2 手順1 のログインコマンドを代表に実行してもらう。**ブラウザ認証なので代わりに実行できない** |
| `サービスアカウントの権限借用に失敗しました` | 借用の権限か `iamcredentials` API が欠けている。§8.2 の「済んでいること」を確認する |
| `権限のある Search Console プロパティがありません` | GSC にサービスアカウントが追加されていない。§8.2 手順2 を代表に実行してもらう |
| `権限のある GA4 プロパティがありません` | GA4 に追加されていない。§8.2 手順3 |
| `HTTP 403`（URL 検査だけ失敗する） | GSC の権限が「制限付き」。「フル」に上げるか `--skip-inspect` を使う |
| `has not been used in project ... or it is disabled` | Google Cloud で API が有効化されていない。§8.2 の表を確認する |

**資格情報の中身を推測して埋めない。パスや中身をチャットや文書に書かない。**
失敗したときはファイルを書いていないので、直してからもう一度実行すればよい。

### 3. 結果を数行で報告する

レポートの §1 サマリと §7 改善提案から、動いたものだけを拾う。全部を読み上げない。

```
2026-08-06〜2026-09-02（28日間）
クリック 142（前期比 +38、+36.5%）/ 表示 3,204（+512）/ 平均掲載順位 18.3（+1.2 改善）
問い合わせ（generate_lead）2件
気になる点: 「ノーコード ゲーム開発」が12位で表示210回。1ページ目まであと一歩
```

**数値は実測値をそのまま書く。丸めない、盛らない。** 日付を必ず添える
（ポータルの CLAUDE.md の数字ルール）。ポータル側の資料に転記するときは
「2026-09-05 GSC 実測」のように出典を書く。

### 4. 深掘りは CLI を直接叩く

レポートに無い切り口を聞かれたら、その場でコマンドを組む。`--format table` を付けると読みやすい。

```bash
# 特定ページに流入しているクエリ
node scripts/analytics/gsc.mjs query --dimensions page,query --limit 50 --format table

# 日別の推移
node scripts/analytics/gsc.mjs query --dimensions date --days 30 --format table

# デバイス別・国別
node scripts/analytics/gsc.mjs query --dimensions device --format table

# 特定 URL がインデックスされているか
node scripts/analytics/gsc.mjs inspect https://creatorpot.net/works

# GA4 のページ別 表示回数
node scripts/analytics/ga4.mjs report --dimensions pagePath --metrics screenPageViews,sessions --limit 30 --format table

# GA4 で使えるメトリクス名を探す
node scripts/analytics/ga4.mjs metadata --filter lead --format table
```

## 数字を読むときの注意

- **GSC の検索パフォーマンスは確定に2〜3日かかる。** 集計の終了日は既定で3日前に置いている。「昨日の数字」は取れない
- **GA4 の当日データは変動する。** 集計の終了日は既定で前日
- **§7 の改善提案はしきい値で機械的に抽出しただけ。** 閾値（`scripts/analytics/report.mjs` の `THRESHOLDS`）に業界的な根拠はなく、運用しながら調整する前提の暫定値。提案をそのまま結論として書かない
- **GSC のクリック数と GA4 のセッション数は一致しない。** 計測の仕組みが違うので、突き合わせて差を問題視しない

## 出力先

| ファイル | 中身 |
|---|---|
| `docs/analytics/reports/YYYY-MM-DD.md` | その回の詳細。7節構成 |
| `docs/analytics/history.csv` | 主要な数値の時系列。1回1行 |

同じ日に2回実行すると、md も CSV のその日の行も最後の実行で上書きされる。行は増えない。

対象プロパティは `scripts/analytics/config.mjs` で固定している（GA4 は `534062125` Corporate Site）。
同じアカウントに nologic-beta のプロパティもあるので、**自動検出に頼らない**。数値が前回と桁違いに
動いていたら、まず対象を取り違えていないか `config.mjs` を確認する。
