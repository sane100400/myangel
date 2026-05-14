-- ============================================================
-- user_generations: base64 TEXT → Storage URL 마이그레이션
-- ============================================================
-- 이전: image TEXT 컬럼에 6MB+ data URL 박아넣음 (DB 부풀어짐)
-- 이후: storage_path 컬럼에 'user-generations' 버킷 경로만 저장
-- 기존 행은 image 컬럼 유지(읽기 호환), 신규는 storage_path 사용

ALTER TABLE user_generations
  ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE user_generations
  ALTER COLUMN image DROP NOT NULL;       -- storage_path를 쓰면 image는 null 허용

CREATE INDEX IF NOT EXISTS user_generations_storage_path_idx
  ON user_generations(storage_path)
  WHERE storage_path IS NOT NULL;

-- ============================================================
-- Storage 버킷: user-generations (private, 본인만 접근)
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-generations',
  'user-generations',
  false,
  20 * 1024 * 1024,  -- 20MB per file (4K PNG 수용)
  ARRAY['image/webp','image/png','image/jpeg']
)
ON CONFLICT (id) DO NOTHING;

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
