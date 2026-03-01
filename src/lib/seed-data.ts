// 시드 데이터 — Gemini AI로 생성한 서브컬쳐 아이템 이미지
// 로컬 이미지 (public/generated/)

export const SEED_MOOD_IMAGES = [
  // ── 지뢰계 (地雷系) ──
  {
    id: "jirai-dress",
    image_url: "/generated/jirai-dress.png",
    title: "지뢰계 레이스 드레스",
    tags: ["지뢰계", "레이스", "다크로맨틱"],
  },
  {
    id: "jirai-headband",
    image_url: "/generated/jirai-headband.png",
    title: "지뢰계 헤드밴드",
    tags: ["지뢰계", "헤드드레스", "리본"],
  },
  {
    id: "jirai-bag",
    image_url: "/generated/jirai-bag.png",
    title: "지뢰계 하트 백",
    tags: ["지뢰계", "가방", "다크로맨틱"],
  },
  {
    id: "jirai-shoes",
    image_url: "/generated/jirai-shoes.png",
    title: "지뢰계 메리제인 슈즈",
    tags: ["지뢰계", "신발", "레이스"],
  },
  {
    id: "jirai-room",
    image_url: "/generated/jirai-room.png",
    title: "지뢰계 룸 인테리어",
    tags: ["지뢰계", "인테리어", "다크로맨틱"],
  },
  {
    id: "jirai-doll",
    image_url: "/generated/jirai-doll.png",
    title: "지뢰계 고딕 인형",
    tags: ["지뢰계", "인형", "고딕"],
  },
  {
    id: "jirai-parasol",
    image_url: "/generated/jirai-parasol.png",
    title: "지뢰계 레이스 양산",
    tags: ["지뢰계", "양산", "레이스"],
  },

  // ── 천사계 (天使界隈) ──
  {
    id: "angel-dress",
    image_url: "/generated/angel-dress.png",
    title: "천사계 오간자 드레스",
    tags: ["천사계", "레이스", "파스텔"],
  },
  {
    id: "angel-wings",
    image_url: "/generated/angel-wings.png",
    title: "천사계 깃털 날개",
    tags: ["천사계", "날개", "인테리어"],
  },
  {
    id: "angel-headpiece",
    image_url: "/generated/angel-headpiece.png",
    title: "천사계 헤드피스",
    tags: ["천사계", "헤드드레스", "레이스"],
  },
  {
    id: "angel-room",
    image_url: "/generated/angel-room.png",
    title: "천사계 룸 인테리어",
    tags: ["천사계", "인테리어", "드림코어"],
  },
  {
    id: "angel-doll",
    image_url: "/generated/angel-doll.png",
    title: "천사계 엔젤 인형",
    tags: ["천사계", "인형", "파스텔"],
  },
  {
    id: "angel-jewelry",
    image_url: "/generated/angel-jewelry.png",
    title: "천사계 주얼리 세트",
    tags: ["천사계", "액세서리", "진주"],
  },
  {
    id: "angel-shoes",
    image_url: "/generated/angel-shoes.png",
    title: "천사계 발레 슈즈",
    tags: ["천사계", "신발", "리본"],
  },

  // ── 양산형 (量産型) ──
  {
    id: "ryousan-dress",
    image_url: "/generated/ryousan-dress.png",
    title: "양산형 프릴 드레스",
    tags: ["양산형", "프릴", "리본"],
  },
  {
    id: "ryousan-bag",
    image_url: "/generated/ryousan-bag.png",
    title: "양산형 하트 백",
    tags: ["양산형", "가방", "핑크"],
  },
  {
    id: "ryousan-parasol",
    image_url: "/generated/ryousan-parasol.png",
    title: "양산형 레이스 양산",
    tags: ["양산형", "양산", "레이스"],
  },
  {
    id: "ryousan-room",
    image_url: "/generated/ryousan-room.png",
    title: "양산형 룸 인테리어",
    tags: ["양산형", "인테리어", "핑크"],
  },
  {
    id: "ryousan-plush",
    image_url: "/generated/ryousan-plush.png",
    title: "양산형 봉제 인형",
    tags: ["양산형", "인형", "귀여움"],
  },
  {
    id: "ryousan-accessories",
    image_url: "/generated/ryousan-accessories.png",
    title: "양산형 액세서리 세트",
    tags: ["양산형", "액세서리", "리본"],
  },
];

