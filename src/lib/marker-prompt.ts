import type { MarkerSpec, GlobalAdjust } from "./marker-protocol";

/**
 * Build a deterministic prompt for marker-based edits.
 * IMAGE 1 = base, IMAGE 2 = mask (grayscale), IMAGE 3.. = references[]
 *
 * Mask grayscale codes:
 *   0   → preserve (do not change)
 *   64  → REMOVE (erase content; reconstruct background plausibly)
 *   128 → ADD (add described content here)
 *   255 → REPLACE (replace content with the matching reference image)
 */
export function buildMarkerPrompt(args: {
  markers: MarkerSpec[];
  width: number;
  height: number;
  refCount: number;
  globalAdjust?: GlobalAdjust;
  inputMode?: "gemini" | "openai";
}): string {
  const { markers, width, height, refCount, globalAdjust } = args;
  const inputMode = args.inputMode ?? "gemini";
  const hasMarkers = markers.length > 0;
  const hasGlobal =
    !!globalAdjust && (globalAdjust.mood || globalAdjust.lighting || globalAdjust.note);
  const referenceOffset = inputMode === "gemini" ? (hasMarkers ? 3 : 2) : 2;

  const lines: string[] = [];
  if (hasMarkers && hasGlobal) {
    lines.push(
      "You are performing an image edit with both LOCAL marker-based changes and a GLOBAL atmosphere adjustment. Marker circles describe the target center and approximate diameter, not a hard circular cutout. Apply the local edits only around those anchors with natural blending, then apply the global mood/lighting transformation across the entire image while preserving subject identity, composition, and existing geometry."
    );
  } else if (hasMarkers) {
    lines.push(
      "You are performing a precise local image edit. Marker circles describe the target center and approximate diameter, not a hard circular cutout or visible boundary. Use the mask as a soft local influence map, blend the result naturally into surrounding pixels, and keep unrelated regions of IMAGE 1 unchanged."
    );
  } else {
    lines.push(
      "You are performing a GLOBAL atmosphere adjustment on the entire image. Preserve the subject, composition, and geometry of IMAGE 1 — change only the mood, color, and lighting as described."
    );
  }
  lines.push("");
  lines.push("Inputs:");
  lines.push("  IMAGE 1: original image (base).");
  if (hasMarkers) {
    if (inputMode === "gemini") {
      lines.push("  IMAGE 2: grayscale mask of the same size. Pixel value encodes op.");
    } else {
      lines.push("  A transparent edit mask is supplied separately; edit only the transparent pixels.");
    }
  }
  if (refCount > 0) {
    for (let i = 0; i < refCount; i++) {
      lines.push(`  IMAGE ${referenceOffset + i}: reference image #${i + 1}.`);
    }
  }

  if (hasMarkers) {
    lines.push("");
    if (inputMode === "gemini") {
      lines.push("Mask codes (in IMAGE 2):");
      lines.push("  0   = preserve");
      lines.push("  64  = REMOVE influence area (erase what is there; reconstruct the background plausibly)");
      lines.push("  128 = ADD influence area (add new content around the marker center as described)");
      lines.push("  255 = REPLACE influence area (replace content around the marker center)");
    } else {
      lines.push("Transparent mask:");
      lines.push("  - Transparent pixels are the local edit target.");
      lines.push("  - Opaque pixels must be preserved unless a global adjustment is requested.");
    }
    lines.push("Do not produce a circular patch, circular crop, or visible mask edge. The circle is only a position and size hint.");
    lines.push("Do not reproduce the mask, marker circles, labels, outlines, or any guide graphics in the final image.");
    lines.push("If the scene contains multiple similar objects, edit only the object or object-part that overlaps the marker. Do not apply a replacement to every object of the same category.");
    lines.push("");
    lines.push(
      `Image dimensions: ${width}x${height}. Coordinates below are normalized to [0,1] (cx, cy from top-left; diameter relative to min(width,height)).`
    );
    lines.push("");
    lines.push("Marker list (apply each in order):");
    markers.forEach((m, i) => {
      const { cx, cy, r } = m.circle;
      const diameter = r * 2;
      const diameterPx = Math.round(diameter * Math.min(width, height));
      const centerX = Math.round(cx * width);
      const centerY = Math.round(cy * height);
      const head = `  [${i + 1}] op=${m.op} center=(x=${centerX}, y=${centerY}, cx=${cx.toFixed(3)}, cy=${cy.toFixed(3)}) diameter≈${diameterPx}px (normalized=${diameter.toFixed(3)})`;
      let tail = "";
      if (m.op === "replace" && typeof m.refIndex === "number") {
        tail = ` use IMAGE ${referenceOffset + m.refIndex} as the source for only the marked object, adapting it to the local perspective and lighting.`;
      } else if (m.op === "replace") {
        tail = " replace only the masked object or object-part according to the marker prompt while matching the surrounding perspective, lighting, texture, and style.";
      } else if (m.op === "add" && typeof m.refIndex === "number") {
        tail = ` use IMAGE ${referenceOffset + m.refIndex} as a content reference, adapting it to the local perspective and lighting.`;
      } else if (m.op === "add") {
        tail = " add new content around the marker center according to the marker prompt and surrounding context.";
      } else if (m.op === "remove") {
        tail = " erase the masked content; inpaint the background.";
      }
      if (m.note) tail += ` Marker prompt: ${m.note}`;
      lines.push(head + tail);
    });
  }

  if (hasGlobal && globalAdjust) {
    lines.push("");
    lines.push("Global atmosphere adjustment (apply across the entire image):");
    if (globalAdjust.mood) lines.push(`  - Mood: ${globalAdjust.mood}`);
    if (globalAdjust.lighting) lines.push(`  - Lighting: ${globalAdjust.lighting}`);
    if (globalAdjust.note) lines.push(`  - Additional note: ${globalAdjust.note}`);
    lines.push(
      "  Preserve the identity of subjects, the composition, and the geometry. Change color, contrast, and lighting to match the requested mood."
    );
  }

  lines.push("");
  lines.push(
    `Preserve the original canvas aspect ratio exactly (${width}x${height}); do not crop, rotate, add borders, or change the composition framing.`
  );
  lines.push(
    "Return a single edited image. Do not add watermarks, borders, or text overlays."
  );

  return lines.join("\n");
}
