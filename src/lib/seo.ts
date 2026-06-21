// SEO 用の共通定数と構造化データ（JSON-LD）ビルダー
// 各ページから呼び出し、Head.astro 経由で <script type="application/ld+json"> として出力する

import type { NewsItem } from "../data/news";

/** サイト全体の基本情報 */
export const SITE = {
  name: "株式会社クリエイターのうえきばち",
  alternateName: ["クリエイターのうえきばち", "CreatorPot"],
  url: "https://creatorpot.net",
  logo: "https://creatorpot.net/logo.png",
  ogImage: "https://creatorpot.net/OGP.png",
  description:
    "株式会社クリエイターのうえきばちは、ノーコードでゲーム制作ができるプラットフォーム「NoLogic」の開発、クリエイター支援コミュニティ「NextCreators」の運営、ゲーム・Webアプリ開発の受託を手掛けています。",
  foundingDate: "2024-11-29",
  /** 問い合わせ先メールアドレス（プライバシーポリシー記載と統一） */
  email: "contact@creatorpot.net",
  /** 所在地（会社概要と統一） */
  address: {
    region: "東京都",
    locality: "千代田区",
    street: "神田神保町3丁目21-7 英弘ビル3F みらいスタジオ",
  },
  /** 代表者 */
  founderName: "山縣 帆高",
  sameAs: [
    "https://twitter.com/creator_pot",
    "https://note.com/creator_pot",
    "https://discord.gg/3hy2UNmXca",
  ],
} as const;

/** "2026.01.05" 形式の日付を ISO 8601（"2026-01-05"）へ変換 */
export function toISODate(date: string): string {
  return date.replace(/\./g, "-");
}

/** 発行元（publisher）として使い回す Organization 断片 */
const publisher = {
  "@type": "Organization",
  name: SITE.name,
  logo: {
    "@type": "ImageObject",
    url: SITE.logo,
  },
};

/** 企業情報（Organization）— 全ページで出力 */
// 住所・連絡先・代表者・専門領域を加え、AI検索（AIO）や検索エンジンが
// 「どこの・何をしている会社か」を正確に抽出できるようにする。
export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    alternateName: SITE.alternateName,
    url: SITE.url,
    logo: SITE.logo,
    image: SITE.ogImage,
    description: SITE.description,
    foundingDate: SITE.foundingDate,
    email: SITE.email,
    founder: {
      "@type": "Person",
      name: SITE.founderName,
      jobTitle: "代表取締役",
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: "JP",
      addressRegion: SITE.address.region,
      addressLocality: SITE.address.locality,
      streetAddress: SITE.address.street,
    },
    contactPoint: {
      "@type": "ContactPoint",
      email: SITE.email,
      contactType: "customer support",
      availableLanguage: ["ja"],
    },
    areaServed: "JP",
    knowsAbout: [
      "ノーコードゲーム制作",
      "クリエイター支援",
      "コミュニティ運営代行",
      "Webアプリケーション開発",
      "ゲーム開発",
      "生成AI活用コンサルティング",
    ],
    sameAs: SITE.sameAs,
  };
}

/** 代表取締役（Person）— E-E-A-T 強化。著者・創業者としての実体を検索/AIに伝える */
export function personSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: SITE.founderName,
    jobTitle: "代表取締役",
    worksFor: { "@type": "Organization", name: SITE.name, url: SITE.url },
    url: `${SITE.url}/essay`,
    award: "IPA未踏IT人材発掘・育成事業 2021年度採択",
    knowsAbout: [
      "ノーコードゲーム開発",
      "Webアプリケーション開発",
      "クリエイター支援",
      "コミュニティ運営",
      "生成AI活用",
    ],
  };
}

/**
 * 提供サービス（Service）— サービスLP／トップのサービス節で出力。
 * provider を自社に固定し、価格は Offer + PriceSpecification として渡せるようにして、
 * AI検索や検索エンジンが「何を・いくらで提供しているか」を構造的に抽出できるようにする。
 */
