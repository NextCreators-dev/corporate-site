#!/usr/bin/env node
// Supabase Free プランの自動停止（7日間アクティビティがないとプロジェクトが Pause される）を防ぐ疎通確認スクリプト。
// GitHub Actions から1日1回実行する。依存を増やさないため Node 22 組み込みの fetch だけで書いている。
//
// 必要な環境変数:
//   SUPABASE_URL       … https://xxxx.supabase.co
//   SUPABASE_ANON_KEY  … anon（publishable）キー。service role キーは使わない
//   SLACK_WEBHOOK_URL  … 任意。未設定なら通知はスキップする

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY ?? "";
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL ?? "";

const RPC_PATH = "/rest/v1/rpc/keepalive_ping";
const TIMEOUT_MS = 20_000;
const MAX_ATTEMPTS = 3;
// 前回のpingからこれ以上空いていたら、定期実行の取りこぼしとして警告する
const WARN_GAP_HOURS = 48;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 日本時間の読みやすい表記に変換
function formatJst(date) {
  return date.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
}

// Slack へ通知する。通知の失敗で疎通確認の結果判定は変えない
async function postSlack(text) {
  if (!SLACK_WEBHOOK_URL) {
    console.warn("SLACK_WEBHOOK_URL が未設定のため Slack 通知はスキップしました。");
    return;
  }

  try {
    const res = await fetch(SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      console.warn(`Slack 通知に失敗しました: ${res.status}`);
    }
  } catch (error) {
    console.warn("Slack 通知に失敗しました:", error.message);
  }
}

// keepalive_ping を呼び出す（読み取りと書き込みを1リクエストで済ませる）
async function callKeepalivePing() {
  const endpoint = `${SUPABASE_URL.replace(/\/$/, "")}${RPC_PATH}`;
  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          "Content-Type": "application/json",
        },
        body: "{}",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      if (!res.ok) {
        // 公開リポジトリのログに残るため、本文は先頭のみに切り詰める
        const detail = (await res.text()).slice(0, 300);
        throw new Error(`HTTP ${res.status} ${detail}`);
      }

      const body = await res.json();
      const row = Array.isArray(body) ? body[0] : body;
      if (!row?.current_ping) {
        throw new Error("keepalive_ping のレスポンスに current_ping が含まれていません。");
      }
      return row;
    } catch (error) {
      lastError = error;
      console.warn(`疎通確認に失敗しました（${attempt}/${MAX_ATTEMPTS} 回目）: ${error.message}`);
      if (attempt < MAX_ATTEMPTS) {
        await sleep(2_000 * attempt);
      }
    }
  }

  throw lastError;
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("SUPABASE_URL / SUPABASE_ANON_KEY が設定されていません。");
    await postSlack("⚠️ Supabase 疎通確認: SUPABASE_URL / SUPABASE_ANON_KEY が設定されていません。");
    process.exitCode = 1;
    return;
  }

  let row;
  try {
    row = await callKeepalivePing();
  } catch (error) {
    console.error("Supabase への疎通確認に失敗しました:", error.message);
    await postSlack(
      [
        `🚨 Supabase の疎通確認に失敗しました（${MAX_ATTEMPTS} 回試行）。`,
        "Free プランは7日間アクティビティがないとプロジェクトが停止します。早めに確認してください。",
        `エラー: ${error.message}`,
      ].join("\n")
    );
    process.exitCode = 1;
    return;
  }

  const current = new Date(row.current_ping);
  const prev = row.prev_ping ? new Date(row.prev_ping) : null;
  const gapHours = prev ? (current.getTime() - prev.getTime()) / 3_600_000 : null;

  console.log(
    `疎通確認 OK / 今回: ${current.toISOString()} / 前回: ${prev ? prev.toISOString() : "なし"} / 累計: ${row.total_pings} 回`
  );

  if (gapHours !== null && gapHours >= WARN_GAP_HOURS) {
    await postSlack(
      [
        `⚠️ Supabase の疎通確認は成功しましたが、前回の実行から ${Math.floor(gapHours)} 時間空いています。`,
        "GitHub Actions のスケジュールが止まっていないか確認してください。",
        `今回: ${formatJst(current)} / 前回: ${formatJst(prev)} / 累計: ${row.total_pings} 回`,
      ].join("\n")
    );
    return;
  }

  // 毎月1日だけ成功サマリを送り、定期実行そのものが生きていることを確認できるようにする
  if (current.getUTCDate() === 1) {
    await postSlack(
      [
        "✅ Supabase の疎通確認は正常に動いています（月次サマリ）。",
        `今回: ${formatJst(current)} / 前回: ${prev ? formatJst(prev) : "なし"} / 累計: ${row.total_pings} 回`,
      ].join("\n")
    );
  }
}

try {
  await main();
} catch (error) {
  console.error("想定外のエラーで終了しました:", error);
  process.exitCode = 1;
}
