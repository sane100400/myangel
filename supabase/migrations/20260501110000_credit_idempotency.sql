-- ============================================================
-- 크레딧 차감 idempotency
-- ============================================================
-- 동일 (user_id, idempotency_key)로 두 번 호출되면 두 번째는 첫 번째 ledger_id를 그대로 반환.
-- 네트워크 retry / double-click / proxy 재시도로 인한 이중 차감 방지.

ALTER TABLE credit_ledger ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- 같은 user + 같은 key는 단 1행 — 부분 unique index (NULL은 unique 제약 받지 않음)
CREATE UNIQUE INDEX IF NOT EXISTS credit_ledger_idempotency_uniq
  ON credit_ledger(user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

DROP FUNCTION IF EXISTS deduct_credits(UUID, INT, TEXT, JSONB);

-- ── deduct_credits RPC: idempotency_key 인자 추가 ──
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

  -- (1) Idempotency: 같은 (user, key)로 이미 있으면 그대로 반환 — 차감 안 함
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_existing_id
    FROM credit_ledger
    WHERE user_id = p_user_id AND idempotency_key = p_idempotency_key
    LIMIT 1;
    IF v_existing_id IS NOT NULL THEN
      RETURN v_existing_id;
    END IF;
  END IF;

  -- (2) 신규 유저면 0으로 행 생성
  INSERT INTO user_credits (user_id, balance) VALUES (p_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- (3) 행 잠금 후 동일 키 ledger 재확인.
  -- 같은 user_credits row lock이 같은 사용자의 동시 차감을 직렬화한다.
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

  -- (4) Ledger 삽입 (idempotency_key는 unique index가 race도 막음)
  INSERT INTO credit_ledger (user_id, delta, reason, meta, idempotency_key)
  VALUES (p_user_id, -p_cost, p_reason, p_meta, p_idempotency_key)
  RETURNING id INTO v_ledger_id;

  RETURN v_ledger_id;
EXCEPTION WHEN unique_violation THEN
  -- (1)과 (4) 사이의 race — 다른 트랜잭션이 같은 key로 먼저 삽입함. 그것 반환.
  SELECT id INTO v_existing_id
  FROM credit_ledger
  WHERE user_id = p_user_id AND idempotency_key = p_idempotency_key
  LIMIT 1;
  RETURN v_existing_id;
END;
$$;

REVOKE ALL ON FUNCTION deduct_credits(UUID, INT, TEXT, JSONB, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION deduct_credits(UUID, INT, TEXT, JSONB, TEXT) TO service_role;
