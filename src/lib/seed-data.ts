// 시드 데이터 — Gemini AI로 생성한 서브컬쳐 아이템 이미지
// 이미지는 content/images/에 저장, API(/api/images/:id)로 서빙

export function getImageUrl(id: string, q: "thumb" | "thumb_sm" | "full" = "full"): string {
  return `/api/images/${id}?q=${q}`;
}

// 시드 이미지는 더 이상 사용하지 않음 — 커뮤니티 공유 이미지만 표시
export const SEED_MOOD_IMAGES: {
  id: string;
  image_url: string;
  title: string;
  tags: string[];
  prompt: string;
}[] = [];

// 메인페이지와 Discover 페이지에서 공유하는 태그 목록
// STYLE_PRESETS 라벨과 동일 — 스타일 태그만 노출
export const SEED_TAGS = [
  "지뢰계", "천사계", "양산형", "로리타", "고스로리",
  "페어리코어", "Y2K", "위시코어", "캐릭터", "감성",
];

// 프롬프트 예시 데이터 (Discover 페이지에서 사용)
export const SEED_PROMPTS = [
  { id: "p-1", prompt: "천사 날개를 단 파스텔 블루 드레스 소녀, 구름 위에서 앉아있는 모습", style: "천사계", tags: ["천사계", "파스텔", "일러스트"] },
  { id: "p-2", prompt: "지뢰계 감성의 검은 레이스 원피스 소녀, 장미꽃이 흩날리는 배경", style: "지뢰계", tags: ["지뢰계", "다크로맨틱", "레이스"] },
  { id: "p-3", prompt: "핑크 리본 가득한 양산형 코디의 귀여운 소녀 일러스트", style: "양산형", tags: ["양산형", "리본", "핑크"] },
  { id: "p-4", prompt: "고딕 로리타 드레스를 입은 인형 같은 소녀, 달빛 아래 성 배경", style: "고스로리", tags: ["고스로리", "로리타", "다크로맨틱"] },
  { id: "p-5", prompt: "몽환적인 숲속의 페어리코어 감성 소녀, 반짝이는 날개", style: "페어리코어", tags: ["페어리코어", "드림코어", "파스텔"] },
  { id: "p-6", prompt: "별과 날개 장식의 글리터 탑과 Y2K 미니스커트, 위시코어 데일리룩", style: "위시코어", tags: ["위시코어", "Y2K", "엔젤코어"] },
];
