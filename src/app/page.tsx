import Link from "next/link";
import { AngelLogo } from "@/components/ui/angel-logo";
import { SEED_TAGS } from "@/lib/seed-data";

const BRANDS_PREVIEW = [
  { name: "MA*RS", url: "https://lilimpark.jp/shopbrand/mars_all/" },
  { name: "Angelic Pretty", url: "https://angelicpretty-onlineshop.com/" },
  { name: "Ank Rouge", url: "https://ailand-store.jp/brand/ankrouge" },
  { name: "ROJITA", url: "https://rlab-store.jp/" },
  { name: "BABY, THE STARS SHINE BRIGHT", url: "https://babyssb.co.jp/" },
  { name: "axes femme", url: "https://axesfemme-kawaii.com/" },
  { name: "LISTEN FLAVOR", url: "https://www.listenflavor.com/" },
  { name: "Moi-meme-Moitie", url: "https://moi-meme-moitie.com/" },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* ══ Hero Section ══ */}
      <section className="relative flex flex-col items-center justify-center px-5 pt-48 pb-32 text-center md:pt-52 md:pb-40 overflow-hidden star-bg bg-gradient-to-b from-[#d6deee] to-[#dce4f2]">
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
          <AngelLogo size={120} priority />
        </div>

        {/* Title */}
        <h1 className="relative z-10 max-w-lg text-5xl tracking-[0.08em] text-[var(--angel-text)] font-heading md:text-7xl">
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

        <p className="relative z-10 mt-6 max-w-sm text-[14px] leading-[1.8] text-[var(--angel-text)]">
          이 느낌, <strong className="text-[var(--angel-blue)]">나도 입고 싶다.</strong>
          <br />
          마음에 드는 사진 한 장이면
          <br />
          어울리는 아이템과 브랜드를 바로 알려줄게요.
        </p>

        {/* CTA Buttons */}
        <div className="relative z-10 mt-4 flex flex-col gap-3 sm:flex-row">
          <Link href="/moodboard" className="angel-btn angel-btn-primary">
            <span className="text-[10px]">✦</span>
            무드보드 만들기
          </Link>
          <Link href="/discover" className="angel-btn angel-btn-secondary">
            무드 탐색
          </Link>
        </div>
      </section>

      {/* ══ Section Divider ══ */}
      <div className="section-divider bg-gradient-to-b from-[#dce4f2] to-[#e0e7f4]">
        <span className="text-[20px] text-[var(--angel-lavender)] twinkle">✦</span>
      </div>

      {/* ══ Why MyAngel ══ */}
      <section className="snap-section relative mx-auto w-full px-5 py-16 bg-gradient-to-b from-[#e0e7f4] to-[#e4eaf6]">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-2 text-center text-3xl tracking-[0.08em] text-[var(--angel-text)] font-heading">
            Why MyAngel?
          </h2>
          <p className="mb-10 text-center text-[11px] tracking-[0.2em] text-[var(--angel-text-soft)]">
            ✦ 이런 고민, 있지 않나요? ✦
          </p>

          <div className="space-y-3 mb-10">
            {[
              "이 코디 너무 예쁜데, 어떤 아이템을 사야 이렇게 입을 수 있을까?",
              "검색해도 내가 원하는 느낌의 옷이 안 나와요",
              "이런 스타일의 브랜드가 있다는데, 어디서 찾아야 할지 모르겠어요",
            ].map((text, i) => (
              <div
                key={i}
                className="glass-card rounded-xl px-5 py-3.5 flex items-start gap-3 max-w-md mx-auto"
              >
                <span className="text-[10px] text-[var(--angel-lavender)] mt-0.5 shrink-0">✦</span>
                <span className="text-[12px] leading-[1.7] text-[var(--angel-text-soft)]">{text}</span>
              </div>
            ))}
          </div>

          <div className="text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--angel-blue)]/10 px-5 py-2 text-[12px] font-medium text-[var(--angel-blue)] mb-4">
              MyAngel이 도와줄게요
            </div>
            <p className="text-[13px] leading-[1.9] text-[var(--angel-text)]">
              마음에 드는 코디 사진만 보여주세요.
              <br />
              <strong className="text-[var(--angel-blue)]">그 느낌에 어울리는 아이템과 브랜드</strong>를
              <br />
              AI가 바로 찾아줄게요.
            </p>
          </div>
        </div>
      </section>

      {/* ══ Section Divider ══ */}
      <div className="section-divider bg-gradient-to-b from-[#e4eaf6] to-[#e0e7f4]">
        <span className="text-[20px] text-[var(--angel-lavender)] twinkle">✧</span>
      </div>

      {/* ══ How it works ══ */}
      <section className="snap-section relative mx-auto w-full px-5 py-16 bg-gradient-to-b from-[#e0e7f4] to-[#dce4f2]">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-2 text-center text-3xl tracking-[0.08em] text-[var(--angel-text)] font-heading">
            How it works
          </h2>
          <p className="mb-10 text-center text-[11px] tracking-[0.2em] text-[var(--angel-text-soft)]">
            ✦ four steps to your mood ✦
          </p>

          <div className="grid gap-4 md:grid-cols-4">
            {[
              { num: "I", title: "사진 한 장", desc: "마음에 드는 코디 사진을\n올려주세요" },
              { num: "II", title: "AI 분석", desc: "AI가 소재·실루엣·색감을\n분석해요" },
              { num: "III", title: "무드보드", desc: "비슷한 느낌의 사진으로\n3×3 보드를 완성해요" },
              { num: "IV", title: "아이템 & 브랜드", desc: "이 느낌에 어울리는\n아이템과 브랜드를 알려줘요" },
            ].map((step) => (
              <div key={step.num} className="glass-card rounded-2xl p-5 text-center group">
                <div className="mb-2 flex items-center justify-center gap-2">
                  <span className="text-[9px] text-[var(--angel-lavender)] opacity-40">✦</span>
                  <span className="text-lg text-[var(--angel-blue)] font-heading">{step.num}</span>
                  <span className="text-[9px] text-[var(--angel-lavender)] opacity-40">✦</span>
                </div>
                <h3 className="mb-1.5 text-[12px] font-medium tracking-[0.08em] text-[var(--angel-text)]">{step.title}</h3>
                <p className="text-[11px] leading-[1.7] text-[var(--angel-text-soft)] whitespace-pre-line">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ Section Divider ══ */}
      <div className="section-divider bg-gradient-to-b from-[#dce4f2] to-[#e0e7f4]">
        <span className="text-[20px] text-[var(--angel-lavender)] twinkle">✦</span>
      </div>

      {/* ══ Brands ══ */}
      <section className="snap-section w-full px-5 py-16 bg-gradient-to-b from-[#e0e7f4] to-[#e4eaf6]">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-2 text-center text-3xl tracking-[0.08em] text-[var(--angel-text)] font-heading">
            Brands
          </h2>
          <p className="mb-8 text-center text-[11px] tracking-[0.2em] text-[var(--angel-text-soft)]">
            ✦ 원하는 느낌에 어울리는 아이템을 만나보세요 ✦
          </p>

          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {BRANDS_PREVIEW.map((brand) => (
              <a
                key={brand.name}
                href={brand.url}
                target="_blank"
                rel="noopener noreferrer"
                className="brand-pill glass-card rounded-full px-4 py-2 text-[12px] font-medium tracking-[0.04em] text-[var(--angel-text)] font-heading"
              >
                {brand.name}
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="brand-pill-arrow">
                  <path d="M6 3h7v7" />
                  <path d="M13 3L6 10" />
                </svg>
              </a>
            ))}
            <span className="glass-card rounded-full px-4 py-2 text-[12px] text-[var(--angel-text-faint)]">
              +18 more
            </span>
          </div>

          <p className="text-center text-[11px] leading-[1.8] text-[var(--angel-text-soft)] max-w-sm mx-auto">
            마음에 드는 느낌이 있다면
            <br />
            그대로 입을 수 있도록 도와줄게요.
          </p>
        </div>
      </section>

      {/* ══ Section Divider ══ */}
      <div className="section-divider bg-gradient-to-b from-[#e4eaf6] to-[#e0e7f4]">
        <span className="text-[20px] text-[var(--angel-lavender)] twinkle">✧</span>
      </div>

      {/* ══ Trending Moods ══ */}
      <section className="snap-section w-full px-5 py-16 bg-gradient-to-b from-[#e0e7f4] to-[#dce4f2]">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-2 text-center text-3xl tracking-[0.08em] text-[var(--angel-text)] font-heading">
            Trending moods
          </h2>
          <p className="mb-8 text-center text-[11px] tracking-[0.2em] text-[var(--angel-text-soft)]">
            ✦ popular styles now ✦
          </p>

          <div className="flex flex-wrap justify-center gap-2">
            {SEED_TAGS.map((tag) => (
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
