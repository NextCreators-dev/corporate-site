// GSC / GA4 のスクリプトで共有する小道具。日付の計算、コマンドライン引数の解釈、表の整形。

// GSC の検索パフォーマンスは確定までに2〜3日かかる。既定の集計期間はこの日数ぶん手前で止める
export const GSC_DATA_LAG_DAYS = 3;

// JST での「今日」を YYYY-MM-DD で返す。sv-SE ロケールは ISO と同じ並びになる
export function todayJst() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
}

// YYYY-MM-DD を delta 日ずらす（負数で過去へ）
export function shiftDays(dateStr, delta) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + delta));
  return shifted.toISOString().slice(0, 10);
}

// 2つの日付の差（日数）
export function daysBetween(startDate, endDate) {
  const toUtc = (s) => {
    const [y, m, d] = s.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUtc(endDate) - toUtc(startDate)) / 86_400_000);
}

// --days / --start / --end から集計期間を決める。
// lagDays を指定すると、終了日を既定でその日数ぶん手前に置く（GSC のデータ遅延対策）。
export function resolvePeriod({ days = 28, start, end, lagDays = 0 } = {}) {
  const endDate = end ?? shiftDays(todayJst(), -lagDays);
  const startDate = start ?? shiftDays(endDate, -(days - 1));
  const span = daysBetween(startDate, endDate) + 1;

  // 直前の同じ長さの期間。前期間比較に使う
  const prevEnd = shiftDays(startDate, -1);
  const prevStart = shiftDays(prevEnd, -(span - 1));

  return { startDate, endDate, span, prevStartDate: prevStart, prevEndDate: prevEnd };
}

// 素朴な引数パーサ。--key value、--flag、位置引数に対応する
export function parseArgs(argv) {
  const flags = {};
  const positional = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      positional.push(arg);
      continue;
    }

    const [key, inlineValue] = arg.slice(2).split(/=(.*)/s);
    if (inlineValue !== undefined) {
      flags[key] = inlineValue;
      continue;
    }

    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) {
      flags[key] = true;
    } else {
      flags[key] = next;
      i++;
    }
  }

  return { flags, positional };
}

// --dimensions query,page のようなカンマ区切りを配列にする
export function parseList(value, fallback = []) {
  if (typeof value !== "string" || value.trim() === "") return fallback;
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

// 数値フラグを取り出す。未指定・不正値は既定値にする
export function parseNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

// 全角文字を2桁として数える。日本語のクエリが混ざっても表の桁が揃うようにする
function displayWidth(text) {
  let width = 0;
  for (const char of String(text)) {
    const code = char.codePointAt(0);
    const isWide =
      (code >= 0x1100 && code <= 0x115f) ||
      (code >= 0x2e80 && code <= 0xa4cf) ||
      (code >= 0xac00 && code <= 0xd7a3) ||
      (code >= 0xf900 && code <= 0xfaff) ||
      (code >= 0xfe30 && code <= 0xfe6f) ||
      (code >= 0xff00 && code <= 0xff60) ||
      (code >= 0xffe0 && code <= 0xffe6);
    width += isWide ? 2 : 1;
  }
  return width;
}

// 表示幅で切り詰める（末尾は … にする）
export function truncate(text, maxWidth) {
  const value = String(text ?? "");
  if (displayWidth(value) <= maxWidth) return value;

  let result = "";
  let width = 0;
  for (const char of value) {
    const charWidth = displayWidth(char);
    if (width + charWidth > maxWidth - 1) break;
    result += char;
    width += charWidth;
  }
  return `${result}…`;
}

// 端末で読める表にする。columns は [{ key, label, align, width }]
export function formatTable(rows, columns) {
  if (rows.length === 0) return "（該当なし）";

  const cells = rows.map((row) =>
    columns.map((column) => {
      const value = column.format ? column.format(row[column.key], row) : row[column.key];
      return column.width ? truncate(value, column.width) : String(value ?? "");
    })
  );

  const widths = columns.map((column, index) =>
    Math.max(displayWidth(column.label), ...cells.map((row) => displayWidth(row[index])))
  );

  const pad = (text, width, align) => {
    const spaces = " ".repeat(Math.max(0, width - displayWidth(text)));
    return align === "right" ? spaces + text : text + spaces;
  };

  const header = columns.map((column, i) => pad(column.label, widths[i], column.align)).join("  ");
  const divider = widths.map((width) => "-".repeat(width)).join("  ");
  const body = cells.map((row) =>
    row.map((cell, i) => pad(cell, widths[i], columns[i].align)).join("  ")
  );

  return [header, divider, ...body].join("\n");
}

// Markdown の表にする。セル内の | は壊れるのでエスケープする
export function formatMarkdownTable(rows, columns) {
  if (rows.length === 0) return "（該当なし）";

  const escape = (text) => String(text ?? "").replace(/\|/g, "\\|");
  const header = `| ${columns.map((c) => escape(c.label)).join(" | ")} |`;
  const divider = `| ${columns.map((c) => (c.align === "right" ? "---:" : "---")).join(" | ")} |`;
  const body = rows.map((row) => {
    const cells = columns.map((column) => {
      const value = column.format ? column.format(row[column.key], row) : row[column.key];
      return escape(column.width ? truncate(value, column.width) : value);
    });
    return `| ${cells.join(" | ")} |`;
  });

  return [header, divider, ...body].join("\n");
}

// 1234 → "1,234"
export const formatInt = (value) => Math.round(Number(value) || 0).toLocaleString("ja-JP");

// 0.0345 → "3.45%"
export const formatPercent = (value, digits = 2) =>
  `${((Number(value) || 0) * 100).toFixed(digits)}%`;

// 掲載順位のように小数第1位まで見たい値
export const formatDecimal = (value, digits = 1) => (Number(value) || 0).toFixed(digits);

// 前期間との差を "+12 (+8.5%)" の形にする。前期間が0のときは率を出さない
export function formatDelta(current, previous, { percent = false } = {}) {
  const now = Number(current) || 0;
  const before = Number(previous) || 0;
  const diff = now - before;
  const sign = diff > 0 ? "+" : "";

  const shown = percent ? `${sign}${(diff * 100).toFixed(2)}pt` : `${sign}${formatInt(diff)}`;
  if (before === 0) return shown;

  const rate = (diff / Math.abs(before)) * 100;
  return `${shown} (${sign}${rate.toFixed(1)}%)`;
}

// 掲載順位の差。順位は小さいほうが良いので、改善したときに + が付くよう符号を反転する。
// 0.4 位の動きを "+0" に丸めてしまわないよう、整数ではなく小数第1位まで出す
export function formatPositionDelta(current, previous) {
  const now = Number(current);
  const before = Number(previous);
  if (!Number.isFinite(now) || !Number.isFinite(before)) return "-";

  const diff = before - now;
  if (Math.abs(diff) < 0.05) return "±0.0";
  return `${diff > 0 ? "+" : "-"}${Math.abs(diff).toFixed(1)}`;
}

// CSV の1セルを安全にする
export function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

// エラーを日本語で出して終了コードを立てる。各 CLI の入口から呼ぶ
export function fail(error) {
  console.error(`エラー: ${error.message ?? error}`);
  process.exitCode = 1;
}
