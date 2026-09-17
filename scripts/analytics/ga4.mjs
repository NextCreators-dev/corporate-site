// Google Analytics 4（Data API / Admin API）からレポートを取る CLI 兼ライブラリ。
//
//   node scripts/analytics/ga4.mjs properties
//   node scripts/analytics/ga4.mjs report --dimensions sessionDefaultChannelGroup --days 28 --compare
//   node scripts/analytics/ga4.mjs report --dimensions pagePath --metrics screenPageViews --limit 20 --format table
//   node scripts/analytics/ga4.mjs events --days 28
//   node scripts/analytics/ga4.mjs realtime
//   node scripts/analytics/ga4.mjs metadata --filter lead
//
// 対象プロパティは scripts/analytics/config.mjs で固定している。
// 一時的に変えるときだけ環境変数 GA4_PROPERTY_ID（数字のみ）を使う。

import { pathToFileURL } from "node:url";
import { googleFetch, SCOPES } from "./auth.mjs";
import { TARGET } from "./config.mjs";
import {
  fail,
  formatDelta,
  formatInt,
  formatTable,
  parseArgs,
  parseList,
  parseNumber,
  resolvePeriod,
} from "./lib.mjs";

const DATA_API = "https://analyticsdata.googleapis.com/v1beta";
const ADMIN_API = "https://analyticsadmin.googleapis.com/v1beta";
// GA4 の当日データは変動するため、既定の集計期間は前日で止める
const GA4_DATA_LAG_DAYS = 1;
// 問い合わせ完了時に送っているイベント（src/components/ContactForm.tsx）
export const LEAD_EVENT_NAME = "generate_lead";

const call = (url, options = {}) => googleFetch(url, { ...options, scope: SCOPES.ga4 });

let propertyIdCache = null;

// 権限のある GA4 プロパティの一覧
export async function listProperties() {
  const body = await call(`${ADMIN_API}/accountSummaries`);
  const summaries = body.accountSummaries ?? [];

  return summaries.flatMap((account) =>
    (account.propertySummaries ?? []).map((property) => ({
      account: account.displayName ?? "",
      // property は "properties/123456789" の形で返る
      propertyId: String(property.property ?? "").replace("properties/", ""),
      displayName: property.displayName ?? "",
      propertyType: property.propertyType ?? "",
    }))
  );
}

// 対象プロパティ ID を決める。
// 候補が複数あるときに黙って選ぶと別プロダクトの数値を取り違えるので、必ず設定で固定する
export async function resolvePropertyId() {
  if (TARGET.ga4PropertyId) return String(TARGET.ga4PropertyId);
  if (propertyIdCache) return propertyIdCache;

  const properties = await listProperties();
  if (properties.length === 0) {
    throw new Error(
      "権限のある GA4 プロパティがありません。サービスアカウントのメールアドレスを GA4 のプロパティ アクセス管理で閲覧者に追加してください。"
    );
  }

  if (properties.length > 1) {
    const list = properties
      .map((property) => `  ${property.propertyId}  ${property.displayName}`)
      .join("\n");
    throw new Error(
      [
        "権限のある GA4 プロパティが複数あります。どれを使うか決められないので中断しました。",
        list,
        "scripts/analytics/config.mjs の ga4PropertyId か、環境変数 GA4_PROPERTY_ID で指定してください。",
      ].join("\n")
    );
  }

  propertyIdCache = properties[0].propertyId;
  return propertyIdCache;
}

