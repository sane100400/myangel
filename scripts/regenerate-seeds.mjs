#!/usr/bin/env node
/**
 * Nano Banana Pro (gemini-3-pro-image-preview)로 시드 이미지 20장 재생성
 * 영문 고품질 상세 프롬프트 + 다양한 비율 + 애니/실사 혼합
 * 프리미엄 4장은 7줄 이상 초상세 프롬프트
 *
 * 사용법: node scripts/regenerate-seeds.mjs
 *   (로컬 .env.local 또는 환경변수에서 GOOGLE_AI_API_KEY 읽음)
 */

import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public", "generated");

// .env.local 또는 .env 로드
config({ path: path.join(ROOT, ".env.local") });
config({ path: path.join(ROOT, ".env") });

const SEEDS = [
  // ══════════════════════════════════════════════
  // ── 지뢰계 (Jirai-kei) ──
  // ══════════════════════════════════════════════

  // ★ PREMIUM — 7줄+ 초상세
  {
    id: "jirai-dress",
    aspect: "3:4",
    premium: true,
    prompt: `A breathtaking jirai-kei (地雷系) fashion item illustration blending anime cel-shading aesthetics with photorealistic fabric rendering, inspired by MA*RS and Ank Rouge brand aesthetics.
The centerpiece is a black lace mini dress displayed on an antique Victorian dress form. The bodice features an intricate overlay of French Chantilly lace with rose and thorn motifs, beneath which lies smooth black duchess satin with a subtle sheen. A sweetheart neckline is trimmed with hand-sewn scalloped lace and tiny jet bead accents that catch the light like dark jewels.
At the waist, a wide pink satin obi-style ribbon is tied into a dramatic asymmetric bow, its long tails cascading down past the hemline, each tail edged with narrow black lace. The skirt is constructed in four tiers: the first in gathered black chiffon, the second in ruffled black tulle with scattered pink rosette appliqués, the third in pleated black organza, and the final layer in a scalloped lace hem revealing just a hint of hot pink tulle petticoat beneath.
Detachable puff sleeves in black organza are gathered at the shoulder with miniature ribbon roses and connected by thin pearl chain shoulder straps. Tiny silver heart locket buttons run down the front placket.
The background is a moody boudoir setting — an antique gilded mirror reflects soft candlelight, a vanity table holds perfume bottles with black ribbon-tied necks, dried black roses and baby's breath spill from a dark ceramic vase, and vintage lace fabric drapes artfully across the scene. Warm golden side-lighting creates dramatic shadows while highlighting the lace texture. Every thread, every bead, every satin fold is rendered in extraordinary detail.`,
  },
  {
    id: "jirai-headband",
    aspect: "1:1",
    prompt: `A meticulously detailed jirai-kei (地雷系) headband accessory in photorealistic product photography style. The headband is crafted from plush black velvet with an oversized asymmetric bow layered with midnight Chantilly lace, finished with cascading thin satin ribbons and tiny silver skull charms. Seed pearl drops hang from the bow edges catching the light. Resting on a dark burgundy velvet jewelry stand against moody black tulle and dried lavender. Macro photography, warm tungsten lighting from the left, extraordinary fiber and bead detail, Japanese dark princess aesthetic.`,
  },
  {
    id: "jirai-bag",
    aspect: "1:1",
    prompt: `A gorgeous jirai-kei (地雷系) heart-shaped mini crossbody bag in high-end product photography. Glossy black patent leather with dimensional heart silhouette, hot pink contrast cross-stitch edges. Silver chain strap with heart links, padlock clasp with dangling key charm. Pink satin interior lining peeks out. Bow and mirror charms on zipper pull. On dark marble with scattered black and pink rose petals, vintage lace doily underneath, directional lighting creating luxurious reflections on patent leather. Every stitch and chain link captured in extreme detail.`,
  },
  {
    id: "jirai-shoes",
    aspect: "4:3",
    prompt: `Jirai-kei (地雷系) Mary Jane platform shoes in detailed anime illustration style with realistic material textures. Black glossy leather rounded toe, 8cm chunky matte platform soles with pink edges. Heart-shaped silver buckle straps, black lace overlay panels, tiny pink ribbon rosettes near ankle. On a dark vanity table with jewelry and velvet ribbons. Dramatic side lighting creating sharp highlights, anime line detail with photorealistic rendering, Japanese street fashion editorial quality.`,
  },
  {
    id: "jirai-room",
    aspect: "16:9",
    prompt: `A breathtaking wide-angle jirai-kei (地雷系) bedroom capturing the dark princess aesthetic. Canopy bed in black lace curtains and wine velvet, pink and black satin cushions, gothic plush bears. Vintage black vanity with ornate gilded mirror reflecting fairy lights. Shelves of bisque dolls in gothic dresses, perfume bottles, dark dried flowers. Dark floral damask wallpaper with shimmer. Crystal chandelier casting fractured warm light. Pink neon 'DREAM' glowing softly. Every surface layered with lace doilies, ribbon bows, and romantic details. Cinematic photorealistic interior, moody yet inviting, extraordinary decorative detail.`,
  },
  {
    id: "jirai-doll",
    aspect: "3:4",
    prompt: `A hauntingly beautiful gothic lolita bisque doll in semi-realistic anime style blending 2D and 3D. Porcelain-white luminous skin, oversized violet glass eyes with deep iris refraction, long curled black lashes, rosebud berry mouth. Jet black ringlet curls with purple highlights, miniature black lace bonnet with satin ribbons. Multi-layered black dress with pintuck pleating, Valenciennes lace trim, fabric roses, bishop sleeves with ribbon cuffs. Holds miniature parasol with lace edge. Inside antique glass dome on velvet pedestal with dried roses and vintage jewelry. Dramatic chiaroscuro, museum-quality textile detail, Japanese gothic meets European dollmaking.`,
  },
  {
    id: "jirai-parasol",
    aspect: "1:1",
    prompt: `An exquisite jirai-kei (地雷系) black lace parasol in overhead flat-lay photography. Fully opened revealing layered Chantilly lace — roses, thorny vines, butterflies in black mesh. Double-layered ruffle trim alternating black and wine satin, tiny bow accents at each spoke tip. Black lacquer carved handle with silver skull-and-bow finial, detachable pearl and crystal wrist chain. On soft lavender silk with scattered black petals and antique silver hairpins. Diffused studio lighting, extraordinary lace thread and ribbon detail, vintage gothic Japanese elegance.`,
  },

  // ══════════════════════════════════════════════
  // ── 천사계 (Tenshi-kai / Angel aesthetic) ──
  // ══════════════════════════════════════════════

  // ★ PREMIUM — 7줄+ 초상세
  {
    id: "angel-dress",
    aspect: "3:4",
    premium: true,
    prompt: `An otherworldly tenshi-kai (天使界隈) angel aesthetic dress rendered in a dreamy anime illustration style that seems to glow from within, inspired by Angelic Pretty and BABY, THE STARS SHINE BRIGHT aesthetics.
The dress is displayed on a ethereal white mannequin that appears to float among wisps of cloud-like tulle. The construction begins with a structured corset bodice in white duchess satin, completely covered in an overlay of hand-embroidered white organza featuring feather, wing, and tiny star motifs stitched with pearlescent thread that shimmers with every angle change.
The neckline is a gentle sweetheart shape framed by a delicate peter pan collar in the finest Brussels lace, each scallop tipped with a single seed pearl. A row of twelve tiny crystal dewdrop buttons runs from collar to waist, each set in a silver filigree setting shaped like a miniature angel wing. At the center of the bodice, a small cameo brooch depicting an angel in profile is framed by a wreath of freshwater pearls.
The sleeves are puffed and gathered in triple layers of tulle — the innermost layer opaque white, the middle layer in palest blue, the outer in sheer white organza — creating a dimensional cloud effect. Each sleeve is cinched at the wrist with a satin ribbon that ties in a delicate bow.
The sash at the waist is a wide pastel blue duchesse satin ribbon, tied at the back into an enormous cathedral bow with four trailing tails that reach nearly to the floor, each tail edge finished with the finest picot lace. From the bow center, thin satin streamers extend upward and outward like stylized angel wings.
The skirt is a masterwork of graduated layers — seven tiers of alternating organza and tulle, each layer slightly longer than the last, creating a cascading waterfall effect. Every tier is edged with a different white lace: the first in Valenciennes, the second in guipure, the third in Chantilly, and so on, creating a textural symphony. The innermost petticoat layer has a subtle pastel blue tint visible through the sheer outer layers.
Surrounding the dress, white feathers drift in slow motion, catching soft backlighting that creates halos around each one. Baby's breath and white peonies frame the base. The entire scene is bathed in soft, warm ethereal light with gentle lens flare and a dreamy soft-focus vignette at the edges. Every single pearl, every embroidery stitch, every lace pattern is rendered with extraordinary loving detail — this is a dress that belongs in heaven.`,
  },
  {
    id: "angel-wings",
    aspect: "4:3",
    prompt: `Magnificent tenshi-kai (天使界隈) decorative angel wings wall art in photorealistic interior style. Large feathered wings spanning one meter each, hundreds of individually placed white goose feathers graduating from soft down to dramatic flight feathers. Intertwined warm white LED fairy lights creating golden glow from within. Cascading pearl chains and crystal prisms casting rainbow refractions. Dried baby's breath and white rose buds between feather layers. Mounted on white wall above console table with candles and crystal vase. Soft golden hour lighting, every feather barb visible, ethereal heavenly atmosphere, Japanese angel aesthetic.`,
  },
  {
    id: "angel-headpiece",
    aspect: "1:1",
    prompt: `A delicate tenshi-kai (天使界隈) angel headpiece in anime-meets-jewelry photography style. Thin silver circlet with two miniature angel wings in white resin feathers tipped with iridescent coating. Freshwater pearl chains drape across forehead in gentle arc to central teardrop crystal. Scattered Swarovski crystals like stars catching every angle. White satin ribbon ties. On white velvet bust form with tulle wisps and white flowers, gentle diffused lighting, extreme macro detail on metalwork, pearl luster, and crystal facets, pure angelic elegance.`,
  },

  // ★ PREMIUM — 7줄+ 초상세
  {
    id: "angel-room",
    aspect: "16:9",
    premium: true,
    prompt: `A breathtaking, impossibly detailed tenshi-kai (天使界隈) angel aesthetic bedroom interior captured in cinematic wide-angle photography, representing the pinnacle of Japanese dreamcore interior design.
The room is an ethereal sanctuary bathed in soft, diffused light that seems to emanate from everywhere and nowhere — as if the room itself exists inside a cloud. The ceiling features a large custom cloud-shaped LED installation, its edges softly graduated and glowing with warm white light that fills the entire room with an even, flattering luminance. Smaller cloud lights of various sizes float at different heights, connected by nearly invisible wires.
The bed is the room's centerpiece — a queen-sized frame in white-painted wrought iron with elaborate scrollwork depicting angel wings, vines, and stars. A magnificent canopy constructed from six layers of progressively sheerer organza drapes from a crown-shaped frame above, each layer in a slightly different shade from pure white to the palest whisper of blue. The bedding is a cloud of white: a down duvet in Egyptian cotton sateen, five different sizes of pillows in white linen and lace cases, cloud-shaped cushions in plush minky fabric, and a hand-crocheted throw blanket. Among the pillows sit a curated collection of angel plush dolls — each unique, each with tiny wings and halos.
Above the headboard, a pair of large decorative angel wings (real preserved goose feathers, each hand-placed) is mounted symmetrically, with hidden LED strip lighting behind casting a soft halo glow on the wall. Between the wings, a circular mirror framed in white porcelain roses reflects the chandelier.
That chandelier is extraordinary — a cascade of teardrop crystal prisms and freshwater pearls on silver chains, creating a gentle tinkling sound with any air movement and casting hundreds of tiny rainbow light spots across the ceiling and walls when sunlight touches it.
White French provincial furniture lines the room: a vanity table with a tri-fold mirror framed in hand-sculpted white roses, its surface arranged with crystal perfume bottles, a pearl-handled brush set, and a small jewelry tree. A glass-front bookcase displays a collection of snow globes, crystal angel figurines, and leather-bound journals with wing-embossed covers. A small writing desk near the window has a white feather quill pen and stationery.
The floor is covered in an ultra-plush white faux fur rug so thick it seems to swallow footsteps. Sheer white curtains with subtle lace patterns billow gently in a breeze from a slightly open window, through which soft golden morning light streams, creating visible light beams in the room's atmosphere. The walls are painted in the palest blue-white and adorned with a few small oval-framed oil paintings of cloudscapes and angel imagery in gilded frames.
Every surface whispers of heaven — pearl knob handles, crystal drawer pulls, white silk flowers in crystal vases, candles in angel-shaped holders. The color palette never breaks from white, pearl, palest blue, and soft gold. It is serene, sacred, and impossibly beautiful.`,
  },
  {
    id: "angel-doll",
    aspect: "3:4",
    prompt: `An adorable tenshi-kai (天使界隈) angel plush doll in soft anime illustration style with product photography lighting. 30cm tall, premium snow-white minky fabric with impossibly soft appearance. Tiny white organza dress with lace trim and miniature blue satin bow. Layered white felt wings with pearl bead accents on her back. Large round pastel blue glass bead eyes with painted starlight reflections, rosy flocked cheeks, tiny embroidered smile. Platinum blonde yarn hair with satin ribbon halo headband. Sits on white tulle clouds with scattered pearl beads. Soft wraparound lighting, ultra kawaii, every stitch visible, pure innocence.`,
  },
  {
    id: "angel-jewelry",
    aspect: "4:3",
    prompt: `An exquisite tenshi-kai (天使界隈) angel jewelry collection in luxurious flat-lay on white silk charmeuse. Three-strand freshwater pearl choker with silver angel wing clasp; dangling angel wing earrings holding teardrop pearls; chain bracelet with alternating pearls and crystal stars; miniature wing ring in silver; pearl-studded hair comb with crystal wing motif. Carefully spaced with loose pearls, tiny white flowers, and ribbon wisps. Overhead bright diffused lighting, every pearl's unique luster and crystal facet captured, high-end Japanese jewelry editorial quality.`,
  },
  {
    id: "angel-shoes",
    aspect: "1:1",
    prompt: `Elegant tenshi-kai (天使界隈) white satin ballet flats in anime-inspired fashion illustration with photorealistic materials. Rounded toe in lustrous white duchess satin, crisscross satin ribbon ankle straps tying in petite bows, row of tiny freshwater pearls along the opening. Pale blue suede insole with embossed wing. Subtle shimmer coating catching pastel rainbow light. On white marble, one standing one on side, with baby's breath, ribbons, and pearl beads. Clean soft lighting with pink and blue reflections, every satin fold and pearl precise, pure innocent aesthetic.`,
  },

  // ══════════════════════════════════════════════
  // ── 양산형 (Ryousangata) ──
  // ══════════════════════════════════════════════

  // ★ PREMIUM — 7줄+ 초상세
  {
    id: "ryousan-dress",
    aspect: "3:4",
    premium: true,
    prompt: `A spectacular ryousangata (量産型) pink frill one-piece dress rendered in vivid anime illustration style with meticulous attention to every kawaii detail, channeling the essence of Ank Rouge and ROJITA brand aesthetics.
The dress is displayed on a cute pink velvet mannequin torso placed in an idealized kawaii boutique setting. The bodice is constructed in baby pink cotton sateen with vertical pintuck pleating creating subtle texture, finished with a row of twelve tiny pearlescent heart-shaped buttons running from the rounded peter pan collar to the waist. The collar itself is a double layer — the under-collar in crisp white cotton, the over-collar in delicate white cotton lace with a scalloped edge, meeting at the center front where a small vintage-style cameo brooch in pink and white depicts a rose.
The sleeves are dramatic puffs gathered at the shoulder with elastic and rows of narrow lace, creating a voluminous cloud-like shape. Each sleeve is cinched at the elbow with a hot pink satin ribbon tied in a triple-loop bow, below which a waterfall of lace ruffles cascades to the wrist, finished with a narrow ribbon cuff.
At the waist, an enormous hot pink duchess satin sash wraps around and ties into a spectacular butterfly bow at the back — the bow itself is structured with internal boning to maintain its shape, each loop standing proud and each tail cascading down to below the knee hem. The bow tails are edged with narrow white picot lace.
The skirt is the showpiece — five tiers of cascading ruffles, each layer slightly longer than the last: the first tier in gathered pink chiffon, the second in white cotton eyelet with embroidered flower patterns, the third in pink organza with scattered tiny fabric rosette appliqués, the fourth in white Valenciennes lace, and the final tier in pink satin with a scalloped hem. Beneath all five tiers, a structured petticoat of layered tulle in white and hot pink gives the skirt its volume.
Hidden details add to the magic: the dress lining is printed with a tiny heart pattern in pink on white, ribbon loops inside the waist allow adjustment, and a tiny embroidered crown logo is hidden inside the collar.
The boutique background glows with warm pink lighting — shelves display folded pastel garments tied with ribbons, heart-shaped mirrors reflect fairy lights, plush bears and bunnies sit in white wicker baskets, and ribbon garlands in pink and white festoon the ceiling. A crystal chandelier with pink glass drops casts sparkly light across the scene. Every ruffle catches the light differently, every lace pattern is distinct, every ribbon fold has weight and dimension — this is kawaii fashion perfection.`,
  },
  {
    id: "ryousan-bag",
    aspect: "1:1",
    prompt: `An irresistibly cute ryousangata (量産型) pastel pink heart-shaped mini handbag in high-quality product photography. Quilted pink faux leather with diamond-pattern stitching creating puffy pillow effect. Large hot pink satin bow on front with golden heart turn-lock clasp below. Chain strap alternating gold links and woven pink ribbon. Key, star, and bow charms dangling from side ring. On fluffy pink tulle with pearl beads, silk flower petals, and teddy bear keychain. Bright warm studio lighting with pink ambient glow, every quilted puff and chain link gleaming, candy kawaii colors.`,
  },
  {
    id: "ryousan-parasol",
    aspect: "1:1",
    prompt: `A romantic ryousangata (量産型) pink lace parasol in anime-meets-photography style. Open and tilted at a charming angle revealing three ruffle layers — outer pink organza, middle white Chantilly lace florals, inner smooth pink satin. Eight spoke tips with alternating pink and white satin bows with pearl centers. Carved handle wrapped in pink ribbon with heart crystal charm on wrist loop. Soft gradient pink to white background with floating cherry blossom petals. Bright even lighting, delicate pastel tones, every lace and ribbon fold detailed, romantic feminine Japanese aesthetic.`,
  },
  {
    id: "ryousan-room",
    aspect: "16:9",
    prompt: `A maximally cute ryousangata (量産型) pink bedroom bursting with kawaii energy in wide-angle interior photography. Explosion of pink — ruffled bedding piled three layers high with heart pillows and dozens of plush dolls arranged meticulously. Heart-shaped vanity mirror with pink LED frame, perfume bottles and makeup. Pink ribbon garlands and fairy lights criss-crossing ceiling. White French provincial furniture with pink trim, glass cabinets showing handbag collections. Fluffy pink rug, lace-overlay curtains, framed fashion prints. Warm pink-tinted ambient lighting with fairy light sparkles everywhere, photorealistic, every element distinct and detailed, ultimate Japanese girly room.`,
  },
  {
    id: "ryousan-plush",
    aspect: "1:1",
    prompt: `The most adorable ryousangata (量産型) pink teddy bear plushie in detailed anime illustration with toy photography softness. Ultra-soft baby pink minky fabric, slightly oversized head for extra cuteness. Tiny frilly lace and satin dress with bow, miniature pearl necklace, tiny bow clipped to one ear. Large embroidered heart eyes in darker pink with white highlight stitching, rosy blush circles. Sits among lace doilies, silk roses, smaller plush friends, holding tiny 'LOVE' heart pillow. Soft warm lighting, pastel harmony, every stitch visible, peak kawaii Japanese plush culture.`,
  },
  {
    id: "ryousan-accessories",
    aspect: "4:3",
    prompt: `A delightful ryousangata (量産型) accessory collection in Instagram-perfect flat-lay on pink satin. Oversized bow hair clips in hot and baby pink with pearl centers; heart-shaped dangling earrings with pearl drops; layered bracelet set of pearl strands, pink ribbon weave, and heart chain; dainty bow ring in rose gold; ribbon hair ties with crystal hearts; rhinestone-studded pink compact mirror. Carefully spaced with pearl beads, silk roses, and curled ribbons. Overhead bright cheerful lighting, vivid yet harmonious pink and white, every rhinestone sparkling and pearl luminous, Japanese girly accessory culture beautifully curated.`,
  },
];

