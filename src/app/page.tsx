import Link from "next/link";
import { AngelLogo } from "@/components/ui/angel-logo";

const SAMPLE_TAGS = [
  "지뢰계", "양산형", "고스로리", "스위트로리타",
  "유메카와이이", "다크아카데미아", "페어리코어", "발레코어",
  "코티지코어", "로맨틱고스", "메르헨", "Y2K",
];

export default function HomePage() {
  return (
    <div className="flex flex-col scroll-smooth">
      {/* ══ Hero Section ══ */}
      <section className="snap-section relative flex flex-col items-center justify-center px-5 py-32 text-center md:py-40 overflow-hidden star-bg bg-gradient-to-b from-[#d6deee] to-[#dce4f2]">
        {/* Floating orbs */}
        <div className="absolute top-12 left-[8%] h-40 w-40 rounded-full bg-[var(--angel-blue)]/8 blur-[80px]" />
        <div className="absolute bottom-16 right-[10%] h-48 w-48 rounded-full bg-[var(--angel-lavender)]/10 blur-[80px]" />
        <div className="absolute top-28 right-[25%] h-24 w-24 rounded-full bg-[var(--angel-pink)]/8 blur-[60px]" />
        <div className="absolute bottom-32 left-[20%] h-32 w-32 rounded-full bg-[var(--angel-blue)]/6 blur-[70px]" />

        {/* Large decorative circles */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] md:w-[580px] md:h-[580px] rounded-full border-[3px] border-[var(--angel-blue)]/40 rotate-slow" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] md:w-[620px] md:h-[620px] rounded-full border-[2.5px] border-[var(--angel-lavender)]/35" style={{ animation: "rotate-slow 35s linear infinite reverse" }} />

        {/* Wing logo */}
        <div className="float-gentle mb-6 relative z-10">
          <AngelLogo size={120} />
        </div>

        {/* Title */}
        <h1
          className="relative z-10 max-w-lg text-5xl tracking-[0.08em] text-[var(--angel-text)] md:text-7xl"
          style={{ fontFamily: "var(--font-logo), 'Libre Bodoni', serif", fontWeight: 700 }}
        >
          My<span className="shimmer-text">Angel</span>
        </h1>

        <p className="relative z-10 mt-8 text-[12px] font-medium tracking-[0.3em] text-[var(--angel-text-soft)] uppercase">
          ✦ your angelic mood curator ✦
        </p>

        {/* Celestial divider */}
        <div className="relative z-10 mt-4 flex items-center gap-3 text-[var(--angel-text-faint)]">
          <span className="h-px w-10 bg-gradient-to-r from-transparent to-[var(--angel-blue)]/40" />
          <span className="text-[10px] tracking-[0.2em] text-[var(--angel-lavender)] twinkle">✦ ✧ ✦</span>
          <span className="h-px w-10 bg-gradient-to-l from-transparent to-[var(--angel-blue)]/40" />
        </div>

        <p className="relative z-10 mt-6 max-w-xs text-[14px] leading-[1.8] text-[var(--angel-text)]">
          무드 이미지 한 장이면 충분해요.
          <br />
          AI가 무드보드를 완성하고
          <br />
          어울리는 브랜드를 찾아줄게요.
        </p>

        {/* CTA Buttons */}
        <div className="relative z-10 mt-4 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/moodboard"
            className="angel-btn angel-btn-primary"
          >
            <span className="text-[10px]">✦</span>
            무드보드 만들기
          </Link>
          <Link
            href="/discover"
            className="angel-btn angel-btn-secondary"
          >
            무드 탐색
          </Link>
        </div>
      </section>

      {/* ══ Section Divider ══ */}
      <div className="section-divider bg-gradient-to-b from-[#dce4f2] to-[#e0e7f4]">
        <span className="text-[20px] text-[var(--angel-lavender)] twinkle">✦</span>
      </div>

      {/* ══ How it works ══ */}
      <section className="snap-section relative mx-auto w-full px-5 py-16 bg-gradient-to-b from-[#e0e7f4] to-[#dce4f2]">
        <div className="mx-auto max-w-3xl">
          <h2
            className="mb-2 text-center text-3xl tracking-[0.08em] text-[var(--angel-text)]"
            style={{ fontFamily: "var(--font-logo), 'Libre Bodoni', serif", fontWeight: 700 }}
          >
            How it works
          </h2>
          <p className="mb-10 text-center text-[11px] tracking-[0.2em] text-[var(--angel-text-soft)]">
            ✦ three steps to your angel board ✦
          </p>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                num: "I",
                icon: "✦",
                title: "무드 이미지",
                desc: "마음에 드는 무드 이미지를\n중심에 놓으세요",
              },
              {
                num: "II",
                icon: "✦",
                title: "AI 무드보드",
                desc: "AI가 비슷한 무드 8장을 찾아\n3×3 보드를 완성해요",
              },
              {
                num: "III",
                icon: "✦",
                title: "브랜드 추천",
                desc: "이 무드에 맞는 브랜드\n공식 스토어로 연결돼요",
              },
            ].map((step) => (
              <div
                key={step.num}
                className="glass-card rounded-2xl p-6 text-center group"
              >
                <div className="mb-3 flex items-center justify-center gap-2">
                  <span className="text-[10px] text-[var(--angel-lavender)] opacity-40">{step.icon}</span>
                  <span
                    className="text-xl text-[var(--angel-blue)]"
                    style={{ fontFamily: "var(--font-logo), 'Libre Bodoni', serif", fontWeight: 600 }}
                  >
                    {step.num}
                  </span>
                  <span className="text-[10px] text-[var(--angel-lavender)] opacity-40">{step.icon}</span>
                </div>

                <h3 className="mb-2 text-[13px] font-medium tracking-[0.08em] text-[var(--angel-text)]">
                  {step.title}
                </h3>
                <p className="text-[12px] leading-[1.7] text-[var(--angel-text)] whitespace-pre-line">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ Section Divider ══ */}
      <div className="section-divider bg-gradient-to-b from-[#dce4f2] to-[#e0e7f4]">
        <span className="text-[20px] text-[var(--angel-lavender)] twinkle">✧</span>
      </div>

      {/* ══ Trending Moods ══ */}
      <section className="snap-section w-full px-5 py-16 bg-gradient-to-b from-[#e0e7f4] to-[#dce4f2]">
        <div className="mx-auto max-w-3xl">
          <h2
            className="mb-2 text-center text-3xl tracking-[0.08em] text-[var(--angel-text)]"
            style={{ fontFamily: "var(--font-logo), 'Libre Bodoni', serif", fontWeight: 700 }}
          >
            Trending moods
          </h2>
          <p className="mb-8 text-center text-[11px] tracking-[0.2em] text-[var(--angel-text-soft)]">
            ✦ popular styles now ✦
          </p>

          <div className="flex flex-wrap justify-center gap-2">
            {SAMPLE_TAGS.map((tag) => (
              <Link
                key={tag}
                href={`/discover?tag=${encodeURIComponent(tag)}`}
                className="angel-tag hover:angel-tag-active transition-all duration-300"
              >
                #{tag}
              </Link>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 text-[11px] tracking-[0.08em] text-[var(--angel-text-faint)] transition-colors hover:text-[var(--angel-text-soft)]"
            >
              <span className="text-[8px] text-[var(--angel-lavender)]">✦</span>
              모든 무드 보기
              <span className="text-[8px] text-[var(--angel-lavender)]">✦</span>
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
