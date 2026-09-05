// GSC と GA4 から週次レポートを作り、docs/analytics/ に書き出す。
//
//   node scripts/analytics/report.mjs                  # 直近28日ぶんを生成して保存する
//   node scripts/analytics/report.mjs --days 7
//   node scripts/analytics/report.mjs --dry-run        # 保存せず標準出力に出す
//   node scripts/analytics/report.mjs --skip-inspect   # URL 検査を省く（API 割り当てを使わない）
//
// 出力
//   docs/analytics/reports/YYYY-MM-DD.md … その回の詳細
//   docs/analytics/history.csv           … 主要な数値を1行追記した時系列

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { TARGET } from "./config.mjs";
import {
  fetchSitemapUrls,
  fetchTotals,
  fetchWithComparison,
  inspectUrl,
  listSitemaps,
  resolveSiteUrl,
} from "./gsc.mjs";
import {
  LEAD_EVENT_NAME,
  fetchEventCounts,
  fetchLeadCount,
  resolvePropertyId,
  runReport,
  runReportWithComparison,
} from "./ga4.mjs";
import {
  GSC_DATA_LAG_DAYS,
  csvCell,
  fail,
  formatDecimal,
  formatDelta,
  formatInt,
  formatMarkdownTable,
  formatPercent,
  formatPositionDelta,
  parseArgs,
  parseNumber,
  resolvePeriod,
  todayJst,
} from "./lib.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const REPORT_DIR = path.join(REPO_ROOT, "docs/analytics/reports");
const HISTORY_CSV = path.join(REPO_ROOT, "docs/analytics/history.csv");

// 改善提案を機械的に拾うための閾値。業界的な根拠のある値ではなく、
// 2026-09-06 時点のサイト規模（28日間で表示 107 回・クエリ5件）に合わせた暫定値。
// 表示回数が増えてノイズが目立ってきたら minImpressions から上げていく。
const THRESHOLDS = {
  // 1ページ目まであと一歩とみなす掲載順位の範囲。
  // 本来は2ページ目（11〜20位）だけを見るが、母集団が小さいうちは3ページ目まで拾う
  nearFirstPageMin: 10.5,
  nearFirstPageMax: 30.5,
  // ノイズを除くための最低表示回数
  minImpressions: 3,
  // 1ページ目にいるのにクリックされていないと判断する CTR
  lowCtrCeiling: 0.02,
  lowCtrMinImpressions: 5,
  // 前期からこれ以上順位を落としたら要注意とする
  positionDropAlert: 3,
  // CV ゼロを気にし始めるセッション数
  minSessionsForLeadCheck: 10,
  // クリックが0のまま表示され続けているクエリを拾う最低表示回数
  noClickMinImpressions: 3,
};

// URL 検査は1日2,000回の割り当てがあるので、1回のレポートで見る上限を決めておく
const MAX_INSPECT_URLS = 30;

const CSV_HEADER =
  "date,period_start,period_end,days,gsc_clicks,gsc_impressions,gsc_ctr,gsc_position,ga4_sessions,ga4_users,ga4_pageviews,ga4_leads,indexed_pages,total_pages,note";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 生成時刻を JST で残す。数値の実測日を後から追えるようにするため
function nowJst() {
  return new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo", hour12: false });
}

