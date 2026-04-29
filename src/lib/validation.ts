import { z } from "zod";

// お問い合わせ種別の選択肢
export const CONTACT_CATEGORIES = [
  { value: "web-site", label: "Webサイト制作" },
  { value: "web-app", label: "Webアプリ開発" },
  { value: "game", label: "ゲーム制作" },
  { value: "creative", label: "クリエイティブ制作" },
  { value: "ai", label: "AI活用コンサルティング" },
  { value: "event", label: "イベント企画・運営" },
  { value: "doujin", label: "お品書き・PV制作" },
  { value: "game-support", label: "ゲーム制作代行" },
  { value: "community", label: "コミュニティ運営サポート" },
  { value: "other", label: "その他" },
] as const;

// ご予算の選択肢
export const BUDGET_OPTIONS = [
  { value: "", label: "選択してください" },
  { value: "under-30", label: "〜30万円" },
  { value: "30-50", label: "30万円〜50万円" },
  { value: "50-100", label: "50万円〜100万円" },
  { value: "100-300", label: "100万円〜300万円" },
  { value: "over-300", label: "300万円〜" },
  { value: "undecided", label: "未定・相談したい" },
] as const;

const validCategories = new Set<string>(
  CONTACT_CATEGORIES.map((category) => category.value),
);
const validBudgets = new Set<string>(
  BUDGET_OPTIONS.map((budget) => budget.value),
);

// バリデーションスキーマ
export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "お名前を入力してください")
    .max(50, "お名前は50文字以内で入力してください"),
  email: z
    .string()
    .trim()
    .min(1, "メールアドレスを入力してください")
    .email("正しいメールアドレスを入力してください"),
  category: z
    .string()
    .trim()
    .refine(
      (value) => validCategories.has(value),
      "お問い合わせ種別を選択してください",
    ),
  message: z
    .string()
    .trim()
    .min(10, "ご相談内容は10文字以上で入力してください")
    .max(2000, "ご相談内容は2000文字以内で入力してください"),
  company: z
    .string()
    .trim()
    .max(100, "法人名は100文字以内で入力してください")
    .optional()
    .default(""),
  budget: z
    .string()
    .refine((value) => validBudgets.has(value), "ご予算の選択肢が不正です")
    .optional()
    .default(""),
  // ハニーポット
  website: z.string().trim().optional().default(""),
});

export type ContactFormData = z.infer<typeof contactSchema>;

// カテゴリ値から表示ラベルを取得
export function getCategoryLabel(value: string): string {
  return CONTACT_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

// 予算値から表示ラベルを取得
export function getBudgetLabel(value: string): string {
  if (!value) return "未選択";
  return BUDGET_OPTIONS.find((b) => b.value === value)?.label ?? value;
}