// Data API のレスポンスを { dimensions: {...}, metrics: {...} } の配列に均す。
// 合計行は dimensionValues が RESERVED_TOTAL で返ってくるので、明細からは除いておく
function normalizeReport(body) {
  const dimensionNames = (body.dimensionHeaders ?? []).map((header) => header.name);
  const metricNames = (body.metricHeaders ?? []).map((header) => header.name);

  const isAggregationRow = (row) =>
    (row.dimensionValues ?? []).some((value) => String(value?.value ?? "").startsWith("RESERVED_"));

  const rows = (body.rows ?? [])
    .filter((row) => !isAggregationRow(row))
    .map((row) => {
      const dimensions = {};
      dimensionNames.forEach((name, index) => {
        dimensions[name] = row.dimensionValues?.[index]?.value ?? "";
      });

      const metrics = {};
      metricNames.forEach((name, index) => {
        metrics[name] = Number(row.metricValues?.[index]?.value ?? 0);
      });

      return { dimensions, metrics };
    });

  // totals は metricAggregations: ["TOTAL"] を送ったときだけ返る。
  // ユニークユーザー数のように単純な足し算にならない指標があるので、行を合計せず API の値を使う
  const totals = {};
  const hasTotals = Array.isArray(body.totals) && body.totals.length > 0;
  metricNames.forEach((name, index) => {
    totals[name] = hasTotals ? Number(body.totals[0]?.metricValues?.[index]?.value ?? 0) : null;
  });

  return { dimensionNames, metricNames, rows, totals, rowCount: body.rowCount ?? rows.length };
}

// レポートを1本引く
export async function runReport({
  propertyId,
  startDate,
  endDate,
  dimensions = [],
  metrics = ["sessions"],
  limit = 25,
  orderByMetric,
  dimensionFilter,
} = {}) {
  const property = propertyId ?? (await resolvePropertyId());
  const orderMetric = orderByMetric ?? metrics[0];

  const body = await call(`${DATA_API}/properties/${property}:runReport`, {
    method: "POST",
    body: {
      dateRanges: [{ startDate, endDate }],
      dimensions: dimensions.map((name) => ({ name })),
      metrics: metrics.map((name) => ({ name })),
      // これを送らないと totals が返らない。limit で切られた行を足しても全体の合計にはならない
      metricAggregations: ["TOTAL"],
      limit,
      ...(dimensions.length > 0 && orderMetric
        ? { orderBys: [{ metric: { metricName: orderMetric }, desc: true }] }
        : {}),
      ...(dimensionFilter ? { dimensionFilter } : {}),
      keepEmptyRows: false,
    },
  });

  return normalizeReport(body);
}

// 当期と前期を突き合わせる。突合キーはディメンション値の連結
export async function runReportWithComparison({
  propertyId,
  period,
  dimensions = [],
  metrics = ["sessions"],
  limit = 25,
  orderByMetric,
  dimensionFilter,
} = {}) {
  const property = propertyId ?? (await resolvePropertyId());
  const base = { propertyId: property, dimensions, metrics, orderByMetric, dimensionFilter };

  const [current, previous] = await Promise.all([
    runReport({ ...base, startDate: period.startDate, endDate: period.endDate, limit }),
    runReport({
      ...base,
      startDate: period.prevStartDate,
      endDate: period.prevEndDate,
      // 当期の上位が前期にどれだけあったか拾うため多めに取る
      limit: Math.max(limit * 4, 100),
    }),
  ]);

  const keyOf = (row) => dimensions.map((name) => row.dimensions[name] ?? "").join(" / ");
  const previousByKey = new Map(previous.rows.map((row) => [keyOf(row), row]));

  return {
    ...current,
    totalsPrevious: previous.totals,
    rows: current.rows.map((row) => ({
      ...row,
      previous: previousByKey.get(keyOf(row))?.metrics ?? null,
    })),
  };
}

// イベント名別のイベント数。キーイベント（旧コンバージョン）の推移を見るのに使う
export async function fetchEventCounts({ propertyId, startDate, endDate, limit = 30 } = {}) {
  return runReport({
    propertyId,
    startDate,
    endDate,
    dimensions: ["eventName"],
    metrics: ["eventCount"],
    limit,
  });
}

// 問い合わせ完了（generate_lead）の件数だけを取る
export async function fetchLeadCount({ propertyId, startDate, endDate } = {}) {
  const report = await runReport({
    propertyId,
    startDate,
    endDate,
    dimensions: ["eventName"],
    metrics: ["eventCount"],
    limit: 1,
    dimensionFilter: {
      filter: {
        fieldName: "eventName",
        stringFilter: { matchType: "EXACT", value: LEAD_EVENT_NAME },
      },
    },
  });

  return report.rows[0]?.metrics.eventCount ?? 0;
}

