import { Resend } from "resend";
import { getCategoryLabel, getBudgetLabel, SALES_CATEGORY } from "./validation";

interface MailParams {
  name: string;
  email: string;
  company: string;
  category: string;
  message: string;
  budget: string;
  sourcePage: string;
}

// 売り込み（種別 sales）は件名と本文の先頭に印を付け、見込み客の相談と見分けられるようにする
export const SALES_MARK = "【営業のご連絡】";

function isSales(category: string): boolean {
  return category === SALES_CATEGORY;
}

// 自動返信メールを送信
export async function sendAutoReply(
  resend: Resend,
  fromEmail: string,
  params: MailParams
): Promise<void> {
  // 案件のご相談には返信の目安を約束する。営業のご連絡には返信を約束しない
  const closing = isSales(params.category)
    ? `内容を拝見し、必要なときにご連絡します。`
    : `担当者より2営業日以内にご連絡いたします。
今しばらくお待ちくださいませ。`;

  await resend.emails.send({
    from: fromEmail,
    to: params.email,
    subject: "【クリエイターのうえきばち】お問い合わせありがとうございます",
    text: `${params.name} 様

お問い合わせいただきありがとうございます。
以下の内容で承りました。

━━━━━━━━━━━━━━━━━━
■ お問い合わせ種別: ${getCategoryLabel(params.category)}
■ ご相談内容:
${params.message}
━━━━━━━━━━━━━━━━━━

${closing}

─────────────────
株式会社クリエイターのうえきばち
https://creatorpot.net
─────────────────

※ このメールは自動送信されています。
  本メールに直接ご返信いただいてもお答えできかねますので、ご了承ください。`,
  });
}

// 管理者通知メールを送信
export async function sendAdminNotify(
  resend: Resend,
  fromEmail: string,
  toEmail: string,
  params: MailParams
): Promise<void> {
  const mark = isSales(params.category) ? SALES_MARK : "【お問い合わせ】";
  await resend.emails.send({
    from: fromEmail,
    to: toEmail,
    subject: `${mark}${getCategoryLabel(params.category)} - ${params.name}様`,
    text: `${isSales(params.category) ? `${SALES_MARK}種別「営業・サービスのご提案」で届いた送信です。\n\n` : ""}新しいお問い合わせがありました。

━━━━━━━━━━━━━━━━━━
■ 種別: ${getCategoryLabel(params.category)}
■ 送信元ページ: ${params.sourcePage || "不明"}
■ お名前: ${params.name}
■ メール: ${params.email}
■ 法人名: ${params.company || "未入力"}
■ 予算: ${getBudgetLabel(params.budget)}
━━━━━━━━━━━━━━━━━━

■ ご相談内容:
${params.message}

━━━━━━━━━━━━━━━━━━`,
  });
}
