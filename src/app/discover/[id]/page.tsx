"use client";

import { useParams, useRouter } from "next/navigation";
import { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { SEED_MOOD_IMAGES, getImageUrl } from "@/lib/seed-data";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface SharedImageData {
  id: string;
  title: string;
  tags: string[];
  prompt: string;
  is_premium: boolean;
  user_id?: string | null;
}

export default function DiscoverDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const isSharedId = id.startsWith("shared-");

  // Seed 이미지 lookup (즉시)
  const seedItem = useMemo(
    () => SEED_MOOD_IMAGES.find((img) => img.id === id),
    [id]
  );

  // Shared 이미지 state
  const [sharedItem, setSharedItem] = useState<SharedImageData | null>(null);
  const [isLoading, setIsLoading] = useState(isSharedId);
  const [fetchError, setFetchError] = useState(false);

  // 현재 유저
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

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
    if (!isSharedId) return;
    let cancelled = false;

    async function fetchSharedImage() {
      try {
        const res = await fetch(`/api/discover/images`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        const found = data.images?.find(
          (img: SharedImageData) => img.id === id
        );
        if (!cancelled) {
          if (found) {
            setSharedItem(found);
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

    fetchSharedImage();
    return () => { cancelled = true; };
  }, [id, isSharedId]);

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
          <div className="text-2xl text-[var(--angel-lavender)] twinkle mb-3">✦</div>
          <p className="text-[12px] text-[var(--angel-text-soft)]">이미지를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 아이템 결정
  const item = isSharedId ? sharedItem : seedItem;

  if (!item || fetchError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
        <div className="text-2xl text-[var(--angel-lavender)] twinkle mb-3">✦</div>
        <p className="text-[13px] text-[var(--angel-text-soft)]">이미지를 찾을 수 없어요</p>
        <Link href="/discover" className="mt-4 angel-btn angel-btn-secondary text-[12px]">
          Discover로 돌아가기
        </Link>
      </div>
    );
  }

  const isPremium = "is_premium" in item && item.is_premium;
  const isOwner =
    isSharedId &&
    currentUserId !== null &&
    "user_id" in item &&
    item.user_id !== null &&
    item.user_id === currentUserId;

  // 제목 수정 핸들러
  const handleStartEdit = () => {
    setEditTitle(item.title);
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
        body: JSON.stringify({ title: editTitle.trim() }),
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
      router.push("/discover");
    } catch {
      toast.error("삭제 중 오류가 발생했어요.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 pt-10 pb-16 md:px-5 md:pt-24">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-1.5 text-[12px] text-[var(--angel-text-soft)] hover:text-[var(--angel-blue)] transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
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
          <div className="glass-card rounded-2xl p-2 relative">
            {isPremium && (
              <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 rounded-full bg-[#ffd700]/90 px-2.5 py-1 shadow-md">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="#fff" stroke="#b8860b" strokeWidth="1">
                  <path d="M3 18h18V8l-4 4-5-6-5 6-4-4v10z" />
                </svg>
                <span className="text-[10px] font-medium text-white">프리미엄</span>
              </div>
            )}
            {isSharedId && (
              <div className="absolute top-4 left-4 z-10 flex items-center gap-1 rounded-full bg-[var(--angel-blue)]/80 px-2.5 py-1 shadow-md">
                <span className="text-[10px] font-medium text-white">AI 생성</span>
              </div>
            )}
            <div className="relative">
              {/* 썸네일 blur placeholder */}
              {!fullLoaded && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={getImageUrl(item.id, "thumb_sm")}
                  alt=""
                  aria-hidden="true"
                  onLoad={(e) => {
                    if (!aspect) {
                      const img = e.currentTarget;
                      detectAspect(img.naturalWidth, img.naturalHeight);
                    }
                  }}
                  className="w-full h-auto rounded-xl filter blur-[8px] scale-[1.02]"
                />
              )}
              {/* 풀 이미지 */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={fullImgRef}
                src={getImageUrl(item.id, "full")}
                alt={item.title || "무드 이미지"}
                decoding="async"
                onLoad={(e) => {
                  setFullLoaded(true);
                  const img = e.currentTarget;
                  detectAspect(img.naturalWidth, img.naturalHeight);
                }}
                className={`w-full h-auto rounded-xl ${fullLoaded ? "" : "absolute inset-0 opacity-0"}`}
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
                onChange={(e) => setEditTitle(e.target.value)}
                maxLength={100}
                className="flex-1 rounded-lg border border-[var(--angel-blue)]/40 bg-white/70 px-3 py-2 text-lg font-heading font-medium text-[var(--angel-text)] outline-none focus:border-[var(--angel-blue)]"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveTitle();
                  if (e.key === "Escape") handleCancelEdit();
                }}
              />
              <button
                onClick={handleSaveTitle}
                disabled={isSavingTitle || !editTitle.trim()}
                className="shrink-0 rounded-lg bg-[var(--angel-blue)] px-3 py-2 text-[12px] text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {isSavingTitle ? "..." : "저장"}
              </button>
              <button
                onClick={handleCancelEdit}
                className="shrink-0 rounded-lg border border-[var(--angel-border)] bg-white/50 px-3 py-2 text-[12px] text-[var(--angel-text-soft)] transition-colors hover:bg-white/80"
              >
                취소
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-2xl font-medium tracking-[0.06em] text-[var(--angel-text)] md:text-3xl">
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

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {item.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/discover?tag=${encodeURIComponent(tag)}`}
                  className="angel-tag angel-tag-active text-[10px]"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* Divider */}
          <div className="mt-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[var(--angel-blue)]/20" />
            <span className="text-[9px] text-[var(--angel-lavender)] twinkle">✦</span>
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[var(--angel-blue)]/20" />
          </div>

          {/* Prompt section */}
          <div className="mt-5">
            <div className="mb-2 flex items-center gap-1.5">
              <span className="text-[9px] text-[var(--angel-lavender)]">✦</span>
              <span className="text-[11px] font-medium text-[var(--angel-text-soft)] tracking-wider uppercase">
                Prompt
              </span>
            </div>

            {"prompt" in item && item.prompt ? (
              isPremium ? (
                <div className="glass-card rounded-xl p-4 relative overflow-hidden">
                  <p className="text-[13px] leading-[1.9] text-[var(--angel-text)] blur-[5px] select-none [word-break:keep-all]">
                    {item.prompt}
                  </p>
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/40 backdrop-blur-[2px]">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#ffd700" stroke="#b8860b" strokeWidth="1">
                      <path d="M3 18h18V8l-4 4-5-6-5 6-4-4v10z" />
                    </svg>
                    <p className="mt-2 text-[12px] font-medium text-[#b8860b]">프리미엄 프롬프트</p>
                    <p className="mt-1 text-[10px] text-[var(--angel-text-soft)]">구매 후 전체 프롬프트를 확인할 수 있어요</p>
                  </div>
                </div>
              ) : (
                <div className="glass-card rounded-xl p-4">
                  <p className="text-[13px] leading-[1.9] text-[var(--angel-text)] [word-break:keep-all]">
                    {item.prompt}
                  </p>
                </div>
              )
            ) : (
              <p className="text-[12px] text-[var(--angel-text-faint)]">프롬프트 정보가 없어요</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-6 space-y-3">
            {isPremium ? (
              <button className="w-full angel-btn py-3 text-[13px] font-medium bg-gradient-to-r from-[#ffd700] to-[#f0c030] text-white border-none shadow-[0_0_20px_rgba(255,215,0,0.2)] hover:shadow-[0_0_30px_rgba(255,215,0,0.3)] transition-shadow rounded-xl flex items-center justify-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff" stroke="#b8860b" strokeWidth="0.5">
                  <path d="M3 18h18V8l-4 4-5-6-5 6-4-4v10z" />
                </svg>
                프리미엄 프롬프트 구매하기
              </button>
            ) : (
              <Link
                href={`/generate?prompt=${encodeURIComponent(("prompt" in item && item.prompt) || "")}`}
                className="w-full angel-btn angel-btn-primary py-3 text-[13px] flex items-center justify-center gap-2"
              >
                <span className="text-[10px]">✦</span>
                이 프롬프트로 이미지 생성하기
              </Link>
            )}

            <button
              onClick={() => {
                if ("prompt" in item && item.prompt && !isPremium) {
                  navigator.clipboard.writeText(item.prompt);
                }
              }}
              disabled={isPremium}
              className="w-full angel-btn angel-btn-secondary py-2.5 text-[12px] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              {isPremium ? "프롬프트 복사 (프리미엄)" : "프롬프트 복사하기"}
            </button>
          </div>

          {/* Style info */}
          <div className="mt-6 glass-card rounded-xl p-4">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[var(--angel-text-soft)]">스타일</span>
              <span className="text-[var(--angel-text)]">{item.tags?.[0] || "-"}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="text-[var(--angel-text-soft)]">등급</span>
              <span className={isPremium ? "text-[#b8860b] font-medium" : "text-[var(--angel-text)]"}>
                {isPremium ? "프리미엄" : "무료"}
              </span>
            </div>
            {isSharedId && (
              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="text-[var(--angel-text-soft)]">출처</span>
                <span className="text-[var(--angel-blue)]">AI 생성 (커뮤니티 공유)</span>
              </div>
            )}
          </div>

          {/* Owner: Delete button */}
          {isOwner && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="mt-4 w-full rounded-xl border border-red-200 bg-red-50/80 py-2.5 text-[12px] text-red-500 transition-colors hover:bg-red-100 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <line x1="10" y1="11" x2="10" y2="17" />
                <line x1="14" y1="11" x2="14" y2="17" />
              </svg>
              {isDeleting ? "삭제 중..." : "이 이미지 삭제하기"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
