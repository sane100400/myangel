"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { listSavedImagesPage, deleteImage, type SavedImage } from "@/lib/saved-images";
import { SavedImageCard } from "@/components/board/saved-image-card";
import { ImageDetailModal } from "@/components/board/image-detail-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { buildImageTitle } from "@/lib/image-title";
import { saveEditorTransfer } from "@/lib/editor-transfer";
import { ArrowRight, ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const SHARE_TITLE_MAX = 32;
const SAVED_PAGE_SIZE = 12;

function SavedImagesSkeletonGrid() {
  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="result-card overflow-hidden">
          <Skeleton className="aspect-square w-full rounded-none" />
          <div className="px-3 pb-2.5 pt-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-2/3" />
            <Skeleton className="mt-3 h-3 w-20" />
          </div>
          <div className="grid grid-cols-2 gap-1.5 border-t border-[var(--angel-border)]/70 px-2.5 py-2">
            <Skeleton className="h-9 rounded-md" />
            <Skeleton className="h-9 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function MyPage() {
  const router = useRouter();
  const [savedImages, setSavedImages] = useState<SavedImage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [nextOffset, setNextOffset] = useState(0);
  const [selectedImage, setSelectedImage] = useState<SavedImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sharingIds, setSharingIds] = useState<Set<string>>(new Set());
  const [shareTarget, setShareTarget] = useState<SavedImage | null>(null);
  const [shareTitle, setShareTitle] = useState("");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const isDiscoverShared = useCallback((image: SavedImage) => {
    const meta = image.meta;
    if (!meta || typeof meta !== "object" || Array.isArray(meta)) return false;
    const ids = meta.discover_image_ids;
    return Boolean(
      (typeof meta.discover_image_id === "string" && meta.discover_image_id) ||
        (Array.isArray(ids) && ids.some((id) => typeof id === "string" && id))
    );
  }, []);

  const refresh = useCallback(async () => {
    const page = await listSavedImagesPage({ limit: SAVED_PAGE_SIZE, offset: 0 });
    setSavedImages(page.items);
    setHasMore(page.hasMore);
    setNextOffset(page.nextOffset);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    listSavedImagesPage({ limit: SAVED_PAGE_SIZE, offset: 0 }).then((page) => {
      if (cancelled) return;
      setSavedImages(page.items);
      setHasMore(page.hasMore);
      setNextOffset(page.nextOffset);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const page = await listSavedImagesPage({
        limit: SAVED_PAGE_SIZE,
        offset: nextOffset,
      });
      setSavedImages((prev) => {
        const seen = new Set(prev.map((item) => item.id));
        const incoming = page.items.filter((item) => !seen.has(item.id));
        return [...prev, ...incoming];
      });
      setHasMore(page.hasMore);
      setNextOffset(page.nextOffset);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, nextOffset]);

  const handleDelete = useCallback(
    async (id: string) => {
      const result = await deleteImage(id);
      if (!result.ok) {
        toast.error(result.error || "삭제에 실패했어요.");
        return false;
      }
      toast.success("마이페이지에서 삭제했어요.", {
        description: "연결된 Discover 공유 이미지도 함께 정리했어요.",
      });
      await refresh();
      return true;
    },
    [refresh]
  );

  const defaultShareTitle = useCallback((image: SavedImage) => {
    return buildImageTitle(image.prompt, "공유 이미지", SHARE_TITLE_MAX);
  }, []);

  const sendToEditor = useCallback(async (image: SavedImage) => {
    try {
      const quality = image.meta?.quality;
      const model = image.meta?.model;
      const transferId = await saveEditorTransfer({
        ...(image.image.startsWith("data:image/")
          ? { base: image.image }
          : { baseUrl: image.image }),
        sourcePrompt: image.prompt?.trim() || undefined,
        quality: quality === "1K" || quality === "2K" || quality === "4K" ? quality : undefined,
        model: model === "nano-banana-pro" || model === "gpt-image-2" ? model : undefined,
      });
      router.push(transferId ? `/edit?transfer=${encodeURIComponent(transferId)}` : "/edit");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "편집기로 보내지 못했어요.");
    }
  }, [router]);

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    setSelectionMode(false);
  }, []);

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.size === 0 || isBulkDeleting) return;
    const confirmed = window.confirm(`${selectedIds.size}개 이미지를 삭제하시겠어요?`);
    if (!confirmed) return;
    setIsBulkDeleting(true);
    try {
      const ids = Array.from(selectedIds);
      const results = await Promise.all(ids.map((id) => deleteImage(id)));
      const failed = results.filter((result) => !result.ok);
      if (failed.length > 0) {
        toast.error(`${failed.length}개 이미지를 삭제하지 못했어요.`);
      } else {
        toast.success(`${ids.length}개 이미지를 삭제했어요.`);
      }
      clearSelection();
      await refresh();
    } finally {
      setIsBulkDeleting(false);
    }
  }, [clearSelection, isBulkDeleting, refresh, selectedIds]);

  const openShareDialog = useCallback((image: SavedImage) => {
    if (sharingIds.has(image.id)) return false;
    if (isDiscoverShared(image)) {
      toast.info("이미 Discover에 공유된 이미지예요.", {
        description: "Discover에서 확인할 수 있어요.",
      });
      return true;
    }
    setShareTarget(image);
    setShareTitle(defaultShareTitle(image));
    return true;
  }, [defaultShareTitle, isDiscoverShared, sharingIds]);

  const handleShare = useCallback(async (image: SavedImage, title: string) => {
    if (sharingIds.has(image.id)) return false;
    const toastId = `mypage-share-${image.id}`;
    setSharingIds((prev) => new Set(prev).add(image.id));
    toast.loading("Discover에 공유하는 중...", { id: toastId });
    try {
      const promptText = image.prompt?.trim() ?? "";
      const cleanTitle = title.trim().slice(0, SHARE_TITLE_MAX) || "공유 이미지";
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceGenerationId: image.id,
          title: cleanTitle,
          prompt: promptText,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "공유에 실패했어요.", { id: toastId });
        return false;
      }
      if (data.alreadyShared) {
        toast.info(data.message || "이미 Discover에 공유된 이미지예요.", {
          id: toastId,
          description: "Discover에서 확인할 수 있어요.",
        });
      } else {
        toast.success(data.message || "Discover에 공유했어요.", {
          id: toastId,
          description: "공유 탭에서 바로 확인할 수 있어요.",
        });
      }
      await refresh();
      return true;
    } catch {
      toast.error("공유 중 오류가 발생했어요.", { id: toastId });
      return false;
    } finally {
      setSharingIds((prev) => {
        const next = new Set(prev);
        next.delete(image.id);
        return next;
      });
    }
  }, [refresh, sharingIds]);

  const confirmShare = useCallback(async () => {
    if (!shareTarget) return;
    const ok = await handleShare(shareTarget, shareTitle);
    if (ok) {
      setShareTarget(null);
      setShareTitle("");
    }
  }, [handleShare, shareTarget, shareTitle]);

  const isInitialLoading = loading && savedImages.length === 0;

  return (
    <div className="page-shell" aria-busy={isInitialLoading}>
      {/* ─── Hero header ─── */}
      <div className="page-header">
        <div>
          <p className="page-kicker">Your Personal Archive</p>
          <h1 lang="en" className="page-title page-title-en">
            My<span className="shimmer-text">page</span>
          </h1>
          <p className="page-lead">
            생성과 편집 결과를 다시 열고, 다운로드하거나 공유할 수 있는 개인 작업 보관함입니다.
          </p>
        </div>
        <Link href="/generate" prefetch={false} className="primary-action">
          <ImagePlus size={17} />
          새 이미지 생성
        </Link>
      </div>

      {/* ─── Stats row + Quick action ─── */}
      <div className="mb-8 flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between md:gap-6">
        {isInitialLoading ? (
          <Skeleton className="h-[72px] w-44 rounded-lg md:w-52" />
        ) : savedImages.length > 0 ? (
          <div className="surface-card flex items-baseline gap-3 px-5 py-4">
            <span lang="en" className="font-en text-[34px] font-bold leading-none text-[var(--angel-blue)] md:text-[40px]">
              {savedImages.length}
              {hasMore ? "+" : ""}
            </span>
            <span className="text-[14px] font-medium text-[var(--angel-text-soft)] md:text-[15px]">
              {hasMore ? "개 이상 표시 중" : "개의 이미지"}
            </span>
          </div>
        ) : (
          <div /> /* spacer */
        )}
        {savedImages.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {selectedIds.size > 0 && (
              <>
                <span className="text-[13px] font-bold text-[var(--angel-blue)]">
                  {selectedIds.size}개 선택됨
                </span>
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  disabled={isBulkDeleting}
                  className="secondary-action text-red-500 hover:text-red-600 disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  {isBulkDeleting ? "삭제 중..." : "선택 삭제"}
                </button>
                <button type="button" onClick={clearSelection} className="secondary-action">
                  선택 해제
                </button>
              </>
            )}
            {selectedIds.size === 0 && !selectionMode && (
              <button
                type="button"
                onClick={() => setSelectionMode(true)}
                className="secondary-action"
              >
                복수 선택
              </button>
            )}
            {selectionMode && selectedIds.size === 0 && (
              <button type="button" onClick={clearSelection} className="secondary-action">
                선택 취소
              </button>
            )}
          </div>
        )}
      </div>

      {/* ─── Image Grid ─── */}
      {isInitialLoading ? (
        <SavedImagesSkeletonGrid />
      ) : savedImages.length === 0 ? (
        <div className="surface-panel px-6 py-20 text-center md:py-24">
          <div className="relative">
            <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-lg border border-[var(--angel-border)] bg-[var(--angel-surface-muted)]">
              <ImagePlus size={26} className="text-[var(--angel-blue)]" />
            </div>
            <p className="text-[22px] font-bold text-[var(--angel-text)] md:text-[26px]">
              아직 저장한 이미지가 없어요
            </p>
            <p className="mx-auto mt-3 max-w-sm text-[14.5px] leading-[1.7] text-[var(--angel-text-soft)] [word-break:keep-all] md:text-[15.5px]">
              Generate에서 이미지를 만들면
              <br className="hidden md:block" />
              {" "}자동으로 이 곳에 보관됩니다.
            </p>
            <div className="mt-8">
              <Link
                href="/generate"
                prefetch={false}
                className="primary-action"
              >
                이미지 생성하러 가기
                <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 grid-cols-2 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
            {savedImages.map((img, index) => (
              <SavedImageCard
                key={img.id}
                image={img}
                index={index}
                onClick={() => setSelectedImage(img)}
                onEdit={() => {
                  void sendToEditor(img);
                }}
                onShare={() => {
                  openShareDialog(img);
                }}
                onToggleSelected={() => toggleSelected(img.id)}
                isSharing={sharingIds.has(img.id)}
                isShared={isDiscoverShared(img)}
                selectionMode={selectionMode}
                selected={selectedIds.has(img.id)}
              />
            ))}
          </div>
          {hasMore && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  void loadMore();
                }}
                disabled={loadingMore}
                className="secondary-action min-h-11 px-5 disabled:opacity-50"
              >
                {loadingMore ? "불러오는 중..." : "더 보기"}
              </button>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {selectedImage && (
        <ImageDetailModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onDelete={handleDelete}
          onEdit={(image) => {
            void sendToEditor(image);
          }}
          onShare={(image) => {
            openShareDialog(image);
            return Promise.resolve(true);
          }}
        />
      )}

      {shareTarget && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 px-4 pb-4 pt-10 backdrop-blur-sm md:items-center md:pb-10"
          onClick={(e) => {
            if (e.target === e.currentTarget && !sharingIds.has(shareTarget.id)) {
              setShareTarget(null);
            }
          }}
        >
          <div className="surface-panel w-full max-w-md bg-[var(--angel-surface)] p-5">
            <h2 className="text-[17px] font-bold text-[var(--angel-text)]">
              Discover에 공유
            </h2>
            <p className="mt-1.5 text-[13px] leading-5 text-[var(--angel-text-soft)]">
              갤러리에 표시될 제목을 정해주세요.
            </p>
            <label className="mt-4 block text-[12.5px] font-bold text-[var(--angel-text-soft)]">
              이미지 제목
            </label>
            <input
              value={shareTitle}
              onChange={(e) => setShareTitle(e.target.value.slice(0, SHARE_TITLE_MAX))}
              maxLength={SHARE_TITLE_MAX}
              disabled={sharingIds.has(shareTarget.id)}
              className="mt-1.5 w-full rounded-lg border border-[var(--angel-border)] bg-white px-3 py-2.5 text-[14px] text-[var(--angel-text)] outline-none focus:border-[var(--angel-blue)]"
              placeholder="예: 푸른빛 작업 공간"
            />
            <div className="mt-1.5 text-right text-[11px] text-[var(--angel-text-faint)]">
              {shareTitle.length}/{SHARE_TITLE_MAX}
            </div>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setShareTarget(null)}
                disabled={sharingIds.has(shareTarget.id)}
                className="secondary-action flex-1 disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  void confirmShare();
                }}
                disabled={!shareTitle.trim() || sharingIds.has(shareTarget.id)}
                className="primary-action flex-1 disabled:opacity-50"
              >
                {sharingIds.has(shareTarget.id) ? "공유 중..." : "공유하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
