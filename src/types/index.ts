// ============================================================
// Database Types
// ============================================================

export interface MoodImage {
  id: string;
  user_id: string | null;
  image_url: string;
  source_url: string | null;
  title: string | null;
  created_at: string;
  tags?: Tag[];
}

export interface Tag {
  id: string;
  name: string;
  usage_count: number;
  created_at: string;
}

export interface MoodImageTag {
  mood_image_id: string;
  tag_id: string;
}

export interface Analysis {
  id: string;
  mood_image_id: string;
  user_id: string | null;
  elements: AnalysisElements;
  raw_response: string | null;
  created_at: string;
  recommended_items?: RecommendedItem[];
}

export interface AnalysisElements {
  materials: string[];
  silhouettes: string[];
  details: string[];
  colors: string[];
  mood: string[];
  overall_style: string;
}

export interface RecommendedItem {
  id: string;
  analysis_id: string;
  category: string;
  item_name: string;
  search_keyword: string;
  shop_links: ShopLinks | null;
  created_at: string;
}

export interface ShopLinks {
  naver: string;
  musinsa: string;
  zigzag: string;
  ably: string;
}

export interface Board {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface BoardItem {
  id: string;
  board_id: string;
  mood_image_id: string | null;
  recommended_item_id: string | null;
  sort_order: number;
  created_at: string;
  mood_image?: MoodImage;
  recommended_item?: RecommendedItem;
}

// ============================================================
// API Types
// ============================================================

export interface AnalyzeRequest {
  image_url: string;
  tags?: string[];
}

export interface AnalyzeResponse {
  analysis: Analysis;
  recommended_items: RecommendedItem[];
}

export type ItemCategory =
  | "상의"
  | "하의"
  | "원피스"
  | "아우터"
  | "신발"
  | "가방"
  | "액세서리"
  | "헤어소품";
