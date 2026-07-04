import { describe, expect, it } from "vitest";

import {
  calculateDistribution,
  calculateSimilarity,
  calculateStats,
  createBucketLabels,
  extractNumber,
  matchBaselines,
} from "@/lib/fingerprint";

describe("fingerprint helpers", () => {
  it("extracts only values in the 1..355 range", () => {
    expect(extractNumber("42")).toBe(42);
    expect(extractNumber("output: 355")).toBe(355);
    expect(extractNumber("0")).toBeNull();
    expect(extractNumber("356")).toBeNull();
    expect(extractNumber("none")).toBeNull();
  });

  it("builds a normalized distribution", () => {
    const distribution = calculateDistribution([1, 1, 2, 355]);
    expect(distribution[0]).toBeCloseTo(0.5);
    expect(distribution[1]).toBeCloseTo(0.25);
    expect(distribution[354]).toBeCloseTo(0.25);
    expect(distribution.reduce((sum, value) => sum + value, 0)).toBeCloseTo(1);
  });

  it("calculates stats and similarity in line with the browser tool", () => {
    const left = [1, 1, 2, 3, 4, 4];
    const right = [1, 1, 2, 3, 4, 5];
    const leftDistribution = calculateDistribution(left);
    const rightDistribution = calculateDistribution(right);
    const leftStats = calculateStats(left);
    const rightStats = calculateStats(right);
    const similarity = calculateSimilarity(leftDistribution, rightDistribution, leftStats, rightStats);

    expect(leftStats.mode).toBe(1);
    expect(leftStats.modeCount).toBe(2);
    expect(leftStats.mean).toBeCloseTo(2.5);
    expect(similarity.overallScore).toBeGreaterThan(0);
    expect(similarity.overallScore).toBeLessThanOrEqual(1);
  });

  it("sorts the best baseline first", () => {
    const distribution = calculateDistribution([42, 42, 43, 44, 45, 45, 45]);
    const stats = calculateStats([42, 42, 43, 44, 45, 45, 45]);
    const baselines = [
      {
        id: "a",
        slug: "alpha",
        displayName: "Alpha",
        vendor: "OpenAI",
        model: "alpha",
        sampleCount: 7,
        distribution,
        stats,
        version: 1,
        active: true,
      },
      {
        id: "b",
        slug: "beta",
        displayName: "Beta",
        vendor: "OpenAI",
        model: "beta",
        sampleCount: 7,
        distribution: calculateDistribution([300, 301, 302, 303, 304, 305, 306]),
        stats: calculateStats([300, 301, 302, 303, 304, 305, 306]),
        version: 1,
        active: true,
      },
    ];

    const matches = matchBaselines(distribution, stats, baselines);
    expect(matches[0]?.slug).toBe("alpha");
    expect(matches[0]?.score).toBeGreaterThan(matches[1]?.score ?? 0);
  });

  it("creates stable bucket labels", () => {
    expect(createBucketLabels(10)[0]).toBe("1-10");
    expect(createBucketLabels(10).at(-1)).toBe("351-355");
  });
});
