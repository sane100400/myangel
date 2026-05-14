import { NextRequest, NextResponse } from "next/server";
import { detectWeakSpans } from "@/lib/prompt-enhancer";
import { createClient } from "@/lib/supabase/server";
import { assertSameOrigin, rateLimitOk, rateKey } from "@/lib/api-guard";
import { reportServerError } from "@/lib/logger";

const MAX_PROMPT_LEN = 4000;

export async function POST(request: NextRequest) {
  try {
    const blocked = assertSameOrigin(request);
    if (blocked) return blocked;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!rateLimitOk(rateKey("enhance", user?.id ?? null, request), 30, 60_000)) {
      return NextResponse.json(
        { error: "요청이 너무 많아요. 잠시 후 다시 시도해주세요." },
        { status: 429 }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "잘못된 요청 본문" }, { status: 400 });
    }

    const prompt = body.prompt;
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "프롬프트를 입력해주세요." }, { status: 400 });
    }
    if (prompt.length > MAX_PROMPT_LEN) {
      return NextResponse.json(
        { error: `프롬프트는 ${MAX_PROMPT_LEN}자 이내로 입력해주세요.` },
        { status: 400 }
      );
    }

    const weakSpans = await detectWeakSpans(prompt.trim());
    return NextResponse.json({ weakSpans });
  } catch (error) {
    await reportServerError({ route: "enhance-prompt.POST", error });
    return NextResponse.json(
      { error: "프롬프트 강화 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
