import { describe, expect, it } from "vitest";
import {
  clampMarkerCenter,
  clampMarkerRadius,
  markerRadiusFractions,
} from "./marker-geometry";

describe("marker geometry", () => {
  it("uses the displayed image aspect ratio for marker radius fractions", () => {
    const rect = { width: 1600, height: 900 };
    const fractions = markerRadiusFractions(rect, 0.1);
    expect(fractions.x).toBeCloseTo(0.05625);
    expect(fractions.y).toBeCloseTo(0.1);
  });

  it("allows marker centers to reach edges and corners", () => {
    expect(clampMarkerCenter({ cx: 0.99, cy: 0.99 })).toEqual({
      cx: 0.99,
      cy: 0.99,
    });
    expect(clampMarkerCenter({ cx: -0.2, cy: 1.2 })).toEqual({
      cx: 0,
      cy: 1,
    });
  });

  it("keeps pointer movement one-to-one until the marker reaches the image edge", () => {
    const rect = { width: 1600, height: 900 };
    const start = { cx: 0.25, cy: 0.4 };
    const moved = clampMarkerCenter({
      cx: start.cx + 160 / rect.width,
      cy: start.cy + 90 / rect.height,
    });
    expect(moved.cx).toBeCloseTo(0.35);
    expect(moved.cy).toBeCloseTo(0.5);
  });

  it("keeps marker radius independent from the nearest edge", () => {
    expect(clampMarkerRadius(0.8)).toBe(0.5);
    expect(clampMarkerRadius(0.2)).toBeCloseTo(0.2);
    expect(clampMarkerRadius(0.15)).toBeCloseTo(0.15);
  });
});
