import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(appRoot, "..");
const demoDir = path.join(appRoot, "public", "demo");
const outDir = path.join(demoDir, "video-assets");

const basePath = path.join(demoDir, "same-base-before.webp");
const finalPath = path.join(demoDir, "same-mix-after.webp");
const generationPath = path.join(repoRoot, "content", "images", "angel-room.webp");

const markers = [
  {
    id: "add",
    op: "add",
    label: "ADD",
    color: "#22c55e",
    circle: { cx: 0.385, cy: 0.545, r: 0.118 },
  },
  {
    id: "remove",
    op: "remove",
    label: "REMOVE",
    color: "#ef4444",
    circle: { cx: 0.56, cy: 0.67, r: 0.075 },
  },
  {
    id: "replace",
    op: "replace",
    label: "REPLACE",
    color: "#3877ea",
    circle: { cx: 0.84, cy: 0.635, r: 0.118 },
  },
];

const opValue = {
  replace: 255,
  add: 128,
  remove: 64,
};

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function blendPaddingPx(baseRadius, op) {
  const scale = op === "add" ? 0.22 : op === "replace" ? 0.12 : 0.16;
  return Math.min(64, Math.max(8, baseRadius * scale));
}

function expandedEditRadius(marker, minSide) {
  const baseRadius = marker.circle.r * minSide;
  const padding = blendPaddingPx(baseRadius, marker.op);
  const maxScale = marker.op === "add" ? 1.28 : marker.op === "replace" ? 1.16 : 1.1;
  return Math.min(minSide * 0.58, baseRadius * maxScale, baseRadius + padding);
}

function maskFeatherPx(minSide) {
  return Math.min(42, Math.max(6, minSide * 0.012));
}

function labelSvg(width, height, title, subtitle) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#0f172a" flood-opacity="0.25"/>
      </filter>
    </defs>
    <rect x="34" y="30" width="${subtitle ? 580 : 430}" height="${subtitle ? 116 : 74}" rx="18" fill="rgba(255,255,255,0.88)" filter="url(#shadow)"/>
    <text x="62" y="75" font-family="Noto Sans CJK KR, DejaVu Sans, sans-serif" font-size="30" font-weight="800" fill="#172033">${esc(title)}</text>
    ${
      subtitle
        ? `<text x="62" y="118" font-family="Noto Sans CJK KR, DejaVu Sans, sans-serif" font-size="18" font-weight="500" fill="#506172">${esc(subtitle)}</text>`
        : ""
    }
  </svg>`);
}

async function metadata(input) {
  const info = await sharp(input).metadata();
  return { width: info.width ?? 1200, height: info.height ?? 799 };
}

async function makeGenerationExample() {
  await sharp(generationPath)
    .resize(1920, 1080, { fit: "cover" })
    .composite([
      {
        input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080">
          <defs>
            <linearGradient id="shade" x1="0" x2="1">
              <stop offset="0" stop-color="#f8fbff" stop-opacity="0.94"/>
              <stop offset="0.42" stop-color="#f8fbff" stop-opacity="0.74"/>
              <stop offset="1" stop-color="#f8fbff" stop-opacity="0.05"/>
            </linearGradient>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="12" stdDeviation="18" flood-color="#243044" flood-opacity="0.18"/>
            </filter>
          </defs>
          <rect width="1920" height="1080" fill="url(#shade)"/>
          <rect x="82" y="138" width="650" height="708" rx="28" fill="rgba(255,255,255,0.88)" filter="url(#shadow)"/>
          <text x="128" y="218" font-family="Noto Sans CJK KR, DejaVu Sans, sans-serif" font-size="54" font-weight="900" fill="#172033">Image Generation</text>
          <text x="128" y="292" font-family="Noto Sans CJK KR, DejaVu Sans, sans-serif" font-size="26" font-weight="700" fill="#3877ea">Prompt example</text>
          <text x="128" y="354" font-family="Noto Sans CJK KR, DejaVu Sans, sans-serif" font-size="25" fill="#344054">
            <tspan x="128" dy="0">angelic sky-blue bedroom, cloud</tspan>
            <tspan x="128" dy="42">ceiling lights, soft morning light,</tspan>
            <tspan x="128" dy="42">white lace, dreamy interior,</tspan>
            <tspan x="128" dy="42">high detail, clean composition</tspan>
          </text>
          <rect x="128" y="624" width="232" height="54" rx="27" fill="#172033"/>
          <text x="163" y="660" font-family="Noto Sans CJK KR, DejaVu Sans, sans-serif" font-size="22" font-weight="800" fill="#ffffff">Generate</text>
          <text x="128" y="766" font-family="Noto Sans CJK KR, DejaVu Sans, sans-serif" font-size="20" fill="#667085">Demo source for the generation step</text>
        </svg>`),
        top: 0,
        left: 0,
      },
    ])
    .png()
    .toFile(path.join(outDir, "01-generation-example.png"));

  await sharp(generationPath)
    .resize(1920, 1080, { fit: "cover" })
    .webp({ quality: 92 })
    .toFile(path.join(outDir, "01-generation-result.webp"));
}

