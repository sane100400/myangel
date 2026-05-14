import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getBalance, getGenerateCost, getEditCost } from "@/lib/credits";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ balance: 0, authed: false });
  }
  const balance = await getBalance(user.id);

  // 가격표도 함께 — UI에서 비용 미리보기 위해
  const generate = {
    "1K": await getGenerateCost("1K", 1),
    "2K": await getGenerateCost("2K", 1),
    "4K": await getGenerateCost("4K", 1),
  };
  const edit = {
    "1K": await getEditCost("1K", 1),
    "2K": await getEditCost("2K", 1),
    "4K": await getEditCost("4K", 1),
  };

  return NextResponse.json({
    authed: true,
    balance,
    pricing: { generate, edit },
  });
}
