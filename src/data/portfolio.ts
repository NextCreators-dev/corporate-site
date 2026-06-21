// ポートフォリオデータ定義
// 新しい実績を追加するには、portfolioItems 配列にオブジェクトを追加するだけでOK

export interface PortfolioItem {
  /** プロジェクト名 */
  title: string;
  /** カテゴリ */
  category: "product" | "client" | "community";
  /** カテゴリ表示名（「自社プロダクト」「クライアントワーク」等） */
  categoryLabel: string;
  /** ステータス */
  status?: "released" | "beta" | "development";
  /** ステータス表示名（「β版運用中」「運用中」等） */
  statusLabel?: string;
  /** 概要説明（2-3行） */
  description: string;
  /** 使用技術タグ */
  techStack: string[];
  /** スクリーンショット画像パス（/public 配下の相対パス） */
  image?: string;
  /** 外部リンクURL */
  url?: string;
  /** 実績数値（「ゲーム投稿200件超」等） */
  metrics?: string[];
  /** 注目実績フラグ（trueで全幅表示） */
  featured?: boolean;
  /**
   * 導入事例の詳細（課題→取り組み→成果）。記載があれば /works で詳しく表示する。
   * 数値や顧客コメントは、確認・許諾が取れたものだけを書くこと（創作は不可）。
   */
  caseStudy?: {
    /** クライアント・座組み（例: 児童発達支援事業者） */
    client?: string;
    /** 背景・課題 */
    challenge: string;
    /** 取り組み・私たちの役割 */
    approach: string;
    /** 成果・現状 */
    result: string;
  };
}

export const portfolioItems: PortfolioItem[] = [
  {
    title: "Comoreviアプリ・LP実装",
    category: "client",
    categoryLabel: "クライアントワーク",
    // 表示ラベル「開発中」と整合させるためステータスを development に修正（要件定義 §5-5）
    status: "development",
    statusLabel: "開発中",
    description:
      "児童発達支援・放課後等デイサービスの記録・勤怠・請求をクラウドで一元管理するアプリ。株式会社コモングランズと共同開発。",
    techStack: ["Next.js", "TypeScript", "GAS"],
    image: "/portfolio/comorevi.png",
    url: "https://comorevi.net/",
    caseStudy: {
      client: "株式会社コモングランズ（児童発達支援・放課後等デイサービス領域）",
      challenge:
        "児童発達支援・放課後等デイサービスの現場では、利用者の記録・職員の勤怠・国保連への請求といった管理業務が分散し、転記や確認に手間がかかりやすい状況がありました。",
      approach:
        "記録・勤怠・請求をクラウドで一元管理できるアプリと、紹介用のLPを、企画から設計・開発まで一貫して担当。Next.js・TypeScript・GASで構築しています。",
      result:
        "現在も開発・改善を継続中です。導入後の効果や利用状況は、許諾を得たうえで追記していきます。",
    },
  },
  {
    title: "STARTUP OASIS 1周年記念イベント出展",
    category: "community",
    categoryLabel: "イベント出展",
    description:
      "渋谷のコワーキングスペース「SHIBUYA STARTUP OASIS」の1周年記念イベントに出展。テンプレート基盤を使用したオリジナルゲームを開発しました。",
    techStack: ["Unity", "C#"],
    image: "/portfolio/oasis.png",
    caseStudy: {
      client: "SHIBUYA STARTUP OASIS（渋谷のコワーキングスペース）",
      challenge:
        "1周年記念イベントで、来場者がその場で楽しめるオリジナルの体験コンテンツが必要でした。",
      approach:
        "テンプレート基盤を使い、イベント用のオリジナルゲームをUnity・C#で短期間に制作し、当日出展しました。",
      result: "記念イベントに出展し、来場者にゲーム体験を提供しました。",
    },
  },
  {
    title: "KOSEN GAME JAM 共同運営",
    category: "community",
    categoryLabel: "共同運営",
    description:
      "株式会社高専キャリア研究所、クリエイピア株式会社、株式会社クリエイターのうえきばちの3社で、オンラインのゲーム開発ハッカソンを開催しました。",
    techStack: ["イベント運営", "ゲーム開発支援"],
    image: "/portfolio/game-dev.png",
    url: "https://kosen-career.tech/event/kosengamejam",
    caseStudy: {
      client:
        "高専キャリア研究所・クリエイピア・クリエイターのうえきばち（3社共同）",
      challenge:
        "高専生がオンラインで集まり、ゲーム開発に挑戦できる場が求められていました。",
      approach:
        "3社共同で、オンラインのゲーム開発ハッカソン「KOSEN GAME JAM」を企画・運営しました。",
      result: "ハッカソンを開催し、参加者の作品づくりを支援しました。",
    },
  },
];
