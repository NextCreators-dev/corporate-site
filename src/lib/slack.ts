import { getCategoryLabel, getBudgetLabel, SALES_CATEGORY } from "./validation";

interface SlackNotifyParams {
  name: string;
  email: string;
  company: string;
  category: string;
  message: string;
  budget: string;
  sourcePage: string;
}

// Slack Incoming Webhook でお問い合わせ通知を送信
// 種別が sales（営業・サービスのご提案）のときは見出しに【営業のご連絡】を付け、見込み客の相談と見分ける
export async function notifySlack(
  webhookUrl: string,
  params: SlackNotifyParams
): Promise<void> {
  const isSales = params.category === SALES_CATEGORY;
  const categoryLabel = getCategoryLabel(params.category);
  const headerText = isSales
    ? `【営業のご連絡】${params.company || params.name}`
    : `新しいお問い合わせ: ${categoryLabel}`;

  const payload = {
    // 通知のプレビュー（モバイルのプッシュ通知など）に出る文
    text: isSales
      ? `【営業のご連絡】${params.company || params.name}（送信元 ${params.sourcePage || "不明"}）`
      : `新しいお問い合わせ: ${categoryLabel} / ${params.company || params.name}（送信元 ${params.sourcePage || "不明"}）`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: headerText.slice(0, 150),
          emoji: false,
        },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*種別:*\n${categoryLabel}` },
          { type: "mrkdwn", text: `*送信元ページ:*\n${params.sourcePage || "不明"}` },
          { type: "mrkdwn", text: `*お名前:*\n${params.name}` },
          { type: "mrkdwn", text: `*メール:*\n${params.email}` },
          { type: "mrkdwn", text: `*法人名:*\n${params.company || "未入力"}` },
          { type: "mrkdwn", text: `*予算:*\n${getBudgetLabel(params.budget)}` },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*ご相談内容:*\n${params.message.slice(0, 500)}${params.message.length > 500 ? "…" : ""}`,
        },
      },
    ],
  };

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    console.error("Slack通知に失敗:", res.status, await res.text());
  }
}
