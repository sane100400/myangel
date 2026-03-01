-- ============================================================
-- MyAngel - 서브컬쳐 패션 무드 큐레이션 DB 스키마
-- ============================================================

-- 무드 이미지 (큐레이션 + 사용자 업로드)
CREATE TABLE mood_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  image_url TEXT NOT NULL,
  source_url TEXT,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 자유 태그
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  usage_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 무드 이미지 - 태그 연결
CREATE TABLE mood_image_tags (
  mood_image_id UUID REFERENCES mood_images(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (mood_image_id, tag_id)
);

-- AI 분석 결과
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mood_image_id UUID REFERENCES mood_images(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  elements JSONB NOT NULL,
  raw_response TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 추천 아이템
CREATE TABLE recommended_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  item_name TEXT NOT NULL,
  search_keyword TEXT NOT NULL,
  shop_links JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 사용자 보드
CREATE TABLE boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT true,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 보드에 저장된 아이템
CREATE TABLE board_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
  mood_image_id UUID REFERENCES mood_images(id),
  recommended_item_id UUID REFERENCES recommended_items(id),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS (Row Level Security) 정책
ALTER TABLE mood_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_image_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommended_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_items ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 무드 이미지를 조회할 수 있음
CREATE POLICY "mood_images_select" ON mood_images FOR SELECT USING (true);
CREATE POLICY "mood_images_insert" ON mood_images FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- 태그는 모두 조회 가능, 누구나 생성 가능
CREATE POLICY "tags_select" ON tags FOR SELECT USING (true);
CREATE POLICY "tags_insert" ON tags FOR INSERT WITH CHECK (true);

-- 태그 연결은 모두 조회 가능
CREATE POLICY "mood_image_tags_select" ON mood_image_tags FOR SELECT USING (true);
CREATE POLICY "mood_image_tags_insert" ON mood_image_tags FOR INSERT WITH CHECK (true);

-- 분석 결과는 모두 조회 가능, 본인만 생성
CREATE POLICY "analyses_select" ON analyses FOR SELECT USING (true);
CREATE POLICY "analyses_insert" ON analyses FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- 추천 아이템은 모두 조회 가능
CREATE POLICY "recommended_items_select" ON recommended_items FOR SELECT USING (true);
CREATE POLICY "recommended_items_insert" ON recommended_items FOR INSERT WITH CHECK (true);

-- 보드는 공개 보드는 모두 조회, 비공개는 본인만
CREATE POLICY "boards_select" ON boards FOR SELECT USING (is_public OR auth.uid() = user_id);
CREATE POLICY "boards_insert" ON boards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "boards_update" ON boards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "boards_delete" ON boards FOR DELETE USING (auth.uid() = user_id);

-- 보드 아이템
CREATE POLICY "board_items_select" ON board_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM boards WHERE boards.id = board_items.board_id AND (boards.is_public OR auth.uid() = boards.user_id))
);
CREATE POLICY "board_items_insert" ON board_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM boards WHERE boards.id = board_items.board_id AND auth.uid() = boards.user_id)
);
CREATE POLICY "board_items_delete" ON board_items FOR DELETE USING (
  EXISTS (SELECT 1 FROM boards WHERE boards.id = board_items.board_id AND auth.uid() = boards.user_id)
);
