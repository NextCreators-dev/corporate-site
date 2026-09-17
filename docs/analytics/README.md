# docs/analytics

GSC と GA4 の実測値の置き場。中身は `scripts/analytics/report.mjs` が書く生成物で、手で書かない。

| パス | 中身 |
| --- | --- |
| `reports/YYYY-MM-DD.md` | その回の詳細レポート（サマリ / クエリ / ページ / デバイス / インデックス状況 / GA4 / 改善提案） |
| `history.csv` | 主要な数値の時系列。1回1行 |

生成は `/seo-report`、またはコマンドで直接。

```bash
node scripts/analytics/report.mjs
```

セットアップ（サービスアカウントの作り方、GSC / GA4 への権限付与）は `../analytics-setup.md` の §8。

## history.csv の列

| 列 | 中身 |
| --- | --- |
| `date` | 生成日（JST） |
| `period_start` / `period_end` / `days` | 集計期間 |
| `gsc_clicks` / `gsc_impressions` / `gsc_ctr` / `gsc_position` | GSC の合計。`ctr` は小数（0.0345 = 3.45%）、`position` は平均掲載順位 |
| `ga4_sessions` / `ga4_users` / `ga4_pageviews` | GA4 の合計 |
| `ga4_leads` | `generate_lead` イベントの発生数 |
| `indexed_pages` / `total_pages` | URL 検査でインデックス済みだったページ数 / **検査したページ数**（サイトマップの総数ではない。1回の上限は30件）。`--skip-inspect` のときは空 |
| `note` | 手で書き足す備考。数字が動いた理由の心当たりなど |

**この CSV の値をポータル側の資料に転記するときは、実測日を併記する**（ポータルの CLAUDE.md の数字ルール）。
コーポレートサイト掲載の累計値とは別物として扱う。
