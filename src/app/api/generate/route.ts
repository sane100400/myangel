import { NextRequest, NextResponse } from "next/server";
import { genai } from "@/lib/gemini";
import { getRecommendedBrands } from "@/lib/brands";
import { STYLE_PRESETS } from "@/lib/seed-data";

export async function POST(request: NextRequest) {
  try {
    const { prompt, style } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "프롬프트를 입력해주세요." },
        { status: 400 }
      );
    }

    // 스타일 프리셋이 선택된 경우 프롬프트에 힌트 추가
    let fullPrompt = prompt;
    const preset = style
      ? STYLE_PRESETS.find((p) => p.id === style || p.label === style)
      : null;

    if (preset) {
      fullPrompt = `${preset.prompt_hint}. ${prompt}`;
    }

    // 고품질 이미지 생성을 위한 프롬프트 보강
    fullPrompt = `고품질 일러스트레이션으로 그려주세요. ${fullPrompt}. 디테일하고 아름다운 아트워크, 깔끔한 배경.`;

    // Gemini 이미지 생성 호출
    const response = await genai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: fullPrompt,
      config: {
        responseModalities: ["IMAGE", "TEXT"],
      },
    });

    // 응답에서 이미지 데이터 추출
    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts) {
      return NextResponse.json(
        { error: "이미지 생성에 실패했습니다. 다시 시도해주세요." },
        { status: 500 }
      );
    }

    let imageData: string | null = null;
    let mimeType: string = "image/png";

    for (const part of parts) {
      if (part.inlineData) {
        imageData = part.inlineData.data as string;
        mimeType = part.inlineData.mimeType || "image/png";
        break;
      }
    }

    if (!imageData) {
      return NextResponse.json(
        { error: "이미지를 생성할 수 없었습니다. 프롬프트를 수정해서 다시 시도해주세요." },
        { status: 500 }
      );
    }

    // 스타일 기반 브랜드 추천
    const styleTags: string[] = [];
    if (preset) {
      styleTags.push(preset.label);
    }
    // 프롬프트에서 스타일 키워드 추출
    const keywords = ["지뢰계", "천사계", "양산형", "로리타", "고스로리", "페어리코어", "Y2K", "고딕", "다크로맨틱", "스위트", "페미닌"];
    for (const kw of keywords) {
      if (prompt.includes(kw) && !styleTags.includes(kw)) {
        styleTags.push(kw);
      }
    }

    const brands = getRecommendedBrands(styleTags);

    return NextResponse.json({
      image: `data:${mimeType};base64,${imageData}`,
      style_tags: styleTags,
      brands: brands.slice(0, 6).map((b) => ({
        id: b.id,
        name: b.name,
        nameJa: b.nameJa,
        storeUrl: b.storeUrl,
        description: b.description,
        priceRange: b.priceRange,
        styles: b.styles,
      })),
    });
  } catch (error) {
    console.error("Image generation error:", error);
    return NextResponse.json(
      { error: "이미지 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
