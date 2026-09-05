// Google API（Search Console / Analytics）用のアクセストークンを取得する。
// 依存を増やさないため node 組み込みの crypto と fetch だけで完結させている。
//
// 認証情報は3通りに対応する。上から順に探す。
//
//   1. サービスアカウント鍵
//      GOOGLE_SERVICE_ACCOUNT_KEY（JSON本体。GitHub Actions の Secrets 向け）か
//      GOOGLE_APPLICATION_CREDENTIALS（ファイルパス）。
//      creatorpot.net の組織では constraints/iam.disableServiceAccountKeyCreation が
//      有効で鍵を発行できないため、いまは 2 を使っている。
//
//   2. ADC + サービスアカウントの権限借用（impersonation） ← 既定
//      gcloud auth application-default login --impersonate-service-account=... で作られる
//      ~/.config/gcloud/application_default_credentials.json を読む。
//      本人の資格情報でサービスアカウントを借用し、必要なスコープのトークンを発行する。
//      鍵ファイルを作らずに済む。
//
//   3. ADC のユーザー資格情報（借用なし）
//      gcloud auth application-default login --scopes=... で作られるもの。
//      2026-09 時点で gcloud の既定クライアント ID では analytics.readonly が
//      ブロックされるため、自前の OAuth クライアントを使う場合にだけ通る。
//
// どの資格情報もリポジトリには置かない。

