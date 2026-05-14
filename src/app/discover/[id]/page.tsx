"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { UserAvatar } from "@/components/ui/user-avatar";
import { saveEditorTransfer } from "@/lib/editor-transfer";
import { toast } from "sonner";
import { CalendarClock, ChevronLeft, Clipboard, ImageOff, Loader2, PenLine, RefreshCw, Trash2 } from "lucide-react";

interface SharedImageData {
  id: string;
  title: string;
  tags: string[];
  prompt: string;
  user_id?: string | null;
  user_name?: string | null;
  user_avatar?: string | null;
  image_url: string;
  thumb_url?: string;
  created_at?: string;
  width?: number | null;
  height?: number | null;
}

const TITLE_MAX_LENGTH = 32;

function formatImageTimestamp(value?: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(date);
}

export default function DiscoverDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  // Shared 이미지 state
  const [sharedItem, setSharedItem] = useState<SharedImageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);

  // 현재 유저
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isSendingToEdit, setIsSendingToEdit] = useState(false);
  const [isSendingToGenerate, setIsSendingToGenerate] = useState(false);

  // 제목 수정 state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [isSavingTitle, setIsSavingTitle] = useState(false);

  // 삭제 state
  const [isDeleting, setIsDeleting] = useState(false);

  // 썸네일 → 풀 이미지 전환
  const [fullLoaded, setFullLoaded] = useState(false);
  const fullImgRef = useRef<HTMLImageElement>(null);

  // 이미지 비율 감지: "landscape" | "portrait" | "square"
  const [aspect, setAspect] = useState<"landscape" | "portrait" | "square" | null>(null);

  // 현재 유저 로드
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchImage() {
      try {
        const res = await fetch(`/api/discover/images/${id}`, { cache: "no-store" });
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!cancelled) {
          if (data.image) {
            setSharedItem(data.image as SharedImageData);
          } else {
            setFetchError(true);
          }
        }
      } catch {
        if (!cancelled) setFetchError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchImage();
    return () => { cancelled = true; };
  }, [id]);

  // id 변경 시 이미지 상태 리셋
  useEffect(() => {
    setFullLoaded(false);
    setAspect(null);
  }, [id]);

  const detectAspect = (w: number, h: number) => {
    const ratio = w / h;
    if (ratio > 1.2) setAspect("landscape");
    else if (ratio < 0.8) setAspect("portrait");
    else setAspect("square");
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 pt-10 pb-16 md:px-5 md:pt-24">
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 size={24} className="mb-3 animate-spin text-[var(--angel-blue)]" />
          <p className="text-[14px] text-[var(--angel-text-soft)]">이미지를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 아이템 결정
  const item = sharedItem;

  if (!item || fetchError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg border border-[var(--angel-border)] bg-[var(--angel-surface-muted)]">
          <ImageOff size={22} className="text-[var(--angel-text-faint)]" />
        </div>
        <p className="text-[15px] text-[var(--angel-text-soft)]">이미지를 찾을 수 없어요</p>
        <Link href="/discover" prefetch={false} className="secondary-action mt-4">
          Discover로 돌아가기
        </Link>
      </div>
    );
  }

  const isOwner =
    currentUserId !== null &&
    item.user_id !== null &&
    item.user_id !== undefined &&
    item.user_id === currentUserId;
  const createdAtLabel = formatImageTimestamp(item.created_at);
  const dimensionLabel =
    item.width && item.height ? `${item.width.toLocaleString()} × ${item.height.toLocaleString()}px` : null;

  // 제목 수정 핸들러
  const handleStartEdit = () => {
    setEditTitle(item.title.slice(0, TITLE_MAX_LENGTH));
    setIsEditingTitle(true);
  };

  const handleCancelEdit = () => {
    setIsEditingTitle(false);
    setEditTitle("");
  };

  const handleSaveTitle = async () => {
    if (!editTitle.trim() || isSavingTitle) return;
    setIsSavingTitle(true);
    try {
      const res = await fetch(`/api/share/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle.trim().slice(0, TITLE_MAX_LENGTH) }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "제목 수정에 실패했어요.");
        return;
      }
      // 로컬 상태 업데이트
      if (sharedItem) {
        setSharedItem({ ...sharedItem, title: data.title });
      }
      setIsEditingTitle(false);
      toast.success("제목이 수정되었어요!");
    } catch {
      toast.error("제목 수정 중 오류가 발생했어요.");
    } finally {
      setIsSavingTitle(false);
    }
  };

  // 이미지를 편집기로 보내기: 이미지 URL → transfer → /edit
  const handleEditThis = async () => {
    if (isSendingToEdit) return;
    setIsSendingToEdit(true);
    try {
      if (!sharedItem) throw new Error("이미지가 아직 로드되지 않았어요");
      const transferId = await saveEditorTransfer({
        baseUrl: sharedItem.image_url,
        sourcePrompt: sharedItem.prompt?.trim() || undefined,
      });
      router.push(transferId ? `/edit?transfer=${encodeURIComponent(transferId)}` : "/edit");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "편집기로 보내지 못했어요");
    } finally {
      setIsSendingToEdit(false);
    }
  };

  const handleGenerateWithReference = async () => {
    if (isSendingToGenerate) return;
    setIsSendingToGenerate(true);
    try {
      if (!sharedItem) throw new Error("이미지가 아직 로드되지 않았어요");
      const res = await fetch(sharedItem.image_url);
      if (!res.ok) throw new Error("이미지를 불러오지 못했어요");
      const blob = await res.blob();
      if (blob.size > 8 * 1024 * 1024) {
        toast.error("이미지가 너무 커서 레퍼런스로 가져갈 수 없어요.");
        return;
      }
      const dataUrl: string = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("read fail"));
        reader.readAsDataURL(blob);
      });
      try {
        sessionStorage.setItem(
          "generate:reference",
          JSON.stringify({
            dataUrl,
            prompt: sharedItem.prompt || "",
            title: sharedItem.title || "",
          })
        );
      } catch {
        toast.error("브라우저 저장공간이 부족해요.");
        return;
      }
      router.push(`/generate?prompt=${encodeURIComponent(sharedItem.prompt || "")}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "생성 페이지로 보내지 못했어요");
    } finally {
      setIsSendingToGenerate(false);
    }
  };

  // 삭제 핸들러
  const handleDelete = async () => {
    if (isDeleting) return;
    const confirmed = window.confirm("이 이미지를 삭제하시겠어요? 이 작업은 되돌릴 수 없어요.");
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/share/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "삭제에 실패했어요.");
        return;
      }
      toast.success("이미지가 삭제되었어요.");
      setSharedItem(null);
      setFetchError(true);
      router.replace(`/discover?refresh=${Date.now()}`);
      router.refresh();
    } catch {
      toast.error("삭제 중 오류가 발생했어요.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="page-shell max-w-4xl">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="secondary-action mb-6"
      >
        <ChevronLeft size={15} />
        뒤로가기
      </button>

      <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
        {/* Image — 비율에 따라 너비 조절 */}
        <div className={`shrink-0 ${
          aspect === "landscape"
            ? "md:w-[55%]"                           /* 가로형: 넓게 */
            : aspect === "portrait"
              ? "md:w-[38%]"                         /* 세로형: 좁게 */
              : "md:w-[45%]"                         /* 정방형/미감지: 중간 */
        }`}>
          <div className="result-card relative p-2">
            <div className="absolute top-4 left-4 z-10 flex items-center gap-1 rounded-md bg-[var(--angel-blue)]/90 px-2.5 py-1 shadow-md">
              <span className="text-[12px] font-medium text-white">AI 생성</span>
            </div>
            <div className="relative">
              {/* 썸네일 blur placeholder */}
              {!fullLoaded && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={item.thumb_url || item.image_url}
                  alt=""
                  aria-hidden="true"
                  loading="eager"
                  decoding="async"
                  onLoad={(e) => {
                    if (!aspect) {
                      const img = e.currentTarget;
                      detectAspect(img.naturalWidth, img.naturalHeight);
                    }
                  }}
                  className="w-full h-auto rounded-md filter blur-[8px] scale-[1.02]"
                />
              )}
              {/* 풀 이미지 */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={fullImgRef}
                src={item.image_url}
                alt={item.title || "무드 이미지"}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                onLoad={(e) => {
                  setFullLoaded(true);
                  const img = e.currentTarget;
                  detectAspect(img.naturalWidth, img.naturalHeight);
                }}
                className={`w-full h-auto rounded-md ${fullLoaded ? "" : "absolute inset-0 opacity-0"}`}
              />
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Title with edit */}
          {isEditingTitle ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value.slice(0, TITLE_MAX_LENGTH))}
                maxLength={TITLE_MAX_LENGTH}
                className="flex-1 rounded-lg border border-[var(--angel-blue)]/40 bg-white/70 px-3 py-2 text-[18px] font-semibold text-[var(--angel-text)] outline-none focus:border-[var(--angel-blue)]"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveTitle();
                  if (e.key === "Escape") handleCancelEdit();
                }}
              />
              <button
                onClick={handleSaveTitle}
                disabled={isSavingTitle || !editTitle.trim()}
                className="shrink-0 rounded-lg bg-[var(--angel-blue)] px-3 py-2 text-[14px] text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {isSavingTitle ? "..." : "저장"}
              </button>
              <button
                onClick={handleCancelEdit}
                className="shrink-0 rounded-lg border border-[var(--angel-border)] bg-white/50 px-3 py-2 text-[14px] text-[var(--angel-text-soft)] transition-colors hover:bg-white/80"
              >
                취소
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-[22px] font-semibold leading-[1.3] text-[var(--angel-text)] [word-break:keep-all] md:text-[26px]">
                {item.title}
              </h1>
              {isOwner && (
                <button
                  onClick={handleStartEdit}
                  className="shrink-0 rounded-lg p-1.5 text-[var(--angel-text-faint)] transition-colors hover:bg-white/60 hover:text-[var(--angel-blue)]"
                  title="제목 수정"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Author */}
          {item.user_id && (
            <div className="mt-4 flex items-center gap-2.5">
              <UserAvatar
                src={item.user_avatar}
                name={item.user_name}
                className="h-8 w-8"
                fallbackClassName="text-[12px]"
              />
              <div className="flex flex-col leading-tight">
                <span className="text-[13.5px] font-medium text-[var(--angel-text)]">
                  {item.user_name ?? "익명 작가"}
                </span>
                <Link
                  href={`/discover?user=${encodeURIComponent(item.user_id)}`}
                  prefetch={false}
                  className="text-[11.5px] text-[var(--angel-blue)] hover:underline"
                >
                  이 사람의 작품 모두 보기 →
                </Link>
              </div>
            </div>
          )}

          {createdAtLabel && (
            <div className="mt-4 inline-flex w-fit items-center gap-2 rounded-lg border border-[var(--angel-border)] bg-[var(--angel-surface-muted)] px-3 py-2 text-[12.5px] font-bold text-[var(--angel-text-soft)]">
              <CalendarClock size={14} className="text-[var(--angel-blue)]" />
              <span>생성 시각</span>
              <time dateTime={item.created_at} className="tabular-nums text-[var(--angel-text)]">
                {createdAtLabel}
              </time>
            </div>
          )}

          <div className="mt-5 border-t border-[var(--angel-border)]" />

          {/* Prompt section */}
          <div className="mt-5">
            <div className="mb-2 flex items-center gap-1.5">
              <span className="text-[13px] font-bold text-[var(--angel-text-soft)]">
                Prompt
              </span>
            </div>

            {item.prompt ? (
              <div className="surface-card p-4">
                <p className="text-[15px] leading-[1.9] text-[var(--angel-text)] [word-break:keep-all]">
                  {item.prompt}
                </p>
              </div>
            ) : (
              <p className="text-[14px] text-[var(--angel-text-faint)]">프롬프트 정보가 없어요</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-6 space-y-2.5">
            <button
              onClick={handleEditThis}
              disabled={isSendingToEdit}
              className="primary-action w-full disabled:opacity-60"
            >
              <PenLine size={16} />
              {isSendingToEdit ? "편집기로 보내는 중..." : "이 이미지 편집하기"}
            </button>

            <button
              type="button"
              onClick={handleGenerateWithReference}
              disabled={isSendingToGenerate}
              className="secondary-action w-full disabled:opacity-60"
            >
              <RefreshCw size={15} />
              {isSendingToGenerate ? "생성 페이지로 보내는 중..." : "같은 이미지로 새로 생성"}
            </button>

            <button
              onClick={() => {
                if (item.prompt) {
                  navigator.clipboard.writeText(item.prompt);
                  toast.success("프롬프트를 복사했어요");
                }
              }}
              disabled={!item.prompt}
              className="secondary-action w-full disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Clipboard size={14} />
              프롬프트 복사
            </button>
          </div>

          {/* Style info */}
          <div className="surface-card mt-6 p-4">
            <div className="flex items-center justify-between gap-4 text-[13px]">
              <span className="text-[var(--angel-text-soft)]">출처</span>
              <span className="text-[var(--angel-blue)]">AI 생성 (커뮤니티 공유)</span>
            </div>
            {dimensionLabel && (
              <div className="mt-3 flex items-center justify-between gap-4 border-t border-[var(--angel-border)] pt-3 text-[13px]">
                <span className="text-[var(--angel-text-soft)]">이미지 크기</span>
                <span className="tabular-nums text-[var(--angel-text)]">{dimensionLabel}</span>
              </div>
            )}
          </div>

          {/* Owner: Delete button */}
          {isOwner && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="mt-4 flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 text-[14px] font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
            >
              <Trash2 size={14} />
              {isDeleting ? "삭제 중..." : "이 이미지 삭제하기"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
