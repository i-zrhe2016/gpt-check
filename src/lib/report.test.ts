import { describe, expect, it } from "vitest";

import { summarizeRun } from "@/lib/report";
import type { MatchResult } from "@/lib/types";

function createMatch(model: string, score: number, modeScore = 1): MatchResult {
  return {
    baselineId: model,
    slug: model,
    displayName: `${model} Official`,
    vendor: "OpenAI",
    model,
    similarity: {
      cosineSimilarity: score,
      jsDivergence: 0,
      modeScore,
      overallScore: score,
    },
    baselineStats: {
      mean: 0,
      median: 0,
      stdDev: 0,
      min: 1,
      max: 355,
      unique: 355,
      mode: 1,
      modeCount: 1,
    },
    score,
  };
}

describe("summarizeRun", () => {
  it("returns an explicit match verdict when the declared model wins", () => {
    const summary = summarizeRun({
      requestedModel: "gpt-5.4",
      sampleCount: 50,
      validSampleCount: 50,
      baselineModels: ["gpt-5.5", "gpt-5.4", "gpt-5.4-mini"],
      topMatches: [createMatch("gpt-5.4", 0.92), createMatch("gpt-5.5", 0.61)],
    });

    expect(summary.outcome).toBe("match");
    expect(summary.verdict).toContain("基本一致");
  });

  it("returns a downgrade verdict when a weaker model wins clearly", () => {
    const summary = summarizeRun({
      requestedModel: "gpt-5.4",
      sampleCount: 50,
      validSampleCount: 50,
      baselineModels: ["gpt-5.5", "gpt-5.4", "gpt-5.4-mini", "gpt-5.4-nano"],
      topMatches: [createMatch("gpt-5.4-mini", 0.84, 0.8), createMatch("gpt-5.5", 0.41)],
    });

    expect(summary.outcome).toBe("suspected_downgrade");
    expect(summary.verdict).toContain("疑似");
    expect(summary.verdict).toContain("降配");
  });

  it("returns a mismatch verdict when the winner is stronger or different", () => {
    const summary = summarizeRun({
      requestedModel: "gpt-5.4",
      sampleCount: 50,
      validSampleCount: 50,
      baselineModels: ["gpt-5.5", "gpt-5.4", "gpt-5.4-mini"],
      topMatches: [createMatch("gpt-5.5", 0.86), createMatch("gpt-5.4", 0.43)],
    });

    expect(summary.outcome).toBe("mismatch");
    expect(summary.verdict).toContain("不一致");
  });

  it("returns inconclusive when the top score is too weak or too close", () => {
    const summary = summarizeRun({
      requestedModel: "gpt-5.4",
      sampleCount: 50,
      validSampleCount: 50,
      baselineModels: ["gpt-5.5", "gpt-5.4", "gpt-5.4-mini"],
      topMatches: [createMatch("gpt-5.4", 0.58), createMatch("gpt-5.5", 0.57)],
    });

    expect(summary.outcome).toBe("inconclusive");
    expect(summary.verdict).toContain("不能给出明确判定");
  });

  it("returns baseline_missing when the declared model has no local baseline", () => {
    const summary = summarizeRun({
      requestedModel: "gpt-6",
      sampleCount: 50,
      validSampleCount: 50,
      baselineModels: ["gpt-5.5", "gpt-5.4", "gpt-5.4-mini"],
      topMatches: [createMatch("gpt-5.5", 0.87), createMatch("gpt-5.4", 0.42)],
    });

    expect(summary.outcome).toBe("baseline_missing");
    expect(summary.verdict).toContain("本地基线");
  });
});
