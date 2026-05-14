-- ============================================================
-- 크레딧 시스템
-- ============================================================

-- 사용자 잔액 (1행/유저)
CREATE TABLE IF NOT EXISTS user_credits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INT NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 크레딧 거래 원장 (감사·환불용)
CREATE TABLE IF NOT EXISTS credit_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delta INT NOT NULL,                           -- 음수=차감, 양수=증감
  reason TEXT NOT NULL,                         -- 'generate', 'edit', 'refund', 'signup_bonus', 'daily_grant', 'admin'
  ref_id TEXT,                                  -- 차감↔환불 매칭용 (보통 ledger row id)
  meta JSONB,                                   -- {quality, count, ...}
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS credit_ledger_user_idx ON credit_ledger(user_id, created_at DESC);

-- 단가/설정 (코드 수정 없이 운영자가 조절)
CREATE TABLE IF NOT EXISTS pricing_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 기본 단가 시드
INSERT INTO pricing_config (key, value) VALUES
  ('generate_quality_cost', '{"1K": 1, "2K": 3, "4K": 6}'::jsonb),
  ('edit_base_cost',        '{"1K": 2, "2K": 4, "4K": 7}'::jsonb),
  ('signup_bonus',          '100'::jsonb),
  ('max_count',             '4'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- RLS
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_credits_select_self" ON user_credits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "credit_ledger_select_self" ON credit_ledger FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "pricing_config_select_all" ON pricing_config FOR SELECT USING (true);
-- 쓰기는 RPC(SECURITY DEFINER)로만 일어나므로 INSERT/UPDATE 정책은 두지 않음

-- ── 차감 RPC: 잔액 부족 시 NULL 반환, 성공 시 ledger row id 반환 ──
CREATE OR REPLACE FUNCTION deduct_credits(
  p_user_id UUID,
  p_cost INT,
  p_reason TEXT,
  p_meta JSONB DEFAULT '{}'::jsonb
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance INT;
  v_ledger_id UUID;
BEGIN
  IF p_cost <= 0 THEN
    RAISE EXCEPTION 'cost must be positive';
  END IF;

  -- 신규 유저면 0으로 행 생성
  INSERT INTO user_credits (user_id, balance) VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- 행 잠금 후 잔액 확인
  SELECT balance INTO v_balance FROM user_credits WHERE user_id = p_user_id FOR UPDATE;
  IF v_balance < p_cost THEN
    RETURN NULL;
  END IF;

  UPDATE user_credits
  SET balance = balance - p_cost, updated_at = now()
  WHERE user_id = p_user_id;

  INSERT INTO credit_ledger (user_id, delta, reason, meta)
  VALUES (p_user_id, -p_cost, p_reason, p_meta)
  RETURNING id INTO v_ledger_id;

  RETURN v_ledger_id;
END;
$$;

-- ── 환불 RPC ──
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

  -- 중복 환불 방지
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

-- ── 가입 보너스: 새 유저 생성 시 자동 충전 ──
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

REVOKE ALL ON FUNCTION deduct_credits(UUID, INT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION deduct_credits(UUID, INT, TEXT, JSONB) TO service_role;
REVOKE ALL ON FUNCTION refund_credits(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION refund_credits(UUID) TO service_role;

-- 기존 유저 보너스 백필 (마이그레이션 시점에 한 번)
INSERT INTO user_credits (user_id, balance)
SELECT id, 100 FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO credit_ledger (user_id, delta, reason)
SELECT id, 100, 'signup_bonus_backfill' FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM credit_ledger
  WHERE user_id = auth.users.id AND reason IN ('signup_bonus','signup_bonus_backfill')
);
