import type { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { sendAutoReply, sendAdminNotify } from "../../src/lib/mail";
import { notifySlack } from "../../src/lib/slack";
import { contactSchema } from "../../src/lib/validation";

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !key) {
    throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が設定されていません。");
  }
  return createClient(url, key);
}

function getJsonHeaders() {
  return { "Content-Type": "application/json" };
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: getJsonHeaders(),
      body: JSON.stringify({ success: false, error: "Method Not Allowed" }),
    };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const result = contactSchema.safeParse(body);

    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        if (!errors[field]) {
          errors[field] = issue.message;
        }
      }

      return {
        statusCode: 400,
        headers: getJsonHeaders(),
        body: JSON.stringify({ success: false, errors }),
      };
    }

    const data = result.data;

    if (data.website) {
      return {
        statusCode: 200,
        headers: getJsonHeaders(),
        body: JSON.stringify({ success: true }),
      };
    }

    const supabase = getSupabaseClient();

    const { error: dbError } = await supabase.from("contacts").insert({
      name: data.name,
      email: data.email,
      company: data.company,
      category: data.category,
      message: data.message,
      budget: data.budget,
      is_spam: false,
    });
    if (dbError) throw dbError;

    const mailParams = {
      name: data.name,
      email: data.email,
      company: data.company ?? "",
      category: data.category,
      message: data.message,
      budget: data.budget ?? "",
    };

    const tasks: Promise<unknown>[] = [];
    const resendApiKey = process.env.RESEND_API_KEY ?? "";
    const fromEmail = process.env.MAIL_FROM ?? "noreply@creatorpot.net";
    const adminEmail = process.env.MAIL_ADMIN ?? "";

    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      tasks.push(
        sendAutoReply(resend, fromEmail, mailParams).catch((error) =>
          console.error("自動返信メールエラー:", error)
        )
      );

      if (adminEmail) {
        tasks.push(
          sendAdminNotify(resend, fromEmail, adminEmail, mailParams).catch((error) =>
            console.error("管理者通知メールエラー:", error)
          )
        );
      }
    }

    const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL ?? "";
    if (slackWebhookUrl) {
      tasks.push(
        notifySlack(slackWebhookUrl, mailParams).catch((error) =>
          console.error("Slack通知エラー:", error)
        )
      );
    }

    await Promise.allSettled(tasks);

    return {
      statusCode: 200,
      headers: getJsonHeaders(),
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error("お問い合わせ処理エラー:", error);
    return {
      statusCode: 500,
      headers: getJsonHeaders(),
      body: JSON.stringify({
        success: false,
        error: "送信に失敗しました。時間をおいて再度お試しください。",
      }),
    };
  }
};
