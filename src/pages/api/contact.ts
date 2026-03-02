import type { APIRoute } from "astro";
import { contactSchema } from "../../lib/validation";
import { notifySlack } from "../../lib/slack";
import { sendAutoReply, sendAdminNotify } from "../../lib/mail";
import { Resend } from "resend";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();

    // バリデーション
    const result = contactSchema.safeParse(body);
    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        if (!errors[field]) {
          errors[field] = issue.message;
        }
      }
      return new Response(JSON.stringify({ success: false, errors }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = result.data;

    // ハニーポット検出（botはスパムと判定するが200を返す）
    if (data.website) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Turnstile トークン検証（設定されている場合）
    const turnstileSecret = getEnv("TURNSTILE_SECRET_KEY", locals);
    if (turnstileSecret && data.turnstileToken) {
      const turnstileRes = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            secret: turnstileSecret,
            response: data.turnstileToken,
          }),
        }
      );
      const turnstileData = await turnstileRes.json() as { success: boolean };
      if (!turnstileData.success) {
        return new Response(
          JSON.stringify({ success: false, error: "スパム検証に失敗しました。ページをリロードして再度お試しください。" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // D1 にデータ保存（設定されている場合）
    const db = getD1(locals);
    if (db) {
      try {
        await db
          .prepare(
            "INSERT INTO contacts (name, email, company, category, message, budget, is_spam) VALUES (?, ?, ?, ?, ?, ?, 0)"
          )
          .bind(data.name, data.email, data.company, data.category, data.message, data.budget)
          .run();
      } catch (e) {
        console.error("D1保存エラー:", e);
        // D1エラーでもフォーム送信自体は成功扱いにする
      }
    }

    const mailParams = {
      name: data.name,
      email: data.email,
      company: data.company ?? "",
      category: data.category,
      message: data.message,
      budget: data.budget ?? "",
    };

    // 並行で通知処理を実行（1つ失敗しても他は続行）
    const tasks: Promise<void>[] = [];

    // Resend メール送信
    const resendApiKey = getEnv("RESEND_API_KEY", locals);
    const fromEmail = getEnv("MAIL_FROM", locals) ?? "noreply@creatorpot.net";
    const adminEmail = getEnv("MAIL_ADMIN", locals) ?? "";

    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      tasks.push(
        sendAutoReply(resend, fromEmail, mailParams).catch((e) =>
          console.error("自動返信メールエラー:", e)
        )
      );
      if (adminEmail) {
        tasks.push(
          sendAdminNotify(resend, fromEmail, adminEmail, mailParams).catch((e) =>
            console.error("管理者通知メールエラー:", e)
          )
        );
      }
    }

    // Slack 通知
    const slackWebhookUrl = getEnv("SLACK_WEBHOOK_URL", locals);
    if (slackWebhookUrl) {
      tasks.push(
        notifySlack(slackWebhookUrl, mailParams).catch((e) =>
          console.error("Slack通知エラー:", e)
        )
      );
    }

    await Promise.allSettled(tasks);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("お問い合わせ処理エラー:", e);
    return new Response(
      JSON.stringify({ success: false, error: "送信に失敗しました。時間をおいて再度お試しください。" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// 環境変数の取得ヘルパー（Cloudflare runtime / Node.js 両対応）
function getEnv(key: string, locals: App.Locals): string | undefined {
  // Cloudflare Pages Functions の場合
  const runtime = (locals as any).runtime;
  if (runtime?.env?.[key]) {
    return runtime.env[key] as string;
  }
  // Node.js の場合（ローカル開発）
  return (import.meta as any).env?.[key] ?? process.env[key];
}

// D1 データベースの取得ヘルパー
function getD1(locals: App.Locals): any | null {
  const runtime = (locals as any).runtime;
  return runtime?.env?.DB ?? null;
}
