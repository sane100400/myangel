export type CopyrightRiskAction = "allow" | "block";

export type CopyrightRiskCategory =
  | "copyrighted_character"
  | "trademark_logo"
  | "living_artist_style"
  | "near_exact_copy";

export interface CopyrightRiskIssue {
  category: CopyrightRiskCategory;
  matched: string;
  message: string;
  suggestion: string;
}

export interface CopyrightRiskAssessment {
  action: CopyrightRiskAction;
  issues: CopyrightRiskIssue[];
}

const CHARACTER_OR_FRANCHISE_TERMS = [
  "mickey mouse",
  "미키마우스",
  "minnie mouse",
  "미니마우스",
  "disney",
  "디즈니",
  "pixar",
  "픽사",
  "marvel",
  "마블",
  "spider-man",
  "spiderman",
  "스파이더맨",
  "batman",
  "배트맨",
  "superman",
  "슈퍼맨",
  "harry potter",
  "해리포터",
  "pokemon",
  "pokémon",
  "포켓몬",
  "pikachu",
  "피카츄",
  "nintendo",
  "닌텐도",
  "zelda",
  "젤다",
  "mario",
  "마리오",
  "hello kitty",
  "헬로키티",
  "doraemon",
  "도라에몽",
  "totoro",
  "토토로",
  "sailor moon",
  "세일러문",
  "one piece",
  "원피스",
  "naruto",
  "나루토",
  "dragon ball",
  "드래곤볼",
  "barbie",
  "바비",
  "lego",
  "레고",
];

const BRAND_TERMS = [
  "nike",
  "나이키",
  "adidas",
  "아디다스",
  "apple",
  "애플",
  "starbucks",
  "스타벅스",
  "coca cola",
  "coca-cola",
  "코카콜라",
  "mcdonald",
  "맥도날드",
  "samsung",
  "삼성",
  "google",
  "구글",
  "openai",
  "오픈ai",
  "오픈에이아이",
  "tesla",
  "테슬라",
  "louis vuitton",
  "루이비통",
  "chanel",
  "샤넬",
  "gucci",
  "구찌",
];

const LOGO_CONTEXT = [
  "logo",
  "brand mark",
  "trademark",
  "wordmark",
  "로고",
  "상표",
  "브랜드마크",
  "워드마크",
];

const LIVING_ARTIST_STYLE_TERMS = [
  "hayao miyazaki",
  "미야자키 하야오",
  "studio ghibli",
  "스튜디오 지브리",
  "지브리",
  "makoto shinkai",
  "신카이 마코토",
  "greg rutkowski",
  "그렉 루트코프스키",
  "beeple",
  "비플",
  "banksy",
  "뱅크시",
  "takashi murakami",
  "무라카미 다카시",
  "yayoi kusama",
  "쿠사마 야요이",
  "kaws",
  "카우스",
  "loish",
  "artgerm",
  "samdoesarts",
];

const STYLE_CONTEXT = [
  "in the style of",
  "style of",
  "by ",
  "as if painted by",
  "as if drawn by",
  "inspired by",
  "스타일",
  "화풍",
  "작가풍",
  "그림체",
  "풍으로",
  "처럼 그린",
  "처럼 그려",
];

const COPY_CONTEXT = [
  "exact copy",
  "copy exactly",
  "identical copy",
  "replicate exactly",
  "recreate exactly",
  "trace this",
  "same as the reference",
  "make it identical",
  "1:1 copy",
  "그대로 복제",
  "정확히 복제",
  "똑같이 복사",
  "동일하게 복제",
  "완전히 똑같이",
  "1:1로 복제",
  "레퍼런스와 똑같이",
];

function normalizeText(input: string): string {
  return input
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[“”‘’]/g, "\"")
    .replace(/\s+/g, " ")
    .trim();
}

function includesTerm(text: string, terms: readonly string[]): string | null {
  return terms.find((term) => text.includes(term)) ?? null;
}

function hasContext(text: string, contexts: readonly string[]): boolean {
  return contexts.some((ctx) => text.includes(ctx));
}

function addIssue(
  issues: CopyrightRiskIssue[],
  issue: CopyrightRiskIssue
): void {
  if (
    issues.some(
      (existing) =>
        existing.category === issue.category && existing.matched === issue.matched
    )
  ) {
    return;
  }
  issues.push(issue);
}

export function assessCopyrightRisk(text: string): CopyrightRiskAssessment {
  const normalized = normalizeText(text);
  if (!normalized) return { action: "allow", issues: [] };

  const issues: CopyrightRiskIssue[] = [];

  const character = includesTerm(normalized, CHARACTER_OR_FRANCHISE_TERMS);
  if (character) {
    addIssue(issues, {
      category: "copyrighted_character",
      matched: character,
      message: "기존 캐릭터·프랜차이즈를 직접 생성하거나 모방하는 요청은 차단됩니다.",
      suggestion: "고유한 캐릭터로 바꾸고, 필요한 특징은 색감·소재·분위기처럼 일반 묘사로 풀어 적어주세요.",
    });
  }

  const brand = includesTerm(normalized, BRAND_TERMS);
  if (brand && hasContext(normalized, LOGO_CONTEXT)) {
    addIssue(issues, {
      category: "trademark_logo",
      matched: brand,
      message: "제3자 브랜드 로고·상표를 생성하거나 합성하는 요청은 차단됩니다.",
      suggestion: "실제 브랜드명 대신 직접 만든 가상의 브랜드명이나 추상적인 심볼 설명을 사용해주세요.",
    });
  }

  const artist = includesTerm(normalized, LIVING_ARTIST_STYLE_TERMS);
  if (artist && hasContext(normalized, STYLE_CONTEXT)) {
    addIssue(issues, {
      category: "living_artist_style",
      matched: artist,
      message: "현존 작가·스튜디오의 고유한 스타일을 직접 모방하는 요청은 차단됩니다.",
      suggestion: "작가명 대신 선 굵기, 색감, 조명, 시대감, 재료감 같은 시각 요소로 설명해주세요.",
    });
  }

  const copyRequest = includesTerm(normalized, COPY_CONTEXT);
  if (copyRequest) {
    addIssue(issues, {
      category: "near_exact_copy",
      matched: copyRequest,
      message: "레퍼런스나 기존 작품을 거의 동일하게 복제하는 요청은 차단됩니다.",
      suggestion: "레퍼런스는 분위기·구도 참고로만 쓰고, 새 구성과 변형 포인트를 명시해주세요.",
    });
  }

  return { action: issues.length > 0 ? "block" : "allow", issues };
}

export function formatCopyrightRiskError(
  assessment: CopyrightRiskAssessment
): string {
  if (assessment.issues.length === 0) return "";
  const first = assessment.issues[0];
  return `${first.message} ${first.suggestion}`;
}

