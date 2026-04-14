import Link from "next/link";
import { AngelLogo } from "@/components/ui/angel-logo";
import { AsciiHearts } from "@/components/ui/ascii-hearts";
import { StudioDemo } from "@/components/home/studio-demo";
import {
  OrnateCross,
  LineHeart,
  HaloRays,
  Quill,
  Hourglass,
  Fleur,
  RadiantEye,
  Chalice,
  Orb,
} from "@/components/ui/ornaments";

/**
 * Landing page — 天使界隈 / lace-devotional aesthetic.
 *
 * Layout principle: ONE parchment ground runs end-to-end. Section variation
 * comes from local glow blobs and ribbon banner colors, not from different
 * background bases — so the page reads as one continuous illustrated book.
 */
export default function HomePage() {
  return (
    <div className="parchment-ground">
      {/* Page-wide watermark cross (subtle) */}
      <div className="watermark-cross pointer-events-none fixed inset-0 opacity-60" />

      <div className="relative">
        {/* ════════════════════════════════════════════
            ✟  HERO
            ════════════════════════════════════════════ */}
        <section className="relative flex flex-col items-center justify-center overflow-hidden px-4 pt-20 pb-24 text-center md:px-5 md:pt-28 md:pb-32">
          <AsciiHearts />

          {/* Soft localized glows */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[10%] top-[16%] h-44 w-44 rounded-full bg-[var(--angel-blue)]/15 blur-[90px] md:h-60 md:w-60" />
            <div className="absolute right-[12%] top-[12%] h-48 w-48 rounded-full bg-[var(--angel-lavender)]/15 blur-[90px] md:h-64 md:w-64" />
            <div className="absolute bottom-[18%] left-[20%] h-36 w-36 rounded-full bg-[var(--angel-blue)]/12 blur-[80px] md:h-52 md:w-52" />
          </div>

          {/* Slowly rotating concentric circles */}
          <div className="pointer-events-none">
            <div className="absolute left-1/2 top-1/2 h-[min(540px,90vw)] w-[min(540px,90vw)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--angel-blue)]/22 rotate-slow md:h-[min(620px,68vw)] md:w-[min(620px,68vw)]" />
            <div
              className="absolute left-1/2 top-1/2 h-[min(600px,96vw)] w-[min(600px,96vw)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[var(--angel-lavender)]/22 md:h-[min(680px,76vw)] md:w-[min(680px,76vw)]"
              style={{ animation: "rotate-slow 50s linear infinite reverse" }}
            />
          </div>

          {/* Logo (no halo behind, no side wings — the logo itself is winged) */}
          <div className="relative z-10 ascend ascend-d1 flex items-center justify-center">
            <div className="relative float-gentle">
              <AngelLogo size={92} priority />
            </div>
          </div>

          {/* Main heading */}
          <h1 className="relative z-10 ascend ascend-d2 mt-8 font-heading text-[52px] leading-[0.95] tracking-[0.02em] text-[var(--angel-text)] md:mt-10 md:text-[96px]">
            My<span className="shimmer-text">Angel</span>
          </h1>

          {/* Uppercase subtitle (NO script font — keeps things calm) */}
          <p className="relative z-10 ascend ascend-d3 mt-5 text-[11px] font-medium uppercase tracking-[0.32em] text-[var(--angel-text-soft)] md:mt-7 md:text-[13px]">
            ✦ Interactive Prompt Optimization Studio ✦
          </p>

          {/* Ornament divider — echoes section-divider */}
          <div className="relative z-10 ascend ascend-d3 mt-5 flex items-center gap-4 md:mt-7">
            <span className="h-px w-16 bg-gradient-to-r from-transparent to-[var(--angel-lavender)]/60 md:w-20" />
            <span className="text-[16px] text-[var(--angel-lavender)] twinkle">✦</span>
            <span className="h-px w-16 bg-gradient-to-l from-transparent to-[var(--angel-lavender)]/60 md:w-20" />
          </div>

          {/* Korean lead body */}
          <p className="relative z-10 ascend ascend-d4 mt-6 max-w-sm text-[14px] leading-[2] text-[var(--angel-text)] [word-break:keep-all] md:mt-8 md:max-w-md md:text-[16px]">
            간단한 입력만으로{" "}
            <strong className="font-semibold text-[var(--angel-lavender)]">
              프롬프트를 최적화
            </strong>
            하고,
            <br />
            원하는 이미지를 정확하게 생성해보세요.
          </p>

          {/* CTA */}
          <div className="relative z-10 ascend ascend-d5 mt-10 md:mt-12">
            <Link href="/generate" className="winged-cta">
              <OrnateCross size={13} className="text-[var(--angel-lavender)]" />
              Studio 시작하기
              <OrnateCross size={13} className="text-[var(--angel-lavender)]" />
            </Link>
          </div>
        </section>

        <div className="section-divider">
          <span className="text-[20px] text-[var(--angel-lavender)] twinkle">✦</span>
        </div>

        {/* ════════════════════════════════════════════
            ✟  THE PROBLEM
            ════════════════════════════════════════════ */}
        <section className="relative overflow-hidden px-4 pt-20 pb-24 md:px-5 md:pt-24 md:pb-28">
          <div className="pointer-events-none absolute -top-12 left-1/2 h-72 w-[80vw] max-w-[640px] -translate-x-1/2 rounded-full bg-[var(--angel-blue)]/12 blur-[100px]" />

          <div className="relative mx-auto max-w-2xl">
            <SectionTitle eyebrow="Chapter I" title="The Problem" />

            <p className="mt-12 text-center text-[16px] leading-[2] text-[var(--angel-text)] [word-break:keep-all] md:text-[18px]">
              강력한 AI 이미지 모델 앞에서도,
              <br />
              우리는 여전히 <strong className="font-semibold text-[var(--angel-lavender)]">좋은 프롬프트</strong>가 필요합니다.
            </p>

            <p className="mx-auto mt-10 max-w-md text-center text-[14px] leading-[2] text-[var(--angel-text-soft)] [word-break:keep-all] md:text-[15px]">
              &ldquo;예쁜 방&rdquo;, &ldquo;감성적인 분위기&rdquo; 같은 표현은
              <br />
              AI가 이해하기엔 너무 추상적입니다.
              <br />
              결국 수십 번 수정하며 시간과 비용을 낭비하게 돼요.
            </p>

            <p className="mx-auto mt-12 max-w-md text-center text-[14px] leading-[2] text-[var(--angel-text)] [word-break:keep-all] md:text-[15px]">
              MyAngel은 추상적인 입력을{" "}
              <strong className="font-semibold text-[var(--angel-lavender)]">
                구조화된 프롬프트
              </strong>
              로 바꾸고,
              <br />
              약한 표현을 자동으로 가려 고쳐드립니다.
            </p>
          </div>
        </section>

        <div className="section-divider">
          <span className="text-[20px] text-[var(--angel-lavender)] twinkle">✦</span>
        </div>

        {/* ════════════════════════════════════════════
            ✟  FEATURE I — Prompt Enhancement
            ════════════════════════════════════════════ */}
        <section className="relative overflow-hidden px-4 pt-20 pb-24 md:px-5 md:pt-24 md:pb-28">
          <div className="pointer-events-none absolute -top-12 right-[10%] h-72 w-72 rounded-full bg-[var(--angel-blue)]/12 blur-[100px]" />
          <div className="pointer-events-none absolute bottom-0 left-[8%] h-64 w-64 rounded-full bg-[var(--angel-lavender)]/10 blur-[90px]" />

          <div className="relative mx-auto max-w-3xl">
            <SectionTitle
              eyebrow="Chapter II"
              title="Prompt Enhancement"
              subtitle="약한 표현을 가려, 더 구체적인 문장으로 다듬어드려요."
            />
            <div className="mb-12" />

            <div className="devotional-frame rounded-sm">
              <span className="corner-bl" />
              <span className="corner-br" />

              <div className="mb-1 flex items-center gap-2 text-[10px] tracking-[0.28em] uppercase text-[var(--angel-text-faint)]">
                <Quill size={11} className="text-amber-500" />
                Before
              </div>
              <div className="rounded-xl border border-[var(--angel-blue)]/30 bg-white px-4 py-3 text-[14px] leading-[1.8] text-[var(--angel-text)] shadow-[0_0_0_3px_rgba(91,155,213,0.08)] md:text-[15px]">
                하얀 침대가 있는{" "}
                <span className="rounded px-0.5 bg-amber-50/80 text-amber-800 underline decoration-wavy decoration-2 decoration-amber-400 underline-offset-[3px]">
                  예쁜
                </span>{" "}
                방,{" "}
                <span className="rounded px-0.5 bg-amber-50/80 text-amber-800 underline decoration-wavy decoration-2 decoration-amber-400 underline-offset-[3px]">
                  감성적인
                </span>{" "}
                분위기의 창문
              </div>

              <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200/60 px-4 py-2 text-[13px] font-medium text-amber-800">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[11px] font-bold text-white">
                    2
                  </span>
                  개선할 수 있는 표현
                </span>
              </div>

              <div className="my-5 flex items-center justify-center gap-3 text-[var(--angel-lavender)]/55">
                <span className="h-px w-12 bg-gradient-to-r from-transparent to-[var(--angel-lavender)]/50" />
                <OrnateCross size={12} />
                <span className="h-px w-12 bg-gradient-to-l from-transparent to-[var(--angel-lavender)]/50" />
              </div>

              <div className="mb-1 flex items-center gap-2 text-[10px] tracking-[0.28em] uppercase text-[var(--angel-text-faint)]">
                <Fleur size={11} className="text-sky-500" />
                After
              </div>
              <div className="rounded-xl border border-[var(--angel-blue)]/30 bg-white px-4 py-3 text-[14px] leading-[1.8] text-[var(--angel-text)] shadow-[0_0_0_3px_rgba(91,155,213,0.08)] md:text-[15px]">
                하얀 침대가 있는{" "}
                <span className="rounded px-0.5 bg-sky-50 text-sky-700 underline decoration-2 decoration-sky-400 underline-offset-[3px]">
                  아이보리 톤의 미니멀한
                </span>{" "}
                방,{" "}
                <span className="rounded px-0.5 bg-sky-50 text-sky-700 underline decoration-2 decoration-sky-400 underline-offset-[3px]">
                  부드러운 자연광이 들어오는 따뜻한
                </span>{" "}
                분위기의 창문
              </div>

              <div className="mt-3 flex items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 border border-sky-200/60 px-4 py-2 text-[13px] font-medium text-sky-700">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="3 8 7 12 13 4" />
                  </svg>
                  모든 표현이 개선되었어요
                </span>
              </div>

              <p className="mt-5 text-center text-[12px] text-[var(--angel-text-faint)]">
                — 밑줄 친 단어를 클릭하면 더 구체적인 표현이 추천돼요 —
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-4 md:mt-12 md:grid-cols-3 md:gap-5">
              <BenefitCard
                icon={<RadiantEye size={17} className="text-[var(--angel-lavender)]" />}
                title="자동 감지"
                desc="약한 표현을 AI가 찾아내요"
              />
              <BenefitCard
                icon={<LineHeart size={17} className="text-[var(--angel-pink)]" />}
                title="원클릭 개선"
                desc="클릭 한 번으로 구체화"
              />
              <BenefitCard
                icon={<Orb size={17} className="text-[var(--angel-blue)]" />}
                title="자동 번역"
                desc="한국어 → 영어 최적화"
              />
            </div>
          </div>
        </section>

        <div className="section-divider">
          <span className="text-[20px] text-[var(--angel-lavender)] twinkle">✦</span>
        </div>

        {/* ════════════════════════════════════════════
            ✟  FEATURE II — Object Studio
            ════════════════════════════════════════════ */}
        <section className="relative overflow-hidden px-4 pt-20 pb-24 md:px-5 md:pt-24 md:pb-28">
          <div className="pointer-events-none absolute top-0 left-[10%] h-72 w-72 rounded-full bg-[var(--angel-blue)]/10 blur-[100px]" />
          <div className="pointer-events-none absolute bottom-0 right-[10%] h-72 w-72 rounded-full bg-[var(--angel-lavender)]/12 blur-[100px]" />

          <div className="relative mx-auto max-w-3xl">
            <SectionTitle
              eyebrow="Chapter III"
              title="Object Studio"
              subtitle="장면을 구성 요소로 나누고, 각 요소를 독립적으로 다듬어요."
            />
            <div className="mb-12" />

            <div className="devotional-frame rounded-sm">
              <span className="corner-bl" />
              <span className="corner-br" />
              <StudioDemo />
            </div>

            <div className="mt-10 grid grid-cols-1 gap-4 md:mt-12 md:grid-cols-3 md:gap-5">
              <BenefitCard
                icon={<Fleur size={17} className="text-[var(--angel-lavender)]" />}
                title="자동 분해"
                desc="입력을 요소별로 분리"
              />
              <BenefitCard
                icon={<Hourglass size={17} className="text-[var(--angel-pink)]" />}
                title="속성 슬라이더"
                desc="세밀한 강도 조절"
              />
              <BenefitCard
                icon={<OrnateCross size={17} className="text-[var(--angel-blue)]" />}
                title="충돌 감지"
                desc="속성 간 모순을 경고"
              />
            </div>
          </div>
        </section>

        <div className="section-divider">
          <span className="text-[20px] text-[var(--angel-lavender)] twinkle">✦</span>
        </div>

        {/* ════════════════════════════════════════════
            ✟  MORE FEATURES
            ════════════════════════════════════════════ */}
        <section className="relative overflow-hidden px-4 pt-20 pb-24 md:px-5 md:pt-24 md:pb-28">
          <div className="pointer-events-none absolute top-0 right-[20%] h-64 w-64 rounded-full bg-[var(--angel-lavender)]/10 blur-[100px]" />

          <div className="relative mx-auto max-w-2xl">
            <SectionTitle
              eyebrow="Chapter IV"
              title="More"
              subtitle="프롬프트 강화 외에도 작은 도움들이 있어요."
            />
            <div className="mb-12" />

            <div className="space-y-5 md:space-y-6">
              <DevotionalRow
                icon={<Chalice size={18} className="text-[var(--angel-lavender)]" />}
                title="프롬프트 비교"
                body={
                  <>
                    원본 입력과 AI가 정제한 프롬프트를 <strong>나란히</strong> 비교할 수 있어요.
                    한국어/영어 토글로 실제 이미지 생성에 쓰이는 영어 프롬프트도 확인 가능합니다.
                  </>
                }
              />
              <DevotionalRow
                icon={<HaloRays size={20} className="text-[var(--angel-pink)]" />}
                title="AI 이미지 생성"
                body={
                  <>
                    최적화된 프롬프트로 바로 이미지를 생성해요.
                    레퍼런스 이미지 업로드와 <strong>프리미엄 2K 고해상도</strong>까지 지원합니다.
                  </>
                }
              />
            </div>
          </div>
        </section>

        <div className="section-divider">
          <span className="text-[20px] text-[var(--angel-lavender)] twinkle">✦</span>
        </div>

        {/* ════════════════════════════════════════════
            ✟  HOW IT WORKS
            ════════════════════════════════════════════ */}
        <section className="relative overflow-hidden px-4 pt-20 pb-28 md:px-5 md:pt-24 md:pb-32">
          <div className="pointer-events-none absolute -top-12 left-1/2 h-80 w-[80vw] max-w-[700px] -translate-x-1/2 rounded-full bg-[var(--angel-lavender)]/12 blur-[110px]" />

          <div className="relative mx-auto max-w-5xl">
            <SectionTitle
              eyebrow="Chapter V"
              title="How it works"
              subtitle="한 줄의 입력에서 완성된 이미지까지, 다섯 단계."
            />
            <div className="mb-16 md:mb-20" />

            <div className="grid grid-cols-1 gap-12 md:grid-cols-5 md:gap-4">
              {STEPS.map((step, i) => (
                <div key={step.num} className="relative flex flex-col items-center text-center">
                  {i < STEPS.length - 1 && (
                    <span className="absolute left-[calc(50%+36px)] right-[calc(-50%+36px)] top-[32px] hidden h-px bg-gradient-to-r from-[var(--angel-lavender)]/40 via-[var(--angel-pink)]/30 to-[var(--angel-lavender)]/40 md:block" />
                  )}

                  <div className="roman-medallion">{step.num}</div>

                  <h3 className="mt-5 text-[15px] font-semibold tracking-[0.04em] text-[var(--angel-text)]">
                    {step.kor}
                  </h3>
                  <p className="mt-2 max-w-[200px] text-[13px] leading-[1.75] text-[var(--angel-text-soft)] [word-break:keep-all] md:text-[14px]">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-20 flex flex-col items-center md:mt-24">
              <Link href="/generate" className="winged-cta">
                <LineHeart size={13} className="text-[var(--angel-pink)]" />
                지금 시작하기
                <LineHeart size={13} className="text-[var(--angel-pink)]" />
              </Link>
            </div>
          </div>
        </section>

        {/* Footer sign-off — echoes the section divider */}
        <div className="pb-16 pt-4 text-center">
          <div className="mx-auto flex items-center justify-center gap-4">
            <span className="h-px w-16 bg-gradient-to-r from-transparent to-[var(--angel-lavender)]/55 md:w-24" />
            <span className="text-[14px] text-[var(--angel-lavender)] twinkle">✦</span>
            <span className="h-px w-16 bg-gradient-to-l from-transparent to-[var(--angel-lavender)]/55 md:w-24" />
          </div>
          <p className="mt-4 font-script text-[22px] leading-none text-[var(--angel-lavender)]/75 md:text-[26px]">
            sincerely, your angel
          </p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Local helpers
   ═══════════════════════════════════════════════════════ */

const STEPS = [
  { num: "I",   kor: "입력", desc: "원하는 이미지를 한 문장으로 설명해요" },
  { num: "II",  kor: "분해", desc: "장면을 구성 요소 단위로 자동 분해해요" },
  { num: "III", kor: "편집", desc: "각 요소의 속성을 세밀하게 조절해요" },
  { num: "IV",  kor: "강화", desc: "추상적 표현을 구체적으로 개선해요" },
  { num: "V",   kor: "생성", desc: "최적화된 프롬프트로 이미지를 만들어요" },
];

function SectionTitle({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="text-center">
      <p className="text-[10px] font-medium uppercase tracking-[0.36em] text-[var(--angel-text-faint)] md:text-[11px]">
        {eyebrow}
      </p>
      <h2 className="mt-4 font-heading text-[32px] leading-[1.05] tracking-[0.02em] text-[var(--angel-text)] md:mt-5 md:text-[46px]">
        {title}
      </h2>
      <div className="mx-auto mt-5 flex items-center justify-center gap-4 md:mt-6">
        <span className="h-px w-14 bg-gradient-to-r from-transparent to-[var(--angel-lavender)]/60 md:w-20" />
        <span className="text-[14px] text-[var(--angel-lavender)] twinkle">✦</span>
        <span className="h-px w-14 bg-gradient-to-l from-transparent to-[var(--angel-lavender)]/60 md:w-20" />
      </div>
      {subtitle && (
        <p className="mx-auto mt-5 max-w-md text-[14px] leading-[1.85] text-[var(--angel-text-soft)] [word-break:keep-all] md:text-[15px]">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function BenefitCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="group relative px-5 py-6 text-center">
      <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[var(--angel-lavender)]/45 to-transparent" />
      <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--angel-lavender)]/30 bg-white/70">
        {icon}
      </div>
      <p className="text-[14px] font-semibold tracking-[0.04em] text-[var(--angel-text)]">
        {title}
      </p>
      <p className="mx-auto mt-1.5 max-w-[180px] text-[12px] leading-[1.7] text-[var(--angel-text-soft)] [word-break:keep-all]">
        {desc}
      </p>
    </div>
  );
}

function DevotionalRow({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: React.ReactNode;
}) {
  return (
    <div className="group relative flex items-start gap-5 px-2 py-6">
      <span className="pointer-events-none absolute inset-x-2 top-0 h-px bg-gradient-to-r from-transparent via-[var(--angel-lavender)]/40 to-transparent" />
      <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--angel-lavender)]/30 bg-white/70">
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="text-[16px] font-semibold tracking-[0.03em] text-[var(--angel-text)] md:text-[17px]">
          {title}
        </h3>
        <p className="mt-2 text-[14px] leading-[1.9] text-[var(--angel-text-soft)] [word-break:keep-all] md:text-[15px]">
          {body}
        </p>
      </div>
    </div>
  );
}