async function makeMarkerExample(width, height) {
  const min = Math.min(width, height);
  const circles = markers
    .map((marker, index) => {
      const cx = marker.circle.cx * width;
      const cy = marker.circle.cy * height;
      const r = marker.circle.r * min;
      const labelX = Math.min(width - 190, Math.max(18, cx - 70));
      const labelY = Math.min(height - 48, Math.max(18, cy - r - 62));
      return `
        <circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${r.toFixed(2)}" fill="${marker.color}" fill-opacity="0.16" stroke="${marker.color}" stroke-width="7"/>
        <circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="18" fill="${marker.color}" stroke="#ffffff" stroke-width="5"/>
        <text x="${cx.toFixed(2)}" y="${(cy + 8).toFixed(2)}" text-anchor="middle" font-family="DejaVu Sans, sans-serif" font-size="22" font-weight="900" fill="#ffffff">${index + 1}</text>
        <rect x="${labelX.toFixed(2)}" y="${labelY.toFixed(2)}" width="170" height="42" rx="21" fill="rgba(255,255,255,0.92)" stroke="${marker.color}" stroke-width="3"/>
        <text x="${(labelX + 85).toFixed(2)}" y="${(labelY + 28).toFixed(2)}" text-anchor="middle" font-family="DejaVu Sans, sans-serif" font-size="18" font-weight="900" fill="${marker.color}">${esc(marker.label)}</text>
      `;
    })
    .join("");

  const overlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="#0f172a" flood-opacity="0.30"/>
      </filter>
    </defs>
    <g filter="url(#shadow)">${circles}</g>
  </svg>`);

  await sharp(basePath)
    .composite([
      { input: overlay, top: 0, left: 0 },
      {
        input: labelSvg(
          width,
          height,
          "Marker Input",
          "User places add / remove / replace circles"
        ),
        top: 0,
        left: 0,
      },
    ])
    .png()
    .toFile(path.join(outDir, "02-edit-marker-input.png"));
}

async function makeNanoMask(width, height) {
  const min = Math.min(width, height);
  const feather = maskFeatherPx(min);
  const blendCircles = markers
    .map((marker) => {
      const cx = marker.circle.cx * width;
      const cy = marker.circle.cy * height;
      const r = expandedEditRadius(marker, min);
      const value = opValue[marker.op].toString(16).padStart(2, "0");
      return `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${r.toFixed(2)}" fill="#${value}${value}${value}" />`;
    })
    .join("");
  const coreCircles = markers
    .map((marker) => {
      const cx = marker.circle.cx * width;
      const cy = marker.circle.cy * height;
      const r = marker.circle.r * min;
      const value = opValue[marker.op].toString(16).padStart(2, "0");
      return `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${r.toFixed(2)}" fill="#${value}${value}${value}" />`;
    })
    .join("");
  const legend = markers
    .map((marker, index) => {
      const value = opValue[marker.op];
      const y = 76 + index * 38;
      return `<rect x="50" y="${y - 20}" width="28" height="28" rx="6" fill="rgb(${value},${value},${value})"/><text x="92" y="${y + 2}" font-family="DejaVu Sans, sans-serif" font-size="20" font-weight="800" fill="#ffffff">${value} = ${esc(marker.label)}</text>`;
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
    <rect x="32" y="30" width="330" height="154" rx="20" fill="rgba(0,0,0,0.55)" stroke="rgba(255,255,255,0.24)"/>
    ${legend}
  </svg>`;

  await sharp(Buffer.from(svg))
    .grayscale()
    .png()
    .toFile(path.join(outDir, "03-mask-nano-banana-pro-grayscale.png"));
}

async function makeOpenAiAlphaMask(width, height) {
  const min = Math.min(width, height);
  const feather = maskFeatherPx(min);
  const blendCircles = markers
    .map((marker) => {
      const cx = marker.circle.cx * width;
      const cy = marker.circle.cy * height;
      const r = expandedEditRadius(marker, min);
      return `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${r.toFixed(2)}" fill="white" />`;
    })
    .join("");
  const coreCircles = markers
    .map((marker) => {
      const cx = marker.circle.cx * width;
      const cy = marker.circle.cy * height;
      const r = marker.circle.r * min;
      return `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${r.toFixed(2)}" fill="white" />`;
    })
    .join("");
  const baseSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="white"/></svg>`;
  const holeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs>
      <filter id="soft-edge" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="${feather.toFixed(2)}" />
      </filter>
    </defs>
    <g filter="url(#soft-edge)">${blendCircles}</g>
    ${coreCircles}
  </svg>`;

  const actualMask = await sharp(Buffer.from(baseSvg))
    .ensureAlpha()
    .composite([{ input: Buffer.from(holeSvg), blend: "dest-out" }])
    .png()
    .toBuffer();

  await sharp(actualMask).toFile(path.join(outDir, "04-mask-gpt-image-2-alpha-actual.png"));

  const checker = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs>
      <pattern id="checker" width="48" height="48" patternUnits="userSpaceOnUse">
        <rect width="48" height="48" fill="#d8dee8"/>
        <rect width="24" height="24" fill="#aeb8c8"/>
        <rect x="24" y="24" width="24" height="24" fill="#aeb8c8"/>
      </pattern>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#checker)"/>
  </svg>`);
  const outline = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    ${markers
      .map((marker) => {
        const cx = marker.circle.cx * width;
        const cy = marker.circle.cy * height;
        const r = expandedEditRadius(marker, min);
        return `<circle cx="${cx.toFixed(2)}" cy="${cy.toFixed(2)}" r="${r.toFixed(2)}" fill="none" stroke="${marker.color}" stroke-width="5" stroke-dasharray="14 10"/>`;
      })
      .join("")}
  </svg>`);

  await sharp(checker)
    .composite([
      { input: actualMask, top: 0, left: 0 },
      { input: outline, top: 0, left: 0 },
      {
        input: labelSvg(
          width,
          height,
          "GPT Image 2 Alpha Mask",
          "Transparent holes are the edit target"
        ),
        top: 0,
        left: 0,
      },
    ])
    .png()
    .toFile(path.join(outDir, "04-mask-gpt-image-2-alpha-preview.png"));
}