// 메인페이지와 Discover 페이지에서 공유하는 태그 목록
export const SEED_TAGS = [
  "지뢰계", "천사계", "양산형",
  "레이스", "리본", "프릴", "다크로맨틱", "파스텔",
  "인테리어", "인형", "가방", "신발", "액세서리",
  "헤드드레스", "양산", "드림코어", "고딕", "핑크", "진주",
];

// 이미지 생성 스타일 프리셋
export const STYLE_PRESETS = [
  { id: "jirai", label: "지뢰계", emoji: "🖤", prompt_hint: "지뢰계 (jirai-kei) 스타일, 블랙 & 핑크, 레이스, 리본, 다크 로맨틱", hashtags: ["#다크로맨틱", "#레이스", "#리본", "#블랙핑크"] },
  { id: "angel", label: "천사계", emoji: "🤍", prompt_hint: "천사계 (tenshi-kai) 스타일, 화이트 & 파스텔 블루, 레이스, 날개, 순수한 분위기", hashtags: ["#파스텔", "#레이스", "#날개", "#순수"] },
  { id: "ryousan", label: "양산형", emoji: "🎀", prompt_hint: "양산형 (ryousangata) 스타일, 핑크, 리본, 프릴, 달콤한 소녀 감성", hashtags: ["#핑크", "#리본", "#프릴", "#스위트"] },
  { id: "lolita", label: "로리타", emoji: "👗", prompt_hint: "로리타 패션 스타일, 프릴, 레이스, 정교한 드레스", hashtags: ["#프릴", "#레이스", "#드레스", "#클래식"] },
  { id: "goth", label: "고스로리", emoji: "🦇", prompt_hint: "고딕 로리타 스타일, 블랙, 다크 로맨틱, 빈티지 고딕", hashtags: ["#고딕", "#다크", "#빈티지", "#로맨틱"] },
  { id: "fairy", label: "페어리코어", emoji: "🧚", prompt_hint: "페어리코어 스타일, 파스텔, 몽환적, 요정 같은 감성", hashtags: ["#파스텔", "#몽환", "#요정", "#드림코어"] },
  { id: "y2k", label: "Y2K", emoji: "💿", prompt_hint: "Y2K 패션 스타일, 2000년대 레트로, 메탈릭, 글로시", hashtags: ["#레트로", "#메탈릭", "#글로시", "#2000s"] },
  { id: "emoji", label: "이모티콘", emoji: "😊", prompt_hint: "귀여운 이모티콘/스티커 스타일, 심플하고 귀여운 일러스트", hashtags: ["#스티커", "#귀여움", "#심플", "#일러스트"] },
  { id: "character", label: "캐릭터", emoji: "✨", prompt_hint: "애니메이션 캐릭터 일러스트 스타일", hashtags: ["#애니", "#일러스트", "#캐릭터디자인", "#판타지"] },
  { id: "aesthetic", label: "감성", emoji: "🌸", prompt_hint: "감성적인 에스테틱 이미지 스타일", hashtags: ["#에스테틱", "#무드", "#감성사진", "#아트"] },
] as const;

// 프롬프트 예시 데이터 (Discover 페이지에서 사용)
export const SEED_PROMPTS = [
  { id: "p-1", prompt: "천사 날개를 단 파스텔 블루 드레스 소녀, 구름 위에서 앉아있는 모습", style: "천사계", tags: ["천사계", "파스텔", "일러스트"] },
  { id: "p-2", prompt: "지뢰계 감성의 검은 레이스 원피스 소녀, 장미꽃이 흩날리는 배경", style: "지뢰계", tags: ["지뢰계", "다크로맨틱", "레이스"] },
  { id: "p-3", prompt: "핑크 리본 가득한 양산형 코디의 귀여운 소녀 일러스트", style: "양산형", tags: ["양산형", "리본", "핑크"] },
  { id: "p-4", prompt: "고딕 로리타 드레스를 입은 인형 같은 소녀, 달빛 아래 성 배경", style: "고스로리", tags: ["고스로리", "로리타", "다크로맨틱"] },
  { id: "p-5", prompt: "몽환적인 숲속의 페어리코어 감성 소녀, 반짝이는 날개", style: "페어리코어", tags: ["페어리코어", "드림코어", "파스텔"] },
  { id: "p-6", prompt: "하트 눈의 귀여운 고양이 이모티콘, 핑크 배경", style: "이모티콘", tags: ["이모티콘", "캐릭터", "귀여움"] },
];
