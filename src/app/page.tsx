import Link from "next/link";
import { AngelLogo } from "@/components/ui/angel-logo";
import { AsciiHearts } from "@/components/ui/ascii-hearts";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* ══ Hero Section ══ */}
      <section className="relative flex flex-col items-center justify-center px-4 pt-20 pb-12 text-center md:px-5 md:pt-52 md:pb-40 overflow-hidden bg-gradient-to-b from-[#d6deee] to-[#dce4f2] star-bg-desktop">
        <AsciiHearts />

        <div className="md:hidden">
          <div className="absolute top-8 left-[5%] h-20 w-20 rounded-full bg-[var(--angel-blue)]/6 blur-[40px]" />
          <div className="absolute bottom-12 right-[8%] h-24 w-24 rounded-full bg-[var(--angel-lavender)]/8 blur-[40px]" />
        </div>
        <div className="hidden md:block">
          <div className="absolute top-12 left-[8%] h-40 w-40 rounded-full bg-[var(--angel-blue)]/8 blur-[80px]" />
          <div className="absolute bottom-16 right-[10%] h-48 w-48 rounded-full bg-[var(--angel-lavender)]/10 blur-[80px]" />
          <div className="absolute top-28 right-[25%] h-24 w-24 rounded-full bg-[var(--angel-pink)]/8 blur-[60px]" />
          <div className="absolute bottom-32 left-[20%] h-32 w-32 rounded-full bg-[var(--angel-blue)]/6 blur-[70px]" />
        </div>

        <div className="pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vw] rounded-full border-[2px] border-[var(--angel-blue)]/20 rotate-slow md:w-[min(580px,70vw)] md:h-[min(580px,70vw)] md:border-[3px] md:border-[var(--angel-blue)]/30" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[135vw] h-[135vw] rounded-full border-[1.5px] border-[var(--angel-lavender)]/15 md:w-[min(620px,75vw)] md:h-[min(620px,75vw)] md:border-[2px] md:border-[var(--angel-lavender)]/25" style={{ animation: "rotate-slow 35s linear infinite reverse" }} />
        </div>

        <div className="mb-5 relative z-10 md:float-gentle md:mb-6">
          <AngelLogo size={80} priority />
        </div>

        <h1 className="relative z-10 max-w-lg text-3xl tracking-[0.08em] text-[var(--angel-text)] font-heading md:text-7xl">
          My<span className="shimmer-text">Angel</span>
        </h1>

        <p className="relative z-10 mt-5 text-[12px] font-medium tracking-[0.3em] text-[var(--angel-text-soft)] uppercase md:mt-8 md:text-[14px]">
          ✦ interactive prompt optimization studio ✦
        </p>

        <div className="relative z-10 mt-3 flex items-center gap-3 text-[var(--angel-text-faint)] md:mt-4">
          <span className="h-px w-8 bg-gradient-to-r from-transparent to-[var(--angel-blue)]/40 md:w-10" />
          <span className="text-[12px] tracking-[0.2em] text-[var(--angel-lavender)] twinkle">✦ ✧ ✦</span>
          <span className="h-px w-8 bg-gradient-to-l from-transparent to-[var(--angel-blue)]/40 md:w-10" />
        </div>

        <p className="relative z-10 mt-5 max-w-sm text-[14px] leading-[1.8] text-[var(--angel-text)] md:mt-6 md:text-base">
          간단한 입력만으로 <strong className="text-[var(--angel-blue)]">프롬프트를 최적화</strong>하고,
          <br />
          원하는 이미지를 정확하게
          <br />
          생성해보세요.
        </p>

        <div className="relative z-10 mt-5">
          <Link href="/generate" className="angel-btn angel-btn-primary">
            <span className="text-[12px]">✦</span>
            Studio 시작하기
          </Link>
        </div>
      </section>

      {/* ══ Section Divider ══ */}
      <div className="section-divider bg-gradient-to-b from-[#dce4f2] to-[#e0e7f4]">
        <span className="text-[20px] text-[var(--angel-lavender)] twinkle">✦</span>
      </div>

      {/* ══ The Problem ══ */}
      <section className="snap-section w-full px-4 py-10 md:px-5 md:py-16 bg-gradient-to-b from-[#e0e7f4] to-[#e4eaf6]">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-2 text-center text-2xl tracking-[0.08em] text-[var(--angel-text)] font-heading md:text-3xl">
            The Problem
          </h2>
          <p className="mb-6 text-center text-[12px] tracking-[0.2em] text-[var(--angel-text-soft)] md:mb-10 md:text-[13px]">
            ✦ 프롬프트 작성, 왜 어려울까? ✦
          </p>

          <div className="glass-card rounded-2xl px-5 py-4 mb-5 max-w-lg mx-auto md:px-6 md:py-5 md:mb-6">
            <p className="text-[15px] leading-[2] text-[var(--angel-text)] text-center [word-break:keep-all]">
              AI 이미지 생성 모델은 강력하지만,
              <br />
              <strong className="text-[var(--angel-blue)]">프롬프트를 잘 써야</strong> 원하는 결과가 나와요.
            </p>
          </div>

          <p className="text-center text-[14px] leading-[1.9] text-[var(--angel-text-soft)] mb-10 max-w-sm mx-auto [word-break:keep-all]">
            &ldquo;예쁜 방&rdquo;, &ldquo;감성적인 분위기&rdquo; 같은 표현은
            <br />
            AI가 이해하기엔 너무 추상적이에요.
            <br />
            결국 수십 번 수정하며 시간과 비용을 낭비하게 돼요.
          </p>

          <div className="flex items-center justify-center gap-3 mb-8">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-[var(--angel-blue)]/40" />
            <span className="text-[11px] tracking-[0.2em] text-[var(--angel-lavender)] twinkle">✦ ✧ ✦</span>
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-[var(--angel-blue)]/40" />
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--angel-blue)]/10 px-5 py-2 text-[14px] font-medium text-[var(--angel-blue)] mb-5">
              MyAngel이 해결해요
            </div>
            <p className="text-[14px] leading-[2] text-[var(--angel-text-soft)] max-w-sm mx-auto [word-break:keep-all]">
              추상적인 입력을 <strong className="text-[var(--angel-text)]">구조화된 프롬프트</strong>로 변환하고,
              <br />
              약한 표현을 자동으로 감지해 개선해줘요.
              <br />
              시행착오 없이 원하는 이미지를 바로 만들 수 있어요.
            </p>
          </div>
        </div>
      </section>

      {/* ══ Section Divider ══ */}
      <div className="section-divider bg-gradient-to-b from-[#e4eaf6] to-[#e0e7f4]">
        <span className="text-[20px] text-[var(--angel-lavender)] twinkle">✧</span>
      </div>

      {/* ══ Prompt Enhancement Showcase ══ */}
      <section className="snap-section relative mx-auto w-full px-5 py-12 md:py-20 bg-gradient-to-b from-[#e0e7f4] to-[#e2e8f5]">
        <div className="mx-auto max-w-2xl">
          <div className="mb-3 flex justify-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 border border-amber-300/40 px-3 py-1 text-[13px] font-medium text-amber-700">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              핵심 기능
            </span>
          </div>
          <h2 className="mb-2 text-center text-2xl tracking-[0.06em] text-[var(--angel-text)] font-heading md:text-3xl">
            프롬프트 강화
          </h2>
          <p className="mb-8 text-center text-[14px] leading-[1.8] text-[var(--angel-text-soft)] md:text-[15px] md:mb-10 [word-break:keep-all]">
            추상적인 표현을 AI가 자동으로 감지하고,<br />
            클릭 한 번으로 더 구체적인 표현으로 바꿔줘요
          </p>

          {/* Visual Demo */}
          <div className="rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50/80 via-white/90 to-amber-50/30 p-4 shadow-md md:p-6">
            {/* Fake textarea */}
            <div className="rounded-xl border border-[var(--angel-border)] bg-white/80 px-3 py-3 text-[14px] leading-[1.9] text-[var(--angel-text)] md:px-4 md:text-[15px]">
              하얀 침대가 있는 <span className="inline-block rounded bg-amber-100/80 px-1 text-amber-700 border-b-2 border-amber-300">예쁜</span> 방,{" "}
              <span className="inline-block rounded bg-amber-100/80 px-1 text-amber-700 border-b-2 border-amber-300">감성적인</span> 분위기의 창문
            </div>

            {/* Arrow */}
            <div className="flex justify-center my-3 md:my-4">
              <div className="flex flex-col items-center gap-1">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--angel-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <polyline points="19 12 12 19 5 12" />
                </svg>
                <span className="text-[12px] font-medium text-[var(--angel-blue)]">AI 강화</span>
              </div>
            </div>

            {/* Enhanced result */}
            <div className="rounded-xl border border-sky-200/60 bg-sky-50/50 px-3 py-3 text-[14px] leading-[1.9] text-[var(--angel-text)] md:px-4 md:text-[15px]">
              하얀 침대가 있는 <span className="inline-block rounded bg-sky-100/80 px-1 text-sky-700 border-b-2 border-sky-400">아이보리 톤의 미니멀한</span> 방,{" "}
              <span className="inline-block rounded bg-sky-100/80 px-1 text-sky-700 border-b-2 border-sky-400">부드러운 자연광이 들어오는 따뜻한</span> 분위기의 창문
            </div>

            {/* Demo chips */}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-xl bg-white px-3 py-1.5 text-[14px] font-medium text-amber-800 border border-amber-300/70 shadow-sm">
                예쁜
                <span className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[8px] text-white font-bold">+</span>
              </span>
              <span className="rounded-xl bg-sky-100/80 px-3 py-1.5 text-[14px] font-medium text-sky-700 border border-sky-300/60">
                감성적인
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="inline ml-1">
                  <polyline points="3 8 7 12 13 4" />
                </svg>
              </span>
            </div>

            <p className="mt-3 text-center text-[12px] text-amber-600/70 md:text-[13px]">
              노란색 단어를 클릭하면 AI가 대안을 추천해요
            </p>
          </div>

          {/* Benefits */}
          <div className="mt-6 grid grid-cols-3 gap-2 md:gap-3 md:mt-8">
            <div className="rounded-xl bg-white/80 border border-[var(--angel-border)] p-3 text-center md:p-4">
              <div className="text-lg mb-1 md:text-xl md:mb-2">🎯</div>
              <p className="text-[13px] font-medium text-[var(--angel-text)] md:text-[14px]">자동 감지</p>
              <p className="mt-0.5 text-[11px] text-[var(--angel-text-soft)] leading-[1.5] md:text-[12px] [word-break:keep-all]">약한 표현을 AI가 찾아줘요</p>
            </div>
            <div className="rounded-xl bg-white/80 border border-[var(--angel-border)] p-3 text-center md:p-4">
              <div className="text-lg mb-1 md:text-xl md:mb-2">✨</div>
              <p className="text-[13px] font-medium text-[var(--angel-text)] md:text-[14px]">원클릭 개선</p>
              <p className="mt-0.5 text-[11px] text-[var(--angel-text-soft)] leading-[1.5] md:text-[12px] [word-break:keep-all]">클릭만으로 구체화</p>
            </div>
            <div className="rounded-xl bg-white/80 border border-[var(--angel-border)] p-3 text-center md:p-4">
              <div className="text-lg mb-1 md:text-xl md:mb-2">🌐</div>
              <p className="text-[13px] font-medium text-[var(--angel-text)] md:text-[14px]">자동 번역</p>
              <p className="mt-0.5 text-[11px] text-[var(--angel-text-soft)] leading-[1.5] md:text-[12px] [word-break:keep-all]">한국어→영어 최적화</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ Section Divider ══ */}
      <div className="section-divider bg-gradient-to-b from-[#e2e8f5] to-[#e0e7f4]">
        <span className="text-[20px] text-[var(--angel-lavender)] twinkle">✧</span>
      </div>

      {/* ══ Other Features ══ */}
      <section className="snap-section relative mx-auto w-full px-5 py-10 md:py-16 bg-gradient-to-b from-[#e0e7f4] to-[#e4eaf6]">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-2 text-center text-2xl tracking-[0.08em] text-[var(--angel-text)] font-heading md:text-3xl">
            More Features
          </h2>
          <p className="mb-8 text-center text-[13px] tracking-[0.2em] text-[var(--angel-text-soft)] md:mb-10">
            ✦ 프롬프트 강화 외에도 ✦
          </p>

          <div className="space-y-3 md:space-y-4">
            {/* Feature 1: Visual Canvas Studio */}
            <div className="glass-card rounded-2xl px-5 py-4 md:px-6 md:py-5">
              <div className="flex items-center gap-2 mb-2 md:mb-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--angel-blue)]/12 text-[14px]">
                  🎨
                </span>
                <h3 className="text-[15px] font-medium tracking-[0.04em] text-[var(--angel-text)] md:text-base">
                  비주얼 캔버스 스튜디오
                </h3>
              </div>
              <p className="text-[14px] leading-[1.9] text-[var(--angel-text-soft)] [word-break:keep-all] md:text-[15px]">
                AI가 입력을 <strong className="text-[var(--angel-text)]">피사체, 배경, 분위기, 조명, 색감</strong> 등으로 자동 분해해요.
                피사체는 <strong className="text-[var(--angel-text)]">캔버스 위에서 드래그로 배치</strong>하고 최대 3개까지 추가할 수 있어요.
                조명, 분위기 같은 장면 속성은 <strong className="text-[var(--angel-text)]">사이드바</strong>에서 슬라이더로 세밀하게 조절하면 최종 프롬프트에 반영돼요.
              </p>
            </div>

            {/* Feature 2: Prompt Comparison */}
            <div className="glass-card rounded-2xl px-5 py-4 md:px-6 md:py-5">
              <div className="flex items-center gap-2 mb-2 md:mb-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--angel-lavender)]/12 text-[14px]">
                  📊
                </span>
                <h3 className="text-[15px] font-medium tracking-[0.04em] text-[var(--angel-text)] md:text-base">
                  프롬프트 비교
                </h3>
              </div>
              <p className="text-[14px] leading-[1.9] text-[var(--angel-text-soft)] [word-break:keep-all] md:text-[15px]">
                원본 입력과 AI가 최적화한 프롬프트를 <strong className="text-[var(--angel-text)]">나란히 비교</strong>할 수 있어요.
                한국어/영어 토글로 실제 이미지 생성에 사용되는 영어 프롬프트도 확인 가능해요.
              </p>
            </div>

            {/* Feature 3: AI Image Generation */}
            <div className="glass-card rounded-2xl px-5 py-4 md:px-6 md:py-5">
              <div className="flex items-center gap-2 mb-2 md:mb-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--angel-pink)]/12 text-[14px]">
                  🖼️
                </span>
                <h3 className="text-[15px] font-medium tracking-[0.04em] text-[var(--angel-text)] md:text-base">
                  AI 이미지 생성
                </h3>
              </div>
              <p className="text-[14px] leading-[1.9] text-[var(--angel-text-soft)] [word-break:keep-all] md:text-[15px]">
                최적화된 프롬프트로 바로 이미지를 생성해요.
                레퍼런스 이미지 업로드와 프리미엄 2K 고해상도도 지원해요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ Section Divider ══ */}
      <div className="section-divider bg-gradient-to-b from-[#e4eaf6] to-[#e0e7f4]">
        <span className="text-[20px] text-[var(--angel-lavender)] twinkle">✧</span>
      </div>

      {/* ══ How it works ══ */}
      <section className="snap-section relative mx-auto w-full px-4 py-10 md:px-5 md:py-16 bg-gradient-to-b from-[#e0e7f4] to-[#dce4f2]">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-2 text-center text-2xl tracking-[0.08em] text-[var(--angel-text)] font-heading md:text-3xl">
            How it works
          </h2>
          <p className="mb-6 text-center text-[12px] tracking-[0.2em] text-[var(--angel-text-soft)] md:mb-10 md:text-[13px]">
            ✦ five steps to your perfect image ✦
          </p>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-5 md:gap-3">
            {[
              { num: "I", title: "입력", desc: "원하는 이미지를 간단하게 설명해요" },
              { num: "II", title: "분해", desc: "장면을 구성 요소 단위로 자동 분해해요" },
              { num: "III", title: "편집", desc: "각 요소의 속성을 세밀하게 조절해요" },
              { num: "IV", title: "강화", desc: "추상적 표현을 구체적으로 개선해요" },
              { num: "V", title: "생성", desc: "최적화된 프롬프트로 이미지를 만들어요" },
            ].map((step, i) => (
              <div key={step.num} className={`glass-card rounded-xl p-3 text-center md:rounded-2xl md:p-4 ${i === 4 ? "col-span-2 md:col-span-1" : ""}`}>
                <div className="mb-1.5 flex items-center justify-center gap-1.5 md:mb-2">
                  <span className="text-[8px] text-[var(--angel-lavender)] opacity-40">✦</span>
                  <span className="text-base text-[var(--angel-blue)] font-heading md:text-lg">{step.num}</span>
                  <span className="text-[8px] text-[var(--angel-lavender)] opacity-40">✦</span>
                </div>
                <h3 className="mb-1 text-[13px] font-medium tracking-[0.04em] text-[var(--angel-text)] md:mb-1.5 md:text-[14px]">{step.title}</h3>
                <p className="text-[12px] leading-[1.6] text-[var(--angel-text-soft)] md:text-[13px] [word-break:keep-all]">{step.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-10 text-center">
            <Link href="/generate" className="angel-btn angel-btn-primary">
              <span className="text-[12px]">✦</span>
              지금 시작하기
            </Link>
          </div>
        </div>
      </section>

      {/* ══ Bottom decoration ══ */}
      <div className="pt-6 pb-16 text-center bg-[#dce4f2]">
        <div className="flex items-center justify-center gap-3">
          <span className="text-[12px] text-[var(--angel-lavender)]">✦</span>
          <span className="text-[14px] text-[var(--angel-lavender)]">✧</span>
          <span className="text-[12px] text-[var(--angel-lavender)]">✦</span>
        </div>
      </div>
    </div>
  );
}
