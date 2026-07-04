export function formatRunStatus(status: string) {
  switch (status) {
    case "PENDING":
      return "排队中";
    case "RUNNING":
      return "检测中";
    case "COMPLETED":
      return "已完成";
    case "FAILED":
      return "失败";
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

export function formatRunOutcome(outcome: string | undefined) {
  switch (outcome) {
    case "matched":
      return "结论：已匹配到近似基线";
    case "insufficient_data":
      return "结论：样本不足";
    case "failed":
      return "结论：无法完成比对";
    case "unmatched":
      return "结论：未命中近似基线";
    case "inconclusive":
      return "结论：结果暂不明确";
    default:
      return null;
  }
}

export function formatRunTime(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);

  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatRunStartError(error: unknown) {
  if (error instanceof Error) {
    if (error.message.includes("5 runs per 10 minutes")) {
      return "当前浏览器在 10 分钟内最多可发起 5 次检测，请稍后再试。";
    }

    if (error.message.includes("10 runs per hour")) {
      return "当前网络地址在 1 小时内已达到检测上限，请稍后再试。";
    }

    if (error.message.includes("Only https Base URL values are allowed")) {
      return "接口地址必须使用 HTTPS。";
    }

    if (
      error.message.includes("Localhost is not allowed") ||
      error.message.includes("Private IPv4 addresses are not allowed") ||
      error.message.includes("Private IPv6 addresses are not allowed") ||
      error.message.includes("resolves to a private IPv4 address") ||
      error.message.includes("resolves to a private IPv6 address")
    ) {
      return "接口地址不能指向本机或私有网络。";
    }
  }

  return "启动检测失败，请检查接口地址、模型名和 API Key 后重试。";
}
