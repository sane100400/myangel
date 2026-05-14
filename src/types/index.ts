// ============================================================
// Prompt Enhancement (Grammarly-style weak span detection)
// ============================================================

export interface EnhancementSuggestion {
  id: string;
  text: string;
  textEn: string;
  confidence: number;
  reasoning: string;
}

export type WeakSpanReason =
  | "too_abstract"
  | "missing_visual"
  | "vague_intensifier"
  | "low_density"
  | "ok";

export interface WeakSpan {
  start: number;
  end: number;
  text: string;
  reason: string;
  reasonCode?: WeakSpanReason;
  densityScore?: number;
  alternatives: EnhancementSuggestion[];
}
