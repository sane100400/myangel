// 서브컬쳐 패션 브랜드 공식 스토어 데이터
// AI가 무드에 맞는 브랜드를 추천할 때 사용

export interface Brand {
  id: string;
  name: string;
  nameJa: string;
  storeUrl: string;
  styles: string[]; // 이 브랜드가 해당하는 스타일 태그
  description: string;
  priceRange: "low" | "mid" | "high";
}

export const BRANDS: Brand[] = [
  // ── 지뢰계 / 량산형 ──
  {
    id: "mars",
    name: "MA*RS",
    nameJa: "マーズ",
    storeUrl: "https://lilimpark.jp/shopbrand/mars_all/",
    styles: ["지뢰계", "량산형", "양산형", "갸루"],
    description: "시부야109 대표 지뢰계/량산형 브랜드",
    priceRange: "mid",
  },
  {
    id: "ank-rouge",
    name: "Ank Rouge",
    nameJa: "アンクルージュ",
    storeUrl: "https://ailand-store.jp/brand/ankrouge",
    styles: ["량산형", "양산형", "스위트", "페미닌"],
    description: "달콤한 핑크 & 리본 가득한 량산형 패션",
    priceRange: "mid",
  },
  {
    id: "dearmylove",
    name: "DearMyLove",
    nameJa: "ディアマイラブ",
    storeUrl: "https://dreamvs.jp/collections/dearmylove",
    styles: ["지뢰계", "량산형", "양산형", "다크"],
    description: "지뢰계 & 량산형 특화, 입문자 추천 브랜드",
    priceRange: "low",
  },
  {
    id: "rojita",
    name: "ROJITA",
    nameJa: "ロジータ",
    storeUrl: "https://rlab-store.jp/",
    styles: ["지뢰계", "량산형", "양산형", "어른스위트"],
    description: "시부야109 출신, 레이스 & 리본의 프린세스 스타일",
    priceRange: "mid",
  },
  {
    id: "noemie",
    name: "NOEMIE",
    nameJa: "ノエミー",
    storeUrl: "https://palemoba.com/noemie/",
    styles: ["량산형", "양산형", "지뢰계", "산리오"],
    description: "산리오 콜라보로 유명한 량산형 브랜드",
    priceRange: "mid",
  },
  {
    id: "honey-cinnamon",
    name: "Honey Cinnamon",
    nameJa: "ハニーシナモン",
    storeUrl: "https://bunnyapartment.com/honeycinnamon/",
    styles: ["지뢰계", "량산형", "양산형", "스위트"],
    description: "달콤하고 귀여운 지뢰계 아이템",
    priceRange: "mid",
  },
  {
    id: "travas-tokyo",
    name: "TRAVAS TOKYO",
    nameJa: "トラバストーキョー",
    storeUrl: "https://acrotokyo-global.com/index_en_USD_2-7.html",
    styles: ["지뢰계", "서브컬", "유니섹스", "스트릿"],
    description: "귀여움과 다크 요소가 공존하는 서브컬 스트릿",
    priceRange: "mid",
  },
  {
    id: "listen-flavor",
    name: "LISTEN FLAVOR",
    nameJa: "リッスンフレーバー",
    storeUrl: "https://www.listenflavor.com/",
    styles: ["유메카와이이", "서브컬", "페어리", "파스텔"],
    description: "파스텔 & 팝한 하라주쿠 서브컬 패션",
    priceRange: "mid",
  },

  // ── 로리타 / 고딕 ──
  {
    id: "baby-the-stars",
    name: "BABY, THE STARS SHINE BRIGHT",
    nameJa: "ベイビーザスターズシャインブライト",
    storeUrl: "https://babyssb.co.jp/",
    styles: ["로리타", "스위트로리타", "클래식로리타"],
    description: "스위트 로리타의 대명사, 일본 대표 로리타 브랜드",
    priceRange: "high",
  },
  {
    id: "angelic-pretty",
    name: "Angelic Pretty",
    nameJa: "アンジェリックプリティ",
    storeUrl: "https://angelicpretty-onlineshop.com/",
    styles: ["로리타", "스위트로리타", "OTT로리타"],
    description: "화려한 프린트와 달콤한 스위트 로리타",
    priceRange: "high",
  },
  {
    id: "moi-meme-moitie",
    name: "Moi-meme-Moitie",
    nameJa: "モワメームモワティエ",
    storeUrl: "https://moi-meme-moitie.com/",
    styles: ["고스로리", "고딕", "엘레강트고딕"],
    description: "Mana 설립, 뱀파이어 로맨스의 엘레강트 고딕",
    priceRange: "high",
  },
  {
    id: "metamorphose",
    name: "Metamorphose temps de fille",
    nameJa: "メタモルフォーゼ",
    storeUrl: "https://metamorphose.gr.jp/en/online-shop",
    styles: ["로리타", "고스로리", "클래식로리타"],
    description: "레이스와 프릴의 고딕 & 클래식 로리타",
    priceRange: "high",
  },
  {
    id: "atelier-pierrot",
    name: "Atelier Pierrot",
    nameJa: "アトリエピエロ",
    storeUrl: "https://atelier-pierrot.jp/",
    styles: ["고스로리", "고딕", "클래식로리타"],
    description: "고딕 로리타와 클래식의 우아한 만남",
    priceRange: "high",
  },

  // ── 페미닌 / 클래식 ──
  {
    id: "axes-femme",
    name: "axes femme",
    nameJa: "アクシーズファム",
    storeUrl: "https://axesfemme-kawaii.com/",
    styles: ["클래식", "페미닌", "로맨틱", "빈티지"],
    description: "유럽풍 빈티지 로맨틱 페미닌 패션",
    priceRange: "mid",
  },
  {
    id: "secret-honey",
    name: "Secret Honey",
    nameJa: "シークレットハニー",
    storeUrl: "https://secret-honey.com/",
    styles: ["페미닌", "스위트", "디즈니콜라보"],
    description: "디즈니 콜라보로 유명한 스위트 페미닌 브랜드",
    priceRange: "mid",
  },
  {
    id: "liz-lisa",
    name: "LIZ LISA",
    nameJa: "リズリサ",
    storeUrl: "https://lizlisa.com/",
    styles: ["히메계", "페미닌", "스위트", "플로럴"],
    description: "꽃무늬와 레이스의 히메계 대표 브랜드",
    priceRange: "mid",
  },

  // ── 페어리 / 유메카와이이 ──
  {
    id: "nile-perch",
    name: "Nile Perch",
    nameJa: "ナイルパーチ",
    storeUrl: "https://nileperch.theshop.jp/",
    styles: ["페어리코어", "유메카와이이", "파스텔"],
    description: "하라주쿠 페어리 케이의 원조",
    priceRange: "mid",
  },

  // ── 다크 / 고딕 / 비주얼계 ──
  {
    id: "putumayo",
    name: "PUTUMAYO",
    nameJa: "プトマヨ",
    storeUrl: "https://putumayo.co.jp/",
    styles: ["고딕", "펑크", "비주얼계", "다크"],
    description: "고딕 펑크 & 비주얼계 스타일",
    priceRange: "mid",
  },
  {
    id: "h-naoto",
    name: "h.NAOTO",
    nameJa: "エイチナオト",
    storeUrl: "https://shop.s-inc.com/",
    styles: ["고딕", "펑크", "다크", "비주얼계"],
    description: "고딕 & 펑크의 아방가르드 서브컬쳐",
    priceRange: "high",
  },

  // ── 레트로 / 카와이이 ──
  {
    id: "milk",
    name: "MILK",
    nameJa: "ミルク",
    storeUrl: "https://shop.milk-inc.com/",
    styles: ["레트로", "빈티지", "카와이이", "하라주쿠"],
    description: "1970년 하라주쿠 원조 레트로 걸리 브랜드",
    priceRange: "high",
  },
  {
    id: "katie",
    name: "Katie",
    nameJa: "ケイティ",
    storeUrl: "https://www.katiewebstore.jp/",
    styles: ["카와이이", "레트로", "서브컬"],
    description: "90년대 카와이이 레트로의 아이콘",
    priceRange: "mid",
  },
  {
    id: "6dokidoki",
    name: "6%DOKIDOKI",
    nameJa: "ロクパーセントドキドキ",
    storeUrl: "https://shop.6dokidoki.com/",
    styles: ["데코라", "페어리코어", "카와이이", "팝"],
    description: "하라주쿠 카와이이의 아이콘, 팝 & 데코라",
    priceRange: "mid",
  },
  {
    id: "bubbles",
    name: "BUBBLES",
    nameJa: "バブルス",
    storeUrl: "https://bubblestokyo.com/",
    styles: ["서브컬", "빈티지", "스트릿", "Y2K"],
    description: "빈티지 인스파이어드 서브컬 스트릿웨어",
    priceRange: "mid",
  },
  {
    id: "eatme",
    name: "EATME",
    nameJa: "イートミー",
    storeUrl: "https://runway-webstore.com/eatme/",
    styles: ["어른걸리", "스위트", "페미닌"],
    description: "귀엽지만 성숙한 어른 걸리 클로젯",
    priceRange: "mid",
  },
  {
    id: "swankiss",
    name: "Swankiss",
    nameJa: "スワンキス",
    storeUrl: "http://swankiss.net/",
    styles: ["드리미", "스위트", "하라주쿠"],
    description: "드리미하고 대담한 하라주쿠 걸리 패션",
    priceRange: "mid",
  },

  // ── 스트릿 / 캐주얼 ──
  {
    id: "wego",
    name: "WEGO",
    nameJa: "ウィゴー",
    storeUrl: "https://gocart.jp/wego",
    styles: ["하라주쿠", "스트릿", "캐주얼", "Y2K"],
    description: "하라주쿠 스트릿 캐주얼의 대표",
    priceRange: "low",
  },
  {
    id: "spinns",
    name: "SPINNS",
    nameJa: "スピンズ",
    storeUrl: "https://www.spinns.com/",
    styles: ["하라주쿠", "스트릿", "레트로", "Y2K"],
    description: "컬러풀 하라주쿠 스트릿웨어",
    priceRange: "low",
  },

  // ── 다크아카데미아 / 모드 ──
  {
    id: "atelier-boz",
    name: "Atelier BOZ",
    nameJa: "アトリエボズ",
    storeUrl: "https://bfrmanufacture.com/",
    styles: ["다크아카데미아", "고딕", "모드"],
    description: "고딕 모드의 세련된 다크 패션",
    priceRange: "high",
  },
];

// 스타일 태그별 브랜드 매핑
export function getBrandsByStyle(style: string): Brand[] {
  const normalized = style.toLowerCase().trim();
  return BRANDS.filter((b) =>
    b.styles.some((s) => s.toLowerCase().includes(normalized) || normalized.includes(s.toLowerCase()))
  );
}

// AI가 추천한 스타일 키워드 목록에서 관련 브랜드들 반환
export function getRecommendedBrands(styles: string[]): Brand[] {
  const brandSet = new Set<string>();
  const result: Brand[] = [];

  for (const style of styles) {
    for (const brand of getBrandsByStyle(style)) {
      if (!brandSet.has(brand.id)) {
        brandSet.add(brand.id);
        result.push(brand);
      }
    }
  }

  return result;
}