// URL からパス部分だけ取り出す。表が横に伸びるのを防ぐ
function toPath(url) {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

// GSC のデータをまとめて取る
async function collectGsc(period, { skipInspect }) {
  const siteUrl = await resolveSiteUrl();

  // 表示に使うのは上位だけだが、提案の抽出には母集団が要る。広めに1回取って上から切り出す
  const [totals, prevTotals, queryPool, pagePool, devices, sitemaps] = await Promise.all([
    fetchTotals({ siteUrl, startDate: period.startDate, endDate: period.endDate }),
    fetchTotals({ siteUrl, startDate: period.prevStartDate, endDate: period.prevEndDate }),
    fetchWithComparison({ siteUrl, period, dimensions: ["query"], rowLimit: 200 }),
    fetchWithComparison({ siteUrl, period, dimensions: ["page"], rowLimit: 100 }),
    fetchWithComparison({ siteUrl, period, dimensions: ["device"], rowLimit: 5 }),
    listSitemaps({ siteUrl }).catch(() => []),
  ]);

  // GSC はクリック数の多い順に返すので、先頭を切り出せば上位になる
  const queries = queryPool.slice(0, 25);
  const pages = pagePool.slice(0, 20);

  const inspection = skipInspect
    ? { results: [], totalUrls: 0, skipped: true }
    : await collectInspections(siteUrl);

  return {
    siteUrl,
    totals,
    prevTotals,
    queries,
    pages,
    devices,
    sitemaps,
    queryPool,
    pagePool,
    inspections: inspection.results,
    inspectionTotalUrls: inspection.totalUrls,
    inspectionSkipped: Boolean(inspection.skipped),
  };
}

// サイトマップに載っている URL のインデックス状況を順番に調べる
async function collectInspections(siteUrl) {
  let urls;
  try {
    urls = await fetchSitemapUrls(TARGET.sitemapUrl);
  } catch (error) {
    console.warn(`サイトマップを読めなかったので URL 検査を省きます: ${error.message}`);
    return { results: [], totalUrls: 0, skipped: true };
  }

  const unique = [...new Set(urls)];
  const targets = unique.slice(0, MAX_INSPECT_URLS);
  const results = [];

  // 1分600回の割り当てに余裕を持たせるため直列で回す
  for (const url of targets) {
    try {
      results.push(await inspectUrl(url, { siteUrl }));
    } catch (error) {
      results.push({ url, verdict: "ERROR", coverageState: error.message.slice(0, 120) });
    }
    await sleep(200);
  }

  if (unique.length > MAX_INSPECT_URLS) {
    console.warn(
      `サイトマップの URL は ${unique.length} 件ありますが、検査は先頭 ${MAX_INSPECT_URLS} 件までにしています。`
    );
  }

  return { results, totalUrls: unique.length, skipped: false };
}

// GA4 のデータをまとめて取る
async function collectGa4(period) {
  const propertyId = await resolvePropertyId();

  const [summary, channels, landingPages, events, leadsByChannel, leads] = await Promise.all([
    runReportWithComparison({
      propertyId,
      period,
      dimensions: [],
      metrics: ["sessions", "totalUsers", "screenPageViews"],
      limit: 1,
    }),
    runReportWithComparison({
      propertyId,
      period,
      dimensions: ["sessionDefaultChannelGroup"],
      metrics: ["sessions", "totalUsers"],
      limit: 10,
    }),
    runReport({
      propertyId,
      startDate: period.startDate,
      endDate: period.endDate,
      dimensions: ["pagePath"],
      metrics: ["screenPageViews", "sessions"],
      limit: 20,
    }),
    fetchEventCounts({
      propertyId,
      startDate: period.startDate,
      endDate: period.endDate,
      limit: 30,
    }),
    runReport({
      propertyId,
      startDate: period.startDate,
      endDate: period.endDate,
      dimensions: ["sessionDefaultChannelGroup"],
      metrics: ["eventCount"],
      limit: 20,
      dimensionFilter: {
        filter: {
          fieldName: "eventName",
          stringFilter: { matchType: "EXACT", value: LEAD_EVENT_NAME },
        },
      },
    }),
    // イベント一覧は件数の多い順なので、発生数の少ない generate_lead は
    // 上位に入らないことがある。件数はサーバー側で絞り込んで数える
    fetchLeadCount({ propertyId, startDate: period.startDate, endDate: period.endDate }),
  ]);

  return { propertyId, summary, channels, landingPages, events, leadsByChannel, leads };
}

// 数値から改善提案の下書きを組み立てる。判断はせず、条件に当てはまった行を並べるだけ
function buildSuggestions({ gsc, ga4 }) {
  const suggestions = [];

  const nearFirstPage = gsc.queryPool
    .filter(
      (row) =>
        row.position >= THRESHOLDS.nearFirstPageMin &&
        row.position <= THRESHOLDS.nearFirstPageMax &&
        row.impressions >= THRESHOLDS.minImpressions
    )
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 10);

  if (nearFirstPage.length > 0) {
    suggestions.push({
      title: `1ページ目まであと一歩のクエリ（掲載順位 ${THRESHOLDS.nearFirstPageMin}〜${THRESHOLDS.nearFirstPageMax} 位・表示 ${THRESHOLDS.minImpressions} 回以上）`,
      note: "既存ページの見出しと本文にこのクエリの意図を足すのが最短。新規ページを作るより先に検討する。",
      table: formatMarkdownTable(nearFirstPage, [
        { key: "keys", label: "クエリ", format: (keys) => keys[0], width: 40 },
        { key: "impressions", label: "表示", align: "right", format: formatInt },
        { key: "clicks", label: "クリック", align: "right", format: formatInt },
        { key: "position", label: "順位", align: "right", format: (v) => formatDecimal(v) },
      ]),
    });
  }

  const lowCtrPages = gsc.pagePool
    .filter(
      (row) =>
        row.position <= 10 &&
        row.impressions >= THRESHOLDS.lowCtrMinImpressions &&
        row.ctr < THRESHOLDS.lowCtrCeiling
    )
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 10);

  if (lowCtrPages.length > 0) {
    suggestions.push({
      title: `順位のわりにクリックされていないページ（10位以内・CTR ${formatPercent(THRESHOLDS.lowCtrCeiling, 0)} 未満）`,
      note: "title と description が検索意図とずれている可能性。まず title を見直す。",
      table: formatMarkdownTable(lowCtrPages, [
        { key: "keys", label: "ページ", format: (keys) => toPath(keys[0]), width: 40 },
        { key: "impressions", label: "表示", align: "right", format: formatInt },
        { key: "ctr", label: "CTR", align: "right", format: (v) => formatPercent(v) },
        { key: "position", label: "順位", align: "right", format: (v) => formatDecimal(v) },
      ]),
    });
  }

  // 順位に関係なく、露出はあるのに1回も選ばれていないクエリ。
  // 順位が低いだけのこともあるが、title と検索意図のずれが混ざっている
  const noClick = gsc.queryPool
    .filter((row) => row.clicks === 0 && row.impressions >= THRESHOLDS.noClickMinImpressions)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 10);

  if (noClick.length > 0) {
    suggestions.push({
      title: `表示はあるがクリックが0のクエリ（表示 ${THRESHOLDS.noClickMinImpressions} 回以上）`,
      note: "順位が低いだけなのか、順位のわりに選ばれていないのかを順位列で見分ける。10位以内なら title の問題。",
      table: formatMarkdownTable(noClick, [
        { key: "keys", label: "クエリ", format: (keys) => keys[0], width: 40 },
        { key: "impressions", label: "表示", align: "right", format: formatInt },
        { key: "position", label: "順位", align: "right", format: (v) => formatDecimal(v) },
      ]),
    });
  }

  const dropped = gsc.queryPool
    .filter(
      (row) =>
        row.previous &&
        row.impressions >= THRESHOLDS.minImpressions &&
        row.position - row.previous.position >= THRESHOLDS.positionDropAlert
    )
    .sort((a, b) => b.position - b.previous.position - (a.position - a.previous.position))
    .slice(0, 10);

  if (dropped.length > 0) {
    suggestions.push({
      title: `前期より順位を落としたクエリ（${THRESHOLDS.positionDropAlert} 位以上の下落）`,
      note: "競合が増えたか、該当ページの更新が止まっているか。落ちた理由を1件ずつ確認する。",
      table: formatMarkdownTable(dropped, [
        { key: "keys", label: "クエリ", format: (keys) => keys[0], width: 40 },
        { key: "position", label: "今期順位", align: "right", format: (v) => formatDecimal(v) },
        {
          key: "previous",
          label: "前期順位",
          align: "right",
          format: (previous) => formatDecimal(previous.position),
        },
        {
          key: "previous",
          label: "下落幅",
          align: "right",
          format: (previous, row) => formatDecimal(row.position - previous.position),
        },
      ]),
    });
  }

  // 検査そのものが失敗したもの（権限不足など）は未インデックスと混ぜない
  const notIndexed = gsc.inspections.filter(
    (row) => row.verdict !== "PASS" && row.verdict !== "ERROR"
  );
  if (notIndexed.length > 0) {
    suggestions.push({
      title: "インデックスされていないページ",
      note: "GSC の URL 検査で PASS 以外だったもの。canonical の指定違いや低品質判定が典型的な原因。",
      table: formatMarkdownTable(notIndexed, [
        { key: "url", label: "URL", format: toPath, width: 40 },
        { key: "verdict", label: "判定" },
        { key: "coverageState", label: "状態", width: 40 },
      ]),
    });
  }

  const leadsByChannel = new Map(
    ga4.leadsByChannel.rows.map((row) => [
      row.dimensions.sessionDefaultChannelGroup,
      row.metrics.eventCount,
    ])
  );
  const noLeadChannels = ga4.channels.rows
    .filter((row) => {
      const channel = row.dimensions.sessionDefaultChannelGroup;
      return (
        row.metrics.sessions >= THRESHOLDS.minSessionsForLeadCheck &&
        (leadsByChannel.get(channel) ?? 0) === 0
      );
    })
    .slice(0, 10);

  if (noLeadChannels.length > 0) {
    suggestions.push({
      title: `流入はあるが問い合わせがゼロのチャネル（${THRESHOLDS.minSessionsForLeadCheck} セッション以上）`,
      note: `${LEAD_EVENT_NAME} が1件も発生していないチャネル。着地ページと導線を確認する。`,
      table: formatMarkdownTable(noLeadChannels, [
        {
          key: "dimensions",
          label: "チャネル",
          format: (values) => values.sessionDefaultChannelGroup,
          width: 30,
        },
        {
          key: "metrics",
          label: "セッション",
          align: "right",
          format: (values) => formatInt(values.sessions),
        },
      ]),
    });
  }

  return suggestions;
}

