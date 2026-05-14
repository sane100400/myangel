-- ============================================================
-- Discover (커뮤니티 공유 이미지) — JSON 파일 기반 → Postgres
-- ============================================================
-- 이전: content/shared-images.json (단일 파일, race condition 위험)
-- 이후: 정규 Postgres 테이블 + RLS + 작성자 attribution 스냅샷

CREATE TABLE IF NOT EXISTS discover_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,            -- Supabase Storage 'shared-images' 버킷 내 경로 (예: '<user_id>/<id>.webp')
  thumb_path  TEXT,                      -- 썸네일 storage 경로 (선택)
  title       TEXT NOT NULL DEFAULT '',
  prompt      TEXT NOT NULL DEFAULT '',
  user_name   TEXT,                      -- 표시용 이름 스냅샷 (공유 시점)
  user_avatar TEXT,                      -- 표시용 아바타 URL 스냅샷
  ip_hash     TEXT,                      -- rate limit용 (해시)
  file_size   INT NOT NULL DEFAULT 0,
  width       INT,
  height      INT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS discover_images_created_idx
  ON discover_images(created_at DESC);
CREATE INDEX IF NOT EXISTS discover_images_user_idx
  ON discover_images(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS discover_images_iphash_day_idx
  ON discover_images(ip_hash, created_at);

-- ============================================================
-- RLS — 누구나 조회, 본인만 삭제/수정
-- ============================================================
ALTER TABLE discover_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "discover_images_select_all"
  ON discover_images FOR SELECT
  USING (true);

CREATE POLICY "discover_images_insert_self"
  ON discover_images FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "discover_images_update_self"
  ON discover_images FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "discover_images_delete_self"
  ON discover_images FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- Storage 버킷: shared-images (public read)
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'shared-images',
  'shared-images',
  true,
  10 * 1024 * 1024,  -- 10MB per file
  ARRAY['image/webp','image/png','image/jpeg']
)
ON CONFLICT (id) DO NOTHING;

-- shared-images 버킷 접근 정책
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
