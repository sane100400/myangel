import Link from "next/link";
import { AngelLogo } from "@/components/ui/angel-logo";
import { AsciiHearts } from "@/components/ui/ascii-hearts";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* ══ Hero Section ══ */}
      <section className="relative flex flex-col items-center justify-center px-5 pt-28 pb-16 text-center md:pt-52 md:pb-40 overflow-hidden bg-gradient-to-b from-[#d6deee] to-[#dce4f2] star-bg-desktop">
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

        <h1 className="relative z-10 max-w-lg text-4xl tracking-[0.08em] text-[var(--angel-text)] font-heading md:text-7xl">
          My<span className="shimmer-text">Angel</span>
        </h1>

        <p className="relative z-10 mt-5 text-[10px] font-medium tracking-[0.3em] text-[var(--angel-text-soft)] uppercase md:mt-8 md:text-[12px]">
          ✦ interactive prompt optimization studio ✦
        </p>

        <div className="relative z-10 mt-3 flex items-center gap-3 text-[var(--angel-text-faint)] md:mt-4">
          <span className="h-px w-8 bg-gradient-to-r from-transparent to-[var(--angel-blue)]/40 md:w-10" />
          <span className="text-[10px] tracking-[0.2em] text-[var(--angel-lavender)] twinkle">✦ ✧ ✦</span>
          <span className="h-px w-8 bg-gradient-to-l from-transparent to-[var(--angel-blue)]/40 md:w-10" />
        </div>

        <p className="relative z-10 mt-5 max-w-sm text-[13px] leading-[1.8] text-[var(--angel-text)] md:mt-6 md:text-[14px]">
          간단한 입력만으로 <strong className="text-[var(--angel-blue)]">프롬프트를 최적화</strong>하고,
          <br />
          원하는 이미지를 정확하게
          <br />
          생성해보세요.
        </p>

        <div className="relative z-10 mt-5">
          <Link href="/generate" className="angel-btn angel-btn-primary">
            <span className="text-[10px]">✦</span>
            Studio 시작하기
          </Link>
        </div>
      </section>

      {/* ══ Section Divider ══ */}
      <div className="section-divider bg-gradient-to-b from-[#dce4f2] to-[#e0e7f4]">
        <span className="text-[20px] text-[var(--angel-lavender)] twinkle">✦</span>
      </div>

      {/* ══ The Problem ══ */}
      <section className="snap-section w-full px-5 py-10 md:py-16 bg-gradient-to-b from-[#e0e7f4] to-[#e4eaf6]">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-2 text-center text-3xl tracking-[0.08em] text-[var(--angel-text)] font-heading">
            The Problem
          </h2>
          <p className="mb-10 text-center text-[11px] tracking-[0.2em] text-[var(--angel-text-soft)]">
            ✦ 프롬프트 작성, 왜 어려울까? ✦
          </p>

          <div className="glass-card rounded-2xl px-6 py-5 mb-6 max-w-lg mx-auto">
            <p className="text-[13px] leading-[2] text-[var(--angel-text)] text-center [word-break:keep-all]">
              AI 이미지 생성 모델은 강력하지만,
              <br />
              <strong className="text-[var(--angel-blue)]">프롬프트를 잘 써야</strong> 원하는 결과가 나와요.
            </p>
          </div>

          <p className="text-center text-[12px] leading-[1.9] text-[var(--angel-text-soft)] mb-10 max-w-sm mx-auto [word-break:keep-all]">
            &ldquo;예쁜 방&rdquo;, &ldquo;감성적인 분위기&rdquo; 같은 표현은
            <br />
            AI가 이해하기엔 너무 추상적이에요.
            <br />
            결국 수십 번 수정하며 시간과 비용을 낭비하게 돼요.
          </p>

          <div className="flex items-center justify-center gap-3 mb-8">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-[var(--angel-blue)]/40" />
            <span className="text-[9px] tracking-[0.2em] text-[var(--angel-lavender)] twinkle">✦ ✧ ✦</span>
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-[var(--angel-blue)]/40" />
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--angel-blue)]/10 px-5 py-2 text-[12px] font-medium text-[var(--angel-blue)] mb-5">
              MyAngel이 해결해요
            </div>
            <p className="text-[12px] leading-[2] text-[var(--angel-text-soft)] max-w-sm mx-auto [word-break:keep-all]">
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

      {/* ══ Core Features ══ */}
      <section className="snap-section relative mx-auto w-full px-5 py-10 md:py-16 bg-gradient-to-b from-[#e0e7f4] to-[#e4eaf6]">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-2 text-center text-3xl tracking-[0.08em] text-[var(--angel-text)] font-heading">
            Core Features
          </h2>
          <p className="mb-10 text-center text-[11px] tracking-[0.2em] text-[var(--angel-text-soft)]">
            ✦ 세 가지 핵심 기능 ✦
          </p>

          <div className="space-y-4">
            {/* Feature 1: Object Editor */}
            <div className="glass-card rounded-2xl px-6 py-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--angel-blue)]/12 text-[12px]">
                  🎯
                </span>
                <h3 className="text-[14px] font-medium tracking-[0.04em] text-[var(--angel-text)]">
                  오브젝트 에디터
                </h3>
              </div>
              <p className="text-[12px] leading-[1.9] text-[var(--angel-text-soft)] [word-break:keep-all]">
                입력한 설명을 <strong className="text-[var(--angel-text)]">피사체, 배경, 분위기, 조명, 색감</strong> 등의 요소로 자동 분해해요.
                각 요소의 속성을 슬라이더로 세밀하게 조절할 수 있어서,
                &ldquo;배경은 몽환적으로, 피사체는 사실적으로&rdquo; 같은 세밀한 제어가 가능해요.
              </p>
            </div>

            {/* Feature 2: Dynamic Enhancement */}
            <div className="glass-card rounded-2xl px-6 py-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--angel-lavender)]/12 text-[12px]">
                  ✨
                </span>
                <h3 className="text-[14px] font-medium tracking-[0.04em] text-[var(--angel-text)]">
                  동적 프롬프트 강화
                </h3>
              </div>
              <p className="text-[12px] leading-[1.9] text-[var(--angel-text-soft)] [word-break:keep-all]">
                &ldquo;예쁜&rdquo;, &ldquo;감성적인&rdquo; 같은 <strong className="text-[var(--angel-text)]">추상적 표현을 자동 감지</strong>하고 하이라이트해요.
                클릭하면 문맥에 맞는 구체적인 대안을 제시해서,
                이미지 생성 모델이 더 잘 이해할 수 있는 프롬프트로 개선해요.
              </p>
            </div>

            {/* Feature 3: AI Image Generation */}
            <div className="glass-card rounded-2xl px-6 py-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--angel-pink)]/12 text-[12px]">
                  🖼️
                </span>
                <h3 className="text-[14px] font-medium tracking-[0.04em] text-[var(--angel-text)]">
                  AI 이미지 생성
                </h3>
              </div>
              <p className="text-[12px] leading-[1.9] text-[var(--angel-text-soft)] [word-break:keep-all]">
                최적화된 프롬프트로 바로 이미지를 생성해요.
                <strong className="text-[var(--angel-text)]"> 강화 전/후 결과를 비교</strong>할 수 있어서
                어떤 수정이 어떤 영향을 미쳤는지 직관적으로 확인할 수 있어요.
                한국어로 입력해도 내부적으로 영어로 최적화돼요.
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
      <section className="snap-section relative mx-auto w-full px-5 py-10 md:py-16 bg-gradient-to-b from-[#e0e7f4] to-[#dce4f2]">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-2 text-center text-3xl tracking-[0.08em] text-[var(--angel-text)] font-heading">
            How it works
          </h2>
          <p className="mb-10 text-center text-[11px] tracking-[0.2em] text-[var(--angel-text-soft)]">
            ✦ five steps to your perfect image ✦
          </p>

          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-5 md:gap-3">
            {[
              { num: "I", title: "입력", desc: "원하는 이미지를 간단하게 설명해요" },
              { num: "II", title: "분해", desc: "장면을 구성 요소 단위로 자동 분해해요" },
              { num: "III", title: "편집", desc: "각 요소의 속성을 세밀하게 조절해요" },
              { num: "IV", title: "강화", desc: "추상적 표현을 구체적으로 개선해요" },
              { num: "V", title: "생성", desc: "최적화된 프롬프트로 이미지를 만들어요" },
            ].map((step) => (
              <div key={step.num} className="glass-card rounded-xl p-3 text-center md:rounded-2xl md:p-4">
                <div className="mb-1.5 flex items-center justify-center gap-1.5 md:mb-2">
                  <span className="text-[8px] text-[var(--angel-lavender)] opacity-40">✦</span>
                  <span className="text-base text-[var(--angel-blue)] font-heading md:text-lg">{step.num}</span>
                  <span className="text-[8px] text-[var(--angel-lavender)] opacity-40">✦</span>
                </div>
                <h3 className="mb-1 text-[11px] font-medium tracking-[0.04em] text-[var(--angel-text)] md:mb-1.5 md:text-[12px]">{step.title}</h3>
                <p className="text-[10px] leading-[1.6] text-[var(--angel-text-soft)] md:text-[11px] [word-break:keep-all]">{step.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-10 text-center">
            <Link href="/generate" className="angel-btn angel-btn-primary">
              <span className="text-[10px]">✦</span>
              지금 시작하기
            </Link>
          </div>
        </div>
      </section>

      {/* ══ Bottom decoration ══ */}
      <div className="pt-6 pb-16 text-center bg-[#dce4f2]">
        <div className="flex items-center justify-center gap-3">
          <span className="text-[10px] text-[var(--angel-lavender)]">✦</span>
          <span className="text-[12px] text-[var(--angel-lavender)]">✧</span>
          <span className="text-[10px] text-[var(--angel-lavender)]">✦</span>
        </div>
      </div>
    </div>
  );
}