// GA4 の合計が返らなかったときに 0 と書くと実測値と紛らわしいので、その場合は - にする
const showGa4Total = (value) => (value === null || value === undefined ? "-" : formatInt(value));
const showGa4Delta = (current, previous) =>
  current === null || previous === null || current === undefined || previous === undefined
    ? "-"
    : formatDelta(current, previous);

// レポート本文を組み立てる
function renderMarkdown({ period, gsc, ga4, suggestions, generatedAt }) {
  const { totals, prevTotals } = gsc;
  const summaryRows = [
    {
      label: "クリック",
      value: formatInt(totals.clicks),
      delta: formatDelta(totals.clicks, prevTotals.clicks),
    },
    {
      label: "表示回数",
      value: formatInt(totals.impressions),
      delta: formatDelta(totals.impressions, prevTotals.impressions),
    },
    {
      label: "CTR",
      value: formatPercent(totals.ctr),
      delta: formatDelta(totals.ctr, prevTotals.ctr, { percent: true }),
    },
    {
      label: "平均掲載順位",
      value: formatDecimal(totals.position),
      delta: formatPositionDelta(totals.position, prevTotals.position),
    },
    {
      label: "セッション（GA4）",
      value: showGa4Total(ga4.summary.totals.sessions),
      delta: showGa4Delta(ga4.summary.totals.sessions, ga4.summary.totalsPrevious.sessions),
    },
    {
      label: "ユーザー（GA4）",
      value: showGa4Total(ga4.summary.totals.totalUsers),
      delta: showGa4Delta(ga4.summary.totals.totalUsers, ga4.summary.totalsPrevious.totalUsers),
    },
    {
      label: `問い合わせ（${LEAD_EVENT_NAME}）`,
      value: formatInt(ga4.leads),
      delta: "-",
    },
  ];

  const indexed = gsc.inspections.filter((row) => row.verdict === "PASS").length;
  const inspectionErrors = gsc.inspections.filter((row) => row.verdict === "ERROR").length;
  // 提案が0件だったときに「閾値が高いのか、そもそもデータが無いのか」を切り分けるための材料
  const maxQueryImpressions = gsc.queryPool.reduce((max, row) => Math.max(max, row.impressions), 0);

  const sections = [
    `# SEOレポート ${todayJst()}`,
    "",
    `- 対象: \`${gsc.siteUrl}\` / GA4 プロパティ \`${ga4.propertyId}\``,
    `- 集計期間: ${period.startDate} 〜 ${period.endDate}（${period.span}日間）`,
    `- 前期間: ${period.prevStartDate} 〜 ${period.prevEndDate}`,
    `- 生成: \`node scripts/analytics/report.mjs\`（${generatedAt} JST 実測）`,
    "",
    "GSC の検索パフォーマンスは確定までに数日かかるため、集計の終了日は " +
      `${GSC_DATA_LAG_DAYS} 日前に置いている。`,
    "",
    "## 1. サマリ",
    "",
    formatMarkdownTable(summaryRows, [
      { key: "label", label: "指標" },
      { key: "value", label: "当期", align: "right" },
      { key: "delta", label: "前期比", align: "right" },
    ]),
    "",
    "## 2. 検索クエリ（クリック上位25）",
    "",
    formatMarkdownTable(gsc.queries, [
      { key: "keys", label: "クエリ", format: (keys) => keys[0], width: 40 },
      { key: "clicks", label: "クリック", align: "right", format: formatInt },
      { key: "impressions", label: "表示", align: "right", format: formatInt },
      { key: "ctr", label: "CTR", align: "right", format: (v) => formatPercent(v) },
      { key: "position", label: "順位", align: "right", format: (v) => formatDecimal(v) },
      {
        key: "previous",
        label: "前期比クリック",
        align: "right",
        format: (previous, row) => (previous ? formatDelta(row.clicks, previous.clicks) : "新規"),
      },
    ]),
    "",
    "## 3. ページ別（クリック上位20）",
    "",
    formatMarkdownTable(gsc.pages, [
      { key: "keys", label: "ページ", format: (keys) => toPath(keys[0]), width: 40 },
      { key: "clicks", label: "クリック", align: "right", format: formatInt },
      { key: "impressions", label: "表示", align: "right", format: formatInt },
      { key: "ctr", label: "CTR", align: "right", format: (v) => formatPercent(v) },
      { key: "position", label: "順位", align: "right", format: (v) => formatDecimal(v) },
      {
        key: "previous",
        label: "前期比クリック",
        align: "right",
        format: (previous, row) => (previous ? formatDelta(row.clicks, previous.clicks) : "新規"),
      },
    ]),
    "",
    "## 4. デバイス別",
    "",
    formatMarkdownTable(gsc.devices, [
      { key: "keys", label: "デバイス", format: (keys) => keys[0] },
      { key: "clicks", label: "クリック", align: "right", format: formatInt },
      { key: "impressions", label: "表示", align: "right", format: formatInt },
      { key: "ctr", label: "CTR", align: "right", format: (v) => formatPercent(v) },
      { key: "position", label: "順位", align: "right", format: (v) => formatDecimal(v) },
    ]),
    "",
    "## 5. インデックス状況",
    "",
    gsc.inspections.length > 0
      ? `サイトマップ掲載 ${gsc.inspectionTotalUrls} ページのうち ${gsc.inspections.length} ページを検査し、` +
        `${indexed} ページがインデックス済み（URL 検査 API の実測）。` +
        (gsc.inspectionTotalUrls > gsc.inspections.length
          ? ` 残り ${gsc.inspectionTotalUrls - gsc.inspections.length} ページは1回あたりの検査上限（${MAX_INSPECT_URLS} 件）を超えたため未検査。`
          : "") +
        (inspectionErrors > 0
          ? ` うち ${inspectionErrors} ページは検査自体に失敗している。GSC の権限が「制限付き」だと URL 検査 API は使えない（docs/analytics-setup.md §8.3）。`
          : "")
      : "URL 検査は実行していない（`--skip-inspect` 指定、またはサイトマップを取得できなかった）。",
    "",
    formatMarkdownTable(gsc.inspections, [
      { key: "url", label: "ページ", format: toPath, width: 40 },
      { key: "verdict", label: "判定" },
      { key: "coverageState", label: "状態", width: 36 },
      { key: "lastCrawlTime", label: "最終クロール", format: (v) => (v ? v.slice(0, 10) : "-") },
    ]),
    "",
    "### サイトマップ",
    "",
    formatMarkdownTable(gsc.sitemaps, [
      { key: "path", label: "サイトマップ", format: toPath, width: 40 },
      { key: "lastDownloaded", label: "最終読み取り", format: (v) => (v ? v.slice(0, 10) : "-") },
      { key: "errors", label: "エラー", align: "right", format: (v) => formatInt(v ?? 0) },
      { key: "warnings", label: "警告", align: "right", format: (v) => formatInt(v ?? 0) },
    ]),
    "",
    "## 6. GA4 流入とコンバージョン",
    "",
    "### チャネル別",
    "",
    formatMarkdownTable(ga4.channels.rows, [
      {
        key: "dimensions",
        label: "チャネル",
        format: (values) => values.sessionDefaultChannelGroup,
        width: 30,
      },
      {
        key: "metrics",
        label: "セッション",
        align: "right",
        format: (values) => formatInt(values.sessions),
      },
      {
        key: "metrics",
        label: "ユーザー",
        align: "right",
        format: (values) => formatInt(values.totalUsers),
      },
      {
        key: "previous",
        label: "前期比セッション",
        align: "right",
        format: (previous, row) =>
          previous ? formatDelta(row.metrics.sessions, previous.sessions) : "新規",
      },
    ]),
    "",
    "### ページ別 表示回数（上位20）",
    "",
    formatMarkdownTable(ga4.landingPages.rows, [
      { key: "dimensions", label: "ページ", format: (values) => values.pagePath, width: 40 },
      {
        key: "metrics",
        label: "表示回数",
        align: "right",
        format: (values) => formatInt(values.screenPageViews),
      },
      {
        key: "metrics",
        label: "セッション",
        align: "right",
        format: (values) => formatInt(values.sessions),
      },
    ]),
    "",
    "### イベント",
    "",
    formatMarkdownTable(ga4.events.rows, [
      { key: "dimensions", label: "イベント名", format: (values) => values.eventName, width: 30 },
      {
        key: "metrics",
        label: "回数",
        align: "right",
        format: (values) => formatInt(values.eventCount),
      },
    ]),
    "",
    "## 7. 改善提案の下書き",
    "",
    "しきい値で機械的に抽出したもので、優先順位づけはしていない。閾値そのものも運用しながら調整する前提の暫定値。",
    "",
    `母集団はクエリ ${gsc.queryPool.length} 件（表示回数の最大 ${formatInt(maxQueryImpressions)} 回）、` +
      `ページ ${gsc.pagePool.length} 件。閾値は \`scripts/analytics/report.mjs\` の \`THRESHOLDS\`。`,
    "",
  ];

  if (suggestions.length === 0) {
    sections.push(
      maxQueryImpressions < THRESHOLDS.minImpressions
        ? `今回の条件に当てはまる行はなかった。表示回数の最大が ${formatInt(maxQueryImpressions)} 回で、` +
            `最低表示回数の閾値 ${THRESHOLDS.minImpressions} 回に届いていない。閾値を下げるか、露出が増えるまで待つ。`
        : "今回の条件に当てはまる行はなかった。閾値が今の規模に対して高い可能性がある。"
    );
  } else {
    for (const suggestion of suggestions) {
      sections.push(`### ${suggestion.title}`, "", suggestion.note, "", suggestion.table, "");
    }
  }

  return sections.join("\n");
}