// 直近30分のアクティブユーザー
export async function runRealtimeReport({ propertyId, dimensions = ["unifiedScreenName"] } = {}) {
  const property = propertyId ?? (await resolvePropertyId());
  const body = await call(`${DATA_API}/properties/${property}:runRealtimeReport`, {
    method: "POST",
    body: {
      dimensions: dimensions.map((name) => ({ name })),
      metrics: [{ name: "activeUsers" }],
      metricAggregations: ["TOTAL"],
      limit: 25,
    },
  });

  return normalizeReport(body);
}

// そのプロパティで使えるディメンション / メトリクスの一覧（カスタム定義を含む）
export async function fetchMetadata({ propertyId } = {}) {
  const property = propertyId ?? (await resolvePropertyId());
  const body = await call(`${DATA_API}/properties/${property}/metadata`);
  return {
    dimensions: (body.dimensions ?? []).map((item) => ({
      apiName: item.apiName,
      uiName: item.uiName,
      customDefinition: Boolean(item.customDefinition),
    })),
    metrics: (body.metrics ?? []).map((item) => ({
      apiName: item.apiName,
      uiName: item.uiName,
      customDefinition: Boolean(item.customDefinition),
    })),
  };
}

// ---- 以下は CLI としての入口 ----

const HELP = `使い方: node scripts/analytics/ga4.mjs <サブコマンド> [オプション]

サブコマンド
  properties                権限のある GA4 プロパティを一覧する
  report                    ディメンション別のレポートを出す
  events                    イベント名別のイベント数を出す
  realtime                  直近30分のアクティブユーザーを出す
  metadata                  使えるディメンション / メトリクス名を一覧する

オプション
  --days <n>                集計日数（既定 28）
  --start <YYYY-MM-DD>      開始日を直接指定する
  --end <YYYY-MM-DD>        終了日を直接指定する（既定は ${GA4_DATA_LAG_DAYS} 日前）
  --dimensions <a,b>        例: sessionDefaultChannelGroup / pagePath / country / deviceCategory
  --metrics <a,b>           例: sessions / totalUsers / screenPageViews / eventCount
  --limit <n>               取得行数（既定 25）
  --compare                 直前の同じ長さの期間と比べる
  --filter <文字列>          metadata の絞り込みに使う
  --format <json|table>     出力形式（既定 json）
`;

function periodFromFlags(flags) {
  return resolvePeriod({
    days: parseNumber(flags.days, 28),
    start: typeof flags.start === "string" ? flags.start : undefined,
    end: typeof flags.end === "string" ? flags.end : undefined,
    lagDays: GA4_DATA_LAG_DAYS,
  });
}

function printReport(report, { dimensions, metrics, format, compare }) {
  if (format !== "table") {
    console.log(JSON.stringify(report, null, 2));
    return;
  }

  const columns = dimensions.map((name) => ({
    key: "dimensions",
    label: name,
    width: name.toLowerCase().includes("path") ? 48 : 30,
    format: (values) => values[name] ?? "",
  }));

  for (const metric of metrics) {
    columns.push({
      key: "metrics",
      label: metric,
      align: "right",
      format: (values) => formatInt(values[metric]),
    });
    if (compare) {
      columns.push({
        key: "previous",
        label: `${metric} 前期比`,
        align: "right",
        format: (previous, row) =>
          previous ? formatDelta(row.metrics[metric], previous[metric]) : "新規",
      });
    }
  }

  // totals が返らなかったときに 0 と表示すると実測値と紛らわしいので、その場合は - にする
  const showTotal = (value) => (value === null || value === undefined ? "-" : formatInt(value));

  console.log(formatTable(report.rows, columns));
  console.log("");
  console.log(
    `合計: ${metrics.map((metric) => `${metric}=${showTotal(report.totals[metric])}`).join(" / ")}`
  );
  if (compare && report.totalsPrevious) {
    console.log(
      `前期比: ${metrics
        .map((metric) => {
          const current = report.totals[metric];
          const previous = report.totalsPrevious[metric];
          if (current === null || previous === null) return `${metric}=-`;
          return `${metric}=${formatDelta(current, previous)}`;
        })
        .join(" / ")}`
    );
  }
}

