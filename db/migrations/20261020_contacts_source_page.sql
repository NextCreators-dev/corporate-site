-- ------------------------------------------------------------
-- 20261020_contacts_source_page.sql
--
-- 目的（決定 0087）:
--   問い合わせフォームが「どのページから送られたか」を contacts に残す。
--   ページの改修が問い合わせに効いたかを、送信元ページ別に見られるようにする。
--   あわせてフォームの種別を入れ替えた（game-promo / unity / business-game /
--   ai-training / partnership / creative / other / sales）。値は最長13字なので
--   category は VARCHAR(50) のままでよく、この SQL では触らない。
--
-- 流し方:
--   Supabase のダッシュボード → SQL Editor にこのファイルの中身を貼って Run。
--   何度流しても同じ結果になる（IF NOT EXISTS）。既存の行は source_page = '' になる。
--   列を足したあと PostgREST のスキーマキャッシュを読み直させる（最後の NOTIFY）。
--
-- 順番:
--   この SQL → corporate-site のデプロイ、の順が望ましい。逆でも送信は壊れない
--   （netlify/functions/contact.ts は列が無いエラーのときだけ source_page を外して保存し直す）。
--
-- 戻し方:
--   ALTER TABLE public.contacts DROP COLUMN IF EXISTS source_page;
--   NOTIFY pgrst, 'reload schema';
--   （戻すと送信元ページの記録は消える。関数は列が無くても動く）
-- ------------------------------------------------------------

ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS source_page TEXT NOT NULL DEFAULT '';

COMMENT ON COLUMN public.contacts.source_page IS
  '送信元ページのパス（window.location.pathname、200字まで。/ で始まらない値は空）。決定 0087';

NOTIFY pgrst, 'reload schema';
