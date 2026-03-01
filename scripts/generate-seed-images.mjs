import { GoogleGenAI } from "@google/genai";
import { writeFileSync, mkdirSync, existsSync } from "fs";

const API_KEY = process.env.GOOGLE_AI_API_KEY;
if (!API_KEY) {
  console.error("ERROR: GOOGLE_AI_API_KEY 환경변수를 설정해주세요.");
  process.exit(1);
}
const genai = new GoogleGenAI({ apiKey: API_KEY });

const OUTPUT_DIR = "public/generated";
if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

const PROMPTS = [
  // ═══ 지뢰계 (地雷系 / Jirai-kei) ═══
  // 지뢰계 = 일본 하라주쿠 발 다크큐트 패션. 블랙x핑크, 레이스, 리본, 십자가, 하트, 눈물 모티프.
  // MA*RS, ROJITA, DearMyLove 같은 브랜드 감성. 병얀데레/멘헤라 감성의 다크 로맨틱.

  {
    id: "jirai-dress",
    prompt: "Anime-style illustration of a jirai-kei (地雷系) coordinate displayed on a dress mannequin torso in a Japanese boutique setting. Black chiffon one-piece dress with pink satin ribbon criss-cross lacing on the bodice, layered tulle petticoat peeking out from the hem, white lace peter pan collar, and oversized pink bow at the chest. Small silver heart-shaped pendant hanging from the ribbon. The mannequin is surrounded by dried dark roses and a tiny teddy bear keychain. Soft pink spot lighting, Japanese fashion magazine aesthetic. Kawaii but melancholic mood. No people, no face.",
    tags: ["지뢰계", "레이스", "다크로맨틱"]
  },
  {
    id: "jirai-headband",
    prompt: "Detailed Japanese anime illustration style — a jirai-kei (地雷系) katyusha headband and hair accessories arranged on a black velvet jewelry tray. The headband features black lace with tiny pink roses and dangling ribbon streamers. Next to it: a pair of cross-shaped hairpins, a black ribbon barrette with a silver heart charm, and small teardrop-shaped black gem hair clips. Everything arranged on a background of scattered dried rose petals. Harajuku dark-cute aesthetic, kawaii melancholic vibes. No people.",
    tags: ["지뢰계", "헤드드레스", "리본"]
  },
  {
    id: "jirai-bag",
    prompt: "Product photography with Japanese kawaii aesthetic — a jirai-kei (地雷系) ita-bag style heart-shaped window handbag in glossy black patent leather with pink stitching. The clear heart window shows tiny plushie keychains and pins inside. Black lace trim around the edges, silver chain strap with ribbon woven through it, a small padlock charm dangling from the zipper. Placed on a pink satin cloth next to a tube of dark berry lipstick and a hand mirror. Dark romantic girly aesthetic. No people.",
    tags: ["지뢰계", "가방", "다크로맨틱"]
  },
  {
    id: "jirai-shoes",
    prompt: "Japanese fashion product photo — a pair of jirai-kei (地雷系) platform shoes. Black enamel double-strap Mary Janes with chunky 8cm platform soles, heart-shaped buckles in silver, and detachable black lace ankle cuffs with pink ribbon ties. Photographed from a 3/4 angle on a checkered black-and-white tile floor with scattered rose petals. Soft dreamy lighting. Style reminiscent of YOSUKE or Swankiss shoes. Kawaii-gothic aesthetic. No people.",
    tags: ["지뢰계", "신발", "레이스"]
  },
  {
    id: "jirai-room",
    prompt: "Anime background illustration style — a jirai-kei (地雷系) girl's room interior in a small Tokyo apartment. Black lace curtains filtering soft pink-tinted light through the window. A vanity table covered with cosmetics (dark lipsticks, pink blush), a three-panel mirror with stickers of hearts and crosses on the frame. A black teddy bear and BJD doll sitting on the lace-covered bed. Fairy lights with star shapes on the wall. Dried roses in a dark vase. Subtle melancholic atmosphere but cozy and cute. Japanese room aesthetic with tatami edge visible. No people.",
    tags: ["지뢰계", "인테리어", "다크로맨틱"]
  },
  {
    id: "jirai-doll",
    prompt: "Highly detailed anime-style illustration of a ball-jointed doll (BJD) dressed in jirai-kei (地雷系) fashion. The doll wears a black and pink layered dress with lace overlay, tiny ribbon choker, and miniature platform Mary Jane shoes. Her eyes are large and glass-like with cross-shaped highlights. She sits on a pile of black lace fabric surrounded by small dried flowers, a tiny hand mirror, and scattered heart-shaped confetti. Dark but kawaii aesthetic, like a page from a Japanese doll hobby magazine. Soft dramatic lighting. No real people.",
    tags: ["지뢰계", "인형", "고딕"]
  },
  {
    id: "jirai-parasol",
    prompt: "Japanese fashion accessory product photo — a jirai-kei (地雷系) parasol (日傘) laid open on a bed of black rose petals. The parasol is black with layers of scalloped lace along the edge, pink ribbon trim woven through the lace, and a small cross charm hanging from the handle. The handle itself is wrapped in pink satin ribbon. Overhead shot with soft moody lighting, vintage dark romantic aesthetic typical of Harajuku jirai-kei fashion. No people.",
    tags: ["지뢰계", "양산", "레이스"]
  },

  // ═══ 천사계 (天使界隈 / Tenshi-kai) ═══
  // 천사계 = 일본 하라주쿠의 천사/엔젤 모티프 패션. 화이트x파스텔블루, 날개, 진주, 십자가, 순수한 이미지.
  // Angelic Pretty의 화이트라인, MILK, Emily Temple Cute 감성. 맑고 투명한 느낌.

  {
    id: "angel-dress",
    prompt: "Soft anime watercolor illustration style — a tenshi-kai (天使界隈) angelic coordinate displayed on a white mannequin in a dreamy Japanese boutique. Pure white organdy dress with layers of sheer tulle, delicate silver cross embroidery on the bodice, tiny pearl buttons down the back, and a pale blue satin sash at the waist tied into angel wing-shaped bow. Detachable white feathered collar piece. The mannequin is placed against a backdrop of pale blue sky with soft clouds painted on the wall. Ethereal, pure, innocent Japanese kawaii aesthetic. No people.",
    tags: ["천사계", "레이스", "파스텔"]
  },
  {
    id: "angel-wings",
    prompt: "Dreamy Japanese aesthetic product photography — a pair of decorative angel wings for room decor or cosplay, made of real white feathers layered over a wire frame, adorned with tiny pearl strands, small silver crosses, and sheer organza ribbon streamers in pale blue. The wings are hung on a white wall next to a window with sheer lace curtains letting in soft morning light. A small glass vase with baby's breath flowers sits on the windowsill. Ethereal tenshi-kai (天使界隈) room aesthetic. Pure and heavenly mood. No people.",
    tags: ["천사계", "날개", "인테리어"]
  },
  {
    id: "angel-headpiece",
    prompt: "Delicate anime illustration style — a tenshi-kai (天使界隈) headdress laid on pale blue satin fabric. The headdress is a white lace crown-shaped headband with miniature angel wings on each side, adorned with tiny freshwater pearls, silver star charms, and sheer white ribbon streamers that would trail down past the shoulders. Next to it: a matching pearl choker with a small cross pendant, and white lace wrist cuffs. Arranged like a Japanese fashion magazine accessory spread. Soft glowing lighting, innocent pure aesthetic. No people.",
    tags: ["천사계", "헤드드레스", "레이스"]
  },
  {
    id: "angel-room",
    prompt: "Anime background art style — a tenshi-kai (天使界隈) themed bedroom corner in a Japanese apartment. Walls painted pale celestial blue with cloud stencils. A white iron bed frame with sheer canopy curtains, white lace bedding with pearl-button details. On the nightstand: a small crystal angel figurine, a snow globe with an angel inside, and a Bible-shaped jewelry box. Pearl string lights draped along the ceiling edge. A white bookshelf with manga volumes and small angel statues. Window showing a soft sunset sky. Everything feels pure, clean, heavenly. No people.",
    tags: ["천사계", "인테리어", "드림코어"]
  },
  {
    id: "angel-doll",
    prompt: "Soft watercolor anime illustration — a porcelain-like ball-jointed doll dressed in tenshi-kai (天使界隈) fashion. The doll wears a flowing white organdy dress with pale blue ribbon accents, tiny angel wings attached to the back, a pearl crown headdress, and white Mary Jane shoes with wing details. She sits on a crescent moon-shaped cushion surrounded by cotton clouds, small star ornaments, and scattered pearls. Her glass eyes reflect light like morning dew. Celestial, pure, Japanese kawaii doll aesthetic. No real people.",
    tags: ["천사계", "인형", "파스텔"]
  },
  {
    id: "angel-jewelry",
    prompt: "Japanese accessory brand product photography — a tenshi-kai (天使界隈) jewelry collection arranged on a white marble tray with a lace doily. Items include: a delicate silver necklace with angel wing pendant and tiny moonstone, pearl drop earrings with cross charms, a chain bracelet with alternating pearls and star beads, and a ring with a miniature angel wing design. Everything has a pure silver and pearl color palette. Soft diffused lighting from the side, casting gentle shadows. Small dried baby's breath flowers scattered around. Ethereal and innocent mood. No people.",
    tags: ["천사계", "액세서리", "진주"]
  },
  {
    id: "angel-shoes",
    prompt: "Japanese fashion product photo with soft dreamy editing — a pair of tenshi-kai (天使界隈) shoes. White enamel ballet-style platforms with low chunky heels, featuring tiny angel wing appliques on the ankle straps, pearl button closures, and pale blue satin ribbon laces that tie into bows. Placed on a fluffy white cloud-like fabric with scattered pearl beads and small silver star confetti. Style reminiscent of LIZ LISA or Honey Salon shoes. Pure angelic kawaii aesthetic. No people.",
    tags: ["천사계", "신발", "리본"]
  },

  // ═══ 양산형 (量産型 / Ryousangata) ═══
  // 양산형 = 일본의 대량생산형 오타쿠 여성 패션. 핑크핑크, 리본, 프릴, 하트 모티프 가득.
  // Ank Rouge, Honey Cinnamon, Evelyn 같은 브랜드. 쟈니즈 콘서트/오시카츠 문화와 연결.
  // 극도로 소녀적이고 달콤한 핑크 카와이.

  {
    id: "ryousan-dress",
    prompt: "Bright colorful anime illustration style — a ryousangata (量産型) coordinate on a mannequin in a pink Japanese boutique like Ank Rouge or Honey Cinnamon. Baby pink mini dress covered in white lace ruffles at every tier, an enormous satin ribbon bow at the chest, puffed sleeves with lace trim, and a sweetheart neckline. A matching pink beret with a ribbon sits on top of the mannequin. The background shows the pink interior of a Harajuku shop with heart-shaped mirrors. Extremely sweet, girly, over-the-top kawaii. No people.",
    tags: ["양산형", "프릴", "리본"]
  },
  {
    id: "ryousan-bag",
    prompt: "Japanese kawaii product photography — a ryousangata (量産型) handbag for oshi-katsu (推し活). Pink quilted heart-pattern handbag with gold hardware, a huge satin ribbon bow on the front flap, and a clear pocket window showing colorful fan-made badges and photo cards of an idol inside. Gold chain strap with pink ribbon woven through. Small heart-shaped mirror charm and pompom keychain attached. Placed on a pink gingham cloth next to concert ticket stubs and heart-shaped sunglasses. Sweet maximalist kawaii aesthetic. No people.",
    tags: ["양산형", "가방", "핑크"]
  },
  {
    id: "ryousan-parasol",
    prompt: "Soft pastel anime illustration — a ryousangata (量産型) parasol (日傘) displayed open against a backdrop of cherry blossoms. The parasol is pale pink with white scalloped lace edging, tiny embroidered strawberry and ribbon motifs across the fabric, and a handle wrapped in pink ribbon with a heart charm. Cherry blossom petals are falling around it. Next to the parasol: a matching pink lace hand fan and a small strawberry-shaped coin purse. Sweet Japanese spring aesthetic, extremely girly and cute. No people.",
    tags: ["양산형", "양산", "레이스"]
  },
  {
    id: "ryousan-room",
    prompt: "Detailed anime background illustration — a ryousangata (量産型) girl's vanity corner in a Tokyo apartment. A white princess-style vanity desk with an oval mirror framed in pink with heart decorations. The desk surface is covered with Japanese cosmetics (CANMAKE, JILL STUART), pink perfume bottles, a ribbon-covered tissue box, and a heart-shaped jewelry organizer. Above: a shelf displaying signed idol photos in pink frames, acrylic stands of favorite characters, and a collection of gacha capsule toys. Pink fairy lights and ribbon garlands decorating the wall. A fluffy pink chair with a bear-shaped cushion. Maximum kawaii, every inch is pink and decorated. No people.",
    tags: ["양산형", "인테리어", "핑크"]
  },
  {
    id: "ryousan-plush",
    prompt: "Cute anime illustration style — a collection of ryousangata (量産型) style plushies and stuffed animals arranged on a pink lace bedspread. Center: a large pink teddy bear wearing a tiny frilly dress with a ribbon bow and a mini crown. Around it: a white bunny in a strawberry-print outfit, a small cat plush with heart-shaped eyes, and matching chibi character mascot keychains in pastel colors. Some plushies hold tiny fabric hearts or stars. Scattered around: ribbon bows, fake pearls, and heart-shaped candy. Extremely cute and sweet Japanese kawaii aesthetic, like a page from a Popteen magazine. No people.",
    tags: ["양산형", "인형", "귀여움"]
  },
  {
    id: "ryousan-accessories",
    prompt: "Japanese fashion magazine flat-lay photography — a ryousangata (量産型) accessories collection spread on pink satin fabric. Items include: oversized pink ribbon hair clips, pearl-and-ribbon barrettes, a heart-shaped compact mirror with rhinestones, white lace fingerless gloves with pink ribbon ties, a choker necklace with a big bow pendant, clip-on earrings with dangling hearts and stars, and a set of pastel nail tip samples with ribbon nail art. Everything is pink, white, and gold. Arranged in a aesthetic flat-lay with small rose buds and ribbon scraps filling the gaps. Sweet, girly, over-the-top cute. No people.",
    tags: ["양산형", "액세서리", "리본"]
  },
];

