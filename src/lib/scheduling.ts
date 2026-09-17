// 無料相談の日程調整ページへの導線を1箇所にまとめる。
// 既定は Google カレンダーの予約ページ（2026-09-17 代表指定）。
// 差し替えるときは環境変数 PUBLIC_SCHEDULE_URL_BUSINESS で上書きする。
// 環境変数名は PUBLIC_ 接頭辞付きなのでクライアント側にも埋め込まれる。

/** 日程調整 URL の既定値（Google カレンダーの予約ページ） */
const FALLBACK_SCHEDULE_URL = "https://calendar.app.google/BxMZH8KAbgAPwG2W6";

/** 企業向けゲーム制作 LP の「無料相談の日程を選ぶ」の行き先 */
export const SCHEDULE_URL_BUSINESS: string =
  import.meta.env.PUBLIC_SCHEDULE_URL_BUSINESS || FALLBACK_SCHEDULE_URL;

/** 外部の日程調整ツールへ飛ばすかどうか（target="_blank" の判定に使う） */
export const IS_EXTERNAL_SCHEDULE_URL: boolean =
  /^https?:\/\//.test(SCHEDULE_URL_BUSINESS);

/** 問い合わせフォーム（日程が合わない方の導線） */
export const CONTACT_FORM_URL = "/techplantstudio/#contact";

/** 問い合わせ用メールアドレス */
export const CONTACT_EMAIL = "contact@creatorpot.net";
