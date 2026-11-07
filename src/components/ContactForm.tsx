import { Fragment, useEffect, useRef, useState } from "react";
import {
  CONTACT_CATEGORIES,
  BUDGET_OPTIONS,
  SALES_CATEGORY,
  SOURCE_PAGE_MAX,
  contactSchema,
  isContactCategory,
} from "../lib/validation";
import { trackEvent } from "../lib/gtag";

type FormErrors = Partial<Record<string, string>>;

interface ContactFormProps {
  // セクション見出し（送信前のみ表示）
  heading?: string;
  // セクション説明文（送信前のみ表示。改行文字 \n は <br /> に変換される）
  description?: string;
  // 初期選択する種別（例: IP向けページなら "game-promo"）。CONTACT_CATEGORIES に無い値は無視する
  defaultCategory?: string;
}

// エラーの文字色。明るい背景で約6:1。site.css に赤の変数が無いのでここだけで持つ
const ERROR_COLOR = "#b42318";

// 案件のご相談に約束する返信の目安（全ページで「2営業日以内」にそろえる。決定 0087）
const REPLY_PROMISE = "担当者から2営業日以内にご連絡します。";
// 営業のご連絡には返信を約束しない
const SALES_REPLY = "内容を拝見し、必要なときにご連絡します。";

// 案件の種別（売り込みの sales は別の段に分けて置く）
const PROJECT_CATEGORIES = CONTACT_CATEGORIES.filter(
  (c) => c.value !== SALES_CATEGORY,
);
const SALES_OPTION = CONTACT_CATEGORIES.find((c) => c.value === SALES_CATEGORY)!;

function getSubmissionErrorMessage() {
  if (import.meta.env.DEV) {
    return "ローカル確認時は `netlify dev` で Functions を起動してください。";
  }
  return "送信に失敗しました。時間をおいて再度お試しください。";
}

// 改行文字を <br /> に変換して描画
function renderMultiline(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => (
    <Fragment key={i}>
      {line}
      {i < lines.length - 1 && <br />}
    </Fragment>
  ));
}

function getSourcePage(): string {
  if (typeof window === "undefined") return "";
  return window.location.pathname.slice(0, SOURCE_PAGE_MAX);
}

const labelClass = "block text-[15px] font-bold leading-relaxed text-[var(--ink)]";
const requiredMark = (
  <span className="ml-2 text-[13px] font-bold text-[var(--accent-ink)]">必須</span>
);
const optionalMark = (
  <span className="ml-2 text-[13px] font-normal text-[var(--muted)]">任意</span>
);

function inputClass(hasError: boolean) {
  return [
    "block w-full rounded-lg border bg-[var(--card)] px-4 py-3 text-[16px] leading-relaxed text-[var(--ink)]",
    "placeholder:text-[var(--muted)] placeholder:opacity-70",
    "focus:outline focus:outline-2 focus:outline-offset-0 focus:outline-[var(--accent)]",
    hasError
      ? "border-2 border-[#b42318]"
      : "border-[var(--rule-strong)] focus:border-[var(--accent-ink)]",
  ].join(" ");
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-2 text-[14px] font-bold leading-relaxed" style={{ color: ERROR_COLOR }}>
      {message}
    </p>
  );
}