async function generateImage(item, index) {
  // 스타일 프리픽스를 아이템별로 다르게
  const fullPrompt = `${item.prompt} High detail, beautiful composition, Japanese kawaii subculture fashion aesthetic.`;

  console.log(`[${index + 1}/${PROMPTS.length}] Generating: ${item.id}...`);
  console.log(`  Prompt: ${item.prompt.substring(0, 80)}...`);

  try {
    const response = await genai.models.generateContent({
      model: "gemini-2.0-flash-exp-image-generation",
      contents: fullPrompt,
      config: {
        responseModalities: ["IMAGE", "TEXT"],
      },
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) {
      console.error(`  ✗ No response for ${item.id}`);
      return null;
    }

    for (const part of parts) {
      if (part.inlineData) {
        const ext = part.inlineData.mimeType?.includes("jpeg") ? "jpg" : "png";
        const filename = `${item.id}.${ext}`;
        const filepath = `${OUTPUT_DIR}/${filename}`;
        const buffer = Buffer.from(part.inlineData.data, "base64");
        writeFileSync(filepath, buffer);
        console.log(`  ✓ Saved: ${filepath} (${(buffer.length / 1024).toFixed(0)}KB)`);
        return { ...item, filename, ext };
      }
    }

    console.error(`  ✗ No image data for ${item.id}`);
    return null;
  } catch (err) {
    console.error(`  ✗ Error for ${item.id}: ${err.message}`);
    return null;
  }
}

async function main() {
  console.log("=== Generating seed images (Japanese subculture kawaii) ===\n");
  const results = [];
  const failed = [];

  for (let i = 0; i < PROMPTS.length; i++) {
    const result = await generateImage(PROMPTS[i], i);
    if (result) {
      results.push(result);
    } else {
      failed.push(PROMPTS[i].id);
    }
    // API rate limit 대비 2초 대기
    if (i < PROMPTS.length - 1) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  console.log(`\n=== Done: ${results.length}/${PROMPTS.length} images generated ===`);
  if (failed.length > 0) {
    console.log(`Failed: ${failed.join(", ")}`);
  }
}

main();
