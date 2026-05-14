"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MoodGallery } from "@/components/discover/mood-gallery";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Search, X } from "lucide-react";

const DISCOVER_PAGE_SIZE = 12;

interface DiscoverImage {
  id: string;
  image_url: string;
  thumb_url?: string;
  title?: string | null;
  prompt?: string;
  user_id?: string | null;
  user_name?: string | null;
  user_avatar?: string | null;
}

function DiscoverContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userFilter = searchParams.get("user");
  const refreshKey = searchParams.get("refresh");
  const rawSortFilter = searchParams.get("sort") ?? "latest";
  const sortFilter =
    rawSortFilter === "oldest" || rawSortFilter === "title" ? rawSortFilter : "latest";
  const fromFilter = searchParams.get("from") ?? "";
  const toFilter = searchParams.get("to") ?? "";
  const queryFilter = searchParams.get("q") ?? "";

  const [images, setImages] = useState<DiscoverImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterName, setFilterName] = useState<string | null>(null);
  const [filterAvatar, setFilterAvatar] = useState<string | null>(null);
  const [queryDraft, setQueryDraft] = useState(queryFilter);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    setQueryDraft(queryFilter);
  }, [queryFilter]);

  const updateFilters = (patch: Record<string, string | null>) => {
    const qs = new URLSearchParams(searchParams.toString());
    qs.delete("refresh");
    for (const [key, value] of Object.entries(patch)) {
      if (value) qs.set(key, value);
      else qs.delete(key);
    }
    const next = qs.toString();
    router.push(next ? `/discover?${next}` : "/discover");
  };

  const buildImageQuery = useCallback((offset: number) => {
    const qs = new URLSearchParams();
    if (userFilter) qs.set("user", userFilter);
    if (queryFilter) qs.set("q", queryFilter);
    if (fromFilter) qs.set("from", fromFilter);
    if (toFilter) qs.set("to", toFilter);
    if (sortFilter) qs.set("sort", sortFilter);
    if (refreshKey) qs.set("refresh", refreshKey);
    qs.set("limit", String(DISCOVER_PAGE_SIZE));
    qs.set("offset", String(offset));
    return qs;
  }, [fromFilter, queryFilter, refreshKey, sortFilter, toFilter, userFilter]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setHasMore(false);
    async function fetchImages() {
      try {
        const qs = buildImageQuery(0);
        const res = await fetch(`/api/discover/images?${qs.toString()}`, {
          cache: "default",
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        if (!cancelled && Array.isArray(data.images)) {
          setImages(data.images);
          setHasMore(Boolean(data.hasMore));
          if (userFilter && data.images[0]) {
            setFilterName(data.images[0].user_name ?? null);
            setFilterAvatar(data.images[0].user_avatar ?? null);
          } else {
            setFilterName(null);
            setFilterAvatar(null);
          }
        }
      } catch {
        if (!cancelled) {
          setImages([]);
          setHasMore(false);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    fetchImages();
    return () => {
      cancelled = true;
    };
  }, [buildImageQuery, userFilter]);

  const loadMoreImages = useCallback(async () => {
    if (isLoading || isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const qs = buildImageQuery(images.length);
      const res = await fetch(`/api/discover/images?${qs.toString()}`, {
        cache: "default",
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (Array.isArray(data.images)) {
        setImages((prev) => [...prev, ...data.images]);
        setHasMore(Boolean(data.hasMore));
      } else {
        setHasMore(false);
      }
    } catch {
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  }, [buildImageQuery, hasMore, images.length, isLoading, isLoadingMore]);

  const clearFilter = () => router.push("/discover");
  const hasFilters = Boolean(userFilter || queryFilter || fromFilter || toFilter || sortFilter !== "latest");

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    updateFilters({ q: queryDraft.trim() || null });
  };

  return (
    <div className="page-shell">
      {/* ─── Hero header ─── */}
      <div className="page-header">
        <div>
          <p className="page-kicker">Community Gallery</p>
          <h1 lang="en" className="page-title page-title-en">
            Dis<span className="shimmer-text">cover</span>
          </h1>
          <p className="page-lead">
            다른 사용자가 공유한 이미지와 프롬프트를 보고, 마음에 드는 결과를 편집 흐름으로 이어갈 수 있습니다.
          </p>
        </div>
      </div>

      {/* User filter badge */}
      {userFilter && (
        <div className="mb-6 flex items-center">
          <div className="inline-flex items-center gap-2.5 rounded-lg border border-[var(--angel-blue)]/30 bg-[var(--angel-surface)] px-3.5 py-1.5 shadow-sm">
            <UserAvatar
              src={filterAvatar}
              name={filterName}
              className="h-6 w-6"
              fallbackClassName="text-[11px]"
            />
            <span className="text-[13.5px] font-medium text-[var(--angel-text)]">
              {filterName ?? "익명"}
            </span>
            <span className="text-[12px] text-[var(--angel-text-faint)]">의 작품</span>
            <button
              onClick={clearFilter}
              className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-md text-[var(--angel-text-faint)] hover:bg-red-50 hover:text-red-500"
              title="필터 해제"
              aria-label="필터 해제"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="surface-panel mb-6 p-4">
        <form onSubmit={submitSearch} className="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_150px_150px_150px]">
          <label className="relative block min-w-0">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--angel-text-faint)]"
            />
            <input
              value={queryDraft}
              onChange={(e) => setQueryDraft(e.target.value)}
              className="h-11 w-full rounded-lg border border-[var(--angel-border)] bg-white pl-9 pr-3 text-[14px] text-[var(--angel-text)] outline-none focus:border-[var(--angel-blue)]"
              placeholder="제목 또는 프롬프트 탐색"
            />
          </label>
          <input
            type="date"
            value={fromFilter}
            onChange={(e) => updateFilters({ from: e.target.value || null })}
            className="h-11 min-w-0 rounded-lg border border-[var(--angel-border)] bg-white px-3 text-[13px] text-[var(--angel-text-soft)] outline-none focus:border-[var(--angel-blue)]"
            aria-label="시작 날짜"
          />
          <input
            type="date"
            value={toFilter}
            onChange={(e) => updateFilters({ to: e.target.value || null })}
            className="h-11 min-w-0 rounded-lg border border-[var(--angel-border)] bg-white px-3 text-[13px] text-[var(--angel-text-soft)] outline-none focus:border-[var(--angel-blue)]"
            aria-label="종료 날짜"
          />
          <select
            value={sortFilter}
            onChange={(e) => updateFilters({ sort: e.target.value === "latest" ? null : e.target.value })}
            className="h-11 min-w-0 rounded-lg border border-[var(--angel-border)] bg-white px-3 text-[13px] font-bold text-[var(--angel-text-soft)] outline-none focus:border-[var(--angel-blue)]"
            aria-label="정렬"
          >
            <option value="latest">최신순</option>
            <option value="oldest">오래된순</option>
            <option value="title">제목순</option>
          </select>
          <button type="submit" className="primary-action min-h-11 md:col-start-1 md:w-fit">
            <Search size={15} />
            탐색
          </button>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilter}
              className="secondary-action min-h-11 md:w-fit"
            >
              <X size={14} />
              초기화
            </button>
          )}
        </form>
      </div>

      {/* Gallery */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
          ))}
        </div>
      ) : (
        <MoodGallery
          images={images}
          hasMore={hasMore}
          isLoadingMore={isLoadingMore}
          onLoadMore={loadMoreImages}
        />
      )}
    </div>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-4 py-8">
          <Skeleton className="h-8 w-40 mb-8 mx-auto" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
            ))}
          </div>
        </div>
      }
    >
      <DiscoverContent />
    </Suspense>
  );
}