export default function ContactForm({
  heading,
  description,
  defaultCategory,
}: ContactFormProps = {}) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category:
      defaultCategory && isContactCategory(defaultCategory) ? defaultCategory : "",
    message: "",
    company: "",
    budget: "",
    website: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [serverError, setServerError] = useState("");
  const [submittedCategory, setSubmittedCategory] = useState("");
  const startedRef = useRef(false);
  // フォームを描画した時刻。送信までの時間をスパム判定に使う
  const mountedAtRef = useRef(0);
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mountedAtRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (status === "success") successRef.current?.focus();
  }, [status]);

  // 最初の入力で1回だけ form_start を送る（入力を始めた人と送信した人の差を見る）
  const markStarted = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    trackEvent("form_start", {
      form_name: "contact",
      source_page: getSourcePage(),
    });
  };

  const clearFieldError = (field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    clearFieldError(name);
    if (name !== "website") markStarted();
    if (serverError) {
      setServerError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError("");

    const sourcePage = getSourcePage();
    const result = contactSchema.safeParse({
      ...formData,
      source_page: sourcePage,
      elapsed_ms: Date.now() - mountedAtRef.current,
    });
    if (!result.success) {
      const newErrors: FormErrors = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        if (!newErrors[field]) {
          newErrors[field] = issue.message;
        }
      }
      setErrors(newErrors);
      trackEvent("form_error", {
        form_name: "contact",
        reason: "client_validation",
      });
      return;
    }

    setStatus("submitting");
    setErrors({});

    try {
      const res = await fetch("/.netlify/functions/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });

      const data = await res.json();

      if (data.success) {
        setSubmittedCategory(result.data.category);
        setStatus("success");
        // リード獲得を GA4 に通知。category / budget / source_page はセグメント分析用
        trackEvent("generate_lead", {
          form_name: "contact",
          category: result.data.category,
          budget: result.data.budget || "unspecified",
          source_page: result.data.source_page,
        });
        trackEvent("form_submit", {
          form_name: "contact",
          category: result.data.category,
        });
        return;
      }

      if (data.errors) {
        setErrors(data.errors);
        setStatus("idle");
        trackEvent("form_error", {
          form_name: "contact",
          reason: "server_validation",
        });
      } else {
        setServerError(data.error || getSubmissionErrorMessage());
        setStatus("error");
        trackEvent("form_error", {
          form_name: "contact",
          reason: "server_error",
        });
      }
    } catch {
      setServerError(getSubmissionErrorMessage());
      setStatus("error");
      trackEvent("form_error", {
        form_name: "contact",
        reason: "network",
      });
    }
  };

  if (status === "success") {
    const isSales = submittedCategory === SALES_CATEGORY;
    return (
      <div
        ref={successRef}
        tabIndex={-1}
        role="status"
        className="surface w-full p-8 md:p-12 focus:outline-none"
      >
        <h3 className="h3">お問い合わせを受け付けました</h3>
        <p className="body mt-4">
          {isSales ? SALES_REPLY : REPLY_PROMISE}
          <br />
          入力いただいたメールアドレスに、受付の確認メールをお送りしました。
        </p>
        {!isSales && (
          <p className="small mt-4">
            確認メールが届かないときは、迷惑メールのフォルダをご確認ください。
          </p>
        )}
      </div>
    );
  }

  const renderChip = (cat: { value: string; label: string }) => {
    const selected = formData.category === cat.value;
    return (
      <label
        key={cat.value}
        className={[
          "inline-flex min-h-[44px] cursor-pointer items-center rounded-lg px-4 py-2 text-[15px] leading-snug transition-colors",
          "has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--accent)]",
          selected
            ? "border-2 border-[var(--accent-ink)] bg-[var(--accent-wash)] font-bold text-[var(--accent-ink)]"
            : "border border-[var(--rule-strong)] bg-[var(--card)] text-[var(--ink-2)] hover:bg-[var(--paper-2)]",
        ].join(" ")}
      >
        <input
          type="radio"
          name="category"
          value={cat.value}
          checked={selected}
          onChange={handleChange}
          className="sr-only"
          aria-describedby={errors.category ? "category-error" : undefined}
        />
        {cat.label}
      </label>
    );
  };

  return (
    <div className="flex w-full flex-col gap-8">
      {(heading || description) && (
        <div className="flex flex-col gap-4">
          {heading && <h2 className="h2">{heading}</h2>}
          {description && (
            <p className="body measure">{renderMultiline(description)}</p>
          )}
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        className="surface flex w-full flex-col gap-7 p-6 md:p-8"
        noValidate
      >
        {/* お名前（必須） */}
        <div>
          <label htmlFor="name" className={labelClass}>
            お名前{requiredMark}
          </label>
          <input
            type="text"
            id="name"
            name="name"
            autoComplete="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="山田 太郎"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "name-error" : undefined}
            className={`mt-2 ${inputClass(!!errors.name)}`}
          />
          <FieldError id="name-error" message={errors.name} />
        </div>

        {/* メールアドレス（必須） */}
        <div>
          <label htmlFor="email" className={labelClass}>
            メールアドレス{requiredMark}
          </label>
          <input
            type="email"
            id="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="example@company.com"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={`mt-2 ${inputClass(!!errors.email)}`}
          />
          <FieldError id="email-error" message={errors.email} />
        </div>

        {/* 法人名（任意） */}
        <div>
          <label htmlFor="company" className={labelClass}>
            法人名・組織名{optionalMark}
          </label>
          <input
            type="text"
            id="company"
            name="company"
            autoComplete="organization"
            value={formData.company}
            onChange={handleChange}
            placeholder="株式会社〇〇"
            aria-invalid={errors.company ? true : undefined}
            aria-describedby={errors.company ? "company-error" : undefined}
            className={`mt-2 ${inputClass(!!errors.company)}`}
          />
          <FieldError id="company-error" message={errors.company} />
        </div>

        {/* お問い合わせ種別（必須）。営業のご連絡は別の段に分ける */}
        <fieldset>
          <legend className={labelClass}>お問い合わせ種別{requiredMark}</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {PROJECT_CATEGORIES.map(renderChip)}
          </div>
          <div className="mt-5 border-t border-[var(--rule)] pt-4">
            <div className="flex flex-wrap gap-2">{renderChip(SALES_OPTION)}</div>
            <p className="small mt-2">
              当社へのサービスのご案内や営業のご連絡は、こちらを選んでください。内容を拝見し、必要なときに当社からご連絡します。
            </p>
          </div>
          <FieldError id="category-error" message={errors.category} />
        </fieldset>

        {/* ご予算（任意） */}
        <div>
          <label htmlFor="budget" className={labelClass}>
            ご予算{optionalMark}
          </label>
          <select
            id="budget"
            name="budget"
            value={formData.budget}
            onChange={handleChange}
            className={`mt-2 appearance-none pr-10 ${inputClass(!!errors.budget)}`}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%234e5d57' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 14px center",
            }}
          >
            {BUDGET_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <FieldError id="budget-error" message={errors.budget} />
        </div>

        {/* ご相談内容（必須） */}
        <div>
          <label htmlFor="message" className={labelClass}>
            ご相談内容{requiredMark}
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={6}
            placeholder={
              "例: 来年3月のイベントで、来場者が遊べるミニゲームを作りたいと考えています。キャラクターの素材は当社で用意できます。"
            }
            style={{ resize: "vertical" }}
            aria-invalid={errors.message ? true : undefined}
            aria-describedby={errors.message ? "message-error message-count" : "message-count"}
            className={`mt-2 min-h-[140px] overflow-y-auto ${inputClass(!!errors.message)}`}
          />
          <div className="flex items-start justify-between gap-4">
            <FieldError id="message-error" message={errors.message} />
            <p id="message-count" className="small num ml-auto mt-2">
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
          <div
            role="alert"
            className="rounded-lg border-2 bg-[var(--card)] px-4 py-3"
            style={{ borderColor: ERROR_COLOR }}
          >
            <p className="text-[15px] font-bold leading-relaxed" style={{ color: ERROR_COLOR }}>
              {serverError}
            </p>
          </div>
        )}

        {/* 送信ボタン */}
        <button
          type="submit"
          disabled={status === "submitting"}
          className="btn w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "submitting" ? "送信しています" : "送信する"}
        </button>

        <p className="small">
          送信すると、
          <a href="/privacy/" target="_blank" rel="noopener" className="link">
            プライバシーポリシー
          </a>
          に同意したものとみなします。ご相談には{REPLY_PROMISE}
        </p>
      </form>
    </div>
  );
}
