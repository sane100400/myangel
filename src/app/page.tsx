import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CircleDot,
  Eraser,
  ImagePlus,
  Layers3,
  MousePointerClick,
  PenLine,
  RefreshCcw,
  ScanLine,
  Share2,
  Sparkles,
} from "lucide-react";

const PRODUCT_FLOW = [
  {
    href: "/generate",
    icon: ImagePlus,
    label: "Generate",
    title: "이미지 생성",
    body: "문장이나 참고 이미지로 첫 결과를 만듭니다.",
  },
  {
    href: "/edit",
    icon: MousePointerClick,
    label: "Edit",
    title: "부분 수정",
    body: "원하는 곳만 골라 추가·삭제·교체합니다.",
    primary: true,
  },
  {
    href: "/discover",
    icon: Share2,
    label: "Share",
    title: "저장·공유",
    body: "완성본을 보관하고 갤러리에 공유합니다.",
  },
];

const TECH_POINTS = [
  { title: "고칠 곳만 콕 집기", body: "수정할 영역을 마커로 지정합니다.", icon: CircleDot },
  { title: "주변은 그대로 유지", body: "선택하지 않은 배경과 분위기는 건드리지 않습니다.", icon: ScanLine },
  { title: "만든 뒤 바로 수정", body: "생성 결과를 다시 업로드하지 않고 이어서 고칩니다.", icon: Layers3 },
  { title: "결과 저장·공유", body: "마음에 든 이미지를 보관하고 링크로 보여줍니다.", icon: Share2 },
];

const BEFORE_IMAGE = "/demo/same-base-before.webp";

const EDIT_EXAMPLES = [
  {
    title: "추가하기",
    body: "마커로 표시한 빈 공간에 별 조명을 새로 넣었어요.",
    afterImage: "/demo/same-add-after.webp",
    beforeAlt: "수정 전 하늘색 책상 원본 이미지",
    afterAlt: "같은 책상 이미지에 별 모양 조명이 추가된 결과",
    icon: ImagePlus,
    markers: [{ cx: 39, cy: 41, r: 12, color: "#22c55e", label: "추가" }],
  },
  {
    title: "삭제하기",
    body: "마커로 표시한 종이와 테이프만 지우고 책상을 채웠어요.",
    afterImage: "/demo/same-remove-after.webp",
    beforeAlt: "수정 전 구겨진 종이와 테이프가 있는 책상 이미지",
    afterAlt: "같은 책상 이미지에서 구겨진 종이와 테이프가 삭제된 결과",
    icon: Eraser,
    markers: [{ cx: 56, cy: 43, r: 10, color: "#ef4444", label: "삭제" }],
  },
  {
    title: "교체하기",
    body: "마커로 표시한 머그컵을 날개 달린 오브제로 바꿨어요.",
    afterImage: "/demo/same-replace-after.webp",
    beforeAlt: "수정 전 오른쪽에 흰 머그컵이 있는 책상 이미지",
    afterAlt: "같은 책상 이미지에서 머그컵이 날개 달린 오브제로 교체된 결과",
    icon: RefreshCcw,
    markers: [{ cx: 82, cy: 42, r: 13, color: "#3877ea", label: "교체" }],
  },
  {
    title: "섞어서 사용하기",
    body: "추가·삭제·교체 영역을 각각 표시하고 한 번에 적용했어요.",
    afterImage: "/demo/same-mix-after.webp",
    beforeAlt: "수정 전 별 조명과 날개 오브제가 없는 책상 이미지",
    afterAlt: "같은 책상 이미지에서 추가, 삭제, 교체가 함께 적용된 결과",
    icon: Sparkles,
    markers: [
      { cx: 39, cy: 41, r: 12, color: "#22c55e", label: "추가" },
      { cx: 56, cy: 43, r: 10, color: "#ef4444", label: "삭제" },
      { cx: 84, cy: 42, r: 13, color: "#3877ea", label: "교체" },
    ],
  },
];

const WORKFLOW_STEPS = [
  ["01", "첫 이미지 만들기", "문장이나 참고 이미지로 시작합니다."],
  ["02", "원하는 부분 고치기", "추가·삭제·교체할 곳만 고릅니다."],
  ["03", "결과 공유하기", "완성본을 저장하고 공개 페이지로 보여줍니다."],
];

const PREVIEW_MARKERS = [
  { cx: 39, cy: 38, r: 8.4, color: "#22c55e", label: "1·추가", selected: true },
  { cx: 57, cy: 49, r: 5.5, color: "#ef4444", label: "2·제거" },
  { cx: 86, cy: 47, r: 8.2, color: "#3877ea", label: "3·교체" },
] as const;

