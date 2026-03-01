import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("tags")
      .select("*")
      .order("usage_count", { ascending: false })
      .limit(30);

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Tags fetch error:", error);
    return NextResponse.json(
      { error: "태그를 불러올 수 없습니다." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name } = await request.json();
    if (!name) {
      return NextResponse.json(
        { error: "태그 이름은 필수입니다." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // upsert: 이미 있으면 usage_count 증가
    const { data: existing } = await supabase
      .from("tags")
      .select("*")
      .eq("name", name)
      .single();

    if (existing) {
      const { data, error } = await supabase
        .from("tags")
        .update({ usage_count: existing.usage_count + 1 })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    }

    const { data, error } = await supabase
      .from("tags")
      .insert({ name, usage_count: 1 })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Tag create error:", error);
    return NextResponse.json(
      { error: "태그를 생성할 수 없습니다." },
      { status: 500 }
    );
  }
}