async function main(argv) {
  const { flags, positional } = parseArgs(argv);
  const [subcommand] = positional;
  const format = flags.format === "table" ? "table" : "json";

  if (!subcommand || flags.help) {
    console.log(HELP);
    return;
  }

  switch (subcommand) {
    case "properties": {
      const properties = await listProperties();
      if (format === "table") {
        console.log(
          formatTable(properties, [
            { key: "propertyId", label: "プロパティID" },
            { key: "displayName", label: "名前", width: 40 },
            { key: "account", label: "アカウント", width: 30 },
          ])
        );
      } else {
        console.log(JSON.stringify(properties, null, 2));
      }
      return;
    }

    case "report": {
      const period = periodFromFlags(flags);
      const dimensions = parseList(flags.dimensions, ["sessionDefaultChannelGroup"]);
      const metrics = parseList(flags.metrics, ["sessions", "totalUsers", "screenPageViews"]);
      const limit = parseNumber(flags.limit, 25);
      const propertyId = await resolvePropertyId();

      const report = flags.compare
        ? await runReportWithComparison({ propertyId, period, dimensions, metrics, limit })
        : await runReport({ propertyId, ...period, dimensions, metrics, limit });

      if (format === "table") {
        console.log(`プロパティ: ${propertyId}`);
        console.log(`期間: ${period.startDate} 〜 ${period.endDate}（${period.span}日間）`);
      }
      printReport(report, { dimensions, metrics, format, compare: Boolean(flags.compare) });
      return;
    }

    case "events": {
      const period = periodFromFlags(flags);
      const propertyId = await resolvePropertyId();
      const report = await fetchEventCounts({
        propertyId,
        ...period,
        limit: parseNumber(flags.limit, 30),
      });

      printReport(report, {
        dimensions: ["eventName"],
        metrics: ["eventCount"],
        format,
        compare: false,
      });
      return;
    }

    case "realtime": {
      const report = await runRealtimeReport({
        dimensions: parseList(flags.dimensions, ["unifiedScreenName"]),
      });
      printReport(report, {
        dimensions: parseList(flags.dimensions, ["unifiedScreenName"]),
        metrics: ["activeUsers"],
        format,
        compare: false,
      });
      return;
    }

    case "metadata": {
      const metadata = await fetchMetadata();
      const needle = typeof flags.filter === "string" ? flags.filter.toLowerCase() : null;
      const match = (item) =>
        !needle ||
        item.apiName.toLowerCase().includes(needle) ||
        item.uiName?.toLowerCase().includes(needle);

      const filtered = {
        dimensions: metadata.dimensions.filter(match),
        metrics: metadata.metrics.filter(match),
      };

      if (format === "table") {
        console.log("ディメンション");
        console.log(
          formatTable(filtered.dimensions, [
            { key: "apiName", label: "API名", width: 40 },
            { key: "uiName", label: "画面表示名", width: 40 },
            { key: "customDefinition", label: "カスタム", format: (v) => (v ? "はい" : "") },
          ])
        );
        console.log("");
        console.log("メトリクス");
        console.log(
          formatTable(filtered.metrics, [
            { key: "apiName", label: "API名", width: 40 },
            { key: "uiName", label: "画面表示名", width: 40 },
            { key: "customDefinition", label: "カスタム", format: (v) => (v ? "はい" : "") },
          ])
        );
      } else {
        console.log(JSON.stringify(filtered, null, 2));
      }
      return;
    }

    default:
      throw new Error(`知らないサブコマンドです: ${subcommand}\n\n${HELP}`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    await main(process.argv.slice(2));
  } catch (error) {
    fail(error);
  }
}
