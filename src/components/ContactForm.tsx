import { useState } from "react";
import {
  CONTACT_CATEGORIES,
  BUDGET_OPTIONS,
  contactSchema,
} from "../lib/validation";

type FormErrors = Partial<Record<string, string>>;

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "",
    message: "",
    company: "",
    budget: "",
    website: "", // ハニーポット
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [serverError, setServerError] = useState("");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // 入力時にそのフィールドのエラーをクリア
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleCategorySelect = (value: string) => {
    setFormData((prev) => ({ ...prev, category: value }));
    if (errors.category) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.category;
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // クライアント側バリデーション
    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      const newErrors: FormErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        if (!newErrors[field]) {
          newErrors[field] = issue.message;
        }
      }
      setErrors(newErrors);
      return;
    }

    setStatus("submitting");
    setErrors({});
    setServerError("");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (data.success) {
        setStatus("success");
      } else if (data.errors) {
        setErrors(data.errors);
        setStatus("idle");
      } else {
        setServerError(data.error || "送信に失敗しました。");
        setStatus("error");
      }
    } catch {
      setServerError("通信エラーが発生しました。時間をおいて再度お試しください。");
      setStatus("error");
    }
  };

  // サンクス表示
  if (status === "success") {
    return (
      <div className="w-full bg-[#111827] p-8 md:p-12 rounded-2xl text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-emerald-500/15 rounded-full flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#10B981"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m9 12 2 2 4-4" />
              <circle cx="12" cy="12" r="10" />
            </svg>
          </div>
          <h3 className="text-white text-xl font-bold">
            お問い合わせありがとうございます
          </h3>
          <p className="text-gray-300 text-sm leading-relaxed max-w-md">
            ご入力いただいたメールアドレスに確認メールをお送りしました。
            <br />
            担当者より1営業日以内にご連絡いたします。
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full bg-[#111827] p-6 md:p-8 rounded-2xl flex flex-col gap-6"
      noValidate
    >
      {/* お名前（必須） */}
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-sm font-medium text-gray-300">
          お名前<span className="text-emerald-500 text-xs ml-1">必須</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="山田 太郎"
          className={`bg-[#0A0F1C] border rounded-lg px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:ring-1 transition-colors ${
            errors.name
              ? "border-red-400 focus:border-red-400 focus:ring-red-400"
              : "border-[#1E293B] focus:border-emerald-500 focus:ring-emerald-500"
          }`}
        />
        {errors.name && (
          <p className="text-red-400 text-xs">{errors.name}</p>
        )}
      </div>

      {/* メールアドレス（必須） */}
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-medium text-gray-300">
          メールアドレス<span className="text-emerald-500 text-xs ml-1">必須</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="example@company.com"
          className={`bg-[#0A0F1C] border rounded-lg px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:ring-1 transition-colors ${
            errors.email
              ? "border-red-400 focus:border-red-400 focus:ring-red-400"
              : "border-[#1E293B] focus:border-emerald-500 focus:ring-emerald-500"
          }`}
        />
        {errors.email && (
          <p className="text-red-400 text-xs">{errors.email}</p>
        )}
      </div>

      {/* 法人名（任意） */}
      <div className="flex flex-col gap-2">
        <label htmlFor="company" className="text-sm font-medium text-gray-300">
          法人名 / 組織名<span className="text-gray-500 text-xs ml-1">任意</span>
        </label>
        <input
          type="text"
          id="company"
          name="company"
          value={formData.company}
          onChange={handleChange}
          placeholder="株式会社〇〇"
          className="bg-[#0A0F1C] border border-[#1E293B] rounded-lg px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
        />
      </div>

      {/* お問い合わせ種別（必須） */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-gray-300">
          お問い合わせ種別<span className="text-emerald-500 text-xs ml-1">必須</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {CONTACT_CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => handleCategorySelect(cat.value)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                formData.category === cat.value
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-500"
                  : "border-[#1E293B] text-gray-400 hover:border-gray-600 hover:text-gray-300"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
        {errors.category && (
          <p className="text-red-400 text-xs">{errors.category}</p>
        )}
      </div>

      {/* ご予算（任意） */}
      <div className="flex flex-col gap-2">
        <label htmlFor="budget" className="text-sm font-medium text-gray-300">
          ご予算<span className="text-gray-500 text-xs ml-1">任意</span>
        </label>
        <select
          id="budget"
          name="budget"
          value={formData.budget}
          onChange={handleChange}
          className="bg-[#0A0F1C] border border-[#1E293B] rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors appearance-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 12px center",
          }}
        >
          {BUDGET_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* ご相談内容（必須） */}
      <div className="flex flex-col gap-2">
        <label htmlFor="message" className="text-sm font-medium text-gray-300">
          ご相談内容<span className="text-emerald-500 text-xs ml-1">必須</span>
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          rows={5}
          placeholder={"例: 自社サービスのWebアプリを開発したいと考えています。\n要件はまだ固まっていませんが、企画段階からご相談可能でしょうか？"}
          className={`bg-[#0A0F1C] border rounded-lg px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:ring-1 transition-colors resize-vertical min-h-[120px] ${
            errors.message
              ? "border-red-400 focus:border-red-400 focus:ring-red-400"
              : "border-[#1E293B] focus:border-emerald-500 focus:ring-emerald-500"
          }`}
        />
        <div className="flex justify-between items-center">
          {errors.message ? (
            <p className="text-red-400 text-xs">{errors.message}</p>
          ) : (
            <span />
          )}
          <p className="text-gray-600 text-xs">
            {formData.message.length} / 2000
          </p>
        </div>
      </div>

      {/* ハニーポット（非表示） */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input
          type="text"
          id="website"
          name="website"
          value={formData.website}
          onChange={handleChange}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* サーバーエラー */}
      {serverError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
          <p className="text-red-400 text-sm">{serverError}</p>
        </div>
      )}

      {/* 送信ボタン */}
      <button
        type="submit"
        disabled={status === "submitting"}
        className="inline-flex items-center justify-center gap-2.5 px-10 py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 disabled:cursor-not-allowed text-white font-bold text-base rounded-xl transition-colors w-full cursor-pointer"
      >
        {status === "submitting" ? (
          <>
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            送信中...
          </>
        ) : (
          <>
            送信する
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </>
        )}
      </button>

      <p className="text-gray-500 text-xs text-center">
        60秒で送信完了 · 強引な営業は一切しません · 通常1営業日以内にご返信
      </p>
    </form>
  );
}
