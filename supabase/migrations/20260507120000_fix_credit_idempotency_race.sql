-- ============================================================
-- 크레딧 idempotency race 보정
-- ============================================================
-- 같은 사용자의 동일 idempotency_key 요청이 동시에 들어오면 user_credits
-- row lock 이후 ledger를 다시 확인해 두 번째 요청이 중복 차감하지 않도록 한다.

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

REVOKE ALL ON FUNCTION deduct_credits(UUID, INT, TEXT, JSONB, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION deduct_credits(UUID, INT, TEXT, JSONB, TEXT) TO service_role;
REVOKE ALL ON FUNCTION refund_credits(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION refund_credits(UUID) TO service_role;
