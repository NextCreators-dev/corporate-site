import { z } from "zod";

// お問い合わせ種別の選択肢（フォームに出す順。2026-10 改修・決定 0087）
// `sales` は売り込みの業者が自分で選ぶ欄。見込み客と混ざらないようにフォームでは他と離して置く
export const CONTACT_CATEGORIES = [
  { value: "game-promo", label: "販促・イベント用のミニゲーム" },
  { value: "unity", label: "Unity でのゲーム開発" },
  { value: "business-game", label: "社内研修・理念浸透のゲーム" },
  { value: "ai-training", label: "AI研修・導入支援" },
  { value: "partnership", label: "制作パートナー・協業のご相談" },
  { value: "creative", label: "イラスト・映像・音楽の制作" },
  { value: "other", label: "その他のご相談" },
  { value: "sales", label: "営業・サービスのご提案" },
] as const;

export type ContactCategory = (typeof CONTACT_CATEGORIES)[number]["value"];

// 売り込みの種別。通知の件名に印を付けるのに使う
export const SALES_CATEGORY = "sales";

// 改修前（〜2026-10）の種別。新しい送信では受け付けないが、過去の受信の表示名を引くために残す
const LEGACY_CATEGORY_LABELS: Record<string, string> = {
  "web-site": "Webサイト制作",
  "web-app": "Webアプリ開発",
  game: "ゲーム制作",
  creative: "クリエイティブ制作",
  ai: "AI活用コンサルティング",
  event: "イベント企画・運営",
  doujin: "お品書き・PV制作",
  "game-support": "ゲーム制作代行",
  community: "コミュニティ運営サポート",
  other: "その他",
};

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

export function isContactCategory(value: string): value is ContactCategory {
  return validCategories.has(value);
}

// 送信元ページ。`/` で始まるパスだけを 200 字まで残し、それ以外は空にする
export const SOURCE_PAGE_MAX = 200;
export function normalizeSourcePage(value: unknown): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (!/^\/[^\s]*$/.test(trimmed)) return "";
  return trimmed.slice(0, SOURCE_PAGE_MAX);
}

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
  // 送信元ページ（window.location.pathname）。不正な値は弾かずに空にする
  source_page: z
    .unknown()
    .optional()
    .transform((value) => normalizeSourcePage(value)),
  // ハニーポット
  website: z.string().trim().optional().default(""),
});

export type ContactFormData = z.infer<typeof contactSchema>;

// カテゴリ値から表示ラベルを取得（旧い種別の値も引ける）
export function getCategoryLabel(value: string): string {
  return (
    CONTACT_CATEGORIES.find((c) => c.value === value)?.label ??
    LEGACY_CATEGORY_LABELS[value] ??
    value
  );
}

// 予算値から表示ラベルを取得
export function getBudgetLabel(value: string): string {
  if (!value) return "未選択";
  return BUDGET_OPTIONS.find((b) => b.value === value)?.label ?? value;
}
