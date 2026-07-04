import type { MatchResult, ReportSummary } from "./types";

export function summarizeRun({
  sampleCount,
  validSampleCount,
  topMatches,
}: {
  sampleCount: number;
  validSampleCount: number;
  topMatches: MatchResult[];
}): ReportSummary {
  if (validSampleCount < 40) {
    return {
      outcome: "insufficient_data",
      validSamples: validSampleCount,
      sampleCount,
      explanation: "可用样本过少，当前结果不足以形成稳定排名。",
    };
  }

  const winner = topMatches[0];
  if (!winner) {
    return {
      outcome: "failed",
      validSamples: validSampleCount,
      sampleCount,
      explanation: "当前没有可用的基线数据，无法完成比对。",
    };
  }

  return {
    outcome: "matched",
    validSamples: validSampleCount,
    sampleCount,
    topScore: winner.score,
    explanation: `本次结果最接近 ${winner.displayName}。分数表示相似度信号，不代表最终结论。`,
  };
}
