import { Resend } from "resend";
import { getCategoryLabel, getBudgetLabel } from "./validation";

interface MailParams {
  name: string;
  email: string;
  company: string;
  category: string;
  message: string;
  budget: string;
}

// 自動返信メールを送信
export async function sendAutoReply(
  resend: Resend,
  fromEmail: string,
  params: MailParams
): Promise<void> {
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

担当者より3営業日以内にご連絡いたします。
今しばらくお待ちくださいませ。

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
  await resend.emails.send({
    from: fromEmail,
    to: toEmail,
    subject: `【お問い合わせ】${getCategoryLabel(params.category)} - ${params.name}様`,
    text: `新しいお問い合わせがありました。

━━━━━━━━━━━━━━━━━━
■ お名前: ${params.name}
■ メール: ${params.email}
■ 法人名: ${params.company || "未入力"}
■ 種別: ${getCategoryLabel(params.category)}
■ 予算: ${getBudgetLabel(params.budget)}
━━━━━━━━━━━━━━━━━━

■ ご相談内容:
${params.message}

━━━━━━━━━━━━━━━━━━`,
  });
}
