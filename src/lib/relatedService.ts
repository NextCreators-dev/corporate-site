// コラム記事の「関連サービス」→ CTA（誘導先と文言）の対応表。
// 記事末から該当サービスLP／プロダクトへ橋渡しする（TOFU→MOFUハンドオフ）。

export interface RelatedServiceCta {
  /** ボタン文言 */
  label: string;
  /** 遷移先URL */
  href: string;
  /** 外部リンク（別タブ）か */
  external: boolean;
  /** 補足文 */
  note: string;
}

export const RELATED_SERVICE: Record<string, RelatedServiceCta> = {
  nologic: {
    label: "NoLogicでゲームを作ってみる",
    href: "https://nologic.app/?utm_source=creatorpot&utm_medium=referral&utm_campaign=column&utm_content=article_cta",
    external: true,
    note: "プログラミング不要。イラスト1枚から、ブラウザで遊べるゲームをつくれます。",
  },
  "community-ops": {
    label: "公式コミュニティ運営代行を見る",
    href: "/community-ops",
    external: false,
    note: "公式Discordの構築から日々の運営まで、まるごと代行します。",
  },
  "event-pack": {
    label: "リアルイベント制作パックを見る",
    href: "/event-pack",
    external: false,
    note: "企画から映像まで、リアルイベントを丸ごと一括で制作します。",
  },
  ryoiku: {
    label: "療育・業務AI化支援を見る",
    href: "/techplantstudio/ryoiku",
    external: false,
    note: "児童発達支援・放課後等デイサービスの業務を、1業務から無理なくAI化します。",
  },
  techplantstudio: {
    label: "受託開発（TechPlant Studio）を見る",
    href: "/techplantstudio",
    external: false,
    note: "ゲーム・Webアプリ・AIを、企画から納品・運用まで伴走します。",
  },
};