export function serviceSchema(opts: {
  name: string;
  description: string;
  url: string;
  /** 例: "コミュニティ運営代行" */
  serviceType?: string;
  offer?: {
    /** 表示用の価格テキスト（例「月額 10〜20万円」「初回30万円＋月額10万円」） */
    priceText?: string;
    /** 価格下限（円）。月額制なら「月額の下限」 */
    minPrice?: number;
    /** 価格上限（円）。単一価格なら省略 */
    maxPrice?: number;
    /** "month" を指定すると月額制であることを機械可読にする（UnitPriceSpecification） */
    unit?: "month";
  };
}) {
  const service: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: opts.name,
    description: opts.description,
    url: opts.url,
    provider: { "@type": "Organization", name: SITE.name, url: SITE.url },
    areaServed: "JP",
  };
  if (opts.serviceType) service.serviceType = opts.serviceType;
  if (opts.offer) {
    const { priceText, minPrice, maxPrice, unit } = opts.offer;
    const offer: Record<string, unknown> = {
      "@type": "Offer",
      priceCurrency: "JPY",
    };
    // 開始価格をスカラーの price にも入れ、「価格未検出」と判定されないようにする
    if (minPrice != null) offer.price = minPrice;
    // priceText は「初回◯＋月額◯」など複合価格の補足としても使う
    if (priceText) offer.description = priceText;
    if (minPrice != null) {
      offer.priceSpecification = {
        // 月額制は UnitPriceSpecification + 月単位（MON）で表現し、総額との取り違えを防ぐ
        "@type":
          unit === "month" ? "UnitPriceSpecification" : "PriceSpecification",
        priceCurrency: "JPY",
        minPrice,
        ...(maxPrice != null ? { maxPrice } : {}),
        ...(unit === "month" ? { unitCode: "MON", unitText: "月" } : {}),
      };
    }
    service.offers = offer;
  }
  return service;
}

/** NoLogic（SoftwareApplication）— ノーコードゲーム制作プラットフォーム */
export function nologicAppSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "NoLogic",
    applicationCategory: "GameApplication",
    operatingSystem: "Web",
    url: "https://nologic.app",
    description:
      "プログラミング不要で、手持ちのイラスト1枚からブラウザで遊べるオリジナルゲームを制作できるノーコードゲーム制作プラットフォーム。作ったゲームはSNSでシェア・公開できる。",
    publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
    inLanguage: "ja",
  };
}

/** サイト情報（WebSite）— 全ページで出力 */
export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    inLanguage: "ja",
    publisher: { "@type": "Organization", name: SITE.name },
  };
}

/** ニュース記事（NewsArticle）— 記事ページで出力 */
export function newsArticleSchema(item: NewsItem, pageUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: item.title,
    description: item.excerpt,
    datePublished: toISODate(item.date),
    dateModified: toISODate(item.updated ?? item.date),
    image: [SITE.ogImage],
    author: { "@type": "Organization", name: SITE.name, url: SITE.url },
    publisher,
    mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
  };
}

/** コラム記事（BlogPosting）— /column の記事ページで出力 */
export function blogPostingSchema(opts: {
  title: string;
  description: string;
  url: string;
  /** ISO 8601（"2026-06-21"） */
  datePublished: string;
  /** ISO 8601。未指定時は datePublished と同じ */
  dateModified?: string;
  /** 記事のアイキャッチ画像URL。未指定時は共通OGP */
  image?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: opts.title,
    description: opts.description,
    datePublished: opts.datePublished,
    dateModified: opts.dateModified ?? opts.datePublished,
    image: [opts.image ?? SITE.ogImage],
    author: { "@type": "Organization", name: SITE.name, url: SITE.url },
    publisher,
    mainEntityOfPage: { "@type": "WebPage", "@id": opts.url },
    inLanguage: "ja",
  };
}

/** パンくずリスト（BreadcrumbList） */
export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/** よくある質問（FAQPage）— TechPlantStudio で出力 */
export function faqSchema(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}
