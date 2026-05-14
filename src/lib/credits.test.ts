import { describe, it, expect } from "vitest";
import { QUALITIES, MAX_COUNT, type Quality } from "./credits";

describe("credits constants", () => {
  it("QUALITIES has the expected three tiers in order", () => {
    expect(QUALITIES).toEqual(["1K", "2K", "4K"]);
  });

  it("MAX_COUNT is reasonable (1..N batch)", () => {
    expect(MAX_COUNT).toBeGreaterThan(0);
    expect(MAX_COUNT).toBeLessThanOrEqual(10);
  });
});

// Pure cost calculation logic mirroring the formula in credits.ts.
// The actual getGenerateCost / getEditCost depend on Supabase.
// We assert the mathematical contract: cost = unit[quality] * clamp(count, 1, MAX_COUNT).
function computeCost(unit: Record<Quality, number>, quality: Quality, count: number): number {
  return unit[quality] * Math.max(1, Math.min(MAX_COUNT, count));
}

describe("cost formula contract", () => {
  const generateUnit: Record<Quality, number> = { "1K": 1, "2K": 3, "4K": 6 };

  it("scales linearly with count", () => {
    expect(computeCost(generateUnit, "2K", 1)).toBe(3);
    expect(computeCost(generateUnit, "2K", 4)).toBe(12);
  });

  it("clamps count below 1", () => {
    expect(computeCost(generateUnit, "1K", 0)).toBe(1);
    expect(computeCost(generateUnit, "1K", -10)).toBe(1);
  });

  it("clamps count above MAX_COUNT", () => {
    expect(computeCost(generateUnit, "4K", MAX_COUNT + 5)).toBe(generateUnit["4K"] * MAX_COUNT);
  });

  it("4K is most expensive", () => {
    expect(computeCost(generateUnit, "4K", 1)).toBeGreaterThan(
      computeCost(generateUnit, "2K", 1)
    );
    expect(computeCost(generateUnit, "2K", 1)).toBeGreaterThan(
      computeCost(generateUnit, "1K", 1)
    );
  });
});
