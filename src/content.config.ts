// コンテンツコレクション定義（Astro 5 Content Layer / glob ローダー）
// コラム（/column）= TOFU 向けの情報記事。検索流入の入口をつくり、関連サービスLPへ橋渡しする。
import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const column = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/column" }),
  schema: z.object({
    /** 記事タイトル（検索意図に合わせた具体的な見出し） */
    title: z.string(),
    /** メタディスクリプション兼リード（120字前後） */
    description: z.string(),
    /** 公開日 */
    publishDate: z.coerce.date(),
    /** 更新日（改稿時に設定。未指定なら公開日を使う） */
    updatedDate: z.coerce.date().optional(),
    /** カテゴリ（一覧のフィルタ表示用） */
    category: z.string(),
    /**
     * 関連サービス。記事末のCTAと内部リンクの誘導先を決める（MOFUハンドオフ）。
     */
    relatedService: z
      .enum([
        "nologic",
        "community-ops",
        "event-pack",
        "ryoiku",
        "techplantstudio",
      ])
      .optional(),
    /** 下書き（true のあいだは一覧・ビルド対象から除外） */
    draft: z.boolean().default(false),
  }),
});

export const collections = { column };