async function main() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    console.error("GOOGLE_AI_API_KEY 환경변수가 필요합니다.");
    process.exit(1);
  }

  console.log(`API Key: ${apiKey.slice(0, 8)}...`);
  const genai = new GoogleGenAI({ apiKey });

  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const premiumCount = SEEDS.filter(s => s.premium).length;
  console.log(`=== Nano Banana Pro 시드 이미지 재생성 (${SEEDS.length}장, 프리미엄 ${premiumCount}장) ===\n`);

  let success = 0;
  let fail = 0;

  for (let i = 0; i < SEEDS.length; i++) {
    const seed = SEEDS[i];
    const outPath = path.join(OUT_DIR, `${seed.id}.png`);
    const label = seed.premium ? "★ PREMIUM" : "  일반";

    console.log(`[${i + 1}/${SEEDS.length}] ${label} ${seed.id} (${seed.aspect}) 생성 중...`);

    try {
      const response = await genai.models.generateContent({
        model: "gemini-3-pro-image-preview",
        contents: seed.prompt,
        config: {
          responseModalities: ["IMAGE", "TEXT"],
          imageConfig: {
            aspectRatio: seed.aspect,
            imageSize: seed.premium ? "2K" : "1K",
          },
        },
      });

      const parts = response.candidates?.[0]?.content?.parts;
      let imageData = null;

      if (parts) {
        for (const part of parts) {
          if (part.inlineData) {
            imageData = part.inlineData.data;
            break;
          }
        }
      }

      if (!imageData) {
        console.log(`  ✗ 이미지 데이터 없음 — 건너뜀`);
        fail++;
        continue;
      }

      fs.writeFileSync(outPath, Buffer.from(imageData, "base64"));
      const sizeKB = Math.round(fs.statSync(outPath).size / 1024);
      console.log(`  ✓ 저장 완료 (${sizeKB}KB) → ${seed.id}.png`);
      success++;
    } catch (err) {
      console.log(`  ✗ 에러: ${err.message}`);
      fail++;
    }

    // Rate limit 방지
    if (i < SEEDS.length - 1) {
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  console.log(`\n=== 완료: 성공 ${success}장 / 실패 ${fail}장 ===`);
}

main();
