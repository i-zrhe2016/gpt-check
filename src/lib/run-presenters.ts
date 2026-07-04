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
    case "matched":
      return locale === "en" ? "Outcome: closest baseline matched" : "结论：已匹配到近似基线";
    case "insufficient_data":
      return locale === "en" ? "Outcome: not enough samples" : "结论：样本不足";
    case "failed":
      return locale === "en" ? "Outcome: comparison unavailable" : "结论：无法完成比对";
    case "unmatched":
      return locale === "en" ? "Outcome: no close baseline found" : "结论：未命中近似基线";
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
        explanation?: string;
      }
    | null
    | undefined,
  topMatches: Array<Record<string, unknown>>,
  locale: AppLocale = "zh-CN",
) {
  const winner = topMatches[0];
  const winnerName = typeof winner?.displayName === "string" ? winner.displayName : null;

  switch (summary?.outcome) {
    case "insufficient_data":
      return locale === "en"
        ? "Too few valid samples were collected to produce a stable ranking."
        : "可用样本过少，当前结果不足以形成稳定排名。";
    case "failed":
      return locale === "en"
        ? "No baseline data is available, so the comparison could not be completed."
        : "当前没有可用的基线数据，无法完成比对。";
    case "matched":
      if (!winnerName) {
        return locale === "en"
          ? "A closest baseline was identified. The score is only a similarity signal, not a final verdict."
          : "本次结果已匹配到最接近的基线。分数表示相似度信号，不代表最终结论。";
      }

      return locale === "en"
        ? `This run is closest to ${winnerName}. Scores indicate similarity signals and are not a final verdict.`
        : `本次结果最接近 ${winnerName}。分数表示相似度信号，不代表最终结论。`;
    case "unmatched":
      return locale === "en" ? "No close baseline was found for this run." : "当前结果没有命中近似基线。";
    case "inconclusive":
      return locale === "en"
        ? "The current signals are not strong enough to support a clear conclusion."
        : "当前结果信号不足，暂时无法形成明确结论。";
    default:
      break;
  }

  if (!summary?.explanation) {
    return null;
  }

  if (locale !== "en") {
    return summary.explanation;
  }

  const matchedSummary = summary.explanation.match(/^本次结果最接近 (.+)。分数表示相似度信号，不代表最终结论。$/);
  if (matchedSummary) {
    return `This run is closest to ${matchedSummary[1]}. Scores indicate similarity signals and are not a final verdict.`;
  }

  if (summary.explanation === "可用样本过少，当前结果不足以形成稳定排名。") {
    return "Too few valid samples were collected to produce a stable ranking.";
  }

  if (summary.explanation === "当前没有可用的基线数据，无法完成比对。") {
    return "No baseline data is available, so the comparison could not be completed.";
  }

  return summary.explanation;
}
