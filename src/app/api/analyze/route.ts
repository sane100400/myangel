import { NextRequest, NextResponse } from "next/server";
import { openai, ANALYSIS_PROMPT } from "@/lib/openai";
import { getRecommendedBrands } from "@/lib/brands";
import type { AnalysisElements } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const { image_url, prompt } = await request.json();

    if (!image_url) {
      return NextResponse.json(
        { error: "image_url은 필수입니다." },
        { status: 400 }
      );
    }

    const userText = prompt
      ? `이 코디 사진을 분석해주세요. 사용자의 추가 요청: "${prompt}"`
      : "이 코디 사진을 분석해주세요.";

    // OpenAI GPT-4o Vision API 호출
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: ANALYSIS_PROMPT,
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: image_url, detail: "high" },
            },
            {
              type: "text",
              text: userText,
            },
          ],
        },
      ],
      max_tokens: 2000,
      response_format: { type: "json_object" },
    });

    const rawResponse = response.choices[0]?.message?.content || "";
    let parsed: {
      elements: AnalysisElements;
      style_tags: string[];
      search_queries: string[];
      suggested_tags: string[];
    };

    try {
      parsed = JSON.parse(rawResponse);
    } catch {
      return NextResponse.json(
        { error: "AI 응답을 파싱할 수 없습니다.", raw: rawResponse },
        { status: 500 }
      );
    }

    // 스타일 태그 기반으로 브랜드 매칭
    const brands = getRecommendedBrands(parsed.style_tags || []);

    return NextResponse.json({
      elements: parsed.elements,
      style_tags: parsed.style_tags || [],
      search_queries: parsed.search_queries || [],
      suggested_tags: parsed.suggested_tags || [],
      brands: brands.map((b) => ({
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
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "분석 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
