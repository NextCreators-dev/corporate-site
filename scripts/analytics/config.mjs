// レポートの対象を明示する設定。
//
// 自動検出に任せてはいけない。同じ Google アカウントには別プロダクトのプロパティが
// ぶら下がっており、名前で絞り込めなかったときに先頭の1件へ黙って落ちると、
// 取り違えたまま数値がレポートと CSV に残る。2026-09-06 に実際に起きた
// （コーポレートサイトのレポートに nologic-beta の数値が入った）。
//
// 対象はここで固定する。別サイトを見たいときだけ環境変数で上書きする。

export const TARGET = {
  // Search Console のプロパティ。ドメインプロパティは sc-domain: で始まる
  gscSiteUrl: process.env.GSC_SITE_URL ?? "sc-domain:creatorpot.net",

  // GA4 のプロパティ ID（数字のみ）。HTML に埋まっている測定 ID（G-LD73BKRCCG）とは別物
  ga4PropertyId: process.env.GA4_PROPERTY_ID ?? "534062125",

  // インデックス状況を調べるときに読むサイトマップ
  sitemapUrl: "https://creatorpot.net/sitemap-index.xml",
};
