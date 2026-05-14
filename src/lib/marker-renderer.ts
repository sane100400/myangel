import sharp from "sharp";
import type { MarkerSpec } from "./marker-protocol";

// op별 마스크 그레이스케일 코드 (0=보존, 64=remove, 128=add, 255=replace)
const OP_VALUE: Record<MarkerSpec["op"], number> = {
  replace: 255,
  add: 128,
  remove: 64,
};

// op별 사람용 미리보기 색
const OP_COLOR: Record<MarkerSpec["op"], { r: number; g: number; b: number }> = {
  replace: { r: 56, g: 119, b: 234 },   // blue
  add: { r: 34, g: 197, b: 94 },        // green
  remove: { r: 239, g: 68, b: 68 },     // red
};

function blendPaddingPx(baseRadius: number, op: MarkerSpec["op"]): number {
  const scale = op === "add" ? 0.22 : op === "replace" ? 0.12 : 0.16;
  return Math.min(64, Math.max(8, baseRadius * scale));
}

function expandedEditRadius(marker: MarkerSpec, minSide: number): number {
  const baseRadius = marker.circle.r * minSide;
  const padding = blendPaddingPx(baseRadius, marker.op);
  const maxScale = marker.op === "add" ? 1.28 : marker.op === "replace" ? 1.16 : 1.1;
  return Math.min(minSide * 0.58, baseRadius * maxScale, baseRadius + padding);
}

function maskFeatherPx(minSide: number): number {
  return Math.min(42, Math.max(6, minSide * 0.012));
}

export async function getBaseSize(baseBuffer: Buffer): Promise<{ width: number; height: number }> {
  const meta = await sharp(baseBuffer).metadata();
  return { width: meta.width ?? 1024, height: meta.height ?? 1024 };
}

/**
 * 흑백(그레이스케일) 마스크 PNG 생성. 0=보존, op별 코드값=편집 영역.
 */
export async function renderMask(
  width: number,
  height: number,
  markers: MarkerSpec[]
): Promise<Buffer> {
  const min = Math.min(width, height);
  const feather = maskFeatherPx(min);
  const blendCircles = markers
    .map((m) => {
      const cx = m.circle.cx * width;
      const cy = m.circle.cy * height;
      const r = expandedEditRadius(m, min);
      const v = OP_VALUE[m.op];
      const hex = v.toString(16).padStart(2, "0");
      const fill = `#${hex}${hex}${hex}`;
      return `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${r.toFixed(2)}" fill="${fill}" />`;
    })
    .join("");
  const coreCircles = markers
    .map((m) => {
      const cx = m.circle.cx * width;
      const cy = m.circle.cy * height;
      const r = m.circle.r * min;
      const v = OP_VALUE[m.op];
      const hex = v.toString(16).padStart(2, "0");
      const fill = `#${hex}${hex}${hex}`;
      return `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${r.toFixed(2)}" fill="${fill}" />`;
    })
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <filter id="soft-edge" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="${feather.toFixed(2)}" />
      </filter>
    </defs>
    <rect width="${width}" height="${height}" fill="#000000" />
    <g filter="url(#soft-edge)">${blendCircles}</g>
    ${coreCircles}
  </svg>`;

  return sharp(Buffer.from(svg)).grayscale().png().toBuffer();
}

/**
 * OpenAI images.edit 용 알파 마스크. 마커 영역은 투명(alpha=0, 편집 대상),
 * 그 외 영역은 불투명(alpha=255, 보존). PNG with alpha.
 *
 * 구현: SVG에서 마커 영역만 alpha=0(투명)으로 그리고 sharp이 native로 PNG 변환.
 * JS 픽셀 루프 없음 — 4K 이미지에서 16M 회 반복 회피.
 */
export async function renderAlphaMask(
  width: number,
  height: number,
  markers: MarkerSpec[]
): Promise<Buffer> {
  const min = Math.min(width, height);
  const feather = maskFeatherPx(min);
  // SVG에서 직접 알파 채널 표현:
  //   - 배경: 흰색 불투명 (보존 영역)
  //   - 마커 원: fill-opacity=0으로 투명한 hole (편집 영역)
  // composite operation 사용: 흰색 배경 위에 mask로 구멍을 뚫음.
  const blendCircles = markers
    .map((m) => {
      const cx = m.circle.cx * width;
      const cy = m.circle.cy * height;
      const r = expandedEditRadius(m, min);
      return `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${r.toFixed(2)}" fill="white" />`;
    })
    .join("");
  const coreCircles = markers
    .map((m) => {
      const cx = m.circle.cx * width;
      const cy = m.circle.cy * height;
      const r = m.circle.r * min;
      return `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${r.toFixed(2)}" fill="white" />`;
    })
    .join("");

  // 1. 흰색 배경 (보존 영역, alpha=255)
  const baseSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="white"/></svg>`;
  // 2. 투명 배경 + 흰 원 — 원 영역은 충분히 넓히고 가장자리는 부드럽게 둬
  //    결과가 선택 원의 경계에 갇혀 보이지 않게 한다.
  const maskSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs>
      <filter id="soft-edge" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="${feather.toFixed(2)}" />
      </filter>
    </defs>
    <g filter="url(#soft-edge)">${blendCircles}</g>
    ${coreCircles}
  </svg>`;

  return sharp(Buffer.from(baseSvg))
    .ensureAlpha()
    .composite([
      {
        input: Buffer.from(maskSvg),
        blend: "dest-out", // 원 영역(alpha=1)의 dest 알파를 제거 → 투명
      },
    ])
    .png()
    .toBuffer();
}

/**
 * 사람용 합성 미리보기. 베이스 위에 op별 색의 외곽선만 얹는다.
 */
export async function renderPreview(
  baseBuffer: Buffer,
  markers: MarkerSpec[]
): Promise<Buffer> {
  const meta = await sharp(baseBuffer).metadata();
  const width = meta.width ?? 1024;
  const height = meta.height ?? 1024;
  const min = Math.min(width, height);

  const overlays = markers
    .map((m) => {
      const cx = m.circle.cx * width;
      const cy = m.circle.cy * height;
      const r = m.circle.r * min;
      const c = OP_COLOR[m.op];
      const stroke = `rgb(${c.r},${c.g},${c.b})`;
      return `
        <circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${r.toFixed(2)}"
          fill="rgba(${c.r},${c.g},${c.b},0.12)" stroke="${stroke}" stroke-width="3" />
      `;
    })
    .join("");

  const overlaySvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${overlays}</svg>`;

  return sharp(baseBuffer)
    .composite([{ input: Buffer.from(overlaySvg), top: 0, left: 0 }])
    .png()
    .toBuffer();
}
