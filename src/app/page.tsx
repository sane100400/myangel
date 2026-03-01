import Link from "next/link";
import { AngelLogo } from "@/components/ui/angel-logo";
import { AsciiHearts } from "@/components/ui/ascii-hearts";
import { StylePresetGrid } from "@/components/home/style-preset-grid";

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
      <section className="relative flex flex-col items-center justify-center px-5 pt-28 pb-16 text-center md:pt-52 md:pb-40 overflow-hidden bg-gradient-to-b from-[#d6deee] to-[#dce4f2] star-bg-desktop">
        {/* ── ASCII heart decorations (hero only) ── */}
        <AsciiHearts />

        {/* Floating orbs — mobile: smaller/fewer, desktop: full set */}
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

        {/* Large decorative circles — mobile: 크게 (짤려도 OK), desktop: 기존 */}
        <div className="pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vw] rounded-full border-[2px] border-[var(--angel-blue)]/20 rotate-slow md:w-[min(580px,70vw)] md:h-[min(580px,70vw)] md:border-[3px] md:border-[var(--angel-blue)]/30" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[135vw] h-[135vw] rounded-full border-[1.5px] border-[var(--angel-lavender)]/15 md:w-[min(620px,75vw)] md:h-[min(620px,75vw)] md:border-[2px] md:border-[var(--angel-lavender)]/25" style={{ animation: "rotate-slow 35s linear infinite reverse" }} />
        </div>

        {/* Wing logo */}
        <div className="mb-5 relative z-10 md:float-gentle md:mb-6">
          <AngelLogo size={80} priority />
        </div>

        {/* Title */}
        <h1 className="relative z-10 max-w-lg text-4xl tracking-[0.08em] text-[var(--angel-text)] font-heading md:text-7xl">
          My<span className="shimmer-text">Angel</span>
        </h1>

        <p className="relative z-10 mt-5 text-[10px] font-medium tracking-[0.3em] text-[var(--angel-text-soft)] uppercase md:mt-8 md:text-[12px]">
          ✦ prompt curator & image creator ✦
        </p>

        {/* Celestial divider */}
        <div className="relative z-10 mt-3 flex items-center gap-3 text-[var(--angel-text-faint)] md:mt-4">
          <span className="h-px w-8 bg-gradient-to-r from-transparent to-[var(--angel-blue)]/40 md:w-10" />
          <span className="text-[10px] tracking-[0.2em] text-[var(--angel-lavender)] twinkle">✦ ✧ ✦</span>
          <span className="h-px w-8 bg-gradient-to-l from-transparent to-[var(--angel-blue)]/40 md:w-10" />
        </div>

        <p className="relative z-10 mt-5 max-w-sm text-[13px] leading-[1.8] text-[var(--angel-text)] md:mt-6 md:text-[14px]">
          트렌드에 맞는 <strong className="text-[var(--angel-blue)]">나만의 이미지</strong>를 만들고,
          <br />
          취향이 담긴 프롬프트를
          <br />
          공유하고 사고팔아요.
        </p>

        {/* CTA Button */}
        <div className="relative z-10 mt-5">
          <Link href="/generate" className="angel-btn angel-btn-primary">
            <span className="text-[10px]">✦</span>
            바로 시작하기
          </Link>
        </div>
      </section>

      {/* ══ Section Divider ══ */}
      <div className="section-divider bg-gradient-to-b from-[#dce4f2] to-[#e0e7f4]">
        <span className="text-[20px] text-[var(--angel-lavender)] twinkle">✦</span>
      </div>

      {/* ══ What is Prompt ══ */}
      <section className="snap-section w-full px-5 py-10 md:py-16 bg-gradient-to-b from-[#e0e7f4] to-[#e4eaf6]">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-2 text-center text-3xl tracking-[0.08em] text-[var(--angel-text)] font-heading">
            Prompt?
          </h2>
          <p className="mb-10 text-center text-[11px] tracking-[0.2em] text-[var(--angel-text-soft)]">
            ✦ 프롬프트, 그게 뭔데? ✦
          </p>

          {/* 프롬프트 설명 */}
          <div className="glass-card rounded-2xl px-6 py-5 mb-6 max-w-lg mx-auto">
            <p className="text-[13px] leading-[2] text-[var(--angel-text)] text-center [word-break:keep-all]">
              프롬프트는 AI에게 &ldquo;이런 이미지 만들어줘&rdquo; 하고
              <br />
              전달하는 <strong className="text-[var(--angel-blue)]">글로 쓴 레시피</strong>예요.
            </p>
          </div>

          <p className="text-center text-[12px] leading-[1.9] text-[var(--angel-text-soft)] mb-10 max-w-sm mx-auto [word-break:keep-all]">
            같은 AI라도 프롬프트에 따라 결과가 완전히 달라져요.
            <br />
            어떤 단어를 쓰고, 어떤 순서로 조합하느냐에 따라
            <br />
            전혀 다른 분위기의 이미지가 나오거든요.
          </p>

          {/* 창작물로서의 프롬프트 */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-[var(--angel-blue)]/40" />
            <span className="text-[9px] tracking-[0.2em] text-[var(--angel-lavender)] twinkle">✦ ✧ ✦</span>
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-[var(--angel-blue)]/40" />
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-[var(--angel-blue)]/10 px-5 py-2 text-[12px] font-medium text-[var(--angel-blue)] mb-5">
              프롬프트는 창작물이에요
            </div>
            <p className="text-[12px] leading-[2] text-[var(--angel-text-soft)] max-w-sm mx-auto [word-break:keep-all]">
              좋은 프롬프트를 만드는 건
              <br />
              좋은 곡을 작곡하는 것과 비슷해요.
              <br />
              시행착오와 감각이 담긴 <strong className="text-[var(--angel-text)]">나만의 창작물</strong>이죠.
            </p>
          </div>

          {/* 마켓 설명 카드 */}
          <div className="space-y-3 max-w-md mx-auto">
            {[
              { icon: "✦", text: "내가 만든 프롬프트를 마켓에 올려서 수익을 얻어요" },
              { icon: "✧", text: "마음에 드는 크리에이터의 프롬프트를 구매해서 바로 써볼 수 있어요" },
              { icon: "✦", text: "같은 취향의 사람들과 창작물을 나누는 공간이에요" },
            ].map((item, i) => (
              <div
                key={i}
                className="glass-card rounded-xl px-5 py-3.5 flex items-start gap-3"
              >
                <span className="text-[10px] text-[var(--angel-lavender)] mt-0.5 shrink-0">{item.icon}</span>
                <span className="text-[12px] leading-[1.7] text-[var(--angel-text-soft)] [word-break:keep-all]">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ Section Divider ══ */}
      <div className="section-divider bg-gradient-to-b from-[#e4eaf6] to-[#e0e7f4]">
        <span className="text-[20px] text-[var(--angel-lavender)] twinkle">✧</span>
      </div>

      {/* ══ Why MyAngel ══ */}
      <section className="snap-section relative mx-auto w-full px-5 py-10 md:py-16 bg-gradient-to-b from-[#e0e7f4] to-[#e4eaf6]">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-2 text-center text-3xl tracking-[0.08em] text-[var(--angel-text)] font-heading">
            Why MyAngel?
          </h2>
          <p className="mb-10 text-center text-[11px] tracking-[0.2em] text-[var(--angel-text-soft)]">
            ✦ 다른 AI 이미지 생성과 뭐가 다를까? ✦
          </p>

          <div className="space-y-3 mb-10">
            {[
              "최신 트렌드에 맞춰 큐레이팅된 프롬프트로 바로 이미지를 만들 수 있어요",
              "내가 만든 프롬프트를 올려서 수익을 얻고, 마음에 드는 프롬프트를 구매할 수 있어요",
              "생성한 이미지 스타일에 딱 맞는 패션 아이템과 브랜드까지 추천받아요",
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
              프롬프트가 곧 취향이에요
            </div>
            <p className="text-[13px] leading-[1.9] text-[var(--angel-text)]">
              트렌드에 맞춘 <strong className="text-[var(--angel-blue)]">프롬프트 큐레이팅</strong>로
              <br />
              나만의 이미지를 만들고, 프롬프트를 거래하세요.
              <br />
              같은 취향의 사람들과 연결돼요.
            </p>
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
            ✦ four steps to your image ✦
          </p>

          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-4">
            {[
              { num: "I", title: "프롬프트 선택", desc: "큐레이팅된 프롬프트를 고르거나 직접 작성해요" },
              { num: "II", title: "나만의 커스텀", desc: "내 취향에 맞게 커스텀하고 이미지 생성" },
              { num: "III", title: "프롬프트 거래", desc: "나만의 프롬프트를 올리고 수익 창출" },
              { num: "IV", title: "브랜드 추천", desc: "스타일에 맞는 아이템과 브랜드 추천" },
            ].map((step) => (
              <div key={step.num} className="glass-card rounded-xl p-3 text-center md:rounded-2xl md:p-5">
                <div className="mb-1.5 flex items-center justify-center gap-1.5 md:mb-2 md:gap-2">
                  <span className="text-[8px] text-[var(--angel-lavender)] opacity-40 md:text-[9px]">✦</span>
                  <span className="text-base text-[var(--angel-blue)] font-heading md:text-lg">{step.num}</span>
                  <span className="text-[8px] text-[var(--angel-lavender)] opacity-40 md:text-[9px]">✦</span>
                </div>
                <h3 className="mb-1 text-[11px] font-medium tracking-[0.04em] text-[var(--angel-text)] md:mb-1.5 md:text-[12px] md:tracking-[0.08em]">{step.title}</h3>
                <p className="text-[10px] leading-[1.6] text-[var(--angel-text-soft)] md:text-[11px] md:leading-[1.7] [word-break:keep-all]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ Section Divider ══ */}
      <div className="section-divider bg-gradient-to-b from-[#dce4f2] to-[#e0e7f4]">
        <span className="text-[20px] text-[var(--angel-lavender)] twinkle">✦</span>
      </div>

      {/* ══ Styles ══ */}
      <section className="snap-section w-full px-5 py-10 md:py-16 bg-gradient-to-b from-[#e0e7f4] to-[#e4eaf6]">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-2 text-center text-3xl tracking-[0.08em] text-[var(--angel-text)] font-heading">
            Styles
          </h2>
          <p className="mb-8 text-center text-[11px] tracking-[0.2em] text-[var(--angel-text-soft)]">
            ✦ 트렌드 스타일을 골라서 바로 생성해보세요 ✦
          </p>

          <StylePresetGrid />

          <p className="mt-4 text-center text-[11px] leading-[1.8] text-[var(--angel-text-soft)] max-w-sm mx-auto">
            스타일을 골라 바로 생성하거나,
            <br />
            자유롭게 커스텀해서 나만의 이미지를 만들어요.
          </p>
        </div>
      </section>

      {/* ══ Section Divider ══ */}
      <div className="section-divider bg-gradient-to-b from-[#e4eaf6] to-[#e0e7f4]">
        <span className="text-[20px] text-[var(--angel-lavender)] twinkle">✧</span>
      </div>

      {/* ══ Brands ══ */}
      <section className="snap-section w-full px-5 py-10 md:py-16 bg-gradient-to-b from-[#e0e7f4] to-[#e4eaf6]">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-2 text-center text-3xl tracking-[0.08em] text-[var(--angel-text)] font-heading">
            Brands
          </h2>
          <p className="mb-8 text-center text-[11px] tracking-[0.2em] text-[var(--angel-text-soft)]">
            ✦ 생성한 이미지에 어울리는 아이템을 만나보세요 ✦
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
            이미지를 생성하면 스타일에 맞는
            <br />
            브랜드와 아이템을 추천받을 수 있어요.
          </p>
        </div>
      </section>

      {/* ══ Bottom decoration ══ */}
      <div className="pt-6 pb-16 text-center bg-[#e4eaf6]">
        <div className="flex items-center justify-center gap-3">
          <span className="text-[10px] text-[var(--angel-lavender)]">✦</span>
          <span className="text-[12px] text-[var(--angel-lavender)]">✧</span>
          <span className="text-[10px] text-[var(--angel-lavender)]">✦</span>
        </div>
      </div>
    </div>
  );
}
