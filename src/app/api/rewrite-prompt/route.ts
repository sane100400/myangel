import { NextRequest, NextResponse } from "next/server";
import { rewriteNatural } from "@/lib/prompt-composer";

export async function POST(request: NextRequest) {
  try {
    const { original, modified } = await request.json();

    if (!original || !modified) {
      return NextResponse.json(
        { error: "원본과 수정된 문장이 필요합니다." },
        { status: 400 }
      );
    }

    const rewritten = await rewriteNatural(original, modified);

    return NextResponse.json({ rewritten });
  } catch (error) {
    console.error("Rewrite error:", error);
    return NextResponse.json(
      { error: "문장 다듬기 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
