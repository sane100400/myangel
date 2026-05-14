-- ============================================================
-- 에러 로그: 클라이언트·서버 오류 자동 수집
-- ============================================================

CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  kind TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'error',
  message TEXT NOT NULL,
  stack TEXT,
  url TEXT,
  user_agent TEXT,
  meta JSONB,
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS error_logs_created_idx ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS error_logs_user_idx ON error_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS error_logs_kind_idx ON error_logs(kind, created_at DESC);

ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "error_logs_select_self" ON error_logs;
CREATE POLICY "error_logs_select_self"
  ON error_logs FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT는 서버의 service-role 클라이언트가 RLS를 우회해서 수행한다.
