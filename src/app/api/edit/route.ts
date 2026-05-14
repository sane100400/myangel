import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateEditRequest } from "@/lib/marker-protocol";
import { runMarkerEdit } from "@/lib/edit-client";
import { deductCredits, refundCredits, getEditCost } from "@/lib/credits";
import { assertSameOrigin } from "@/lib/api-guard";
import { createSSEStream } from "@/lib/sse";
import { reportServerError } from "@/lib/logger";

export const maxDuration = 360;
const HEARTBEAT_MS = 15_000;

export async function POST(request: NextRequest) {
  const blocked = assertSameOrigin(request);
  if (blocked) return blocked;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 본문" }, { status: 400 });
  }

  const validated = validateEditRequest(body);
  if ("error" in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const cost = await getEditCost(validated.quality, validated.count);
  const idempotencyKey = request.headers.get("idempotency-key")?.slice(0, 100) || null;
  const deduct = await deductCredits({
    userId: user.id,
    cost,
    reason: "edit",
    meta: {
      quality: validated.quality,
      count: validated.count,
      markers: validated.markers.length,
      model: validated.model,
    },
    idempotencyKey,
  });
  if (!deduct.ok) {
    if (deduct.reason === "insufficient") {
      return NextResponse.json(
        { error: `크레딧이 부족해요. (필요: ${cost})`, code: "insufficient_credits" },
        { status: 402 }
      );
    }
    return NextResponse.json({ error: "크레딧 처리 중 오류" }, { status: 500 });
  }

  const sse = createSSEStream();
  const startTime = Date.now();

  (async () => {
    const heartbeat = setInterval(() => {
      sse.send("heartbeat", { t: Date.now() });
    }, HEARTBEAT_MS);
    try {
      sse.send("stage", {
        stage: "started",
        total: validated.count,
        model: validated.model,
        quality: validated.quality,
        cost,
        message: `${validated.count}장 편집 시작`,
      });

      const result = await runMarkerEdit(validated, {
        onStart: (idx) => {
          sse.send("stage", { stage: "calling", index: idx, message: "모델 호출 중" });
        },
        onResult: (idx, res) => {
          if (res.ok) sse.send("image", { index: idx, image: res.image });
          else sse.send("image_failed", { index: idx, error: res.error });
        },
      });

      if (result.images.length === 0) {
        await refundCredits(deduct.ledgerId);
        sse.send("error", {
          message: `편집에 실패했어요.${result.errors[0] ? ` (${result.errors[0]})` : ""}`,
          errors: result.errors,
        });
      } else {
        sse.send("done", {
          count: result.images.length,
          requested: validated.count,
          errors: result.errors,
          model: validated.model,
          quality: validated.quality,
          cost,
          elapsedMs: Date.now() - startTime,
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      reportServerError({ route: "edit.POST", error: e, userId: user.id });
      try {
        await refundCredits(deduct.ledgerId);
      } catch {}
      sse.send("error", { message: `서버 오류: ${msg}` });
    } finally {
      clearInterval(heartbeat);
      sse.close();
    }
  })();

  return sse.response();
}