// 取れなかった数値は 0 ではなく空欄で残す。後から見て「0件」と「未取得」を取り違えないため
const csvNumber = (value) =>
  value === null || value === undefined || !Number.isFinite(Number(value)) ? "" : Math.round(value);

// 時系列の CSV に1行足す。ヘッダは初回だけ書く
async function appendHistory({ period, gsc, ga4 }) {
  const indexed = gsc.inspections.filter((row) => row.verdict === "PASS").length;

  let lines = [];
  try {
    const existing = await readFile(HISTORY_CSV, "utf8");
    lines = existing.split("\n").filter((line) => line.trim() !== "");
  } catch {
    // 初回は作る
  }

  const row = [
    todayJst(),
    period.startDate,
    period.endDate,
    period.span,
    Math.round(gsc.totals.clicks),
    Math.round(gsc.totals.impressions),
    gsc.totals.ctr.toFixed(4),
    gsc.totals.position.toFixed(2),
    csvNumber(ga4.summary.totals.sessions),
    csvNumber(ga4.summary.totals.totalUsers),
    csvNumber(ga4.summary.totals.screenPageViews),
    csvNumber(ga4.leads),
    gsc.inspections.length > 0 ? indexed : "",
    gsc.inspections.length > 0 ? gsc.inspections.length : "",
    "",
  ]
    .map(csvCell)
    .join(",");

  // 同じ日に何度流しても行が増えないよう、その日の行は最後の実行で置き換える
  const today = todayJst();
  const kept = lines.filter((line) => line !== CSV_HEADER && !line.startsWith(`${today},`));

  await mkdir(path.dirname(HISTORY_CSV), { recursive: true });
  await writeFile(HISTORY_CSV, [CSV_HEADER, ...kept, row].join("\n") + "\n", "utf8");
}

