const DEFAULT_TITLE_MAX = 32;

const LABEL_RE = /^(?:원본\s*프롬프트|편집\s*내용|프롬프트|prompt)\s*[:：]\s*/i;

const STYLE_TAIL_RE =
  /\b(?:detailed|beautiful|artwork|high quality|ultra detailed|photorealistic|cinematic)\b[,. ]*/gi;
const DANGLING_CONNECTOR_RE = /(?:[,，]\s*)?(?:and|with)\s*$/i;

function cleanLine(line: string): string {
  return line
    .replace(LABEL_RE, "")
    .replace(STYLE_TAIL_RE, "")
    .replace(DANGLING_CONNECTOR_RE, "")
    .replace(/[<>&"']/g, "")
    .replace(/[\x00-\x1f\x7f]/g, "")
    .replace(/[{}[\]()`*_#~|\\]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^[,.;:，。·\-\s]+|[,.;:，。·\-\s]+$/g, "")
    .trim();
}

export function buildImageTitle(
  prompt?: string | null,
  fallback = "공유 이미지",
  maxLength = DEFAULT_TITLE_MAX
): string {
  const lines = (prompt ?? "")
    .split(/\r?\n/)
    .map(cleanLine)
    .filter(Boolean);

  const sourceLine = lines.find((line) => !/^편집\s*내용/i.test(line));
  const raw = sourceLine || lines[0] || fallback;
  const title = cleanLine(raw) || fallback;

  if (title.length <= maxLength) return title;
  const sliced = title.slice(0, maxLength);
  const lastSpace = sliced.lastIndexOf(" ");
  if (lastSpace >= Math.floor(maxLength * 0.55)) {
    return sliced.slice(0, lastSpace).trim();
  }
  return sliced.trim();
}
