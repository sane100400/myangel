const WRAPPING_QUOTES_RE = /^[`"'“”‘’]+|[`"'“”‘’]+$/g;

const INSTRUCTION_LEAK_PATTERNS: RegExp[] = [
  /^\s*(system|assistant|developer|user)\s*[:：]/im,
  /^\s*(원본|수정|규칙)\s*[:：]/m,
  /이미지 생성 프롬프트에서 더 구체적으로 만들 수 있는/,
  /이미지 생성 프롬프트를 자연스럽고 매끄럽게 다시 써줘/,
  /JSON\s*형식\s*[:：]/i,
  /\{\s*"spans"\s*:/i,
  /\b(?:contents|parts|responseMimeType|thinkingConfig|systemInstruction)\b/i,
  /\balternatives\[\]\.text\b/i,
  /The user prompt is mainly/i,
  /Extract weak (?:English|Korean) visual/i,
  /Keep reason and reasoning/i,
  /원본에 없는 새 대상은 만들지 말고/,
  /각 표현에 대안\s*\d+개/,
  /다듬은 문장만 한 줄로 반환/,
  /따옴표[·\s]*설명[·\s]*접두어/,
];

export function cleanModelOutputText(value: string): string {
  let text = String(value ?? "").replace(/^\uFEFF/, "").trim();
  const fullFence = text.match(/^```(?:json|text|markdown)?\s*([\s\S]*?)\s*```$/i);
  if (fullFence?.[1]) {
    text = fullFence[1].trim();
  }
  return text.trim();
}

export function containsPromptInstructionLeak(value: string): boolean {
  const text = cleanModelOutputText(value);
  if (!text) return false;
  return INSTRUCTION_LEAK_PATTERNS.some((pattern) => pattern.test(text));
}

export function parseJsonFromModelText(value: string): unknown | null {
  const text = cleanModelOutputText(value);
  const candidates = [text];

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) candidates.push(fenced[1].trim());

  const objectStart = text.indexOf("{");
  const objectEnd = text.lastIndexOf("}");
  if (objectStart !== -1 && objectEnd > objectStart) {
    candidates.push(text.slice(objectStart, objectEnd + 1));
  }

  const arrayStart = text.indexOf("[");
  const arrayEnd = text.lastIndexOf("]");
  if (arrayStart !== -1 && arrayEnd > arrayStart) {
    candidates.push(text.slice(arrayStart, arrayEnd + 1));
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
      // Try the next extraction candidate.
    }
  }

  return null;
}

export function sanitizeModelField(value: unknown, maxLength: number): string {
  const text = cleanModelOutputText(String(value ?? ""))
    .replace(WRAPPING_QUOTES_RE, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!text || text.length > maxLength) return "";
  if (containsPromptInstructionLeak(text)) return "";
  return text;
}

export function sanitizeRewrittenPrompt(
  value: string | null | undefined,
  fallback: string,
  maxLength: number
): string {
  let text = cleanModelOutputText(String(value ?? ""))
    .replace(WRAPPING_QUOTES_RE, "")
    .trim();

  text = text
    .replace(
      /^(?:프롬프트|최종\s*문장|다듬은\s*문장|결과|output|prompt)\s*[:：]\s*/i,
      ""
    )
    .replace(WRAPPING_QUOTES_RE, "")
    .trim();

  if (!text || text.length > maxLength) return fallback.trim();
  if (containsPromptInstructionLeak(text)) return fallback.trim();
  if (/^[{\[]/.test(text)) return fallback.trim();

  const meaningfulLines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (meaningfulLines.length > 2 && /^\s*[-*•]/m.test(text)) {
    return fallback.trim();
  }

  return text.replace(/\s*\n\s*/g, " ").trim();
}
