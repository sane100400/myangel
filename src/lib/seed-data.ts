// 시드 데이터 — Gemini AI로 생성한 서브컬쳐 아이템 이미지
// 이미지는 content/images/에 저장, API(/api/images/:id)로 서빙

export function getImageUrl(id: string, q: "thumb" | "thumb_sm" | "full" = "full"): string {
  return `/api/images/${id}?q=${q}`;
}

export const SEED_MOOD_IMAGES = [
  // ── 지뢰계 (地雷系) ──
  {
    id: "jirai-dress",
    image_url: "jirai-dress",
    title: "지뢰계 레이스 드레스",
    tags: ["지뢰계", "레이스", "다크로맨틱"],
    prompt: "A breathtaking jirai-kei (地雷系) fashion item illustration blending anime cel-shading aesthetics with photorealistic fabric rendering, inspired by MA*RS and Ank Rouge brand aesthetics. The centerpiece is a black lace mini dress displayed on an antique Victorian dress form. The bodice features an intricate overlay of French Chantilly lace with rose and thorn motifs, beneath which lies smooth black duchess satin with a subtle sheen. A sweetheart neckline is trimmed with hand-sewn scalloped lace and tiny jet bead accents that catch the light like dark jewels. At the waist, a wide pink satin obi-style ribbon is tied into a dramatic asymmetric bow. The skirt is constructed in four tiers of gathered chiffon, ruffled tulle with pink rosette appliqués, pleated organza, and scalloped lace hem. The background is a moody boudoir setting with antique gilded mirror, candlelight, dried black roses, and vintage lace fabric.",
    is_premium: true,
  },
  {
    id: "jirai-headband",
    image_url: "jirai-headband",
    title: "지뢰계 헤드밴드",
    tags: ["지뢰계", "헤드드레스", "리본"],
    prompt: "A meticulously detailed jirai-kei headband accessory in photorealistic product photography style. Black velvet with an oversized asymmetric bow layered with midnight Chantilly lace, cascading thin satin ribbons and tiny silver skull charms. Seed pearl drops hang from the bow edges. On dark burgundy velvet jewelry stand against moody black tulle and dried lavender. Macro photography, warm tungsten lighting, extraordinary detail.",
  },
  {
    id: "jirai-bag",
    image_url: "jirai-bag",
    title: "지뢰계 하트 백",
    tags: ["지뢰계", "가방", "다크로맨틱"],
    prompt: "A gorgeous jirai-kei heart-shaped mini crossbody bag in high-end product photography. Glossy black patent leather with dimensional heart silhouette, hot pink contrast cross-stitch edges. Silver chain strap with heart links, padlock clasp with dangling key charm. Pink satin interior lining. On dark marble with scattered black and pink rose petals, vintage lace doily, directional lighting creating luxurious reflections.",
  },
  {
    id: "jirai-shoes",
    image_url: "jirai-shoes",
    title: "지뢰계 메리제인 슈즈",
    tags: ["지뢰계", "신발", "레이스"],
    prompt: "Jirai-kei Mary Jane platform shoes in detailed anime illustration style with realistic material textures. Black glossy leather rounded toe, 8cm chunky matte platform soles with pink edges. Heart-shaped silver buckle straps, black lace overlay panels, tiny pink ribbon rosettes near ankle. On a dark vanity table with jewelry and velvet ribbons. Dramatic side lighting, anime line detail with photorealistic rendering.",
  },
  {
    id: "jirai-room",
    image_url: "jirai-room",
    title: "지뢰계 룸 인테리어",
    tags: ["지뢰계", "인테리어", "다크로맨틱"],
    prompt: "A breathtaking wide-angle jirai-kei bedroom capturing the dark princess aesthetic. Canopy bed in black lace curtains and wine velvet, pink and black satin cushions, gothic plush bears. Vintage black vanity with ornate gilded mirror reflecting fairy lights. Shelves of bisque dolls, perfume bottles, dark dried flowers. Dark floral damask wallpaper. Crystal chandelier casting fractured warm light. Pink neon 'DREAM' glowing softly. Cinematic photorealistic interior.",
  },
  {
    id: "jirai-doll",
    image_url: "jirai-doll",
    title: "지뢰계 고딕 인형",
    tags: ["지뢰계", "인형", "고딕"],
    prompt: "A hauntingly beautiful gothic lolita bisque doll in semi-realistic anime style blending 2D and 3D. Porcelain-white luminous skin, oversized violet glass eyes with deep iris refraction, long curled black lashes, rosebud berry mouth. Jet black ringlet curls with purple highlights, miniature black lace bonnet. Multi-layered black dress with Valenciennes lace trim, fabric roses. Inside antique glass dome on velvet pedestal. Dramatic chiaroscuro, museum-quality textile detail.",
  },
  {
    id: "jirai-parasol",
    image_url: "jirai-parasol",
    title: "지뢰계 레이스 양산",
    tags: ["지뢰계", "양산", "레이스"],
    prompt: "An exquisite jirai-kei black lace parasol in overhead flat-lay photography. Fully opened revealing layered Chantilly lace — roses, thorny vines, butterflies in black mesh. Double-layered ruffle trim alternating black and wine satin, tiny bow accents at each spoke tip. Black lacquer carved handle with silver skull-and-bow finial, detachable pearl and crystal wrist chain. On soft lavender silk. Vintage gothic Japanese elegance.",
  },

  // ── 천사계 (天使界隈) ──
  {
    id: "angel-dress",
    image_url: "angel-dress",
    title: "천사계 오간자 드레스",
    tags: ["천사계", "레이스", "파스텔"],
    prompt: "An otherworldly tenshi-kai angel aesthetic dress in dreamy anime illustration style, inspired by Angelic Pretty and BABY, THE STARS SHINE BRIGHT. Displayed on an ethereal white mannequin floating among cloud-like tulle. Structured corset bodice in white duchess satin covered in hand-embroidered organza with feather, wing, and star motifs in pearlescent thread. Peter pan collar in Brussels lace with seed pearls. Crystal dewdrop buttons in silver angel wing settings. Triple-layered tulle puff sleeves. Wide pastel blue duchesse satin sash tied into an enormous cathedral bow. Seven-tier cascading skirt of alternating organza and tulle, each edged with different white lace. White feathers drift in soft backlighting, baby's breath and peonies frame the base.",
    is_premium: true,
  },
  {
    id: "angel-wings",
    image_url: "angel-wings",
    title: "천사계 깃털 날개",
    tags: ["천사계", "날개", "인테리어"],
    prompt: "Magnificent tenshi-kai decorative angel wings wall art in photorealistic interior style. Large feathered wings spanning one meter each, hundreds of individually placed white goose feathers. Intertwined warm white LED fairy lights creating golden glow. Cascading pearl chains and crystal prisms casting rainbow refractions. Dried baby's breath and white rose buds between feathers. Mounted on white wall above console table with candles. Soft golden hour lighting, every feather barb visible.",
  },
  {
    id: "angel-headpiece",
    image_url: "angel-headpiece",
    title: "천사계 헤드피스",
    tags: ["천사계", "헤드드레스", "레이스"],
    prompt: "A delicate tenshi-kai angel headpiece in anime-meets-jewelry photography style. Thin silver circlet with two miniature angel wings in white resin feathers tipped with iridescent coating. Freshwater pearl chains drape across forehead to central teardrop crystal. Scattered Swarovski crystals like stars. White satin ribbon ties. On white velvet bust form with tulle wisps, gentle diffused lighting, extreme macro detail.",
  },
  {
    id: "angel-room",
    image_url: "angel-room",
    title: "천사계 룸 인테리어",
    tags: ["천사계", "인테리어", "드림코어"],
    prompt: "A breathtaking tenshi-kai angel aesthetic bedroom in cinematic wide-angle photography, pinnacle of Japanese dreamcore interior design. Cloud-shaped LED ceiling installation with warm white glow. Queen bed in white wrought iron with angel wing scrollwork, six-layer organza canopy from crown frame. Egyptian cotton sateen duvet, cloud pillows, angel plush dolls. Large decorative angel wings mounted above headboard with hidden LED halo. Crystal chandelier of teardrop prisms and freshwater pearls casting rainbow light. White French provincial vanity with porcelain rose mirror, glass-front bookcase with snow globes and crystal figurines. Ultra-plush white faux fur rug, sheer lace curtains billowing in golden morning light. Every surface in white, pearl, palest blue, and soft gold.",
    is_premium: true,
  },
  {
    id: "angel-doll",
    image_url: "angel-doll",
    title: "천사계 엔젤 인형",
    tags: ["천사계", "인형", "파스텔"],
    prompt: "An adorable tenshi-kai angel plush doll in soft anime illustration with product photography lighting. 30cm tall, premium snow-white minky fabric. Tiny white organza dress with lace trim and miniature blue satin bow. Layered white felt wings with pearl beads on her back. Large round pastel blue glass bead eyes with starlight reflections, rosy flocked cheeks, tiny embroidered smile. Platinum blonde yarn hair with satin ribbon halo headband. Sits on white tulle clouds with scattered pearl beads.",
  },
  {
    id: "angel-jewelry",
    image_url: "angel-jewelry",
    title: "천사계 주얼리 세트",
    tags: ["천사계", "액세서리", "진주"],
    prompt: "An exquisite tenshi-kai angel jewelry collection in luxurious flat-lay on white silk charmeuse. Three-strand freshwater pearl choker with silver angel wing clasp; dangling angel wing earrings holding teardrop pearls; chain bracelet with alternating pearls and crystal stars; miniature wing ring; pearl-studded hair comb with crystal wing motif. Overhead bright diffused lighting, every pearl's unique luster captured. High-end Japanese jewelry editorial quality.",
  },
  {
    id: "angel-shoes",
    image_url: "angel-shoes",
    title: "천사계 발레 슈즈",
    tags: ["천사계", "신발", "리본"],
    prompt: "Elegant tenshi-kai white satin ballet flats in anime-inspired fashion illustration with photorealistic materials. Rounded toe in lustrous white duchess satin, crisscross satin ribbon ankle straps tying in petite bows, row of tiny freshwater pearls along the opening. Pale blue suede insole with embossed wing. On white marble with baby's breath, ribbons, and pearl beads. Clean soft lighting with pink and blue reflections.",
  },

  // ── 양산형 (量産型) ──
  {
    id: "ryousan-dress",
    image_url: "ryousan-dress",
    title: "양산형 프릴 드레스",
    tags: ["양산형", "프릴", "리본"],
    prompt: "A spectacular ryousangata pink frill one-piece dress in vivid anime illustration style, channeling Ank Rouge and ROJITA brand aesthetics. Displayed on a pink velvet mannequin in a kawaii boutique. Baby pink cotton sateen bodice with pintuck pleating, pearlescent heart buttons, double-layer peter pan collar in white cotton lace with vintage cameo brooch. Dramatic puff sleeves with triple-loop hot pink satin bows and cascading lace ruffles. Enormous hot pink duchess satin butterfly bow at the back with structured boning. Five-tier cascading ruffled skirt: gathered pink chiffon, white eyelet embroidery, pink organza with rosettes, Valenciennes lace, and pink satin scalloped hem over structured tulle petticoat. Boutique background with ribbon garlands, crystal chandelier with pink glass drops.",
    is_premium: true,
  },
  {
    id: "ryousan-bag",
    image_url: "ryousan-bag",
    title: "양산형 하트 백",
    tags: ["양산형", "가방", "핑크"],
    prompt: "An irresistibly cute ryousangata pastel pink heart-shaped mini handbag in high-quality product photography. Quilted pink faux leather with diamond-pattern stitching creating puffy pillow effect. Large hot pink satin bow on front with golden heart turn-lock clasp. Chain strap alternating gold links and woven pink ribbon. Key, star, and bow charms dangling from side ring. On fluffy pink tulle with pearl beads and silk flower petals. Bright warm studio lighting, candy kawaii colors.",
  },
  {
    id: "ryousan-parasol",
    image_url: "ryousan-parasol",
    title: "양산형 레이스 양산",
    tags: ["양산형", "양산", "레이스"],
    prompt: "A romantic ryousangata pink lace parasol in anime-meets-photography style. Open and tilted revealing three ruffle layers — outer pink organza, middle white Chantilly lace florals, inner smooth pink satin. Eight spoke tips with alternating pink and white satin bows with pearl centers. Carved handle wrapped in pink ribbon with heart crystal charm. Soft gradient pink to white background with floating cherry blossom petals. Bright even lighting, delicate pastel tones.",
  },
  {
    id: "ryousan-room",
    image_url: "ryousan-room",
    title: "양산형 룸 인테리어",
    tags: ["양산형", "인테리어", "핑크"],
    prompt: "A maximally cute ryousangata pink bedroom bursting with kawaii energy in wide-angle interior photography. Ruffled pink bedding with heart pillows and dozens of plush dolls. Heart-shaped vanity mirror with pink LED frame. Pink ribbon garlands and fairy lights criss-crossing ceiling. White French provincial furniture with pink trim, glass cabinets showing handbag collections. Fluffy pink rug, lace-overlay curtains. Warm pink-tinted ambient lighting with fairy light sparkles. Ultimate Japanese girly room.",
  },
  {
    id: "ryousan-plush",
    image_url: "ryousan-plush",
    title: "양산형 봉제 인형",
    tags: ["양산형", "인형", "귀여움"],
    prompt: "The most adorable ryousangata pink teddy bear plushie in detailed anime illustration with toy photography softness. Ultra-soft baby pink minky fabric, slightly oversized head. Tiny frilly lace and satin dress with bow, miniature pearl necklace, tiny bow clipped to one ear. Large embroidered heart eyes with white highlight stitching, rosy blush circles. Sits among lace doilies, silk roses, smaller plush friends, holding tiny 'LOVE' heart pillow. Peak kawaii Japanese plush culture.",
  },
  {
    id: "ryousan-accessories",
    image_url: "ryousan-accessories",
    title: "양산형 액세서리 세트",
    tags: ["양산형", "액세서리", "리본"],
    prompt: "A delightful ryousangata accessory collection in Instagram-perfect flat-lay on pink satin. Oversized bow hair clips in hot and baby pink with pearl centers; heart-shaped dangling earrings with pearl drops; layered bracelet set of pearl strands, pink ribbon weave, and heart chain; dainty bow ring in rose gold; rhinestone-studded pink compact mirror. Overhead bright cheerful lighting, vivid pink and white, Japanese girly accessory culture beautifully curated.",
  },
];

// 메인페이지와 Discover 페이지에서 공유하는 태그 목록
// STYLE_PRESETS 라벨과 동일 — 스타일 태그만 노출
export const SEED_TAGS = [
  "지뢰계", "천사계", "양산형", "로리타", "고스로리",
  "페어리코어", "Y2K", "위시코어", "캐릭터", "감성",
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
  { id: "wishcore", label: "위시코어", emoji: "⭐", prompt_hint: "위시코어 스타일, NCT WISH 감성, Y2K 베이스에 별과 날개 장식, 글리터, 엔젤코어, 키치한 데일리룩", hashtags: ["#도트패턴", "#Y2K글리터", "#엔젤코어", "#키치데일리"] },
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
  { id: "p-6", prompt: "별과 날개 장식의 글리터 탑과 Y2K 미니스커트, 위시코어 데일리룩", style: "위시코어", tags: ["위시코어", "Y2K", "엔젤코어"] },
];
