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
  elements: Record<string, unknown>;
  raw_response: string | null;
  created_at: string;
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
}

// ============================================================
// Image Generation Types
// ============================================================

export interface GeneratedImage {
  id: string;
  user_id: string | null;
  prompt: string;
  style: string | null;
  image_url: string;
  is_public: boolean;
  created_at: string;
}

export interface GenerateRequest {
  prompt: string;
  enhancedPromptEn?: string;
  premium?: boolean;
  referenceImages?: { base64: string; mimeType: string }[];
}

// ============================================================
// Scene Object System (프롬프트 최적화)
// ============================================================

export type ObjectRole =
  | "subject"
  | "background"
  | "mood"
  | "lighting"
  | "color"
  | "texture"
  | "composition"
  | "custom";

export type AttributeCategory =
  | "style"
  | "texture"
  | "color"
  | "lighting"
  | "mood"
  | "detail";

export interface ObjectAttribute {
  id: string;
  name: string;        // Korean display name (e.g. "사실감", "몽환도")
  nameEn: string;      // English equivalent for prompt
  value: number;        // 0-100 intensity
  category: AttributeCategory;
}

export interface SceneObject {
  id: string;
  role: ObjectRole;
  label: string;        // Korean display name (e.g. "피사체", "배경")
  description: string;  // User's original text for this element
  attributes: ObjectAttribute[];
}

// ============================================================
// Prompt Enhancement Types
// ============================================================

export interface EnhancementSuggestion {
  id: string;
  text: string;         // Suggested replacement (Korean)
  textEn: string;       // English equivalent
  confidence: number;   // 0-1
  reasoning: string;    // Brief explanation
}

export interface WeakSpan {
  start: number;
  end: number;
  text: string;         // The weak/abstract expression
  reason: string;       // Why it's weak (Korean)
  alternatives: EnhancementSuggestion[];
}

export interface StructuredPrompt {
  id: string;
  originalInput: string;
  objects: SceneObject[];
  weakSpans: WeakSpan[];
  enhancedPromptKo: string;
  enhancedPromptEn: string;
  createdAt: string;
}

// ============================================================
// API Request/Response Types
// ============================================================

export interface AnalyzePromptRequest {
  prompt: string;
}

export interface AnalyzePromptResponse {
  objects: SceneObject[];
}

export interface EnhancePromptRequest {
  prompt: string;
  objects: SceneObject[];
}

export interface EnhancePromptResponse {
  weakSpans: WeakSpan[];
}

export interface ComposePromptRequest {
  objects: SceneObject[];
  selectedAlternatives: Record<string, string>;
}

export interface ComposePromptResponse {
  promptKo: string;
  promptEn: string;
}
