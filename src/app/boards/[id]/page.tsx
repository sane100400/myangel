"use client";

import { useParams } from "next/navigation";
import { BoardDetail } from "@/components/board/board-detail";
import type { Board } from "@/types";

export default function BoardDetailPage() {
  const params = useParams();
  const boardId = params.id as string;

  // MVP: 임시 빈 보드 표시
  const board: Board = {
    id: boardId,
    user_id: "local-user",
    title: "보드",
    description: null,
    is_public: true,
    thumbnail_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return <BoardDetail board={board} items={[]} isOwner={true} />;
}
