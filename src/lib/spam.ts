// 問い合わせフォームのスパム判定（2026-11 追加）
//
// 届いていたスパムは、お名前とご相談内容が「VxHmMlVNuHGzetWmOwgZGz」のような
// 英大文字・小文字の無作為な並びになっていた。送信の速さも合わせて見る。
// 判定に当たった送信は捨てずに contacts へ is_spam = true で保存し、
// 自動返信・管理者通知・Slack 通知だけを止める（誤判定でも DB から拾える）。

// フォームを開いてから送信までの最短時間。人が5項目を埋めるのにこれより速いことはない
export const MIN_FILL_MS = 3000;

// 英字だけで空白を含まず、小文字→大文字の切り替わりが3回以上ある文字列を無作為な並びとみなす。
// 実在の綴りは「McDonald」「DeAndre」「JohnSmith」でも切り替わりは1回
const RANDOM_CASE_MIN_LENGTH = 8;
const RANDOM_CASE_MIN_SWITCHES = 3;

export function looksLikeRandomString(value: string): boolean {
  const text = value.trim();
  if (text.length < RANDOM_CASE_MIN_LENGTH) return false;
  if (!/^[A-Za-z]+$/.test(text)) return false;
  const switches = text.match(/[a-z][A-Z]/g)?.length ?? 0;
  return switches >= RANDOM_CASE_MIN_SWITCHES;
}

interface SpamCheckInput {
  name: string;
  message: string;
  // フォームを開いてから送信までのミリ秒。フォームを通さず直接 POST されると null
  elapsedMs: number | null;
}

// 当たった理由を返す。空配列ならスパムではない
export function detectSpam(input: SpamCheckInput): string[] {
  const reasons: string[] = [];
  if (looksLikeRandomString(input.name)) reasons.push("random_name");
  if (looksLikeRandomString(input.message)) reasons.push("random_message");
  if (input.elapsedMs === null) {
    reasons.push("no_elapsed");
  } else if (input.elapsedMs < MIN_FILL_MS) {
    reasons.push("too_fast");
  }
  return reasons;
}
