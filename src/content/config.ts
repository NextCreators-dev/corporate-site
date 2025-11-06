import { defineCollection, z } from 'astro:content';

const newsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedAt: z.date(),
    tags: z.array(z.string()).default([]),
    image: z.string().optional(),
    author: z.string().default('株式会社クリエイターのうえきばち'),
  }),
});

export const collections = {
  news: newsCollection,
};
