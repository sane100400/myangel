import { NextRequest, NextResponse } from "next/server";
import { composePrompt } from "@/lib/prompt-composer";

export async function POST(request: NextRequest) {
  try {
    const { objects, selectedAlternatives } = await request.json();

    if (!objects || !Array.isArray(objects) || objects.length === 0) {
      return NextResponse.json(
        { error: "장면 오브젝트 데이터가 필요합니다." },
        { status: 400 }
      );
    }

    const result = await composePrompt(
      objects,
      selectedAlternatives || {}
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Prompt composition error:", error);
    return NextResponse.json(
      { error: "프롬프트 조합 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
