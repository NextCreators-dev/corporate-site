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
