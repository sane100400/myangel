#!/usr/bin/env node
/**
 * Nano Banana Pro (gemini-3-pro-image-preview)로 시드 이미지 20장 재생성
 * 사용법: GOOGLE_AI_API_KEY=xxx node scripts/regenerate-seeds.mjs
 */

import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "public", "generated");

const SEEDS = [
  { id: "jirai-dress", prompt: "지뢰계(jirai-kei) 감성의 블랙 레이스 미니 드레스, 핑크 리본 포인트, 다크 로맨틱 무드, 고품질 아이템 일러스트" },
  { id: "jirai-headband", prompt: "지뢰계 스타일 블랙 벨벳 헤드밴드, 레이스 트림과 새틴 리본, 다크 프린세스 감성 아이템" },
  { id: "jirai-bag", prompt: "지뢰계 감성 하트 모양 미니 크로스백, 블랙 에나멜 소재에 핑크 스티칭, 체인 스트랩" },
  { id: "jirai-shoes", prompt: "지뢰계 스타일 블랙 메리제인 슈즈, 청키 플랫폼 힐, 하트 버클과 레이스 디테일" },
  { id: "jirai-room", prompt: "지뢰계 감성 룸 인테리어, 블랙 & 핑크 침실, 레이스 커튼과 캐노피 침대, 봉제인형 가득한 다크 프린세스 방" },
  { id: "jirai-doll", prompt: "고딕 로리타 스타일 인형, 검은 드레스와 레이스 장식, 유리 눈동자의 비스크 돌 느낌" },
  { id: "jirai-parasol", prompt: "지뢰계 스타일 블랙 레이스 양산, 프릴 트림과 리본 장식, 빈티지 고딕 감성" },
  { id: "angel-dress", prompt: "천사계(tenshi-kai) 감성 화이트 오간자 드레스, 파스텔 블루 리본, 투명한 레이스 디테일, 순수하고 몽환적인 무드" },
  { id: "angel-wings", prompt: "천사계 스타일 화이트 깃털 날개 벽장식, 파스텔 조명과 진주 장식, 인테리어 소품" },
  { id: "angel-headpiece", prompt: "천사계 감성 화이트 레이스 헤드피스, 작은 날개 모티프와 진주 체인, 천사 감성 헤어 액세서리" },
  { id: "angel-room", prompt: "천사계 감성 룸 인테리어, 화이트 & 파스텔 블루 침실, 구름 모양 조명과 날개 장식, 드림코어 분위기" },
  { id: "angel-doll", prompt: "천사계 스타일 엔젤 봉제인형, 화이트 드레스와 작은 날개, 파스텔 블루 눈동자, 순수한 감성" },
  { id: "angel-jewelry", prompt: "천사계 감성 주얼리 세트, 진주 목걸이와 날개 모티프 귀걸이, 크리스탈 팔찌, 은은한 광택" },
  { id: "angel-shoes", prompt: "천사계 스타일 화이트 새틴 발레 슈즈, 리본 스트랩과 진주 디테일, 순수한 느낌" },
  { id: "ryousan-dress", prompt: "양산형(ryousangata) 스타일 핑크 프릴 원피스, 대형 리본과 레이스 프릴, 달콤한 소녀 감성 드레스" },
  { id: "ryousan-bag", prompt: "양산형 감성 핑크 하트 미니백, 리본 장식과 진주 체인, 스위트한 소녀 스타일 가방" },
  { id: "ryousan-parasol", prompt: "양산형 스타일 핑크 레이스 양산, 프릴 트림과 리본, 로맨틱한 파스텔 톤" },
  { id: "ryousan-room", prompt: "양산형 감성 핑크 룸 인테리어, 프릴 침구와 봉제인형 가득한 침실, 리본 장식과 파스텔 핑크 가구" },
  { id: "ryousan-plush", prompt: "양산형 스타일 핑크 곰 봉제인형, 리본과 하트 장식, 양산형 코디의 필수 아이템" },
  { id: "ryousan-accessories", prompt: "양산형 감성 액세서리 세트, 핑크 리본 머리끈과 하트 귀걸이, 진주 팔찌 세트" },
];

async function main() {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    console.error("GOOGLE_AI_API_KEY 환경변수가 필요합니다.");
    process.exit(1);
  }

  const genai = new GoogleGenAI({ apiKey });

  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  console.log(`=== Nano Banana Pro 시드 이미지 재생성 (${SEEDS.length}장) ===\n`);

  let success = 0;
  let fail = 0;

  for (let i = 0; i < SEEDS.length; i++) {
    const seed = SEEDS[i];
    const outPath = path.join(OUT_DIR, `${seed.id}.png`);

    console.log(`[${i + 1}/${SEEDS.length}] ${seed.id} 생성 중...`);

    try {
      const fullPrompt = `고품질 일러스트레이션으로 그려주세요. ${seed.prompt}. 디테일하고 아름다운 아트워크, 깔끔한 배경.`;

      const response = await genai.models.generateContent({
        model: "gemini-3-pro-image-preview",
        contents: fullPrompt,
        config: {
          responseModalities: ["IMAGE", "TEXT"],
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: "1K",
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
      console.log(`  ✓ 저장 완료 → ${outPath}`);
      success++;
    } catch (err) {
      console.log(`  ✗ 에러: ${err.message}`);
      fail++;
    }

    // Rate limit 방지 — 2초 대기
    if (i < SEEDS.length - 1) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  console.log(`\n=== 완료: 성공 ${success}장 / 실패 ${fail}장 ===`);
}

main();
