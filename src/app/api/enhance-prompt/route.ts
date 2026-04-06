import { NextRequest, NextResponse } from "next/server";
import { detectWeakSpans } from "@/lib/prompt-enhancer";

export async function POST(request: NextRequest) {
  try {
    const { prompt, objects } = await request.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "프롬프트를 입력해주세요." },
        { status: 400 }
      );
    }

    if (!objects || !Array.isArray(objects)) {
      return NextResponse.json(
        { error: "장면 오브젝트 데이터가 필요합니다." },
        { status: 400 }
      );
    }

    const weakSpans = await detectWeakSpans(prompt.trim(), objects);

    return NextResponse.json({ weakSpans });
  } catch (error) {
    console.error("Prompt enhancement error:", error);
    return NextResponse.json(
      { error: "프롬프트 강화 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