export default function HomePage() {
  return (
    <div className="bg-[var(--background)]">
      <section className="mx-auto grid min-h-[calc(100vh-7rem)] w-[min(100%-32px,1120px)] gap-7 py-9 md:grid-cols-[0.88fr_1.12fr] md:items-center md:py-10">
        <div>
          <p className="home-eyebrow">AI 이미지 생성·편집·공유</p>
          <h1 className="home-title">
            만들고,
            <br />
            원하는 곳만 고치고,
            <br />
            바로 공유하세요.
          </h1>
          <p className="home-lead">
            이미지를 생성한 뒤 필요한 부분만 다시 수정하고, 완성본을 저장·공유하는 AI 이미지 스튜디오입니다.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link href="/generate" prefetch={false} className="primary-action min-h-[50px] px-6">
              첫 이미지 만들기
              <ArrowRight size={17} />
            </Link>
            <Link href="/edit" prefetch={false} className="secondary-action min-h-[50px] px-5 text-[15px]">
              부분 수정하기
            </Link>
          </div>
        </div>

        <div className="grid gap-3">
          <PipelinePreview />
          <div className="grid gap-3 md:grid-cols-3">
            {PRODUCT_FLOW.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  className={`home-action p-4 ${item.primary ? "home-action-primary" : ""}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--angel-border)] bg-white text-[var(--angel-blue)]">
                      <Icon size={19} />
                    </span>
                    <span lang="en" className="font-en text-[11px] font-bold text-[var(--angel-text-faint)]">
                      {item.label}
                    </span>
                  </div>
                  <h2 className="mt-4 text-[15px] font-bold text-[var(--angel-text)]">{item.title}</h2>
                  <p className="mt-2 text-[12.5px] leading-5 text-[var(--angel-text-soft)]">{item.body}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto w-[min(100%-32px,1120px)] py-10 md:py-12">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="page-kicker">수정 예시</p>
            <h2 className="font-ko-display mt-2 text-[24px] leading-tight text-[var(--angel-text)] md:text-[31px]">
              수정 전후를 한눈에 비교합니다.
            </h2>
          </div>
          <p className="max-w-[430px] text-[14px] leading-7 text-[var(--angel-text-soft)] md:text-right">
            수정할 영역만 표시하고, 결과에서 바뀐 부분을 바로 확인할 수 있습니다.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {EDIT_EXAMPLES.map(({ title, body, afterImage, beforeAlt, afterAlt, icon: Icon, markers }) => (
            <article key={title} className="result-card">
              <div className="grid grid-cols-2 gap-px bg-[var(--angel-border)]">
                <DemoFrame src={BEFORE_IMAGE} alt={beforeAlt} label="Before" markers={markers} />
                <DemoFrame src={afterImage} alt={afterAlt} label="After" markers={[]} active />
              </div>
              <div className="p-4">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--angel-border)] bg-[var(--angel-blue-pale)] text-[var(--angel-blue)]">
                  <Icon size={17} />
                </div>
                <h3 className="text-[15px] font-bold text-[var(--angel-text)]">{title}</h3>
                <p className="mt-1.5 text-[12.5px] leading-5 text-[var(--angel-text-soft)]">{body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[var(--angel-border)] bg-[var(--angel-surface)]">
        <div className="mx-auto grid w-[min(100%-32px,1120px)] gap-3 py-6 md:grid-cols-4">
          {TECH_POINTS.map(({ title, body, icon: Icon }) => (
            <article key={title} className="surface-card p-4">
              <Icon size={18} className="mb-3 text-[var(--angel-blue)]" />
              <h2 className="text-[14px] font-bold text-[var(--angel-text)]">{title}</h2>
              <p className="mt-1.5 text-[12.5px] leading-5 text-[var(--angel-text-soft)]">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid w-[min(100%-32px,1120px)] gap-4 py-12 md:grid-cols-[0.8fr_1.2fr] md:items-start">
        <div>
          <p className="page-kicker">서비스 흐름</p>
          <h2 className="font-ko-display mt-2 text-[25px] leading-tight text-[var(--angel-text)] md:text-[32px]">
            생성부터 공유까지 한 흐름으로 이어집니다.
          </h2>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {WORKFLOW_STEPS.map(([num, title, body]) => (
            <article key={num} className="surface-card p-4">
              <p lang="en" className="font-en text-[22px] font-bold leading-none text-[var(--angel-blue)]">{num}</p>
              <h3 className="mt-4 text-[14px] font-bold text-[var(--angel-text)]">{title}</h3>
              <p className="mt-2 text-[12.5px] leading-5 text-[var(--angel-text-soft)]">{body}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function PipelinePreview() {
  return (
    <div className="tool-surface overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--angel-border)] bg-[var(--angel-surface-muted)] px-4 py-3">
        <div className="flex items-center gap-2 text-[13px] font-bold text-[var(--angel-text)]">
          <PenLine size={16} className="text-[var(--angel-blue)]" />
          실시간 작업 흐름
        </div>
        <span lang="en" className="font-en text-[11px] font-bold text-[var(--angel-text-faint)]">
          generate / edit / share
        </span>
      </div>

      <div className="grid gap-0 md:grid-cols-[1fr_190px]">
        <div className="p-4">
          <div className="relative aspect-[16/10] overflow-hidden rounded-lg border border-[var(--angel-border)] bg-white">
            <Image
              src={BEFORE_IMAGE}
              alt="부분 수정을 위해 마커를 표시한 하늘색 책상 원본 이미지"
              fill
              loading="eager"
              fetchPriority="high"
              quality={70}
              sizes="(min-width: 768px) 620px, calc(100vw - 64px)"
              className="object-cover"
            />
            <svg
              aria-hidden="true"
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 100 62.5"
              preserveAspectRatio="none"
            >
              {PREVIEW_MARKERS.map((marker) => (
                <PreviewMarker key={marker.label} {...marker} />
              ))}
            </svg>
          </div>
        </div>

        <div className="border-t border-[var(--angel-border)] bg-[var(--angel-surface-muted)] p-4 md:border-l md:border-t-0">
          <MiniStatus icon={ImagePlus} label="이미지 생성" />
          <MiniStatus icon={MousePointerClick} label="수정할 곳 선택" />
          <MiniStatus icon={Sparkles} label="그 부분만 다시 생성" />
          <MiniStatus icon={Share2} label="저장·공유" />
        </div>
      </div>
    </div>
  );
}

function PreviewMarker({
  cx,
  cy,
  r,
  color,
  label,
  selected = false,
}: {
  cx: number;
  cy: number;
  r: number;
  color: string;
  label: string;
  selected?: boolean;
}) {
  const handleX = cx + r * 0.7071;
  const handleY = cy + r * 0.7071;
  const closeX = cx + r * 0.7071;
  const closeY = cy - r * 0.7071;

  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={color}
        fillOpacity={selected ? 0.18 : 0.13}
        stroke={color}
        strokeWidth={selected ? 0.52 : 0.34}
      />
      <text
        x={cx}
        y={cy - r - 1.5}
        fill={color}
        fontSize="2.35"
        fontWeight="700"
        textAnchor="middle"
        style={{ fontFamily: "var(--font-ko), sans-serif" }}
      >
        {label}
      </text>
      <circle
        cx={handleX}
        cy={handleY}
        r="1.45"
        fill="white"
        stroke={color}
        strokeWidth="0.34"
      />
      {selected && (
        <g>
          <circle cx={closeX} cy={closeY} r="1.55" fill="#ef4444" stroke="white" strokeWidth="0.34" />
          <path
            d={`M ${closeX - 0.55} ${closeY - 0.55} L ${closeX + 0.55} ${closeY + 0.55} M ${closeX + 0.55} ${closeY - 0.55} L ${closeX - 0.55} ${closeY + 0.55}`}
            stroke="white"
            strokeWidth="0.34"
            strokeLinecap="round"
          />
        </g>
      )}
    </g>
  );
}

function DemoFrame({
  src,
  alt,
  label,
  markers,
  active = false,
}: {
  src: string;
  alt: string;
  label: "Before" | "After";
  markers: Array<{ cx: number; cy: number; r: number; color: string; label: string }>;
  active?: boolean;
}) {
  return (
    <div className="relative aspect-[16/10] bg-[var(--angel-surface-muted)]">
      <Image
        src={src}
        alt={alt}
        fill
        loading="lazy"
        quality={60}
        sizes="(min-width: 768px) 280px, 50vw"
        className="object-cover"
      />
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 62.5"
        preserveAspectRatio="none"
      >
        {markers.map((marker) => (
          <DemoMarker key={`${marker.label}-${marker.cx}-${marker.cy}`} {...marker} />
        ))}
      </svg>
      <span
        lang="en"
        className={`font-en absolute left-2 top-2 rounded-md border px-2 py-1 text-[10px] font-bold leading-none shadow-sm ${
          active
            ? "border-[var(--angel-blue)] bg-[var(--angel-blue)] text-white"
            : "border-white/80 bg-white/90 text-[var(--angel-text-soft)]"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function DemoMarker({
  cx,
  cy,
  r,
  color,
  label,
}: {
  cx: number;
  cy: number;
  r: number;
  color: string;
  label: string;
}) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={color} fillOpacity="0.14" stroke="white" strokeWidth="1.25" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="0.86" strokeDasharray="2 1.4" />
      <rect
        x={Math.max(2, cx - 5.4)}
        y={Math.max(2, cy - r - 6)}
        width="10.8"
        height="4.4"
        rx="1.8"
        fill={color}
      />
      <text
        x={cx}
        y={Math.max(5.1, cy - r - 2.9)}
        fill="white"
        fontSize="2.35"
        fontWeight="800"
        textAnchor="middle"
        style={{ fontFamily: "var(--font-ko), sans-serif" }}
      >
        {label}
      </text>
    </g>
  );
}

function MiniStatus({
  icon: Icon,
  label,
}: {
  icon: typeof Sparkles;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-[var(--angel-border)] py-2 last:border-b-0">
      <Icon size={15} className="text-[var(--angel-blue)]" />
      <span className="text-[12px] font-bold text-[var(--angel-text-soft)]">{label}</span>
    </div>
  );
}
