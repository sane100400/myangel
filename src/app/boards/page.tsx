"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BoardCard } from "@/components/board/board-card";
import type { Board } from "@/types";

export default function BoardsPage() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleCreate = () => {
    if (!newTitle.trim()) return;

    const board: Board = {
      id: crypto.randomUUID(),
      user_id: "local-user",
      title: newTitle.trim(),
      description: newDesc.trim() || null,
      is_public: true,
      thumbnail_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setBoards((prev) => [board, ...prev]);
    setNewTitle("");
    setNewDesc("");
    setDialogOpen(false);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 pb-10 md:px-5 md:pt-24">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1
          className="font-heading text-3xl font-medium tracking-[0.08em] text-[var(--angel-text)]"
        >
          Mypage
        </h1>
        <p className="mt-2 text-[12px] text-[var(--angel-text-soft)]">
          마음에 드는 무드와 브랜드를 보드에 저장하세요
        </p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <span className="h-px w-12 bg-gradient-to-r from-transparent to-[var(--angel-blue)]/30" />
          <span className="text-[9px] text-[var(--angel-lavender)] twinkle">✦ ✧ ✦</span>
          <span className="h-px w-12 bg-gradient-to-l from-transparent to-[var(--angel-blue)]/30" />
        </div>
      </div>

      <div className="mb-8 flex justify-center">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <button className="angel-btn angel-btn-secondary">
              <span className="text-[10px] text-[var(--angel-lavender)]">✦</span>
              새 보드 만들기
            </button>
          </DialogTrigger>
          <DialogContent className="glass-card border-white/30">
            <DialogHeader>
              <DialogTitle
                className="font-heading-light text-lg font-medium tracking-[0.08em] text-[var(--angel-text)]"
              >
                새 보드 만들기
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <label className="mb-1.5 block text-[11px] tracking-[0.06em] text-[var(--angel-text-soft)]">제목</label>
                <Input
                  placeholder="보드 이름"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  className="rounded-full border-[var(--angel-border)] bg-white/50 text-[12px] placeholder-[var(--angel-text-faint)] focus:border-[var(--angel-blue)]/40 focus:bg-white/70"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] tracking-[0.06em] text-[var(--angel-text-soft)]">설명 (선택)</label>
                <Input
                  placeholder="보드 설명"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="rounded-full border-[var(--angel-border)] bg-white/50 text-[12px] placeholder-[var(--angel-text-faint)] focus:border-[var(--angel-blue)]/40 focus:bg-white/70"
                />
              </div>
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim()}
                className="w-full angel-btn angel-btn-primary disabled:opacity-40"
              >
                만들기
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Board Grid */}
      {boards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 text-2xl text-[var(--angel-lavender)] twinkle">✦</div>
          <p className="text-[12px] text-[var(--angel-text-soft)]">아직 보드가 없어요.</p>
          <p className="mt-1 text-[10px] text-[var(--angel-text-faint)]">
            새 보드를 만들고 무드와 브랜드를 저장해보세요.
          </p>
          <div className="mt-6 flex justify-center">
            <span className="text-[10px] text-[var(--angel-lavender)]">✦ ✧ ✦</span>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {boards.map((board) => (
            <BoardCard key={board.id} board={board} />
          ))}
        </div>
      )}
    </div>
  );
}
