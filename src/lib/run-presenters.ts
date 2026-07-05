import type { AppLocale } from "./locale";

export function formatRunStatus(status: string, locale: AppLocale = "zh-CN") {
  switch (status) {
    case "PENDING":
      return locale === "en" ? "Queued" : "排队中";
    case "RUNNING":
      return locale === "en" ? "Running" : "检测中";
    case "COMPLETED":
      return locale === "en" ? "Completed" : "已完成";
    case "FAILED":
      return locale === "en" ? "Failed" : "失败";
    default:
      return status;
  }
}

export function formatRunEndpoint(baseUrl: string) {
  try {
    const url = new URL(baseUrl);
    const pathname = url.pathname === "/" ? "" : url.pathname.replace(/\/$/, "");
    return `${url.host}${pathname}`;
  } catch {
    return baseUrl;
  }
}

export function formatRunStatusTone(status: string) {
  switch (status) {
    case "PENDING":
      return "pending";
    case "RUNNING":
      return "running";
    case "COMPLETED":
      return "completed";
    case "FAILED":
      return "failed";
    default:
      return "idle";
  }
}

export function isTerminalRunStatus(status: string) {
  return status === "COMPLETED" || status === "FAILED";
}

export function formatRunOutcome(outcome: string | undefined, locale: AppLocale = "zh-CN") {
  switch (outcome) {
    case "match":
      return locale === "en" ? "Outcome: broadly consistent with the declared model" : "结论：与声明模型基本一致";
    case "suspected_downgrade":
      return locale === "en" ? "Outcome: suspected downgrade" : "结论：疑似降配";
    case "mismatch":
      return locale === "en" ? "Outcome: declared model mismatch" : "结论：与声明模型不一致";
    case "baseline_missing":
      return locale === "en" ? "Outcome: requested baseline missing" : "结论：缺少声明模型基线";
    case "insufficient_data":
      return locale === "en" ? "Outcome: not enough samples" : "结论：样本不足";
    case "failed":
      return locale === "en" ? "Outcome: comparison unavailable" : "结论：无法完成比对";
    case "inconclusive":
      return locale === "en" ? "Outcome: inconclusive" : "结论：结果暂不明确";
    default:
      return null;
  }
}

