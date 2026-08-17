CREATE TABLE IF NOT EXISTS contacts (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  company VARCHAR(100) NOT NULL DEFAULT '',
  category VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  budget VARCHAR(50) NOT NULL DEFAULT '',
  is_spam BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS contacts_created_at_idx ON contacts (created_at DESC);
CREATE INDEX IF NOT EXISTS contacts_email_idx ON contacts (email);

-- RLS 有効化（サービスロールキーはバイパスする）
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- 疎通確認（keepalive）
-- Free プランは7日間ユーザー由来のDBアクティビティがないとプロジェクトが停止するため、
-- GitHub Actions から1日1回この行を更新して非アクティブ判定をリセットする。
-- 1行だけを使い回すのでDB容量は増えない。
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS keepalive (
  id SMALLINT PRIMARY KEY DEFAULT 1,
  last_ping_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  prev_ping_at TIMESTAMPTZ,
  ping_count BIGINT NOT NULL DEFAULT 0,
  CONSTRAINT keepalive_single_row CHECK (id = 1)
);

-- ポリシーを作らないため、anon キーでのテーブル直接アクセスはできない
ALTER TABLE keepalive ENABLE ROW LEVEL SECURITY;

INSERT INTO keepalive (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- keepalive の1行を更新し、前回・今回のping時刻と累計回数を返す。
-- SECURITY DEFINER にすることで、anon キーからはこの関数経由でしか keepalive を触れない。
CREATE OR REPLACE FUNCTION public.keepalive_ping()
RETURNS TABLE (prev_ping TIMESTAMPTZ, current_ping TIMESTAMPTZ, total_pings BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.keepalive AS k
     SET prev_ping_at = k.last_ping_at,
         last_ping_at = NOW(),
         ping_count   = k.ping_count + 1
   WHERE k.id = 1
  RETURNING k.prev_ping_at, k.last_ping_at, k.ping_count;
END;
$$;

REVOKE ALL ON FUNCTION public.keepalive_ping() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.keepalive_ping() TO anon;
