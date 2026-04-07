import { NextRequest, NextResponse } from "next/server";
import { refreshAttributes } from "@/lib/attribute-refresher";

export async function POST(request: NextRequest) {
  try {
    const { role, label, description } = await request.json();

    if (!role || !label || !description?.trim()) {
      return NextResponse.json(
        { error: "role, label, description이 필요합니다." },
        { status: 400 }
      );
    }

    const attributes = await refreshAttributes({
      role,
      label,
      description: description.trim(),
    });

    return NextResponse.json({ attributes });
  } catch (error) {
    console.error("Attribute refresh error:", error);
    return NextResponse.json(
      { error: "속성 갱신 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
