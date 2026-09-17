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
export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    alternateName: SITE.alternateName,
    url: SITE.url,
    logo: SITE.logo,
    description: SITE.description,
    foundingDate: SITE.foundingDate,
    sameAs: SITE.sameAs,
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
    dateModified: toISODate(item.date),
    image: [SITE.ogImage],
    author: { "@type": "Organization", name: SITE.name, url: SITE.url },
    publisher,
    mainEntityOfPage: { "@type": "WebPage", "@id": pageUrl },
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

/** 提供サービス（Service）— サービス LP で出力
 *  offers には価格そのものではなく価格レンジ（下限〜上限）を入れる。
 *  掲載金額は「〜」付きの下限表記なので、上限は書かず lowPrice のみを与える。
 *  lowPrice を省いたプラン（「要相談」など）は、機械可読な価格を出さない。 */
export function serviceSchema(params: {
  name: string;
  description: string;
  serviceType: string;
  url: string;
  /** プラン名と下限価格（円）の組。lowPrice 省略時は価格を出力しない */
  offers: { name: string; lowPrice?: number; description: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: params.name,
    description: params.description,
    serviceType: params.serviceType,
    url: params.url,
    provider: {
      "@type": "Organization",
      name: SITE.name,
      url: SITE.url,
    },
    areaServed: { "@type": "Country", name: "日本" },
    offers: params.offers.map((offer) => ({
      "@type": "Offer",
      name: offer.name,
      description: offer.description,
      ...(offer.lowPrice === undefined
        ? {}
        : {
            priceCurrency: "JPY",
            priceSpecification: {
              "@type": "PriceSpecification",
              priceCurrency: "JPY",
              minPrice: offer.lowPrice,
            },
          }),
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
