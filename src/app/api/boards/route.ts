import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// 보드 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from("boards")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Boards fetch error:", error);
    return NextResponse.json(
      { error: "보드를 불러올 수 없습니다." },
      { status: 500 }
    );
  }
}

// 보드 생성
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const { title, description, is_public } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: "보드 제목은 필수입니다." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("boards")
      .insert({
        user_id: user.id,
        title,
        description: description || null,
        is_public: is_public ?? true,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Board create error:", error);
    return NextResponse.json(
      { error: "보드를 생성할 수 없습니다." },
      { status: 500 }
    );
  }
}

// 보드 수정
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const { id, title, description, is_public } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "보드 ID는 필수입니다." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("boards")
      .update({
        title,
        description,
        is_public,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Board update error:", error);
    return NextResponse.json(
      { error: "보드를 수정할 수 없습니다." },
      { status: 500 }
    );
  }
}

// 보드 삭제
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "보드 ID는 필수입니다." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("boards")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Board delete error:", error);
    return NextResponse.json(
      { error: "보드를 삭제할 수 없습니다." },
      { status: 500 }
    );
  }
}
