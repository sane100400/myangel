import { NextRequest, NextResponse } from "next/server";
import { analyzePrompt } from "@/lib/prompt-analyzer";

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "프롬프트를 입력해주세요." },
        { status: 400 }
      );
    }

    if (prompt.length > 500) {
      return NextResponse.json(
        { error: "프롬프트는 500자 이내로 입력해주세요." },
        { status: 400 }
      );
    }

    const objects = await analyzePrompt(prompt.trim());

    return NextResponse.json({ objects });
  } catch (error) {
    console.error("Prompt analysis error:", error);
    return NextResponse.json(
      { error: "프롬프트 분석 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
