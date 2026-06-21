// 日程調整リンク（要件定義 §3-3 / §5-2 / §7-1）
// メインCTA = 日程調整リンク。フォーム往復を殺し、その場で日程を確定させる。
//
// ⚠️ 現状はすべてプレースホルダ（実ツール未契約）。
//   - §7-1 TODO: Spir / TimeRex 等を契約後、担当別の予約枠URLに差し替える。
//   - Netlify等の環境変数（PUBLIC_SCHEDULE_URL_CREATOR / PUBLIC_SCHEDULE_URL_RYOIKU）で
//     コードを触らずに本番URLへ差し替え可能。
//   - 未設定時のフォールバックは既存のお問い合わせフォーム（/techplantstudio#contact）。
//     リンク切れを避けつつ、暫定の受け皿として機能させる。

/** 日程調整ツール未設定時の暫定リンク先（既存のお問い合わせフォーム） */
const SCHEDULE_PLACEHOLDER = "/techplantstudio#contact";

/**
 * 担当別の予約枠URL。
 * 一次対応の振り分け（§3-3）をリンクレベルで実現する。
 * クロージング・初回同席は山縣（裏側運用）。
 */
export const SCHEDULING_LINKS = {
  /** クリエイター系（①コミュニティ運営代行 / ②リアルイベントパック）一次対応: 佐藤 */
  creator:
    import.meta.env.PUBLIC_SCHEDULE_URL_CREATOR ?? SCHEDULE_PLACEHOLDER,
  /** 療育・業務AI化（③）一次対応: 芽以 */
  ryoiku: import.meta.env.PUBLIC_SCHEDULE_URL_RYOIKU ?? SCHEDULE_PLACEHOLDER,
} as const;

/**
 * LP識別子（GA4 schedule_click / UTM campaign に使用 §3-7）。
 * utm_campaign の値とも揃える。
 */
export const LP_IDS = {
  communityOps: "lp_community_ops",
  eventPack: "lp_event_pack",
  ryoiku: "lp_ryoiku",
} as const;
