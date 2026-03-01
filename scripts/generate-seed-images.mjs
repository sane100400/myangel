import { GoogleGenAI } from "@google/genai";
import { writeFileSync, mkdirSync, existsSync } from "fs";

const API_KEY = process.env.GOOGLE_AI_API_KEY || "AIzaSyD932AmA2V9p-IXu5tpM6YJGohVib0KhFM";
const genai = new GoogleGenAI({ apiKey: API_KEY });

const OUTPUT_DIR = "public/generated";
if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

const PROMPTS = [
  // 지뢰계 아이템
  { id: "jirai-dress", prompt: "A gothic black lace dress with pink ribbons displayed on a white mannequin torso, dark romantic jirai-kei fashion, studio photography on pastel background, no people", tags: ["지뢰계", "레이스", "다크로맨틱"] },
  { id: "jirai-headband", prompt: "A black lace headband with small dark roses and ribbon bows, jirai-kei hair accessory, product photography on soft pink fabric background, no people", tags: ["지뢰계", "헤드드레스", "리본"] },
  { id: "jirai-bag", prompt: "A small heart-shaped black velvet handbag with silver chains and lace trim, jirai-kei accessory, dark romantic style, product photo on marble surface, no people", tags: ["지뢰계", "가방", "다크로맨틱"] },
  { id: "jirai-shoes", prompt: "Black platform Mary Jane shoes with white lace trim and ribbon bows, jirai-kei shoes, product photography on wooden floor, no people", tags: ["지뢰계", "신발", "레이스"] },
  { id: "jirai-room", prompt: "A dark romantic bedroom corner with black lace curtains, dried roses in a vase, gothic candle holder, and vintage mirror, jirai-kei room aesthetic, no people", tags: ["지뢰계", "인테리어", "다크로맨틱"] },
  { id: "jirai-doll", prompt: "A gothic porcelain ball-jointed doll wearing a black and red lace dress with ribbon details, sitting on a velvet cushion, dark romantic aesthetic, no people", tags: ["지뢰계", "인형", "고딕"] },
  { id: "jirai-parasol", prompt: "A black lace parasol with pink ribbon trim, elegant dark romantic jirai-kei accessory, product photography on white background, no people", tags: ["지뢰계", "양산", "레이스"] },

  // 천사계 아이템
  { id: "angel-dress", prompt: "A pure white organza dress with delicate lace and pearl details on a mannequin, angelic tenshi-kai fashion, dreamy soft lighting, pastel blue background, no people", tags: ["천사계", "레이스", "파스텔"] },
  { id: "angel-wings", prompt: "Decorative white feather angel wings with pearl beads and satin ribbons, wall decor item, soft pastel lighting, product photography, no people", tags: ["천사계", "날개", "인테리어"] },
  { id: "angel-headpiece", prompt: "A white lace headdress with tiny pearl flowers and sheer ribbon streamers, tenshi-kai hair accessory, product photo on light blue satin, no people", tags: ["천사계", "헤드드레스", "레이스"] },
  { id: "angel-room", prompt: "A dreamy pastel blue room corner with white lace curtains, glass angel figurines, pearl string lights, and soft cushions, angelic aesthetic interior, no people", tags: ["천사계", "인테리어", "드림코어"] },
  { id: "angel-doll", prompt: "A porcelain doll in a white lace angel dress with tiny wings, sitting on a cloud-like cushion, soft pastel lighting, ethereal angelic aesthetic, no people", tags: ["천사계", "인형", "파스텔"] },
  { id: "angel-jewelry", prompt: "Delicate silver jewelry set with moonstone and pearl on white lace — necklace, earrings and bracelet, tenshi-kai accessories, soft lighting, no people", tags: ["천사계", "액세서리", "진주"] },
  { id: "angel-shoes", prompt: "White ballet flats with satin ribbon ties and small pearl embellishments, angelic tenshi-kai shoes, product photography on pastel fabric, no people", tags: ["천사계", "신발", "리본"] },

  // 양산형 아이템
  { id: "ryousan-dress", prompt: "A cute pink frilly dress with white lace collar and large bow on a mannequin, sweet ryousangata fashion, bright studio lighting on pink background, no people", tags: ["양산형", "프릴", "리본"] },
  { id: "ryousan-bag", prompt: "A heart-shaped pink quilted handbag with gold chain strap and ribbon charm, sweet ryousangata style bag, product photo on cute background, no people", tags: ["양산형", "가방", "핑크"] },
  { id: "ryousan-parasol", prompt: "A light pink parasol with white lace edge and ribbon bows, cute ryousangata fashion accessory, product photography on flower background, no people", tags: ["양산형", "양산", "레이스"] },
  { id: "ryousan-room", prompt: "A cute pink bedroom vanity table with heart mirror, ribbon-decorated cosmetics, plush bear, and fairy lights, sweet ryousangata room decor, no people", tags: ["양산형", "인테리어", "핑크"] },
  { id: "ryousan-plush", prompt: "A collection of cute handmade stuffed animals - bears and bunnies wearing tiny frilly dresses with ribbon bows, sweet ryousangata style plushies, arranged on lace doily, no people", tags: ["양산형", "인형", "귀여움"] },
  { id: "ryousan-accessories", prompt: "A flat lay of cute ryousangata accessories: pink hair clips with ribbons, pearl hairpins, heart-shaped compact mirror, and lace gloves, arranged on pastel background, no people", tags: ["양산형", "액세서리", "리본"] },
];

async function generateImage(item, index) {
  const fullPrompt = `High quality product photography style illustration. ${item.prompt}. Beautiful detailed artwork, clean composition.`;

  console.log(`[${index + 1}/${PROMPTS.length}] Generating: ${item.id}...`);

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
  console.log("=== Generating seed images ===\n");
  const results = [];

  for (let i = 0; i < PROMPTS.length; i++) {
    const result = await generateImage(PROMPTS[i], i);
    if (result) results.push(result);
    // API rate limit 대비 1.5초 대기
    if (i < PROMPTS.length - 1) {
      await new Promise(r => setTimeout(r, 1500));
    }
  }

  console.log(`\n=== Done: ${results.length}/${PROMPTS.length} images generated ===`);

  // seed-data에 사용할 코드 출력
  console.log("\n// --- Copy this to seed-data.ts ---");
  console.log("export const SEED_MOOD_IMAGES = [");
  for (const r of results) {
    console.log(`  {`);
    console.log(`    id: "${r.id}",`);
    console.log(`    image_url: "/generated/${r.filename}",`);
    console.log(`    title: "${r.id.replace(/-/g, " ")}",`);
    console.log(`    tags: ${JSON.stringify(r.tags)},`);
    console.log(`  },`);
  }
  console.log("];");
}

main();
