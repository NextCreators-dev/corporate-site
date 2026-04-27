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
    title: "Comoreviアプリ・LP実装",
    category: "client",
    categoryLabel: "クライアントワーク",
    status: "released",
    statusLabel: "開発中",
    description:
      "児童発達支援・放課後等デイサービスの記録・勤怠・請求をクラウドで一元管理するアプリ。株式会社コモングランズと共同開発。",
    techStack: ["Next.js", "TypeScript", "GAS"],
    image: "/portfolio/comorevi.png",
    url: "https://comorevi.net/",
  },
  {
    title: "STARTUP OASIS 1周年記念イベント出展",
    category: "community",
    categoryLabel: "イベント出展",
    description:
      "渋谷のコワーキングスペース「SHIBUYA STARTUP OASIS」の1周年記念イベントに出展。テンプレート基盤を使用したオリジナルゲームを開発しました。",
    techStack: ["Unity", "C#"],
    image: "/portfolio/oasis.png",
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
  },
];