export function formatRunTime(value: string | Date, locale: AppLocale = "zh-CN") {
  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatRunStartError(error: unknown, locale: AppLocale = "zh-CN") {
  if (error instanceof Error) {
    if (error.message.includes("5 runs per 10 minutes")) {
      return locale === "en"
        ? "This browser can start at most 5 checks within 10 minutes. Please try again later."
        : "当前浏览器在 10 分钟内最多可发起 5 次检测，请稍后再试。";
    }

    if (error.message.includes("10 runs per hour")) {
      return locale === "en"
        ? "This network address has reached the hourly check limit. Please try again later."
        : "当前网络地址在 1 小时内已达到检测上限，请稍后再试。";
    }

    if (error.message.includes("Only https Base URL values are allowed")) {
      return locale === "en" ? "The endpoint must use HTTPS." : "接口地址必须使用 HTTPS。";
    }

    if (
      error.message.includes("Localhost is not allowed") ||
      error.message.includes("Private IPv4 addresses are not allowed") ||
      error.message.includes("Private IPv6 addresses are not allowed") ||
      error.message.includes("resolves to a private IPv4 address") ||
      error.message.includes("resolves to a private IPv6 address")
    ) {
      return locale === "en"
        ? "The endpoint cannot point to localhost or a private network."
        : "接口地址不能指向本机或私有网络。";
    }
  }

  return locale === "en"
    ? "Failed to start the check. Verify the endpoint, model name, and API key, then try again."
    : "启动检测失败，请检查接口地址、模型名和 API Key 后重试。";
}

export function formatRunErrorSummary(summary: string | null | undefined, locale: AppLocale = "zh-CN") {
  if (!summary || locale !== "en") {
    return summary;
  }

  const partialFailures = summary.match(/^已有 (\d+) 次请求失败或返回了无效结果。$/);
  if (partialFailures) {
    return `${partialFailures[1]} requests have already failed or returned invalid results.`;
  }

  const totalFailures = summary.match(/^共有 (\d+) 次请求失败或返回了无效结果。$/);
  if (totalFailures) {
    return `${totalFailures[1]} requests failed or returned invalid results in total.`;
  }

  const insufficientSamples = summary.match(/^仅收集到 (\d+) 个有效样本，至少需要 (\d+) 个才能完成检测。$/);
  if (insufficientSamples) {
    return `Only ${insufficientSamples[1]} valid samples were collected; at least ${insufficientSamples[2]} are required to finish the check.`;
  }

  const upstreamError = summary.match(/^上游接口返回错误（(\d+)）：([\s\S]+)$/);
  if (upstreamError) {
    return `Upstream API returned an error (${upstreamError[1]}): ${upstreamError[2]}`;
  }

  if (summary === "上游响应中没有可用的消息内容。") {
    return "The upstream response did not include usable message content.";
  }

  if (summary === "检测过程中出现未知错误。") {
    return "An unknown error occurred during the check.";
  }

  return summary;
}

export function formatRunSummaryExplanation(
  summary:
    | {
        outcome?: string;
        requestedModel?: string;
        matchedModel?: string;
        matchedDisplayName?: string;
        topScore?: number;
        scoreGap?: number;
        explanation?: string;
      }
    | null
    | undefined,
  topMatches: Array<Record<string, unknown>>,
  locale: AppLocale = "zh-CN",
) {
  const winner = topMatches[0];
  const winnerName =
    typeof summary?.matchedDisplayName === "string"
      ? summary.matchedDisplayName
      : typeof winner?.displayName === "string"
        ? winner.displayName
        : null;

  switch (summary?.outcome) {
    case "match":
      return locale === "en"
        ? `Top match is ${winnerName ?? "the declared baseline"}${typeof summary.topScore === "number" ? ` with an overall score of ${(summary.topScore * 100).toFixed(2)}%` : ""}${typeof summary.scoreGap === "number" ? `, ahead of the runner-up by ${(summary.scoreGap * 100).toFixed(2)}%` : ""}.`
        : `Top 1 为 ${winnerName ?? "声明模型基线"}${typeof summary.topScore === "number" ? `，综合分 ${(summary.topScore * 100).toFixed(2)}%` : ""}${typeof summary.scoreGap === "number" ? `，与第二名差距 ${(summary.scoreGap * 100).toFixed(2)}%` : ""}。`;
    case "suspected_downgrade":
      return locale === "en"
        ? `The strongest match is ${winnerName ?? "a weaker baseline"}${typeof summary.topScore === "number" ? ` with an overall score of ${(summary.topScore * 100).toFixed(2)}%` : ""}${typeof summary.scoreGap === "number" ? ` and a ${(summary.scoreGap * 100).toFixed(2)}% lead over the runner-up` : ""}.`
        : `Top 1 为 ${winnerName ?? "更弱基线"}${typeof summary.topScore === "number" ? `，综合分 ${(summary.topScore * 100).toFixed(2)}%` : ""}${typeof summary.scoreGap === "number" ? `，与第二名差距 ${(summary.scoreGap * 100).toFixed(2)}%` : ""}。`;
    case "mismatch":
      return locale === "en"
        ? `The closest baseline is ${winnerName ?? "another model"}${typeof summary.topScore === "number" ? ` with an overall score of ${(summary.topScore * 100).toFixed(2)}%` : ""}${typeof summary.scoreGap === "number" ? ` and a ${(summary.scoreGap * 100).toFixed(2)}% lead over the runner-up` : ""}.`
        : `Top 1 为 ${winnerName ?? "其他模型"}${typeof summary.topScore === "number" ? `，综合分 ${(summary.topScore * 100).toFixed(2)}%` : ""}${typeof summary.scoreGap === "number" ? `，与第二名差距 ${(summary.scoreGap * 100).toFixed(2)}%` : ""}。`;
    case "baseline_missing":
      return locale === "en"
        ? `The requested model ${summary.requestedModel ?? ""} does not have a local baseline yet${winnerName ? `; the closest available baseline is ${winnerName}` : ""}${typeof summary.topScore === "number" ? ` with an overall score of ${(summary.topScore * 100).toFixed(2)}%` : ""}.`
        : `当前没有声明模型 ${summary.requestedModel ?? ""} 的本地基线${winnerName ? `，现有基线里最接近的是 ${winnerName}` : ""}${typeof summary.topScore === "number" ? `，综合分 ${(summary.topScore * 100).toFixed(2)}%` : ""}。`;
    case "insufficient_data":
      return locale === "en"
        ? "Too few valid samples were collected to produce a stable ranking."
        : "可用样本过少，当前结果不足以形成稳定排名。";
    case "failed":
      return locale === "en"
        ? "No baseline data is available, so the comparison could not be completed."
        : "当前没有可用的基线数据，无法完成比对。";
    case "inconclusive":
      return locale === "en"
        ? `The current top signal${winnerName ? ` is ${winnerName}` : ""}, but the score or separation from the runner-up is not strong enough for a clear verdict.`
        : `当前 Top 1${winnerName ? ` 为 ${winnerName}` : ""}，但综合分或与第二名差距还不足以支撑明确结论。`;
    default:
      break;
  }

  if (!summary?.explanation) {
    return null;
  }

  if (locale !== "en") {
    return summary.explanation;
  }

  if (summary.explanation === "可用样本过少，当前结果不足以形成稳定排名。") {
    return "Too few valid samples were collected to produce a stable ranking.";
  }

  if (summary.explanation === "当前没有可用的基线数据，无法完成比对。") {
    return "No baseline data is available, so the comparison could not be completed.";
  }

  return summary.explanation;
}

export function formatRunSummaryVerdict(
  summary:
    | {
        outcome?: string;
        requestedModel?: string;
        matchedDisplayName?: string;
        matchedModel?: string;
        verdict?: string;
      }
    | null
    | undefined,
  locale: AppLocale = "zh-CN",
) {
  if (!summary) {
    return null;
  }

  const requested = summary.requestedModel ?? "目标模型";
  const matched = summary.matchedDisplayName ?? summary.matchedModel ?? "近似基线";

  switch (summary.outcome) {
    case "match":
      return locale === "en"
        ? `Result is broadly consistent with the declared model ${requested}.`
        : `检测结果与声明模型 ${requested} 基本一致。`;
    case "suspected_downgrade":
      return locale === "en"
        ? `Result is closer to ${matched} and suggests a downgrade from ${requested}.`
        : `检测结果更接近 ${matched}，疑似从 ${requested} 降配。`;
    case "mismatch":
      return locale === "en"
        ? `Result does not match the declared model ${requested}; it is closer to ${matched}.`
        : `检测结果与声明模型 ${requested} 不一致，更接近 ${matched}。`;
    case "baseline_missing":
      return locale === "en"
        ? `No local baseline exists yet for the declared model ${requested}.`
        : `当前没有声明模型 ${requested} 的本地基线，无法直接判定是否一致。`;
    case "insufficient_data":
      return locale === "en"
        ? "There are not enough valid samples to support a conclusion."
        : "样本不足，暂时无法形成明确结论。";
    case "failed":
      return locale === "en"
        ? "Comparison could not be completed, so no conclusion is available."
        : "无法完成比对，当前没有可用结论。";
    case "inconclusive":
      return locale === "en"
        ? "The current result is not stable enough for a clear verdict."
        : "当前结果不够稳定，暂时不能给出明确判定。";
    default:
      return summary.verdict ?? null;
  }
}

export function formatRunSummaryRecommendation(
  summary:
    | {
        outcome?: string;
        requestedModel?: string;
        recommendation?: string;
      }
    | null
    | undefined,
  locale: AppLocale = "zh-CN",
) {
  if (!summary) {
    return null;
  }

  if (locale === "zh-CN") {
    return summary.recommendation ?? null;
  }

  switch (summary.outcome) {
    case "match":
      return "Keep this report as an acceptance record and optionally follow up with a manual spot check.";
    case "suspected_downgrade":
      return "Retest immediately and verify the vendor's declared model, upstream route, and billing model.";
    case "mismatch":
      return "Check the endpoint routing, model mapping, and upstream model source.";
    case "baseline_missing":
      return `Add an official baseline for ${summary.requestedModel ?? "the declared model"} and run the check again.`;
    case "insufficient_data":
      return "Improve request success rate and rerun the check with enough valid samples.";
    case "failed":
      return "Verify baseline availability and inspect upstream responses before retrying.";
    case "inconclusive":
      return "Run another check and combine it with more samples or manual review.";
    default:
      return summary.recommendation ?? null;
  }
}
