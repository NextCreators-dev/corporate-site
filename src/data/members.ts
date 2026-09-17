// メンバーデータ定義
// 正は本ファイル。techplantstudio.astro と business-game.astro の両方から参照する。
// desc は HTML 文字列（set:html で描画する）ため、編集時はタグの閉じ忘れに注意。

export interface Member {
  /** 氏名・ハンドルネーム */
  name: string;
  /** 役割表記（「エンジニア」等を略さず記載する） */
  role: string;
  /** 自己紹介文（HTML 文字列） */
  desc: string;
  /** 代表かどうか */
  isRepresentative: boolean;
  /** アバター画像パス（/public 配下の相対パス） */
  avatar: string;
}

export const members: Member[] = [
  { name: "山縣 帆高", role: "Webエンジニア / 映像クリエイター", desc: "Webサイトやアプリの企画・要件定義からデザイン・開発、映像制作まで担当。現在はNoLogicの開発手法をもとに、AI活用コンサルも担当。", isRepresentative: true ,avatar: "/members/hoppy.png"},
  { name: "リロル", role: "ゲームエンジニア / CGモデラー / イラストレーター", desc: `元ゲーム会社所属。「ゲームを全て自分で作りたい」という思いから、イラスト作成、アセット制作、CGモデル制作、Unityでのゲームプログラミングを担当。pixel artによるゲーム背景やデフォルメの3Dアバターの作成が得意。<br/><a href="https://creatorpot.booth.pm/" target="_blank" class="text-emerald-400 underline">BOOTH</a><br><a href="https://skima.jp/profile?id=43669"  target="_blank" class="text-emerald-400
  underline">SKIMA</a>`, isRepresentative: false ,avatar: "/members/riroru.png"},
  { name: "nakachoco", role: "音楽家 / Webエンジニア", desc: `NoLogicで使用しているBGMの制作を担当。EDMからボーカロイド楽曲、編曲までマルチに作成できる音楽家。個人の開発経験を活かし、社内の作業自動化も担当。<br/><a href="https://skeb.jp/@nakachoco" target="_blank" class="text-emerald-400 underline">Skeb</a>`, isRepresentative: false ,avatar: "/members/nakahcoco.png"},
  { name: "佐藤 諒", role: "コミュニティ運営・ライター", desc: "個人で文章創作を行なっていた経験から、シナリオ制作やwebライティングを担当。また、全国最大規模の高専コミュニティの運営補助経験を活かし、クリエイターコミュニティの運営も担当。", isRepresentative: false ,avatar: "/members/uyo.png"},
  { name: "坂部 凌央", role: "映像クリエイター", desc: "代表と一緒に学生時代にボーカロイドライブを作った経験から、MVを中心とした映像制作を担当。", isRepresentative: false ,avatar: "/members/ryou.png"},
  { name: "Xia0", role: "イラストレーター / CGモデラー", desc: `デジタルハリウッド大阪にて、ジェネラリストとしてモデリングやゲームエンジン、デザイン基礎などを学ぶ。現在は室内を中心とした背景モデリングや、漫画、人物イラスト等を制作。経年劣化など質感や使用感にこだわりがある。<br/><a href="https://www.foriio.com/works/1890759" target="_blank" class="text-emerald-400 underline">portfolio</a><br/><a href="https://x.com/Xia0_0x0" target="_blank" class="text-emerald-400 underline">SNS(Twitter)</a>`, isRepresentative: false ,avatar: "/members/xia0.jpg"},];

