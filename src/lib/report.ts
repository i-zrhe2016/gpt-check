import type { MatchResult, ReportSummary } from "./types";

const MIN_CLEAR_SCORE = 0.55;
const MIN_CLEAR_GAP = 0.03;

function formatPercent(value: number | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }

  return `${(value * 100).toFixed(2)}%`;
}

function normalizeModelName(value: string | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

function parseComparableModel(model: string) {
  const normalized = normalizeModelName(model);
  const match = normalized.match(/^(.+?)-(\d+)(?:\.(\d+))?(?:-(mini|nano))?$/);
  if (!match) {
    return null;
  }

  return {
    family: match[1],
    major: Number(match[2]),
    minor: Number(match[3] ?? "0"),
    tier: match[4] === "nano" ? 0 : match[4] === "mini" ? 1 : 2,
  };
}

function compareModelStrength(left: string, right: string) {
  const parsedLeft = parseComparableModel(left);
  const parsedRight = parseComparableModel(right);
  if (!parsedLeft || !parsedRight || parsedLeft.family !== parsedRight.family) {
    return null;
  }

  if (parsedLeft.major !== parsedRight.major) {
    return parsedLeft.major - parsedRight.major;
  }

  if (parsedLeft.minor !== parsedRight.minor) {
    return parsedLeft.minor - parsedRight.minor;
  }

  return parsedLeft.tier - parsedRight.tier;
}

export function summarizeRun({
  requestedModel,
  sampleCount,
  validSampleCount,
  baselineModels,
  topMatches,
}: {
  requestedModel: string;
  sampleCount: number;
  validSampleCount: number;
  baselineModels: string[];
  topMatches: MatchResult[];
}): ReportSummary {
  if (validSampleCount < 40) {
    return {
      outcome: "insufficient_data",
      validSamples: validSampleCount,
      sampleCount,
      requestedModel,
      verdict: "样本不足，暂时无法形成明确结论。",
      explanation: "可用样本过少，当前结果不足以形成稳定排名。",
      recommendation: "建议检查上游稳定性后重新检测，确保至少收集到 40 个有效样本。",
    };
  }

  const winner = topMatches[0];
  if (!winner) {
    return {
      outcome: "failed",
      validSamples: validSampleCount,
      sampleCount,
      requestedModel,
      verdict: "无法完成比对，当前没有可用结论。",
      explanation: "当前没有可用的基线数据，无法完成比对。",
      recommendation: "建议先补齐或启用基线数据，再重新执行检测。",
    };
  }

  const runnerUp = topMatches[1];
  const topScore = winner.score;
  const scoreGap = typeof runnerUp?.score === "number" ? winner.score - runnerUp.score : winner.score;
  const requestedModelName = normalizeModelName(requestedModel);
  const winnerModelName = normalizeModelName(winner.model);
  const hasRequestedBaseline = baselineModels.some((model) => normalizeModelName(model) === requestedModelName);
  const scoreText = formatPercent(topScore);
  const gapText = formatPercent(scoreGap);

  if (topScore < MIN_CLEAR_SCORE || scoreGap < MIN_CLEAR_GAP) {
    return {
      outcome: "inconclusive",
      validSamples: validSampleCount,
      sampleCount,
      requestedModel,
      matchedModel: winner.model,
      matchedDisplayName: winner.displayName,
      topScore,
      scoreGap,
      verdict: "当前结果不够稳定，暂时不能给出明确判定。",
      explanation: `Top 1 为 ${winner.displayName}${scoreText ? `（综合分 ${scoreText}）` : ""}${gapText ? `，与第二名差距为 ${gapText}` : ""}，当前信号仍需人工复核。`,
      recommendation: "建议再次复测，并结合更多样本或人工抽检一起判断。",
    };
  }

  if (!hasRequestedBaseline) {
    return {
      outcome: "baseline_missing",
      validSamples: validSampleCount,
      sampleCount,
      requestedModel,
      matchedModel: winner.model,
      matchedDisplayName: winner.displayName,
      topScore,
      scoreGap,
      verdict: `当前没有声明模型 ${requestedModel} 的本地基线，无法直接判定是否一致。`,
      explanation: `现有基线里最接近的是 ${winner.displayName}${scoreText ? `（综合分 ${scoreText}）` : ""}。`,
      recommendation: `建议先补充 ${requestedModel} 的官方基线后，再重新检测。`,
    };
  }

  if (requestedModelName === winnerModelName) {
    return {
      outcome: "match",
      validSamples: validSampleCount,
      sampleCount,
      requestedModel,
      matchedModel: winner.model,
      matchedDisplayName: winner.displayName,
      topScore,
      scoreGap,
      verdict: `检测结果与声明模型 ${requestedModel} 基本一致。`,
      explanation: `Top 1 为 ${winner.displayName}${scoreText ? `（综合分 ${scoreText}）` : ""}${gapText ? `，与第二名差距为 ${gapText}` : ""}。`,
      recommendation: "建议保留本次报告作为验收记录，必要时再做人工抽检。",
    };
  }

  const strengthDelta = compareModelStrength(winner.model, requestedModel);
  if (typeof strengthDelta === "number" && strengthDelta < 0) {
    return {
      outcome: "suspected_downgrade",
      validSamples: validSampleCount,
      sampleCount,
      requestedModel,
      matchedModel: winner.model,
      matchedDisplayName: winner.displayName,
      topScore,
      scoreGap,
      verdict: `检测结果更接近 ${winner.displayName}，疑似从 ${requestedModel} 降配。`,
      explanation: `Top 1 为 ${winner.displayName}${scoreText ? `（综合分 ${scoreText}）` : ""}${gapText ? `，与第二名差距为 ${gapText}` : ""}。`,
      recommendation: "建议立即复测，并核对上游供应商声明型号、路由配置和计费型号。",
    };
  }

  return {
    outcome: "mismatch",
    validSamples: validSampleCount,
    sampleCount,
    requestedModel,
    matchedModel: winner.model,
    matchedDisplayName: winner.displayName,
    topScore,
    scoreGap,
    verdict: `检测结果与声明模型 ${requestedModel} 不一致，更接近 ${winner.displayName}。`,
    explanation: `Top 1 为 ${winner.displayName}${scoreText ? `（综合分 ${scoreText}）` : ""}${gapText ? `，与第二名差距为 ${gapText}` : ""}。`,
    recommendation: "建议检查接口实际路由、模型映射和上游返回来源，确认是否存在错配。",
  };
}
