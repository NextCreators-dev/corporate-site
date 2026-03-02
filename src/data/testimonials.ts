// テスティモニアルデータ定義
// 新しい声を追加するには、testimonials 配列にオブジェクトを追加するだけでOK
// 注意: プレースホルダーは必ず実際の声に差し替えてからリリースすること

export interface Testimonial {
  /** 引用文（2-3文） */
  quote: string;
  /** 氏名またはハンドルネーム */
  name: string;
  /** 肩書き・属性 */
  role: string;
  /** アバター画像パス（/public 配下の相対パス） */
  avatar?: string;
  /** 出典区分 */
  source: "community" | "client";
}

// テスティモニアルが0件の場合、セクション自体を非表示にする
// ⚠️ 仮データ: リリース前に必ず実際の声に差し替えること
export const testimonials: Testimonial[] = [

];
