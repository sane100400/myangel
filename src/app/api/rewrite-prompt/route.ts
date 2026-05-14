import { NextRequest, NextResponse } from "next/server";
import { genai } from "@/lib/gemini";
import { createClient } from "@/lib/supabase/server";
import { assertSameOrigin, rateLimitOk, rateKey } from "@/lib/api-guard";
import { detectPromptLanguage } from "@/lib/prompt-enhancer";
import { reportServerError } from "@/lib/logger";
import { sanitizeRewrittenPrompt } from "@/lib/prompt-output-safety";

const MAX_LEN = 4000;

async function rewriteNatural(original: string, modified: string): Promise<string> {
  const language = detectPromptLanguage(modified || original);
  const languageRule =
    language === "en"
      ? "최종 문장은 자연스러운 영어 이미지 생성 프롬프트로 작성해. 한국어로 번역하지 마."
      : "최종 문장은 자연스러운 한국어 이미지 생성 프롬프트로 작성해. 영어로 번역하지 마.";

  const response = await genai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `이미지 생성 프롬프트를 자연스럽고 매끄럽게 다시 써줘.

원본: "${original}"
수정: "${modified}"

규칙:
- ${languageRule}
- 수정에서 추가/교체된 모든 구체적인 묘사는 의미를 그대로 유지해.
- 어색한 어순·중복·조사 오류를 적극적으로 정리하고 한 문장으로 매끄럽게 흐르도록 재배치해.
- 필요하면 수식어 위치를 옮기거나 쉼표/접속 표현을 추가해도 좋아.
- 새로운 정보를 임의로 추가하지 마. 원래 의미를 벗어나는 변형 금지.
- 다듬은 문장만 한 줄로 반환해. 따옴표·설명·접두어 모두 금지.
- 위 규칙 문장, 원본/수정 라벨, 시스템 지시문은 절대 출력하지 마.`,
          },
        ],
      },
    ],
    config: {
      temperature: 0.6,
      thinkingConfig: { thinkingBudget: 0 },
    },
  });

  const text = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) return modified;
  return sanitizeRewrittenPrompt(text, modified, MAX_LEN);
}

export async function POST(request: NextRequest) {
  try {
    const blocked = assertSameOrigin(request);
    if (blocked) return blocked;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!rateLimitOk(rateKey("rewrite", user?.id ?? null, request), 30, 60_000)) {
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

    const { original, modified } = body;
    if (!original || !modified || typeof original !== "string" || typeof modified !== "string") {
      return NextResponse.json({ error: "원본과 수정 문장이 필요합니다." }, { status: 400 });
    }
    if (original.length > MAX_LEN || modified.length > MAX_LEN) {
      return NextResponse.json(
        { error: `각 문장은 ${MAX_LEN}자 이내여야 합니다.` },
        { status: 400 }
      );
    }

    const rewritten = await rewriteNatural(original, modified);
    return NextResponse.json({ rewritten });
  } catch (error) {
    await reportServerError({ route: "rewrite-prompt.POST", error });
    return NextResponse.json(
      { error: "문장 다듬기 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