async function makeFinalExample() {
  await sharp(finalPath)
    .png()
    .composite([
      {
        input: labelSvg(1200, 799, "Completed Edit", "Add + remove + replace applied"),
        top: 0,
        left: 0,
      },
    ])
    .toFile(path.join(outDir, "05-edit-completed-example.png"));
}

async function makePanel(input, width, height) {
  return sharp(input)
    .resize(width, height, {
      fit: "contain",
      background: { r: 247, g: 250, b: 252, alpha: 1 },
    })
    .png()
    .toBuffer();
}

async function makeStoryboard() {
  const panelW = 870;
  const panelH = 370;
  const panels = [
    {
      title: "1. Marker input",
      file: path.join(outDir, "02-edit-marker-input.png"),
      left: 70,
      top: 138,
    },
    {
      title: "2. Nano Banana mask",
      file: path.join(outDir, "03-mask-nano-banana-pro-grayscale.png"),
      left: 980,
      top: 138,
    },
    {
      title: "3. GPT Image 2 mask",
      file: path.join(outDir, "04-mask-gpt-image-2-alpha-preview.png"),
      left: 70,
      top: 594,
    },
    {
      title: "4. Completed result",
      file: path.join(outDir, "05-edit-completed-example.png"),
      left: 980,
      top: 594,
    },
  ];

  const background = await sharp({
    create: {
      width: 1920,
      height: 1080,
      channels: 4,
      background: { r: 244, g: 248, b: 252, alpha: 1 },
    },
  })
    .png()
    .toBuffer();

  const composites = [
    {
      input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080">
        <text x="70" y="82" font-family="Noto Sans CJK KR, DejaVu Sans, sans-serif" font-size="44" font-weight="900" fill="#172033">Marker edit demo flow</text>
        <text x="70" y="119" font-family="Noto Sans CJK KR, DejaVu Sans, sans-serif" font-size="20" font-weight="600" fill="#667085">Same user action, different mask contract per model</text>
        ${panels
          .map(
            (panel) => `
              <rect x="${panel.left}" y="${panel.top - 42}" width="${panelW}" height="${panelH + 78}" rx="24" fill="#ffffff" stroke="#d9e3ef"/>
              <text x="${panel.left + 24}" y="${panel.top - 14}" font-family="Noto Sans CJK KR, DejaVu Sans, sans-serif" font-size="23" font-weight="900" fill="#25324a">${esc(panel.title)}</text>
            `
          )
          .join("")}
      </svg>`),
      top: 0,
      left: 0,
    },
  ];

  for (const panel of panels) {
    composites.push({
      input: await makePanel(panel.file, panelW, panelH),
      top: panel.top,
      left: panel.left,
    });
  }

  await sharp(background)
    .composite(composites)
    .png()
    .toFile(path.join(outDir, "06-edit-flow-storyboard.png"));
}

await fs.mkdir(outDir, { recursive: true });
const { width, height } = await metadata(basePath);
await makeGenerationExample();
await makeMarkerExample(width, height);
await makeNanoMask(width, height);
await makeOpenAiAlphaMask(width, height);
await makeFinalExample();
await makeStoryboard();

console.log(`Demo video assets written to ${outDir}`);
