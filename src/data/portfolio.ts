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
}

export const portfolioItems: PortfolioItem[] = [
  {
    title: "NoLogic",
    category: "product",
    categoryLabel: "自社プロダクト",
    status: "beta",
    statusLabel: "β版運用中",
    description:
      "ノーコードゲーム制作プラットフォーム。イラスト1枚からオリジナルゲームを生成。IPA未踏IT人材発掘・育成事業採択プロジェクト。",
    techStack: ["TypeScript", "React", "Node.js", "WebSocket"],
    image: "/portfolio/nologic.png",
    url: "https://nologic.app",
    metrics: ["ゲーム投稿 200件超", "サービス来訪者 400名超"],
    featured: true,
  },
  {
    title: "コーポレートサイト",
    category: "product",
    categoryLabel: "自社プロダクト",
    status: "released",
    statusLabel: "運用中",
    description:
      "株式会社クリエイターのうえきばちのコーポレートサイト。ダークテーマのモダンなデザインとパフォーマンスを両立。",
    techStack: ["Astro", "Tailwind CSS", "TypeScript"],
    image: "/portfolio/corporate-site.png",
    url: "https://creatorpot.net",
  },

  // クライアントワークの追加例:
  // {
  //   title: "案件名",
  //   category: "client",
  //   categoryLabel: "クライアントワーク",
  //   status: "released",
  //   statusLabel: "納品済み",
  //   description: "案件の概要を2-3行で記載",
  //   techStack: ["使用技術1", "使用技術2"],
  //   image: "/portfolio/project-name.png",
  //   url: "https://example.com",
  //   metrics: ["成果指標"],
  // },
];
