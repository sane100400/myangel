-- ============================================================
-- 사용자 생성/편집 이미지 저장 (계정 기반, 디바이스 무관)
-- ============================================================

CREATE TABLE IF NOT EXISTS user_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image TEXT NOT NULL,                    -- data: URL (base64) — 추후 Storage URL로 마이그레이션 가능
  prompt TEXT,
  source TEXT NOT NULL DEFAULT 'generate' CHECK (source IN ('generate','edit')),
  meta JSONB,                             -- {model, quality, count, ...}
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_generations_user_idx
  ON user_generations(user_id, created_at DESC);

ALTER TABLE user_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_generations_select_self"
  ON user_generations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_generations_insert_self"
  ON user_generations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_generations_delete_self"
  ON user_generations FOR DELETE
  USING (auth.uid() = user_id);