import { createSign } from "node:crypto";
import { readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const TIMEOUT_MS = 30_000;
const MAX_ATTEMPTS = 3;
// 有効期限ぎりぎりのトークンを使い回して 401 になるのを避けるための余裕
const EXPIRY_MARGIN_SEC = 60;

// 用途ごとの OAuth スコープ。どちらも読み取り専用
export const SCOPES = {
  gsc: "https://www.googleapis.com/auth/webmasters.readonly",
  ga4: "https://www.googleapis.com/auth/analytics.readonly",
};

// 借用するサービスアカウント。案内メッセージに使うだけで、実際の対象は ADC の中身が決める
const IMPERSONATE_TARGET =
  process.env.GOOGLE_IMPERSONATE_SERVICE_ACCOUNT ??
  "analytics-reader@creatorpot-analytics.iam.gserviceaccount.com";

// ADC を作り直してもらうときに案内するコマンド
export const ADC_LOGIN_COMMAND = `gcloud auth application-default login --impersonate-service-account=${IMPERSONATE_TARGET}`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const base64url = (input) => Buffer.from(input).toString("base64url");

let credentialsCache = null;
const tokenCache = new Map();

// gcloud が ADC を置く場所。CLOUDSDK_CONFIG があればそちらを優先する
function adcPath() {
  const base = process.env.CLOUDSDK_CONFIG ?? path.join(os.homedir(), ".config", "gcloud");
  return path.join(base, "application_default_credentials.json");
}

async function readJson(filePath, label) {
  let raw;
  try {
    raw = await readFile(filePath, "utf8");
  } catch (error) {
    throw new Error(`${label}を読めませんでした: ${filePath} / ${error.message}`);
  }

  try {
    return JSON.parse(raw);
  } catch {
    // 資格情報の中身はログに出さない
    throw new Error(`${label}が JSON として読めませんでした: ${filePath}`);
  }
}

// 資格情報の形が想定どおりか確かめる
function validateCredentials(parsed, source) {
  const retryHint = ["次のコマンドで取り直してください。", `  ${ADC_LOGIN_COMMAND}`].join("\n");

  switch (parsed.type) {
    case "service_account":
      if (!parsed.client_email || !parsed.private_key) {
        throw new Error(`サービスアカウント鍵に client_email / private_key がありません: ${source}`);
      }
      return;

    case "impersonated_service_account":
      if (!parsed.service_account_impersonation_url || !parsed.source_credentials) {
        throw new Error(`権限借用の資格情報が不完全です: ${source}\n${retryHint}`);
      }
      return;

    case "authorized_user":
      if (!parsed.client_id || !parsed.client_secret || !parsed.refresh_token) {
        throw new Error(`ADC の資格情報が不完全です: ${source}\n${retryHint}`);
      }
      return;

    default:
      throw new Error(`対応していない資格情報の形式です（type: ${parsed.type ?? "不明"}）: ${source}`);
  }
}

// 資格情報を読み込む。2回目以降はキャッシュを返す
export async function loadCredentials() {
  if (credentialsCache) return credentialsCache;

  const inline = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  const explicitPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  let parsed;
  let source;

  if (inline) {
    source = "GOOGLE_SERVICE_ACCOUNT_KEY";
    try {
      parsed = JSON.parse(inline);
    } catch {
      throw new Error(`サービスアカウント鍵が JSON として読めませんでした: ${source}`);
    }
  } else if (explicitPath) {
    source = `GOOGLE_APPLICATION_CREDENTIALS (${explicitPath})`;
    parsed = await readJson(explicitPath, "資格情報");
  } else {
    const fallback = adcPath();
    try {
      parsed = await readJson(fallback, "ADC の資格情報");
      source = `ADC (${fallback})`;
    } catch {
      throw new Error(
        [
          "Google API の資格情報が見つかりません。次のコマンドでログインしてください。",
          `  ${ADC_LOGIN_COMMAND}`,
          "GitHub Actions などサービスアカウント鍵を使う場合は GOOGLE_SERVICE_ACCOUNT_KEY を設定してください。",
        ].join("\n")
      );
    }
  }

  validateCredentials(parsed, source);
  credentialsCache = { ...parsed, source };
  return credentialsCache;
}

// サービスアカウント鍵で署名した JWT を作る
function buildAssertion(credentials, scope) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claims = {
    iss: credentials.client_email,
    scope,
    aud: TOKEN_ENDPOINT,
    iat: now,
    exp: now + 3600,
  };

  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claims))}`;
  const signature = createSign("RSA-SHA256")
    .update(unsigned)
    .sign(credentials.private_key)
    .toString("base64url");

  return `${unsigned}.${signature}`;
}

// トークンエンドポイントを叩く。失敗時のメッセージに資格情報の中身は含めない
async function requestToken(body, { userCredentials = false } = {}) {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  const parsed = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = String(parsed.error_description ?? parsed.error ?? "").slice(0, 300);
    const hint = userCredentials ? `\nADC を取り直してください:\n  ${ADC_LOGIN_COMMAND}` : "";
    throw new Error(`アクセストークンの取得に失敗しました: HTTP ${res.status} ${detail}${hint}`);
  }

  if (!parsed.access_token) {
    throw new Error("アクセストークンの取得に失敗しました: レスポンスに access_token がありません。");
  }

  return parsed;
}

// 本人の資格情報でサービスアカウントを借用し、指定スコープのトークンを発行してもらう。
// 鍵を作らずにサービスアカウントとして API を読むための仕組み
async function generateImpersonatedToken(credentials, scopes) {
  const source = credentials.source_credentials;
  const sourceToken = await requestToken(
    {
      grant_type: "refresh_token",
      client_id: source.client_id,
      client_secret: source.client_secret,
      refresh_token: source.refresh_token,
    },
    { userCredentials: true }
  );

  const res = await fetch(credentials.service_account_impersonation_url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sourceToken.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      scope: scopes,
      lifetime: "3600s",
      delegates: credentials.delegates ?? [],
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  const parsed = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = String(parsed.error?.message ?? "").slice(0, 300);
    throw new Error(
      [
        `サービスアカウントの権限借用に失敗しました: HTTP ${res.status} ${detail}`,
        "借用の権限（roles/iam.serviceAccountTokenCreator）が付いているか、",
        "IAM Service Account Credentials API が有効か確認してください。",
      ].join("\n")
    );
  }

  if (!parsed.accessToken) {
    throw new Error("権限借用のレスポンスに accessToken がありません。");
  }

  return {
    token: parsed.accessToken,
    // expireTime は RFC3339。取れなければ既定の1時間として扱う
    expiresAt: parsed.expireTime
      ? new Date(parsed.expireTime).getTime() - EXPIRY_MARGIN_SEC * 1000
      : Date.now() + (3600 - EXPIRY_MARGIN_SEC) * 1000,
  };
}

// アクセストークンを返す。期限内ならキャッシュを使い回す。
// 権限借用とユーザー資格情報ではスコープを個別に分けないので、キャッシュは1本にまとめる
export async function getAccessToken(scope) {
  const credentials = await loadCredentials();
  const cacheKey = credentials.type === "service_account" ? scope : credentials.type;

  const cached = tokenCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.token;
  }

  if (credentials.type === "impersonated_service_account") {
    // GSC と GA4 の両方を含めて1本のトークンにする
    const result = await generateImpersonatedToken(credentials, [SCOPES.gsc, SCOPES.ga4]);
    tokenCache.set(cacheKey, result);
    return result.token;
  }

  const body =
    credentials.type === "service_account"
      ? {
          grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
          assertion: buildAssertion(credentials, scope),
        }
      : {
          grant_type: "refresh_token",
          client_id: credentials.client_id,
          client_secret: credentials.client_secret,
          refresh_token: credentials.refresh_token,
        };

  const parsed = await requestToken(body, {
    userCredentials: credentials.type === "authorized_user",
  });
  const expiresIn = Number(parsed.expires_in) || 3600;

  tokenCache.set(cacheKey, {
    token: parsed.access_token,
    expiresAt: Date.now() + (expiresIn - EXPIRY_MARGIN_SEC) * 1000,
  });

  return parsed.access_token;
}

// スコープ不足はログインし直せば直るので、その場で手順を出す
function decorateError(message, status, credentials) {
  if (
    status === 403 &&
    credentials.type === "authorized_user" &&
    /insufficient authentication scopes|ACCESS_TOKEN_SCOPE_INSUFFICIENT/i.test(message)
  ) {
    return `${message}\n\n資格情報に必要なスコープが含まれていません。取り直してください:\n  ${ADC_LOGIN_COMMAND}`;
  }

  if (status === 403 && credentials.type !== "authorized_user") {
    return `${message}\n\nサービスアカウント（${IMPERSONATE_TARGET}）が GSC / GA4 のユーザーに追加されているか確認してください（docs/analytics-setup.md §8.2）。`;
  }

  return message;
}

// Google API を叩く。429 と 5xx だけ待って再試行し、それ以外は即座に失敗させる
export async function googleFetch(url, { scope, method = "GET", body } = {}) {
  // 資格情報の不足や誤りは何回試しても同じ結果になる。
  // 待ち時間を挟まずすぐ失敗させたいので、トークンの取得はリトライの外で1回だけ行う
  const credentials = await loadCredentials();
  const token = await getAccessToken(scope);

  // ユーザー資格情報で叩くときはクォータの計上先を明示する。
  // 権限借用とサービスアカウントではトークン自体がプロジェクトに紐づくので要らない
  const quotaProject =
    credentials.type === "authorized_user"
      ? (process.env.GOOGLE_CLOUD_PROJECT ?? credentials.quota_project_id)
      : null;

  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(quotaProject ? { "x-goog-user-project": quotaProject } : {}),
          ...(body ? { "Content-Type": "application/json" } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      if (res.ok) {
        return await res.json();
      }

      const text = (await res.text()).slice(0, 500);
      let message = text;
      try {
        message = JSON.parse(text)?.error?.message ?? text;
      } catch {
        // JSON でなければ本文をそのまま使う
      }

      const error = new Error(
        `HTTP ${res.status}: ${decorateError(message, res.status, credentials)}`
      );
      error.status = res.status;

      // 権限不足や不正なリクエストは再試行しても同じ結果になる
      if (res.status !== 429 && res.status < 500) throw error;
      lastError = error;
    } catch (error) {
      if (error.status && error.status !== 429 && error.status < 500) throw error;
      lastError = error;
    }

    if (attempt < MAX_ATTEMPTS) {
      await sleep(2_000 * attempt);
    }
  }

  throw lastError;
}