async function main(argv) {
  const { flags } = parseArgs(argv);
  const period = resolvePeriod({
    days: parseNumber(flags.days, 28),
    start: typeof flags.start === "string" ? flags.start : undefined,
    end: typeof flags.end === "string" ? flags.end : undefined,
    lagDays: GSC_DATA_LAG_DAYS,
  });

  const generatedAt = nowJst();
  const gsc = await collectGsc(period, { skipInspect: Boolean(flags["skip-inspect"]) });
  const ga4 = await collectGa4(period);
  const suggestions = buildSuggestions({ gsc, ga4 });
  const markdown = renderMarkdown({ period, gsc, ga4, suggestions, generatedAt });

  if (flags["dry-run"]) {
    console.log(markdown);
    return;
  }

  const reportPath = path.join(REPORT_DIR, `${todayJst()}.md`);
  await mkdir(REPORT_DIR, { recursive: true });
  await writeFile(reportPath, markdown, "utf8");
  await appendHistory({ period, gsc, ga4 });

  console.log(`レポートを書き出しました: ${path.relative(REPO_ROOT, reportPath)}`);
  console.log(`時系列に1行追記しました: ${path.relative(REPO_ROOT, HISTORY_CSV)}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    await main(process.argv.slice(2));
  } catch (error) {
    fail(error);
  }
}
