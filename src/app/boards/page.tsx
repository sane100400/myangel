"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Tab = "images" | "prompts";

interface SavedImage {
  id: string;
  prompt: string;
  style: string | null;
  image_url: string;
  created_at: string;
}

interface SavedPrompt {
  id: string;
  title: string;
  prompt: string;
  style: string | null;
  price: number;
  is_public: boolean;
  sales_count: number;
  created_at: string;
}

export default function MyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("images");

  // 임시 데이터 (DB 연동 전)
  const [savedImages] = useState<SavedImage[]>([]);
  const [savedPrompts] = useState<SavedPrompt[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/auth/login");
        return;
      }
      setUser({ id: user.id, email: user.email ?? undefined });
      setLoading(false);
    };
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="text-2xl text-[var(--angel-lavender)] twinkle mb-3">✦</div>
          <p className="text-[12px] text-[var(--angel-text-soft)]">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 pt-10 pb-16 md:px-5 md:pt-24">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="font-heading text-3xl font-medium tracking-[0.08em] text-[var(--angel-text)]">
          Mypage
        </h1>
        <p className="mt-2 text-[12px] text-[var(--angel-text-soft)]">
          {user?.email}
        </p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <span className="h-px w-12 bg-gradient-to-r from-transparent to-[var(--angel-blue)]/30" />
          <span className="text-[9px] text-[var(--angel-lavender)] twinkle">✦ ✧ ✦</span>
          <span className="h-px w-12 bg-gradient-to-l from-transparent to-[var(--angel-blue)]/30" />
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex justify-center gap-2">
        <button
          onClick={() => setActiveTab("images")}
          className={`angel-btn text-[12px] ${
            activeTab === "images" ? "angel-btn-primary" : "angel-btn-secondary"
          }`}
        >
          내 이미지
        </button>
        <button
          onClick={() => setActiveTab("prompts")}
          className={`angel-btn text-[12px] ${
            activeTab === "prompts" ? "angel-btn-primary" : "angel-btn-secondary"
          }`}
        >
          프롬프트 관리
        </button>
      </div>

      {/* ══ 내 이미지 탭 ══ */}
      {activeTab === "images" && (
        <div>
          {/* Quick action */}
          <div className="mb-6 text-center">
            <Link href="/generate" className="angel-btn angel-btn-secondary text-[12px]">
              <span className="text-[10px] text-[var(--angel-lavender)]">✦</span>
              새 이미지 생성하기
            </Link>
          </div>

          {savedImages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 text-2xl text-[var(--angel-lavender)] twinkle">✦</div>
              <p className="text-[13px] text-[var(--angel-text-soft)]">아직 생성한 이미지가 없어요</p>
              <p className="mt-1.5 text-[11px] text-[var(--angel-text-faint)] [word-break:keep-all]">
                Generate에서 이미지를 만들면 여기에 저장돼요
              </p>
              <div className="mt-6">
                <Link href="/generate" className="angel-btn angel-btn-primary text-[12px]">
                  <span className="text-[10px]">✦</span>
                  이미지 생성하러 가기
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
              {savedImages.map((img) => (
                <div key={img.id} className="glass-card rounded-2xl overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.image_url} alt={img.prompt} className="w-full aspect-square object-cover" />
                  <div className="p-3">
                    <p className="text-[11px] text-[var(--angel-text)] line-clamp-2 leading-[1.6] [word-break:keep-all]">{img.prompt}</p>
                    {img.style && (
                      <span className="mt-1.5 inline-block angel-tag text-[9px]">#{img.style}</span>
                    )}
                    <p className="mt-1.5 text-[9px] text-[var(--angel-text-faint)]">
                      {new Date(img.created_at).toLocaleDateString("ko-KR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ 프롬프트 관리 탭 ══ */}
      {activeTab === "prompts" && (
        <div>
          {/* Stats */}
          <div className="mb-6 grid grid-cols-3 gap-3">
            {[
              { label: "등록한 프롬프트", value: savedPrompts.length },
              { label: "총 판매", value: savedPrompts.reduce((sum, p) => sum + p.sales_count, 0) },
              { label: "공개 중", value: savedPrompts.filter((p) => p.is_public).length },
            ].map((stat) => (
              <div key={stat.label} className="glass-card rounded-xl p-4 text-center">
                <p className="text-xl font-heading text-[var(--angel-blue)]">{stat.value}</p>
                <p className="mt-1 text-[10px] text-[var(--angel-text-soft)] [word-break:keep-all]">{stat.label}</p>
              </div>
            ))}
          </div>

          {savedPrompts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 text-2xl text-[var(--angel-lavender)] twinkle">✦</div>
              <p className="text-[13px] text-[var(--angel-text-soft)]">아직 등록한 프롬프트가 없어요</p>
              <p className="mt-1.5 text-[11px] text-[var(--angel-text-faint)] max-w-xs mx-auto [word-break:keep-all]">
                이미지를 생성한 뒤 마음에 드는 프롬프트를 등록하면 다른 사람들이 구매할 수 있어요
              </p>
              <div className="mt-6">
                <Link href="/generate" className="angel-btn angel-btn-primary text-[12px]">
                  <span className="text-[10px]">✦</span>
                  프롬프트 만들러 가기
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {savedPrompts.map((p) => (
                <div key={p.id} className="glass-card rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[13px] font-medium text-[var(--angel-text)] truncate">{p.title}</h3>
                      <p className="mt-1 text-[11px] text-[var(--angel-text-soft)] line-clamp-2 leading-[1.6] [word-break:keep-all]">{p.prompt}</p>
                      <div className="mt-2 flex items-center gap-2">
                        {p.style && <span className="angel-tag text-[9px]">#{p.style}</span>}
                        <span className="text-[10px] text-[var(--angel-text-faint)]">
                          판매 {p.sales_count}회
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[14px] font-heading text-[var(--angel-blue)]">
                        {p.price > 0 ? `${p.price.toLocaleString()}원` : "무료"}
                      </p>
                      <span className={`mt-1 inline-block text-[9px] px-2 py-0.5 rounded-full ${
                        p.is_public
                          ? "bg-[var(--angel-blue)]/10 text-[var(--angel-blue)]"
                          : "bg-[var(--angel-text-faint)]/10 text-[var(--angel-text-faint)]"
                      }`}>
                        {p.is_public ? "공개" : "비공개"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
