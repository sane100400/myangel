-- ============================================================
-- MyAngel - 이미지 생성·편집·공유 플랫폼 DB 스키마
-- ============================================================

-- ============================================================
-- 크레딧 시스템
-- ============================================================

CREATE TABLE IF NOT EXISTS user_credits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INT NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS credit_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delta INT NOT NULL,
  reason TEXT NOT NULL,
  ref_id TEXT,
  meta JSONB,
  idempotency_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS credit_ledger_user_idx
  ON credit_ledger(user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS credit_ledger_idempotency_uniq
  ON credit_ledger(user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS pricing_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO pricing_config (key, value) VALUES
  ('generate_quality_cost', '{"1K": 1, "2K": 3, "4K": 6}'::jsonb),
  ('edit_base_cost',        '{"1K": 2, "2K": 4, "4K": 7}'::jsonb),
  ('signup_bonus',          '100'::jsonb),
  ('max_count',             '4'::jsonb)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_credits_select_self" ON user_credits;
CREATE POLICY "user_credits_select_self"
  ON user_credits FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "credit_ledger_select_self" ON credit_ledger;
CREATE POLICY "credit_ledger_select_self"
  ON credit_ledger FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "pricing_config_select_all" ON pricing_config;
CREATE POLICY "pricing_config_select_all"
  ON pricing_config FOR SELECT
  USING (true);

DROP FUNCTION IF EXISTS deduct_credits(UUID, INT, TEXT, JSONB);

CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id UUID,
  p_cost INT,
  p_reason TEXT,
  p_meta JSONB DEFAULT '{}'::jsonb,
  p_idempotency_key TEXT DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance INT;
  v_ledger_id UUID;
  v_existing_id UUID;
BEGIN
  IF p_cost <= 0 THEN
    RAISE EXCEPTION 'cost must be positive';
  END IF;

  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_existing_id
    FROM credit_ledger
    WHERE user_id = p_user_id AND idempotency_key = p_idempotency_key
    LIMIT 1;
    IF v_existing_id IS NOT NULL THEN
      RETURN v_existing_id;
    END IF;
  END IF;

  INSERT INTO user_credits (user_id, balance) VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT balance INTO v_balance FROM user_credits WHERE user_id = p_user_id FOR UPDATE;

  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_existing_id
    FROM credit_ledger
    WHERE user_id = p_user_id AND idempotency_key = p_idempotency_key
    LIMIT 1;
    IF v_existing_id IS NOT NULL THEN
      RETURN v_existing_id;
    END IF;
  END IF;

  IF v_balance < p_cost THEN
    RETURN NULL;
  END IF;

  UPDATE user_credits
  SET balance = balance - p_cost, updated_at = now()
  WHERE user_id = p_user_id;

  INSERT INTO credit_ledger (user_id, delta, reason, meta, idempotency_key)
  VALUES (p_user_id, -p_cost, p_reason, p_meta, p_idempotency_key)
  RETURNING id INTO v_ledger_id;

  RETURN v_ledger_id;
EXCEPTION WHEN unique_violation THEN
  SELECT id INTO v_existing_id
  FROM credit_ledger
  WHERE user_id = p_user_id AND idempotency_key = p_idempotency_key
  LIMIT 1;
  RETURN v_existing_id;
END;
$$;

CREATE OR REPLACE FUNCTION refund_credits(
  p_ledger_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID;
  v_delta INT;
  v_already INT;
BEGIN
  SELECT user_id, delta INTO v_user, v_delta FROM credit_ledger WHERE id = p_ledger_id;
  IF v_user IS NULL OR v_delta >= 0 THEN
    RETURN FALSE;
  END IF;

  SELECT COUNT(*) INTO v_already FROM credit_ledger WHERE ref_id = p_ledger_id::text AND reason = 'refund';
  IF v_already > 0 THEN
    RETURN FALSE;
  END IF;

  UPDATE user_credits
  SET balance = balance + (-v_delta), updated_at = now()
  WHERE user_id = v_user;

  INSERT INTO credit_ledger (user_id, delta, reason, ref_id)
  VALUES (v_user, -v_delta, 'refund', p_ledger_id::text);

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION grant_signup_bonus()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bonus INT;
BEGIN
  SELECT (value #>> '{}')::int INTO v_bonus FROM pricing_config WHERE key = 'signup_bonus';
  IF v_bonus IS NULL THEN v_bonus := 30; END IF;

  INSERT INTO user_credits (user_id, balance) VALUES (NEW.id, v_bonus)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO credit_ledger (user_id, delta, reason)
  VALUES (NEW.id, v_bonus, 'signup_bonus');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_grant_bonus ON auth.users;
CREATE TRIGGER on_auth_user_created_grant_bonus
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION grant_signup_bonus();

REVOKE ALL ON FUNCTION deduct_credits(UUID, INT, TEXT, JSONB, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION deduct_credits(UUID, INT, TEXT, JSONB, TEXT) TO service_role;
REVOKE ALL ON FUNCTION refund_credits(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION refund_credits(UUID) TO service_role;

-- ============================================================
-- 사용자 생성·편집 이미지 저장
-- ============================================================

CREATE TABLE IF NOT EXISTS user_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image TEXT,
  storage_path TEXT,
  prompt TEXT,
  source TEXT NOT NULL DEFAULT 'generate' CHECK (source IN ('generate','edit')),
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_generations_user_idx
  ON user_generations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS user_generations_storage_path_idx
  ON user_generations(storage_path)
  WHERE storage_path IS NOT NULL;

ALTER TABLE user_generations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_generations_select_self" ON user_generations;
CREATE POLICY "user_generations_select_self"
  ON user_generations FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_generations_insert_self" ON user_generations;
CREATE POLICY "user_generations_insert_self"
  ON user_generations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_generations_delete_self" ON user_generations;
CREATE POLICY "user_generations_delete_self"
  ON user_generations FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- Discover 공유 이미지
-- ============================================================

CREATE TABLE IF NOT EXISTS discover_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,
  thumb_path TEXT,
  title TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  prompt TEXT NOT NULL DEFAULT '',
  user_name TEXT,
  user_avatar TEXT,
  ip_hash TEXT,
  file_size INT NOT NULL DEFAULT 0,
  width INT,
  height INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS discover_images_created_idx
  ON discover_images(created_at DESC);
CREATE INDEX IF NOT EXISTS discover_images_user_idx
  ON discover_images(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS discover_images_iphash_day_idx
  ON discover_images(ip_hash, created_at);

ALTER TABLE discover_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "discover_images_select_all" ON discover_images;
CREATE POLICY "discover_images_select_all"
  ON discover_images FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "discover_images_insert_self" ON discover_images;
CREATE POLICY "discover_images_insert_self"
  ON discover_images FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "discover_images_update_self" ON discover_images;
CREATE POLICY "discover_images_update_self"
  ON discover_images FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "discover_images_delete_self" ON discover_images;
CREATE POLICY "discover_images_delete_self"
  ON discover_images FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 에러 로그
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

-- ============================================================
-- Storage 버킷과 object 정책
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'shared-images',
  'shared-images',
  true,
  10 * 1024 * 1024,
  ARRAY['image/webp','image/png','image/jpeg']
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-generations',
  'user-generations',
  false,
  20 * 1024 * 1024,
  ARRAY['image/webp','image/png','image/jpeg']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "shared_images_public_read" ON storage.objects;
CREATE POLICY "shared_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'shared-images');

DROP POLICY IF EXISTS "shared_images_authenticated_insert" ON storage.objects;
CREATE POLICY "shared_images_authenticated_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'shared-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "shared_images_owner_delete" ON storage.objects;
CREATE POLICY "shared_images_owner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'shared-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "user_generations_owner_select" ON storage.objects;
CREATE POLICY "user_generations_owner_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'user-generations'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "user_generations_owner_insert" ON storage.objects;
CREATE POLICY "user_generations_owner_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'user-generations'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "user_generations_owner_delete" ON storage.objects;
CREATE POLICY "user_generations_owner_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'user-generations'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
