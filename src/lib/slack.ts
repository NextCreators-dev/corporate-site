import { getCategoryLabel, getBudgetLabel } from "./validation";

interface SlackNotifyParams {
  name: string;
  email: string;
  company: string;
  category: string;
  message: string;
  budget: string;
}

// Slack Incoming Webhook でお問い合わせ通知を送信
export async function notifySlack(
  webhookUrl: string,
  params: SlackNotifyParams
): Promise<void> {
  const payload = {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "📩 新しいお問い合わせ",
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*お名前:*\n${params.name}` },
          { type: "mrkdwn", text: `*メール:*\n${params.email}` },
          { type: "mrkdwn", text: `*法人名:*\n${params.company || "未入力"}` },
          { type: "mrkdwn", text: `*種別:*\n${getCategoryLabel(params.category)}` },
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
